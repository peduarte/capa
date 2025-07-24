import { useState, useEffect } from 'react';
import { trackEvent } from 'fathom-client';
import download from '../utils/download';
import { FilmStock, FILM_STOCKS, Frame } from '../utils/constants';

interface DownloadButtonProps {
  frames: Record<string, Frame>;
  frameOrder: string[];
  filmStock: FilmStock;
  rotation?: number;
  className?: string;
  isDemo?: boolean;
  onDownloadStateChange?: (isDownloading: boolean) => void;
}

export const DownloadButton = ({
  frames,
  frameOrder,
  filmStock,
  rotation = 0,
  className = '',
  isDemo = false,
  onDownloadStateChange,
}: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to update downloading state and notify parent
  const updateDownloadingState = (downloading: boolean) => {
    setIsDownloading(downloading);
    onDownloadStateChange?.(downloading);
  };

  // Auto-dismiss error after 8 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 8000);

      return () => clearTimeout(timeout);
    }
  }, [error]);

  const handleDownload = async () => {
    if (!frameOrder.length || isDownloading) return;

    const eventName = isDemo ? `export-demo` : `export`;
    trackEvent(`${eventName} film:${filmStock} frames:${frameOrder.length}`);

    updateDownloadingState(true);
    setError(null); // Clear any previous errors

    try {
      // Generate filename with film name
      const filmName = FILM_STOCKS[filmStock].name
        .toLowerCase()
        .replace(/\s+/g, '-');
      const filename = `contact-sheet-${filmName}.png`;

      // Convert blob URLs to data URLs if needed for server processing
      const processedFrames: Record<string, Frame> = {};

      await Promise.all(
        frameOrder.map(async (frameId, index) => {
          const frame = frames[frameId];
          const imagePath = frame.src;
          if (imagePath.startsWith('blob:')) {
            try {
              const response = await fetch(imagePath);
              const blob = await response.blob();

              // Check blob size - if too large, might cause issues on iOS
              const MAX_BLOB_SIZE = 2 * 1024 * 1024; // 2MB limit for safety
              if (blob.size > MAX_BLOB_SIZE) {
                console.warn(
                  `Image ${index + 1} is very large (${blob.size} bytes), may cause issues on iOS`
                );
              }

              // Log blob size for debugging
              console.log(`Image ${index + 1} blob size: ${blob.size} bytes`);

              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  // Log data URL size for debugging
                  console.log(
                    `Image ${index + 1} data URL size: ${dataUrl.length} chars`
                  );

                  // Additional size check for data URL (base64 is ~33% larger than binary)
                  const MAX_DATA_URL_SIZE = 3 * 1024 * 1024; // 3MB limit for data URLs
                  if (dataUrl.length > MAX_DATA_URL_SIZE) {
                    reject(
                      new Error(
                        `Image ${index + 1} data URL too large for iOS Safari`
                      )
                    );
                    return;
                  }

                  processedFrames[frameId] = {
                    ...frame,
                    src: dataUrl,
                  };
                  resolve(dataUrl);
                };
                reader.onerror = () => {
                  console.error(
                    `Failed to convert image ${index + 1} to data URL`
                  );
                  reject(new Error(`Failed to convert image ${index + 1}`));
                };
                reader.readAsDataURL(blob);
              });
            } catch (error) {
              console.warn('Failed to convert blob URL:', imagePath, error);
              processedFrames[frameId] = frame; // fallback to original frame
            }
          } else {
            processedFrames[frameId] = frame; // Use original frame if not blob URL
          }
        })
      );

      // Call the contact sheet generation API
      const response = await fetch('/api/generate-contact-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frames: processedFrames,
          frameOrder,
          filmStock,
          rotation,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Get the image blob
      const imageBlob = await response.blob();
      const dataUrl = URL.createObjectURL(imageBlob);

      // Download using simple utility
      download(dataUrl, filename);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
    } catch (err) {
      console.error('Download error:', err);

      // Extract meaningful error message
      let errorMessage = 'Download failed';
      if (err instanceof Error) {
        if (err.message.includes('CORS')) {
          errorMessage =
            'Image loading blocked. Try refreshing and uploading images again.';
        } else if (err.message.includes('Server error')) {
          errorMessage = 'Server error generating image. Please try again.';
        } else if (err.message.includes('Failed to convert image')) {
          // Detect iOS for specific guidance
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          errorMessage = isIOS
            ? 'Images too large for iOS Safari. Try uploading smaller or fewer images.'
            : 'Failed to process images. Try uploading smaller files.';
        } else {
          errorMessage = err.message || 'Unknown error occurred';
        }
      }

      setError(errorMessage);
    } finally {
      updateDownloadingState(false);
    }
  };

  // Handle manual dismissal of error
  const dismissError = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`text-sm bg-white text-black hover:text-black px-3 py-1 rounded border disabled:opacity-30 ${className}`}
      >
        {isDownloading ? 'Downloading...' : 'Export'}
      </button>

      {/* Error tooltip */}
      {error && (
        <div
          className="absolute bottom-full right-0 mb-2 p-3 bg-red-600 text-white text-sm rounded shadow-lg max-w-xs z-50 cursor-pointer"
          onClick={dismissError}
          title="Click to dismiss"
        >
          <div className="font-medium">{error}</div>
          <div className="text-xs mt-1 opacity-90">
            Try refreshing the page or re-uploading your images
          </div>
          <div className="text-xs mt-1 opacity-75">
            (Auto-dismisses in 8 seconds)
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600" />
        </div>
      )}
    </div>
  );
};
