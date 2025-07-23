import { useState } from 'react';
import download from '../utils/download';
import { FilmStock } from '../utils/constants';

interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}

interface DownloadButtonProps {
  images: string[];
  highlights: FrameHighlight[];
  xMarks: number[];
  filmStock: FilmStock;
  rotation?: number;
  className?: string;
}

export const DownloadButton = ({
  images,
  highlights,
  xMarks,
  filmStock,
  rotation = 0,
  className = '',
}: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!images.length || isDownloading) return;

    setIsDownloading(true);
    setError(null);

    try {
      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      const filename = `contact-sheet-${timestamp}.png`;

      // Convert blob URLs to data URLs if needed for server processing
      const processedImages = await Promise.all(
        images.map(async imagePath => {
          if (imagePath.startsWith('blob:')) {
            try {
              const response = await fetch(imagePath);
              const blob = await response.blob();
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (error) {
              console.warn('Failed to convert blob URL:', imagePath, error);
              return imagePath; // fallback to original path
            }
          }
          return imagePath;
        })
      );

      // Call the Puppeteer API
      const response = await fetch('/api/generate-contact-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: processedImages,
          highlights,
          xMarks,
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
        } else {
          errorMessage = err.message || 'Unknown error occurred';
        }
      }

      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`text-sm bg-white text-black hover:text-black px-3 py-1 rounded border disabled:opacity-30 ${className}`}
      >
        {isDownloading ? 'Downloading...' : 'Download contact sheet'}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full right-0 mb-2 p-3 bg-red-600 text-white text-sm rounded shadow-lg max-w-xs z-50">
          <div className="font-medium">{error}</div>
          <div className="text-xs mt-1 opacity-90">
            Try refreshing the page or re-uploading your images
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600" />
        </div>
      )}
    </div>
  );
};
