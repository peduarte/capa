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

export const convertFileToObjectUrl = (file: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
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