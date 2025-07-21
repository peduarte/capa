import { toPng, toJpeg } from 'html-to-image';

export interface DownloadOptions {
  filename?: string;
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
  filter?: (node: Element) => boolean;
}

// Helper function to temporarily convert blob URLs to data URLs for download compatibility
const convertBlobUrlsToDataUrls = async (
  element: HTMLElement
): Promise<() => void> => {
  const images = element.querySelectorAll('img');
  const conversions: Array<{
    img: HTMLImageElement;
    originalSrc: string;
    newSrc: string;
  }> = [];

  for (const img of Array.from(images)) {
    if (img.src.startsWith('blob:')) {
      try {
        // Fetch the blob and convert to data URL
        const response = await fetch(img.src);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        conversions.push({
          img,
          originalSrc: img.src,
          newSrc: dataUrl,
        });

        // Temporarily replace with data URL
        img.src = dataUrl;
      } catch (error) {
        console.warn('Failed to convert blob URL for image:', img.src, error);
      }
    }
  }

  // Return cleanup function to restore original URLs
  return () => {
    conversions.forEach(({ img, originalSrc }) => {
      img.src = originalSrc;
    });
  };
};

export const downloadContactSheet = async (
  element: HTMLElement,
  options: DownloadOptions = {}
): Promise<void> => {
  const {
    filename = 'contact-sheet.png',
    quality = 1.0,
    pixelRatio = 2,
    backgroundColor = '#000000',
    filter = node => {
      if (node.tagName) {
        const tagName = node.tagName.toLowerCase();
        if (tagName === 'button') return false;

        try {
          const element = node as HTMLElement;
          const styles = window.getComputedStyle(element);
          if (styles.position === 'fixed') return false;
        } catch (e) {
          // Continue
        }
      }
      return true;
    },
  } = options;

  let cleanup: (() => void) | null = null;

  try {
    if (!element) {
      throw new Error('Contact sheet element not found');
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      throw new Error('Contact sheet element has no dimensions');
    }

    // Convert blob URLs to data URLs temporarily for html-to-image compatibility
    cleanup = await convertBlobUrlsToDataUrls(element);

    // Wait a bit for images to load
    await new Promise(resolve => setTimeout(resolve, 100));

    const dataUrl = await toPng(element, {
      quality,
      pixelRatio,
      backgroundColor,
      filter,
      cacheBust: true,
      width: rect.width + 100, // Add 100px total (50px padding on each side)
      height: rect.height + 100, // Add 100px total (50px padding on each side)
      style: {
        // Center the contact sheet with 50px padding
        transform: 'scale(1)',
        transformOrigin: 'top left',
        margin: '50px', // 50px margin on all sides creates the padding
        position: 'relative',
        display: 'block',
      },
    });

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(
      `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    // Always restore original URLs
    if (cleanup) {
      cleanup();
    }
  }
};

export const downloadContactSheetJPEG = async (
  element: HTMLElement,
  options: DownloadOptions = {}
): Promise<void> => {
  const {
    filename = 'contact-sheet.jpg',
    quality = 0.95,
    pixelRatio = 2,
    backgroundColor = '#000000',
    filter = node => {
      if (node.tagName) {
        const tagName = node.tagName.toLowerCase();
        if (tagName === 'button') return false;

        try {
          const element = node as HTMLElement;
          const styles = window.getComputedStyle(element);
          if (styles.position === 'fixed') return false;
        } catch (e) {
          // Continue
        }
      }
      return true;
    },
  } = options;

  try {
    const rect = element.getBoundingClientRect();

    const dataUrl = await toJpeg(element, {
      quality,
      pixelRatio,
      backgroundColor,
      filter,
      cacheBust: true,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    link.remove();
  } catch (error) {
    console.error('Failed to download contact sheet as JPEG:', error);
    throw new Error(
      'Failed to generate contact sheet image. Please try again.'
    );
  }
};

export const getContactSheetDataUrl = async (
  element: HTMLElement,
  options: Omit<DownloadOptions, 'filename'> = {}
): Promise<string> => {
  const {
    quality = 1.0,
    pixelRatio = 2,
    backgroundColor = '#000000',
    filter = node => {
      if (node.tagName) {
        const tagName = node.tagName.toLowerCase();
        if (tagName === 'button') return false;

        try {
          const element = node as HTMLElement;
          const styles = window.getComputedStyle(element);
          if (styles.position === 'fixed') return false;
        } catch (e) {
          // Continue
        }
      }
      return true;
    },
  } = options;

  try {
    return await toPng(element, {
      quality,
      pixelRatio,
      backgroundColor,
      filter,
      cacheBust: true,
    });
  } catch (error) {
    console.error('Failed to generate contact sheet data URL:', error);
    throw new Error('Failed to generate contact sheet preview.');
  }
};
