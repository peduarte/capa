'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ContactSheet } from './contact-sheet/components/ContactSheet';
import { DownloadButton } from './contact-sheet/components/DownloadButton';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImagesRef = useRef<string[]>([]); // Track images for cleanup

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
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-gray-700/50 h-[60px] flex items-center justify-center">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          {/* Left: Upload Button and Guidance Text or Clear Button */}
          <div className="flex items-center space-x-4">
            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="text-sm text-gray-300 hover:text-white px-3 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
              disabled={isProcessing || isDragOver}
            >
              Upload images
            </button>

            {/* Guidance Text or Clear Button */}
            {uploadedImages.length > 0 ? (
              <button
                onClick={clearContactSheet}
                className="text-sm text-gray-300 hover:text-white px-3 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                disabled={isProcessing || isDragOver}
              >
                Clear
              </button>
            ) : (
              <span className="text-sm text-gray-300">or drag them</span>
            )}
          </div>

          {/* Center: Film Stock Selector */}
          <div className="flex items-center space-x-2">
            <select
              id="film-stock"
              value={selectedFilmStock}
              onChange={e => setSelectedFilmStock(e.target.value as FilmStock)}
              className="text-sm bg-black border border-gray-600 text-gray-300 px-3 py-1 rounded hover:border-gray-400 focus:border-white focus:outline-none transition-colors"
            >
              {Object.values(FILM_STOCKS).map(stock => (
                <option key={stock.id} value={stock.id}>
                  {stock.name}
                </option>
              ))}
            </select>
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
        className="w-full bg-black overflow-auto flex items-center justify-center py-12"
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
        />
      </div>
    </div>
  );
}

export default function Home() {
  return <ContactSheetPageContent />;
}
