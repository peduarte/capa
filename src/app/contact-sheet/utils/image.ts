import { toPng as htmlToPng } from 'html-to-image';

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
    const htmlToImageOptions = {
      pixelRatio: 2,
      skipAutoScale: true,
      cacheBust: true,
    };

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
