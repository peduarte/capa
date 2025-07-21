import { useState, useRef, useCallback } from 'react';
import {
  convertFilesToObjectUrls,
  getValidImages,
  getErrors,
} from '../utils/imageUtils';

interface FileUploadProps {
  onImagesSelected: (images: string[]) => void;
  onError: (errors: string[]) => void;
  isLoading?: boolean;
  maxFiles?: number;
}

export const FileUpload = ({
  onImagesSelected,
  onError,
  isLoading = false,
  maxFiles = 50,
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      if (files.length === 0) return;

      if (files.length > maxFiles) {
        onError([`Too many files selected. Maximum is ${maxFiles} images.`]);
        return;
      }

      setIsProcessing(true);

      try {
        const results = await convertFilesToObjectUrls(files);
        const validImages = getValidImages(results);
        const errors = getErrors(results);

        if (validImages.length > 0) {
          onImagesSelected(validImages);
        }

        if (errors.length > 0) {
          onError(errors);
        }

        if (validImages.length === 0 && errors.length === 0) {
          onError(['No valid images found.']);
        }
      } catch (error) {
        onError(['An error occurred while processing your images.']);
        console.error('File processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onImagesSelected, onError, maxFiles]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragOver to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!isLoading && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const isDisabled = isLoading || isProcessing;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 min-h-[200px] flex flex-col items-center justify-center
          ${
            isDragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isDisabled}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Processing images...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please wait while we validate and process your files
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isDragOver ? 'Drop your images here' : 'Select your photos'}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drag and drop or click to browse
            </p>

            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
              <p>Supports: JPEG, PNG, WebP</p>
              <p>Max file size: 10MB each</p>
              <p>Max files: {maxFiles} images</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
