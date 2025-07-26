'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Tooltip from '@radix-ui/react-tooltip';

import { ContactSheet } from './contact-sheet/components/ContactSheet';
import { DownloadButton } from './contact-sheet/components/DownloadButton';
import { Toolbar } from './contact-sheet/components/Toolbar';
import {
  convertFilesToCompressedObjectUrls,
  getValidImages,
  getErrors,
  revokeObjectUrls,
} from './contact-sheet/utils/imageUtils';
import {
  FilmStock,
  FILM_STOCKS,
  Frame,
  ContactSheetState,
  Sticker,
} from './contact-sheet/utils/constants';
import { defaultFrameData } from './contact-sheet/utils/defaultFrameData';

function ContactSheetPageContent() {
  const contactSheetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // New object-based state
  const [contactSheetState, setContactSheetState] = useState<ContactSheetState>(
    {
      frames: {},
      frameOrder: [],
    }
  );

  const [errors, setErrors] = useState<string[]>([]);
  const [showDemo, setShowDemo] = useState(false); // Start with empty frames
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFilmStock, setSelectedFilmStock] =
    useState<FilmStock>('ilford-hp5');
  const [selectedToolbarAction, setSelectedToolbarAction] =
    useState<string>('');

  // Object-based sticker state
  const [stickerData, setStickerData] = useState<Record<string, Sticker>>({});
  const [stickerOrder, setStickerOrder] = useState<string[]>([]);
  const [focusedTextStickerId, setFocusedTextStickerId] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedObjectUrlsRef = useRef<string[]>([]); // Track blob URLs for cleanup

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device supports touch
    const checkTouchDevice = () => {
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      setIsTouchDevice(isTouch);

      // If on touch device and loupe is selected, reset to rectangle
      if (isTouch && selectedToolbarAction === 'loupe') {
        setSelectedToolbarAction('rectangle');
      }
    };

    checkTouchDevice();
  }, [selectedToolbarAction]);

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

      const key = event.key.toLowerCase();

      // Handle escape key to deselect current action
      if (key === 'escape') {
        if (selectedToolbarAction) {
          setSelectedToolbarAction('');
          event.preventDefault();
        }
        return;
      }

      // Don't handle shortcuts if any modifier keys are pressed
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      switch (key) {
        case 'c':
          setSelectedToolbarAction(current =>
            current === 'circle' ? '' : 'circle'
          );
          break;
        case 's':
          setSelectedToolbarAction(current =>
            current === 'scribble' ? '' : 'scribble'
          );
          break;
        case 'x':
          setSelectedToolbarAction(current =>
            current === 'cross' ? '' : 'cross'
          );
          break;
        case 'r':
          setSelectedToolbarAction(current =>
            current === 'rectangle' ? '' : 'rectangle'
          );
          break;
        case 'd':
          setSelectedToolbarAction(current =>
            current === 'delete' ? '' : 'delete'
          );
          break;
        case 'l':
          if (!isTouchDevice) {
            setSelectedToolbarAction(current =>
              current === 'loupe' ? '' : 'loupe'
            );
          }
          break;
        case 't':
          setSelectedToolbarAction(current =>
            current === 'text' ? '' : 'text'
          );
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
  }, [isTouchDevice, selectedToolbarAction]);

  // Clear focused sticker when toolbar action changes
  useEffect(() => {
    // Focus and editing state is now managed internally by ContactSheet
  }, [selectedToolbarAction]);

  // Check if we have any frames to work with (unused)

  // Demo frame data (loaded from external TypeScript file)
  const demoData: ContactSheetState = defaultFrameData;

  // Create array of 14 empty frames for default view
  const emptyFrames = useMemo(() => Array(14).fill(''), []);

  // Create empty frame state for initial display
  const createEmptyFrameState = (): ContactSheetState => {
    const frames: Record<string, Frame> = {};
    const frameOrder: string[] = [];

    emptyFrames.forEach((_, index) => {
      const id = `empty_${index}`;
      frames[id] = {
        src: '',
        highlights: {
          rectangle: false,
          circle: false,
          scribble: false,
          cross: false,
        },
      };
      frameOrder.push(id);
    });

    return { frames, frameOrder };
  };

  // Get current display state - actual frames or empty frames for initial display
  const getDisplayState = (): ContactSheetState => {
    if (contactSheetState.frameOrder.length > 0) {
      return contactSheetState;
    }
    return createEmptyFrameState();
  };

  const framesState = getDisplayState();

  // Helper to get current images from state
  const getCurrentImages = (): string[] => {
    return framesState.frameOrder.map(id => framesState.frames[id].src);
  };

  // Use uploaded images if available, otherwise demo images if enabled, otherwise empty frames
  const currentImages = getCurrentImages();

  // Clear contact sheet back to empty frames
  const clearContactSheet = useCallback(() => {
    revokeObjectUrls(uploadedObjectUrlsRef.current);
    uploadedObjectUrlsRef.current = [];
    setContactSheetState({ frames: {}, frameOrder: [] });
    setStickerData({});
    setStickerOrder([]);
    setShowDemo(false);
    setErrors([]);
  }, []);

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

      // When demo is active, uploaded images should replace demo data
      // When demo is not active, check against existing user-uploaded frames
      const existingUserFrameCount = showDemo
        ? 0
        : contactSheetState.frameOrder.length;
      const totalImages = existingUserFrameCount + files.length;
      if (totalImages > 42) {
        setErrors([
          `Too many images. Maximum is 42 total (you have ${existingUserFrameCount}, trying to add ${files.length}).`,
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
          // Generate IDs and create frame objects
          const newFrames: Record<string, Frame> = {};
          const newFrameOrder: string[] = [];

          validImages.forEach((src, index) => {
            const id = `frame_${Date.now()}_${index}`;
            newFrames[id] = {
              src,
              highlights: {
                rectangle: false,
                circle: false,
                scribble: false,
                cross: false,
              },
              uploadedAt: Date.now(),
            };
            newFrameOrder.push(id);
          });

          // If demo is active, replace demo data entirely
          // If demo is not active, add to existing frames
          if (showDemo) {
            // Replace demo data with new uploads
            setContactSheetState({
              frames: newFrames,
              frameOrder: newFrameOrder,
            });
          } else {
            // Add to existing frames
            setContactSheetState(prev => ({
              frames: { ...prev.frames, ...newFrames },
              frameOrder: [...prev.frameOrder, ...newFrameOrder],
            }));
          }

          // Track blob URLs for cleanup
          uploadedObjectUrlsRef.current = [
            ...uploadedObjectUrlsRef.current,
            ...validImages.filter(src => src.startsWith('blob:')),
          ];

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
    [contactSheetState.frameOrder.length, showDemo]
  );

  // Sticker drag handlers - now handled internally by ContactSheet

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

    // Add global event listeners for file drag/drop
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('dragleave', handleGlobalDragLeave);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('dragleave', handleGlobalDragLeave);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [processFiles]);

  // Cleanup Object URLs when component unmounts to prevent memory leaks
  // Don't cleanup on state changes or it will revoke URLs before download
  useEffect(() => {
    return () => {
      revokeObjectUrls(uploadedObjectUrlsRef.current);
    };
  }, []); // Empty dependency array - only cleanup on unmount

  // Handle image deletion
  const handleImageDelete = useCallback(
    (frameNumber: number) => {
      const imageIndex = frameNumber - 1;
      if (imageIndex < 0 || imageIndex >= currentImages.length) return;

      // Since demo frames are now loaded into normal state, treat all deletions the same
      if (imageIndex >= contactSheetState.frameOrder.length) return;

      const frameIdToDelete = contactSheetState.frameOrder[imageIndex];
      const frameToDelete = contactSheetState.frames[frameIdToDelete];

      // Revoke the object URL to prevent memory leaks (only for blob URLs)
      if (frameToDelete?.src && frameToDelete.src.startsWith('blob:')) {
        URL.revokeObjectURL(frameToDelete.src);
        // Remove from cleanup tracking
        uploadedObjectUrlsRef.current = uploadedObjectUrlsRef.current.filter(
          url => url !== frameToDelete.src
        );
      }

      // Remove frame from state
      const updatedFrames = { ...contactSheetState.frames };
      delete updatedFrames[frameIdToDelete];

      const updatedFrameOrder = contactSheetState.frameOrder.filter(
        id => id !== frameIdToDelete
      );

      setContactSheetState({
        frames: updatedFrames,
        frameOrder: updatedFrameOrder,
      });
    },
    [contactSheetState, currentImages]
  );

  // Helper functions for object-based sticker operations (unused in parent)

  const handleStickerDataChange = useCallback(
    (
      updatedStickerData: Record<string, Sticker>,
      updatedStickerOrder?: string[]
    ) => {
      setStickerData(updatedStickerData);
      if (updatedStickerOrder) {
        setStickerOrder(updatedStickerOrder);
      }
    },
    []
  );

  const handleSelectedActionChange = useCallback((action: string) => {
    setSelectedToolbarAction(action);
  }, []);

  const handleFocusedStickerChange = useCallback(
    (stickerId: string | null) => {
      // Set focused text sticker ID only for text stickers
      if (stickerId && stickerData[stickerId]?.type === 'text') {
        setFocusedTextStickerId(stickerId);
      } else {
        setFocusedTextStickerId(null);
      }

      // Don't automatically change toolbar action when focusing stickers
      // This allows users to focus one sticker type while having a different tool selected
    },
    [stickerData]
  );

  // Get selected text sticker for toolbar
  const selectedTextSticker = useMemo(() => {
    if (selectedToolbarAction === 'text' && focusedTextStickerId) {
      return stickerData[focusedTextStickerId] || null;
    }
    return null;
  }, [selectedToolbarAction, focusedTextStickerId, stickerData]);

  return (
    <Tooltip.Provider>
      <div className="min-h-screen relative z-0">
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

              {/* Demo Button or Clear Button */}
              {contactSheetState.frameOrder.length > 0 && !showDemo ? (
                <button
                  onClick={clearContactSheet}
                  className="text-sm text-white px-3 py-1"
                  disabled={isProcessing || isDragOver}
                >
                  Reset
                </button>
              ) : !showDemo ? (
                <button
                  onClick={() => {
                    setContactSheetState(demoData);
                    setShowDemo(true);
                  }}
                  className="text-sm text-white px-3 py-1"
                  disabled={isProcessing || isDragOver}
                >
                  View demo
                </button>
              ) : null}
            </div>

            {(contactSheetState.frameOrder.length > 0 || showDemo) && (
              <DownloadButton
                frames={contactSheetState.frames}
                frameOrder={contactSheetState.frameOrder}
                filmStock={selectedFilmStock}
                stickers={stickerOrder.map(id => stickerData[id])}
                isDemo={showDemo}
                onDownloadStateChange={setIsDownloading}
              />
            )}
          </div>
        </div>

        {/* Bottom toolbar - only show when there are images or demo is active */}
        {(contactSheetState.frameOrder.length > 0 || showDemo) && (
          <div className="fixed bottom-0 z-40 bg-black/80 backdrop-blur-sm flex gap-2 md:gap-4 left-1/2 -translate-x-1/2 p-2 md:p-4 rounded-tl-lg rounded-tr-lg border-1 border-white/20">
            <div className="flex items-center space-x-2">
              <Select.Root
                value={selectedFilmStock}
                onValueChange={value =>
                  setSelectedFilmStock(value as FilmStock)
                }
              >
                <Select.Trigger className="px-2 py-1 text-xs text-white rounded hover:bg-white/20 focus:outline-none flex items-center justify-between text-nowrap">
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
                  <Select.Content
                    position="popper"
                    className="bg-black border border-gray-600 rounded shadow-lg z-50"
                  >
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
            <Toolbar
              selectedAction={selectedToolbarAction}
              onActionChange={setSelectedToolbarAction}
              hideLoupeOption={isTouchDevice}
              selectedTextColor={selectedTextSticker?.color}
              onTextColorChange={(color: string) => {
                // Update the color of the focused text sticker
                if (focusedTextStickerId && stickerData[focusedTextStickerId]) {
                  const updatedStickerData = {
                    ...stickerData,
                    [focusedTextStickerId]: {
                      ...stickerData[focusedTextStickerId],
                      color,
                    },
                  };
                  setStickerData(updatedStickerData);
                }
              }}
            />
          </div>
        )}

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
            <div className="py-8 px-12">
              <div className="text-center">
                <h3 className="text-xl font-semibold">Drop images</h3>
              </div>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="py-8 px-12">
              <div className="text-center">
                <h3 className="text-xl font-semibold ">Creating...</h3>
              </div>
            </div>
          </div>
        )}

        {/* Download Overlay */}
        {isDownloading && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="py-8 px-12">
              <div className="text-center">
                <h3 className="text-xl font-semibold ">Generating...</h3>
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
          className={`w-full bg-black overflow-auto flex items-center justify-center`}
          style={{
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <div
            className={
              contactSheetState.frameOrder.length === 0 && !showDemo
                ? 'pointer-events-none'
                : ''
            }
            style={{
              cursor:
                selectedToolbarAction && selectedToolbarAction !== 'loupe'
                  ? 'crosshair'
                  : 'default',
              minWidth: '0',
            }}
          >
            <ContactSheet
              ref={contactSheetRef}
              frames={framesState}
              filmStock={selectedFilmStock}
              selectedToolbarAction={selectedToolbarAction}
              stickerData={stickerData}
              stickerOrder={stickerOrder}
              onStickerDataChange={handleStickerDataChange}
              onSelectedActionChange={handleSelectedActionChange}
              onFocusedStickerChange={handleFocusedStickerChange}
              onFrameUpdate={(frameId, updatedFrame) => {
                // Only update if it's not an empty frame
                if (!frameId.startsWith('empty_')) {
                  setContactSheetState(prev => ({
                    ...prev,
                    frames: { ...prev.frames, [frameId]: updatedFrame },
                  }));
                }
              }}
              onImageDelete={handleImageDelete}
            />
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}

export default function Home() {
  return <ContactSheetPageContent />;
}
