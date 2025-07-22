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
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION = 4096; // 4K max width/height

// Compression settings
export const COMPRESSION_MAX_WIDTH = 1200; // Max width for compressed images
export const COMPRESSION_MAX_HEIGHT = 1200; // Max height for compressed images
export const COMPRESSION_QUALITY = 0.8; // JPEG quality (0.0 - 1.0)

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

// Image compression function
export const compressImage = (
  file: File,
  maxWidth: number = COMPRESSION_MAX_WIDTH,
  maxHeight: number = COMPRESSION_MAX_HEIGHT,
  quality: number = COMPRESSION_QUALITY
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const aspectRatio = width / height;

      // Resize if image is larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        if (aspectRatio > 1) {
          // Landscape
          width = maxWidth;
          height = width / aspectRatio;
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        } else {
          // Portrait or square
          height = maxHeight;
          width = height * aspectRatio;
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
        }
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

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
        quality
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
