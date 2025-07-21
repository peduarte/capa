import { toPng as htmlToPng, toJpeg as htmlToJpeg } from 'html-to-image';

const isSafari = () => {
  if (typeof navigator === 'undefined') return false;
  return (
    navigator.userAgent.indexOf('Safari') > -1 &&
    navigator.userAgent.indexOf('Chrome') <= -1
  );
};

const imageFilter = (node: HTMLElement) => {
  if (!node.tagName) return true;

  const tagName = node.tagName.toLowerCase();
  if (tagName === 'button') return false;

  try {
    const styles = window.getComputedStyle(node);
    if (styles.position === 'fixed' || styles.position === 'sticky')
      return false;
  } catch {
    // Continue if we can't get styles
  }

  return true;
};

const getHtmlToImageOptions = () => {
  const baseOptions = {
    filter: imageFilter,
    pixelRatio: 2,
    skipAutoScale: true,
    cacheBust: true,
  };

  // Safari-specific options - remove backgroundColor and complex properties
  if (isSafari()) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    backgroundColor: '#000000',
  };
};

// Convert blob URLs to data URLs so html-to-image can access them
const convertBlobUrlsToDataUrls = async (
  element: HTMLElement
): Promise<() => void> => {
  const images = element.querySelectorAll('img');
  const conversions: Array<{ img: HTMLImageElement; originalSrc: string }> = [];

  for (const img of Array.from(images)) {
    if (img.src.startsWith('blob:')) {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        conversions.push({
          img,
          originalSrc: img.src,
        });

        img.src = dataUrl;
      } catch (error) {
        console.warn('Failed to convert blob URL:', img.src, error);
      }
    }
  }

  // Return cleanup function
  return () => {
    conversions.forEach(({ img, originalSrc }) => {
      img.src = originalSrc;
    });
  };
};

type PngOptions = Parameters<typeof htmlToPng>[1];
export const toPng = async (node: HTMLElement, options?: PngOptions) => {
  // Convert blob URLs to data URLs first
  const cleanup = await convertBlobUrlsToDataUrls(node);

  try {
    const htmlToImageOptions = getHtmlToImageOptions();

    // Ray-so's double rendering trick for reliability
    await htmlToPng(node, {
      ...htmlToImageOptions,
      ...options,
    });

    const result = await htmlToPng(node, {
      ...htmlToImageOptions,
      ...options,
    });

    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
};

type JpegOptions = Parameters<typeof htmlToJpeg>[1];
export const toJpeg = async (node: HTMLElement, options?: JpegOptions) => {
  // Convert blob URLs to data URLs first
  const cleanup = await convertBlobUrlsToDataUrls(node);

  try {
    const htmlToImageOptions = getHtmlToImageOptions();

    // Ray-so's double rendering trick for reliability
    await htmlToJpeg(node, {
      ...htmlToImageOptions,
      quality: 0.95,
      ...options,
    });

    const result = await htmlToJpeg(node, {
      ...htmlToImageOptions,
      quality: 0.95,
      ...options,
    });

    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
};
