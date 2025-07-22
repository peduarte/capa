'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Select from '@radix-ui/react-select';
import { ContactSheet } from './contact-sheet/components/ContactSheet';
import { DownloadButton } from './contact-sheet/components/DownloadButton';
import { HighlightTypeSelector } from './contact-sheet/components/HighlightTypeSelector';
import {
  convertFilesToCompressedObjectUrls,
  getValidImages,
  getErrors,
  revokeObjectUrls,
} from './contact-sheet/utils/imageUtils';
import {
  FilmStock,
  FILM_STOCKS,
  DEFAULT_FILM_STOCK,
} from './contact-sheet/utils/constants';

// Types for highlights and X marks
interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}

function ContactSheetPageContent() {
  const contactSheetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showDemo, setShowDemo] = useState(true); // Start with demo shown
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlights, setHighlights] = useState<FrameHighlight[]>([]);
  const [xMarks, setXMarks] = useState<number[]>([]);
  const [selectedFilmStock, setSelectedFilmStock] =
    useState<FilmStock>(DEFAULT_FILM_STOCK);
  const [selectedHighlightType, setSelectedHighlightType] =
    useState<string>('rectangle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImagesRef = useRef<string[]>([]); // Track images for cleanup

  // Keyboard shortcuts for highlight type selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      // Don't handle shortcuts if any modifier keys are pressed
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      const key = event.key.toLowerCase();
      switch (key) {
        case 'c':
          setSelectedHighlightType('circle');
          break;
        case 's':
          setSelectedHighlightType('scribble');
          break;
        case 'x':
          setSelectedHighlightType('x');
          break;
        case 'r':
          setSelectedHighlightType('rectangle');
          break;
        default:
          return;
      }

      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Demo image list (complete list from prototype)
  const demoImageList = useMemo(
    () => [
      '000000160024.jpeg',
      '000000180006.jpeg',
      '000004310026.jpeg',
      '000004340020.jpeg',
      '000004350036.jpeg',
      '000004350039.jpeg',
      '000004360009.jpeg',
      '000004390004.jpeg',
      '000004390011.jpeg',
      '000014740026.jpeg',
      '000014750008.jpeg',
      '000014800037.jpeg',
      '000016800013.jpeg',
      '000016800019.jpeg',
      '000016800023.jpeg',
      '000019050039.jpeg',
      '000019670023.jpeg',
      '000028.jpeg',
      '000032250013.jpeg',
      '000036270021.jpeg',
      '000790--005--VK.jpeg',
      '000790--026--VK.jpeg',
      '000791--003--VK.jpeg',
      '000791--022--VK.jpeg',
      '000791--028--VK.jpeg',
      '000811--004--VK.jpeg',
      '002364--017--VK.jpeg',
      '008229--027--VK.jpeg',
      '008281--009--VK.jpeg',
      '008325--016--VK.jpeg',
      '008325--020--VK.jpeg',
      '25530026.jpeg',
      'IMG_1078.jpeg',
      'IMG_6347.jpeg',
      'IMG_6377.jpeg',
      'IMG_6476.jpeg',
      'IMG_7136.jpeg',
      'IMG_7138.jpeg',
    ],
    []
  );

  // Use uploaded images if available, otherwise demo images if enabled
  const currentImages =
    uploadedImages.length > 0 ? uploadedImages : showDemo ? demoImageList : [];

  // Clear contact sheet back to demo
  const clearContactSheet = useCallback(() => {
    // Clean up existing object URLs
    revokeObjectUrls(uploadedImages);
    setUploadedImages([]);
    uploadedImagesRef.current = []; // Update ref
    setShowDemo(true);
    setErrors([]);
    setHighlights([]);
    setXMarks([]);
  }, [uploadedImages]);

  // Handle upload button click
  const handleUploadClick = () => {
    if (!isProcessing && !isDragOver) {
      fileInputRef.current?.click();
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  // Global drag and drop handlers
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      if (files.length === 0) return;

      // Check total image count (existing + new)
      const totalImages = uploadedImages.length + files.length;
      if (totalImages > 50) {
        setErrors([
          `Too many images. Maximum is 50 total (you have ${uploadedImages.length}, trying to add ${files.length}).`,
        ]);
        return;
      }

      setIsProcessing(true);
      setErrors([]);

      try {
        const results = await convertFilesToCompressedObjectUrls(files);
        const validImages = getValidImages(results);
        const fileErrors = getErrors(results);

        if (validImages.length > 0) {
          // Append new images to existing ones (don't replace)
          setUploadedImages(prev => [...prev, ...validImages]);
          uploadedImagesRef.current = [
            ...uploadedImagesRef.current,
            ...validImages,
          ]; // Update ref
          setShowDemo(false);
        }

        if (fileErrors.length > 0) {
          setErrors(fileErrors);
        }

        if (validImages.length === 0 && fileErrors.length === 0) {
          setErrors(['No valid images found.']);
        }
      } catch (error) {
        setErrors(['An error occurred while processing your images.']);
        console.error('File processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [uploadedImages]
  );

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOver(true);
      }
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only hide if leaving the window entirely
      if (!e.relatedTarget) {
        setIsDragOver(false);
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer?.files) {
        processFiles(e.dataTransfer.files);
      }
    };

    // Add global event listeners - these will only be registered ONCE
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('dragleave', handleGlobalDragLeave);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('dragleave', handleGlobalDragLeave);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [processFiles]); // Only depend on processFiles which is stable with useCallback

  // Cleanup Object URLs when component unmounts to prevent memory leaks
  // Don't cleanup on uploadedImages changes or it will revoke URLs before download
  useEffect(() => {
    return () => {
      revokeObjectUrls(uploadedImagesRef.current);
    };
  }, []); // Empty dependency array - only cleanup on unmount

  return (
    <div className="min-h-screen relative">
      {/* Sticky Top Navigation Bar*/}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-white/20 h-[60px] flex items-center justify-center">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          {/* Left: Upload Button and Guidance Text or Clear Button */}
          <div className="flex items-center space-x-4">
            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="text-sm text-white hover:text-white px-3 py-1 rounded border border-white"
              disabled={isProcessing || isDragOver}
            >
              Choose images
            </button>

            {/* Guidance Text or Clear Button */}
            {uploadedImages.length > 0 ? (
              <button
                onClick={clearContactSheet}
                className="text-sm text-white hover:text-white px-3 py-1 rounded border border-white"
                disabled={isProcessing || isDragOver}
              >
                Clear
              </button>
            ) : (
              <span className="text-sm text-white italic hidden md:block">
                or drag them
              </span>
            )}
          </div>

          {/* Right: Download Button - only enabled when user uploads images */}
          <DownloadButton
            images={currentImages}
            highlights={highlights}
            xMarks={xMarks}
            filmStock={selectedFilmStock}
          />
        </div>
      </div>

      <div className="fixed bottom-0 z-40 bg-black/80 backdrop-blur-sm flex gap-2 md:gap-4 left-1/2 -translate-x-1/2 p-2 md:p-4 rounded-tl-lg rounded-tr-lg border-1 border-white/20">
        <div className="flex items-center space-x-2">
          <Select.Root
            value={selectedFilmStock}
            onValueChange={value => setSelectedFilmStock(value as FilmStock)}
          >
            <Select.Trigger className="px-2 py-1 text-xs text-white rounded focus:outline-none flex items-center justify-between text-nowrap">
              <Select.Value />
              <Select.Icon className="ml-1">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-black border border-gray-600 rounded shadow-lg z-50">
                <Select.Viewport className="p-1">
                  {Object.values(FILM_STOCKS).map(stock => (
                    <Select.Item
                      key={stock.id}
                      value={stock.id}
                      className="text-sm text-white px-3 py-1 rounded cursor-pointer hover:bg-white/20 focus:bg-white focus:text-black focus:outline-none"
                    >
                      <Select.ItemText>{stock.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Center-Right: Highlight Type Selector */}
        <HighlightTypeSelector
          selectedType={selectedHighlightType}
          onTypeChange={setSelectedHighlightType}
        />
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isProcessing || isDragOver}
      />

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="py-8 px-12 border-1 border-dashed border-white/50">
            <div className="text-center">
              <h3 className="text-l font-semibold ">Let your frames go</h3>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="py-8 px-12 border-1 border-dashed border-white/50">
            <div className="text-center">
              <h3 className="text-l font-semibold ">
                Creating your contact sheet...
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Error Display - only show if errors exist */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
          <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Contact Sheet - Scrollable at natural size */}
      <div
        ref={containerRef}
        className="w-full bg-black overflow-auto flex items-center justify-center pt-12 pb-[120px]"
        style={{
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <ContactSheet
          ref={contactSheetRef}
          images={currentImages}
          highlights={highlights}
          xMarks={xMarks}
          onHighlightsChange={setHighlights}
          onXMarksChange={setXMarks}
          filmStock={selectedFilmStock}
          selectedHighlightType={selectedHighlightType}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return <ContactSheetPageContent />;
}
