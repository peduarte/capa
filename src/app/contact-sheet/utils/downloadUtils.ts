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
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const conversions: Array<{
    img: HTMLImageElement;
    originalSrc: string;
    newSrc: string;
  }> = [];

  for (const img of Array.from(images)) {
    // For Safari, convert ALL images to data URLs, not just blob URLs
    const needsConversion = isSafari || img.src.startsWith('blob:');

    if (needsConversion) {
      try {
        let dataUrl: string;

        if (img.src.startsWith('blob:')) {
          // Convert blob URL to data URL
          const response = await fetch(img.src);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
          }

          const blob = await response.blob();
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () =>
              reject(new Error('Failed to read blob as data URL'));

            // Add timeout for Safari
            const timeout = setTimeout(() => {
              reject(new Error('Blob conversion timeout'));
            }, 10000);

            reader.onload = () => {
              clearTimeout(timeout);
              resolve(reader.result as string);
            };

            reader.readAsDataURL(blob);
          });
        } else {
          // For Safari: Convert regular URLs to data URLs by drawing to canvas
          dataUrl = await new Promise<string>((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const tempImg = new Image();

            tempImg.crossOrigin = 'anonymous';

            tempImg.onload = () => {
              canvas.width = tempImg.naturalWidth;
              canvas.height = tempImg.naturalHeight;
              ctx?.drawImage(tempImg, 0, 0);

              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                resolve(dataUrl);
              } catch (e) {
                reject(new Error('Canvas conversion failed'));
              }
            };

            tempImg.onerror = () => reject(new Error('Image load failed'));
            tempImg.src = img.src;
          });
        }

        conversions.push({
          img,
          originalSrc: img.src,
          newSrc: dataUrl,
        });

        // Temporarily replace with data URL
        img.src = dataUrl;

        // Ensure image is marked as loaded
        await new Promise(resolve => {
          if (img.complete) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
          }
        });
      } catch (error) {
        console.warn('Failed to convert image:', img.src, error);
        // Continue with other images rather than failing completely
      }
    }
  }

  console.log(
    `Converted ${conversions.length} images for Safari compatibility`
  );

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

    // Check if contact sheet has any images
    const images = element.querySelectorAll('img');
    if (images.length === 0) {
      throw new Error('No images found in contact sheet');
    }

    // Check if any images are still loading
    const unloadedImages = Array.from(images).filter(img => !img.complete);
    if (unloadedImages.length > 0) {
      // Wait for images to load
      await Promise.all(
        unloadedImages.map(
          img =>
            new Promise(resolve => {
              if (img.complete) resolve(img);
              img.onload = () => resolve(img);
              img.onerror = () => resolve(img); // Continue even if image fails to load
              // Timeout after 5 seconds
              setTimeout(() => resolve(img), 5000);
            })
        )
      );
    }

    // Safari-specific: Ensure all images have crossOrigin set for blob URLs
    Array.from(images).forEach(img => {
      if (img.src.startsWith('blob:') && !img.crossOrigin) {
        img.crossOrigin = 'anonymous';
      }
    });

    // Extra wait for Safari to ensure all images are fully rendered
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait for Safari
    }

    // Convert blob URLs to data URLs temporarily for html-to-image compatibility
    cleanup = await convertBlobUrlsToDataUrls(element);

    // Additional wait after conversions for Safari
    if (isSafari) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Wait a bit for images to load
    await new Promise(resolve => setTimeout(resolve, 100));

    const imageOptions = {
      quality,
      pixelRatio,
      backgroundColor,
      filter,
      cacheBust: true,
      width: rect.width + 100,
      height: rect.height + 100,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        margin: '50px',
        position: 'relative',
        display: 'block',
      },
      // Safari-specific options
      ...(isSafari && {
        useCORS: true,
        allowTaint: false, // Changed to false for better Safari compatibility
        scale: 1,
        skipFonts: false,
        preferredFontFormat: 'woff2',
      }),
    };

    // Create a promise with timeout for the image generation
    const imageGeneration = toPng(element, imageOptions);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Download timeout - try with fewer images or lower quality'
            )
          ),
        30000
      )
    );

    const dataUrl = await Promise.race([imageGeneration, timeout]);

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
    console.error('Download failed:', error);

    // Provide more specific error messages
    let errorMessage = 'Unknown error';
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (error instanceof Error) {
      errorMessage = error.message;

      // Safari-specific guidance
      if (isSafari && error.message.includes('Failed to convert')) {
        errorMessage =
          'Safari download issue - try using Chrome or Firefox for better compatibility';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }

    throw new Error(`Download failed: ${errorMessage}`);
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
