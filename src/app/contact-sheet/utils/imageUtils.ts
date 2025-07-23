export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
  objectUrl?: string; // Changed from dataUrl to objectUrl
}

export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB - increased for phone photos
export const MAX_IMAGE_DIMENSION = 8192; // 8K max width/height - modern phones can go higher

// Compression settings - optimized for contact sheet thumbnails (final display: 180x120)
export const COMPRESSION_MAX_WIDTH = 540; // Max width for compressed images (3x display size)
export const COMPRESSION_MAX_HEIGHT = 360; // Max height for compressed images (3x display size)
export const COMPRESSION_QUALITY = 0.9; // JPEG quality (0.0 - 1.0) - slightly lower for smaller files

// iOS-specific compression settings to handle data URL size limitations
export const IOS_COMPRESSION_MAX_WIDTH = 360; // Smaller for iOS Safari data URL limits
export const IOS_COMPRESSION_MAX_HEIGHT = 240; // Smaller for iOS Safari data URL limits
export const IOS_COMPRESSION_QUALITY = 0.7; // More aggressive compression for iOS

// Detect iOS Safari
export const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari =
    /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);

  return isIOS && isSafari;
};

export const validateImageFile = (
  file: File
): Pick<ImageValidationResult, 'valid' | 'error'> => {
  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported format: ${file.type}. Please use JPEG, PNG, or WebP.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 10MB.`,
    };
  }

  return { valid: true };
};

export const convertFileToObjectUrl = (
  file: File
): Promise<ImageValidationResult> => {
  return new Promise(resolve => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      resolve(validation);
      return;
    }

    // Create Object URL - much more efficient than data URL
    const objectUrl = URL.createObjectURL(file);

    // Check image dimensions
    const img = new Image();
    img.onload = () => {
      if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        URL.revokeObjectURL(objectUrl); // Clean up
        resolve({
          valid: false,
          error: `Image too large: ${img.width}x${img.height}. Maximum dimension is ${MAX_IMAGE_DIMENSION}px.`,
        });
        return;
      }

      resolve({
        valid: true,
        file,
        objectUrl,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl); // Clean up
      resolve({
        valid: false,
        error: 'Invalid image file or corrupted data.',
      });
    };

    img.src = objectUrl;
  });
};

export const convertFilesToObjectUrls = async (
  files: FileList | File[]
): Promise<ImageValidationResult[]> => {
  const fileArray = Array.from(files);
  const results = await Promise.all(fileArray.map(convertFileToObjectUrl));
  return results;
};

export const getValidImages = (results: ImageValidationResult[]): string[] => {
  return results
    .filter(result => result.valid && result.objectUrl)
    .map(result => result.objectUrl!);
};

export const getErrors = (results: ImageValidationResult[]): string[] => {
  return results
    .filter(result => !result.valid && result.error)
    .map(result => result.error!);
};

// Helper function to clean up Object URLs when no longer needed
export const revokeObjectUrls = (urls: string[]) => {
  urls.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};

// Image compression function with portrait rotation
export const compressImage = (
  file: File,
  maxWidth?: number,
  maxHeight?: number,
  quality?: number
): Promise<Blob> => {
  // Use iOS-specific settings if on iOS Safari, otherwise use defaults
  const isIOS = isIOSSafari();
  const finalMaxWidth =
    maxWidth ?? (isIOS ? IOS_COMPRESSION_MAX_WIDTH : COMPRESSION_MAX_WIDTH);
  const finalMaxHeight =
    maxHeight ?? (isIOS ? IOS_COMPRESSION_MAX_HEIGHT : COMPRESSION_MAX_HEIGHT);
  const finalQuality =
    quality ?? (isIOS ? IOS_COMPRESSION_QUALITY : COMPRESSION_QUALITY);
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Check if image is portrait and rotate it to landscape
      const isPortrait = height > width;
      if (isPortrait) {
        // Swap dimensions for portrait images to make them landscape
        [width, height] = [height, width];
      }

      const aspectRatio = width / height;

      // Resize if image is larger than max dimensions
      if (width > finalMaxWidth || height > finalMaxHeight) {
        if (aspectRatio > 1) {
          // Landscape (or rotated portrait)
          width = finalMaxWidth;
          height = width / aspectRatio;
          if (height > finalMaxHeight) {
            height = finalMaxHeight;
            width = height * aspectRatio;
          }
        } else {
          // Square
          height = finalMaxHeight;
          width = height * aspectRatio;
          if (width > finalMaxWidth) {
            width = finalMaxWidth;
            height = width / aspectRatio;
          }
        }
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      if (isPortrait) {
        // For portrait images, rotate 90 degrees clockwise
        ctx.translate(width / 2, height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -height / 2, -width / 2, height, width);
      } else {
        // For landscape images, draw normally
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Convert to blob with compression
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg', // Always use JPEG for smaller file sizes
        finalQuality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

// Modified function to create compressed object URLs
export const convertFileToCompressedObjectUrl = (
  file: File
): Promise<ImageValidationResult> => {
  return new Promise(async resolve => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      resolve(validation);
      return;
    }

    try {
      // Check original image dimensions first
      const originalUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = async () => {
        URL.revokeObjectURL(originalUrl); // Clean up original URL

        if (
          img.width > MAX_IMAGE_DIMENSION ||
          img.height > MAX_IMAGE_DIMENSION
        ) {
          resolve({
            valid: false,
            error: `Image too large: ${img.width}x${img.height}. Maximum dimension is ${MAX_IMAGE_DIMENSION}px.`,
          });
          return;
        }

        try {
          // Compress the image
          const compressedBlob = await compressImage(file);
          const compressedUrl = URL.createObjectURL(compressedBlob);

          resolve({
            valid: true,
            file,
            objectUrl: compressedUrl,
          });
        } catch (compressionError) {
          console.warn('Compression failed, using original:', compressionError);
          // Fall back to original if compression fails
          const fallbackUrl = URL.createObjectURL(file);
          resolve({
            valid: true,
            file,
            objectUrl: fallbackUrl,
          });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(originalUrl);
        resolve({
          valid: false,
          error: 'Invalid image file or corrupted data.',
        });
      };

      img.src = originalUrl;
    } catch {
      resolve({
        valid: false,
        error: 'Failed to process image file.',
      });
    }
  });
};

// New function to process files with compression
export const convertFilesToCompressedObjectUrls = async (
  files: FileList | File[]
): Promise<ImageValidationResult[]> => {
  const fileArray = Array.from(files);
  const results = await Promise.all(
    fileArray.map(convertFileToCompressedObjectUrl)
  );
  return results;
};
