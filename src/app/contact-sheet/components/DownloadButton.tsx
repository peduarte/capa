import { useState } from 'react';
import { downloadContactSheet } from '../utils/downloadUtils';

interface DownloadButtonProps {
  contactSheetRef: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
  className?: string;
}

export const DownloadButton = ({
  contactSheetRef,
  disabled = true, // Disabled by default
  className = '',
}: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!contactSheetRef.current || isDownloading) return;

    setIsDownloading(true);
    setError(null);

    try {
      // Wait a bit longer to ensure contact sheet is fully rendered
      // This is especially important when images were just added
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      const filename = `contact-sheet-${timestamp}.png`;

      await downloadContactSheet(contactSheetRef.current, {
        filename,
        pixelRatio: 2, // High resolution
        quality: 1.0,
        backgroundColor: '#000000', // Black background like film
      });
    } catch (err) {
      console.error('Download error details:', err);

      // Better error handling with more specific messages
      let errorMessage = 'Download failed';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      } else {
        errorMessage = 'Unknown error occurred. Check console for details.';
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
        disabled={disabled || isDownloading}
        className={`
          px-4 py-2 text-sm rounded-lg transition-colors
          ${disabled ? 'hidden' : 'bg-white text-black'}
          ${className}
        `}
      >
        {isDownloading ? 'Downloading...' : 'Download'}
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
