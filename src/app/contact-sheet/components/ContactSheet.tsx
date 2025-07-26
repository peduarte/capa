import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NegativeStrip } from './NegativeStrip';
import { Frame } from './Frame';
import {
  MEASUREMENTS,
  FilmStock,
  Frame as FrameData,
  StickerType,
  STICKER_CONFIGS,
  Sticker,
  ContactSheetState,
  TEXT_COLORS,
} from '../utils/constants';

interface ContactSheetProps {
  frames: ContactSheetState;
  filmStock: FilmStock;
  selectedToolbarAction: string;
  stickerData?: Record<string, Sticker>;
  stickerOrder?: string[];
  ref: React.RefObject<HTMLDivElement | null>;
  onFrameUpdate?: (frameId: string, updatedFrame: FrameData) => void;
  onImageDelete?: (frameNumber: number) => void;
  onStickerDataChange?: (
    stickerData: Record<string, Sticker>,
    stickerOrder?: string[]
  ) => void;
  onSelectedActionChange?: (action: string) => void;
  onFocusedStickerChange?: (stickerId: string | null) => void;
  disableLoupe?: boolean;
}

export const ContactSheet = React.forwardRef<HTMLDivElement, ContactSheetProps>(
  (
    {
      frames,
      filmStock,
      selectedToolbarAction,
      stickerData,
      stickerOrder,
      onFrameUpdate,
      onImageDelete,
      onStickerDataChange,
      onSelectedActionChange,
      onFocusedStickerChange,
      disableLoupe = false,
    },
    ref
  ) => {
    const textStickerRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const contactSheetRef = useRef<HTMLDivElement>(null);

    // Internal state for focus and editing (using IDs instead of indices)
    const [focusedStickerId, setFocusedStickerId] = useState<string | null>(
      null
    );
    const [editingStickerId, setEditingStickerId] = useState<string | null>(
      null
    );

    // Internal state for dragging
    const [isDraggingSticker, setIsDraggingSticker] = useState(false);
    const [draggingStickerId, setDraggingStickerId] = useState<string | null>(
      null
    );
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
    const [isNewlyPlacedSticker, setIsNewlyPlacedSticker] = useState(false);
    const [localStickerData, setLocalStickerData] = useState<
      Record<string, Sticker>
    >({});
    const [localStickerOrder, setLocalStickerOrder] = useState<string[]>([]);

    // Loupe configuration
    const loupeSize = 188; // Adjust this value to change loupe size
    const loupeScaleFactor = 2; // Adjust this value to change magnification level

    // Loupe state
    const [loupeVisible, setLoupeVisible] = useState(false);
    const [loupePosition, setLoupePosition] = useState({ x: 0, y: 0 });
    const [loupeOffset, setLoupeOffset] = useState({ x: 0, y: 0 });

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
      };

      // Global mouse handler for loupe
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (
          selectedToolbarAction === 'loupe' &&
          !isTouchDevice &&
          !disableLoupe &&
          contactSheetRef.current
        ) {
          const rect = contactSheetRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          // Calculate the contact sheet dimensions
          const numberOfStrips = Math.ceil(frames.frameOrder.length / 6);
          const maxFramesPerStrip = Math.min(6, frames.frameOrder.length);
          const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;
          const sheetWidth = maxStripWidth + 32;
          const sheetHeight =
            MEASUREMENTS.frameHeight * numberOfStrips +
            (numberOfStrips - 1) * 16 +
            32;

          // Check if we're near the contact sheet
          const tolerance = 20;
          if (
            mouseX < -tolerance ||
            mouseX > sheetWidth + tolerance ||
            mouseY < -tolerance ||
            mouseY > sheetHeight + tolerance
          ) {
            setLoupeVisible(false);
            return;
          }

          // Calculate normalized position for the transform
          const normalizedX = mouseX / sheetWidth;
          const normalizedY = mouseY / sheetHeight;

          setLoupeVisible(true);
          setLoupePosition({
            x: e.clientX,
            y: e.clientY,
          });
          setLoupeOffset({ x: normalizedX, y: normalizedY });
        } else {
          setLoupeVisible(false);
        }
      };

      checkTouchDevice();
      window.addEventListener('mousemove', handleGlobalMouseMove);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }, [
      selectedToolbarAction,
      frames.frameOrder.length,
      isTouchDevice,
      disableLoupe,
    ]);

    // Hide loupe when switching away from loupe mode
    useEffect(() => {
      if (selectedToolbarAction !== 'loupe') {
        setLoupeVisible(false);
      }
    }, [selectedToolbarAction]);

    const handleContactSheetMouseLeave = useCallback(() => {
      if (
        selectedToolbarAction === 'loupe' &&
        !isTouchDevice &&
        !disableLoupe
      ) {
        setLoupeVisible(false);
      }
    }, [selectedToolbarAction, isTouchDevice, disableLoupe]);

    // Helper function to generate sticker IDs
    const generateStickerId = useCallback(
      () =>
        `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      []
    );

    // Notify parent when focused sticker changes
    useEffect(() => {
      if (onFocusedStickerChange) {
        // Report the focused or editing sticker (editing takes priority for text stickers)
        const activeStickerId = editingStickerId || focusedStickerId;
        if (activeStickerId && localStickerData[activeStickerId]) {
          onFocusedStickerChange(activeStickerId);
        } else {
          onFocusedStickerChange(null);
        }
      }
    }, [
      editingStickerId,
      focusedStickerId,
      localStickerData,
      onFocusedStickerChange,
    ]);

    // Sync local sticker data with props when not dragging
    useEffect(() => {
      if (!isDraggingSticker) {
        setLocalStickerData(stickerData || {});
        setLocalStickerOrder(stickerOrder || []);
      }
    }, [stickerData, stickerOrder, isDraggingSticker]);

    // Track toolbar interactions to prevent clearing focused stickers
    const isToolbarInteractionRef = useRef(false);

    // Track toolbar interactions to prevent clearing focused stickers
    useEffect(() => {
      const handleGlobalMouseDown = (event: MouseEvent) => {
        const target = event.target as Element;

        // Check if the mouseDown was on the toolbar
        const isToolbarClick = target?.closest('[data-toolbar="true"]');

        if (isToolbarClick) {
          // Mark as toolbar interaction and reset after a longer delay
          isToolbarInteractionRef.current = true;
          setTimeout(() => {
            isToolbarInteractionRef.current = false;
          }, 100); // Increased from 10ms to 100ms
        }
      };

      document.addEventListener('mousedown', handleGlobalMouseDown, true); // Use capture phase
      return () =>
        document.removeEventListener('mousedown', handleGlobalMouseDown, true);
    }, []);

    // Clear focused sticker when toolbar action changes to different sticker type
    useEffect(() => {
      // Only check if there's a focused sticker
      if (focusedStickerId) {
        // Get the type of the currently focused sticker
        const focusedSticker = localStickerData[focusedStickerId];
        if (focusedSticker) {
          // Determine expected toolbar action for this sticker type
          let expectedAction = '';
          if (focusedSticker.type === 'text') {
            expectedAction = 'text';
          } else if (focusedSticker.type === 'dot') {
            expectedAction = 'sticker-dot';
          } else if (focusedSticker.type === 'twin-check') {
            expectedAction = 'sticker-twin-check';
          }

          // Clear focus if toolbar action doesn't match the focused sticker type
          if (selectedToolbarAction !== expectedAction) {
            setFocusedStickerId(null);
            setEditingStickerId(null);
          }
        }
      }
    }, [selectedToolbarAction, focusedStickerId, localStickerData]);

    // Global event handlers for sticker dragging
    useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDraggingSticker && draggingStickerId && contactSheetRef.current) {
          const contactSheetRect =
            contactSheetRef.current.getBoundingClientRect();
          const mouseX = e.clientX - contactSheetRect.left;
          const mouseY = e.clientY - contactSheetRect.top;

          // Get the sticker config for bounds calculation
          const currentSticker = localStickerData[draggingStickerId];
          const stickerConfig = currentSticker
            ? STICKER_CONFIGS[currentSticker.type]
            : null;
          const stickerWidth = stickerConfig?.width || 51;
          const stickerHeight = stickerConfig?.height || 26;

          // Calculate new position accounting for drag offset
          const newLeft = Math.max(
            0,
            Math.min(
              contactSheetRect.width - stickerWidth,
              mouseX - dragOffset.x
            )
          );
          const newTop = Math.max(
            0,
            Math.min(
              contactSheetRect.height - stickerHeight,
              mouseY - dragOffset.y
            )
          );

          // Update local sticker data only (no parent callback during drag)
          const updatedStickerData = {
            ...localStickerData,
            [draggingStickerId]: {
              ...currentSticker,
              left: newLeft,
              top: newTop,
            },
          };
          setLocalStickerData(updatedStickerData);
        }
      };

      const handleGlobalMouseUp = () => {
        if (isDraggingSticker && draggingStickerId) {
          // Check for sticker deletion before resetting drag state
          if (selectedToolbarAction.startsWith('sticker-')) {
            const currentSticker = localStickerData[draggingStickerId];
            const selectedStickerType = selectedToolbarAction.replace(
              'sticker-',
              ''
            );

            // Check if the sticker didn't move (within a small tolerance) and types match
            const tolerance = 2; // pixels
            const didNotMove =
              Math.abs(currentSticker.left - dragStartPosition.x) < tolerance &&
              Math.abs(currentSticker.top - dragStartPosition.y) < tolerance;

            if (
              didNotMove &&
              currentSticker.type === selectedStickerType &&
              isNewlyPlacedSticker
            ) {
              // Delete the newly placed sticker that wasn't moved
              const updatedStickerData = { ...localStickerData };
              delete updatedStickerData[draggingStickerId];
              // Remove sticker from order as well
              const updatedOrder = localStickerOrder.filter(
                id => id !== draggingStickerId
              );
              setLocalStickerOrder(updatedOrder);

              if (onStickerDataChange) {
                onStickerDataChange(updatedStickerData, updatedOrder);
              }
            } else {
              // Commit the final position to parent
              if (onStickerDataChange) {
                onStickerDataChange(localStickerData, localStickerOrder);
              }
            }
          } else {
            // Commit the final position to parent
            if (onStickerDataChange) {
              onStickerDataChange(localStickerData);
            }
          }
        }

        setIsDraggingSticker(false);
        setDraggingStickerId(null);
        setIsNewlyPlacedSticker(false);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }, [
      isDraggingSticker,
      draggingStickerId,
      dragOffset,
      localStickerData,
      localStickerOrder,
      dragStartPosition,
      selectedToolbarAction,
      onStickerDataChange,
      isNewlyPlacedSticker,
    ]);

    // Internal sticker mouse down handler
    const handleStickerMouseDown = (
      stickerId: string,
      event: React.MouseEvent
    ) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDraggingSticker(true);
      setDraggingStickerId(stickerId);
      setIsNewlyPlacedSticker(false); // This is an existing sticker being clicked

      // Store the initial position of the sticker being dragged
      const contactSheetRect = contactSheetRef.current?.getBoundingClientRect();
      const sticker = localStickerData[stickerId];
      if (contactSheetRect && sticker) {
        setDragStartPosition({
          x: sticker.left,
          y: sticker.top,
        });

        // Calculate offset from mouse to sticker's current position
        const mouseX = event.clientX - contactSheetRect.left;
        const mouseY = event.clientY - contactSheetRect.top;

        setDragOffset({
          x: mouseX - sticker.left,
          y: mouseY - sticker.top,
        });
      }
    };

    // Focus the contenteditable when a text sticker enters editing mode
    useEffect(() => {
      if (
        editingStickerId &&
        localStickerData[editingStickerId]?.type === 'text'
      ) {
        const element = textStickerRefs.current[editingStickerId];
        if (element) {
          setTimeout(() => {
            element.focus();
            // Select all text for easy replacement
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(element);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }, 10);
        }
      }
    }, [editingStickerId, localStickerData]);

    const numberOfStrips = Math.ceil(frames.frameOrder.length / 6);
    const maxFramesPerStrip = Math.min(6, frames.frameOrder.length);
    const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;

    const handleFrameClick = (frameNumber: number) => {
      if (selectedToolbarAction === 'delete') {
        onImageDelete?.(frameNumber);
        return;
      }

      // Check if we have a valid frame to update
      const frameId = frames.frameOrder[frameNumber - 1];
      const frame = frames.frames[frameId];
      if (!frame || !onFrameUpdate) return;

      // Get the highlight type from the selected action
      const highlightType =
        selectedToolbarAction as keyof FrameData['highlights'];
      if (
        !['rectangle', 'circle', 'scribble', 'cross'].includes(highlightType)
      ) {
        return;
      }

      // Toggle the highlight
      const newHighlights = {
        ...frame.highlights,
        [highlightType]: !frame.highlights[highlightType],
      };

      onFrameUpdate(frameId, { ...frame, highlights: newHighlights });
    };

    const handleContactSheetMouseDown = (event: React.MouseEvent) => {
      // Check if the click is on a sticker element
      const target = event.target as Element;
      const isClickingOnSticker = target.closest('[data-sticker-id]') !== null;

      // If clicking on a sticker, the sticker's onMouseDown should have called stopPropagation
      // This handler should not run for sticker clicks
      if (isClickingOnSticker) {
        return;
      }

      // Check if it's a sticker mode or text mode
      if (
        selectedToolbarAction.startsWith('sticker-') ||
        selectedToolbarAction === 'text'
      ) {
        // If a sticker is already focused, unfocus it (since we're not clicking on a sticker)
        if (focusedStickerId) {
          // Save text if we're currently editing a text sticker
          if (
            editingStickerId &&
            localStickerData[editingStickerId]?.type === 'text'
          ) {
            const element = textStickerRefs.current[editingStickerId];
            if (element) {
              const finalText = element.textContent || '';
              const updatedStickerData = {
                ...localStickerData,
                [editingStickerId]: {
                  ...localStickerData[editingStickerId],
                  text: finalText,
                },
              };
              setLocalStickerData(updatedStickerData);
              if (onStickerDataChange) {
                onStickerDataChange(updatedStickerData, localStickerOrder);
              }
            }
          }

          setFocusedStickerId(null);
          setEditingStickerId(null); // Also clear editing state
          return;
        }

        // No sticker is focused, so place a new one
        // Calculate click position relative to the contact sheet
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        let stickerType: StickerType;
        if (selectedToolbarAction === 'text') {
          stickerType = 'text';
        } else {
          // Extract sticker type from selectedToolbarAction (e.g., "sticker-dot" -> "dot")
          stickerType = selectedToolbarAction.replace(
            'sticker-',
            ''
          ) as StickerType;
        }

        const stickerConfig = STICKER_CONFIGS[stickerType];

        // Position sticker at click location, accounting for sticker size
        const stickerLeft = Math.max(
          0,
          Math.min(
            rect.width - stickerConfig.width,
            clickX - stickerConfig.width / 2
          )
        );
        const stickerTop = Math.max(
          0,
          Math.min(
            rect.height - stickerConfig.height,
            clickY - stickerConfig.height / 2
          )
        );

        const newSticker: Sticker = {
          type: stickerType,
          top: stickerTop,
          left: stickerLeft,
          text: stickerType === 'text' ? 'Edit me' : undefined,
          color: stickerType === 'text' ? TEXT_COLORS.white : undefined,
        };

        // Generate ID for new sticker
        const newStickerId = generateStickerId();
        const updatedStickerData = {
          ...localStickerData,
          [newStickerId]: newSticker,
        };
        const updatedStickerOrder = [...localStickerOrder, newStickerId];

        setLocalStickerData(updatedStickerData);
        setLocalStickerOrder(updatedStickerOrder);

        // Commit new sticker immediately
        if (onStickerDataChange) {
          onStickerDataChange(updatedStickerData, updatedStickerOrder);
        }

        // Mark this as a newly placed sticker for potential deletion
        setIsNewlyPlacedSticker(true);

        // For text stickers, focus immediately and start editing
        if (stickerType === 'text') {
          setTimeout(() => {
            setFocusedStickerId(newStickerId);
            setEditingStickerId(newStickerId);
            // Notify parent that text action should be selected
            if (onSelectedActionChange) {
              onSelectedActionChange('text');
            }
          }, 0);
        }
      } else {
        // No sticker tool selected, deselect any focused stickers
        if (focusedStickerId || editingStickerId) {
          // Save text if editing
          if (
            editingStickerId &&
            localStickerData[editingStickerId]?.type === 'text'
          ) {
            const element = textStickerRefs.current[editingStickerId];
            if (element) {
              const finalText = element.textContent || '';
              const updatedStickerData = {
                ...localStickerData,
                [editingStickerId]: {
                  ...localStickerData[editingStickerId],
                  text: finalText,
                },
              };
              setLocalStickerData(updatedStickerData);
              if (onStickerDataChange) {
                onStickerDataChange(updatedStickerData, localStickerOrder);
              }
            }
          }

          setFocusedStickerId(null);
          setEditingStickerId(null);
        }
      }
    };

    const loupePortal =
      loupeVisible &&
      !isTouchDevice &&
      !disableLoupe &&
      typeof window !== 'undefined' &&
      createPortal(
        <div
          data-loupe="true"
          className="fixed z-50 pointer-events-none"
          style={{
            left: '0px',
            top: '0px',
            transform: `translate(${loupePosition.x - loupeSize / 2}px, ${loupePosition.y - loupeSize / 2}px)`,
            width: `${loupeSize}px`,
            height: `${loupeSize}px`,
            border: '3px solid white',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              transform: `scale(${loupeScaleFactor}) translate(${
                loupeSize / 2 / loupeScaleFactor -
                loupeOffset.x *
                  (Math.min(6, frames.frameOrder.length) *
                    MEASUREMENTS.frameWidth +
                    32)
              }px, ${
                loupeSize / 2 / loupeScaleFactor -
                loupeOffset.y *
                  (MEASUREMENTS.frameHeight *
                    Math.ceil(frames.frameOrder.length / 6) +
                    (Math.ceil(frames.frameOrder.length / 6) - 1) * 16 +
                    32)
              }px)`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            <ContactSheet
              ref={null}
              frames={frames}
              filmStock={filmStock}
              selectedToolbarAction="" // Disable interactions in loupe
              stickerData={localStickerData}
              stickerOrder={localStickerOrder}
              onFrameUpdate={() => {}} // No-op for loupe
              onImageDelete={() => {}} // No-op for loupe
              onStickerDataChange={() => {}} // No-op for loupe
              disableLoupe={true} // Prevent recursive loupe rendering
            />
          </div>
        </div>,
        document.body
      );

    return (
      <>
        {loupePortal}
        <div
          className="relative bg-black"
          style={{
            width: maxStripWidth + 128,
            height:
              MEASUREMENTS.frameHeight * numberOfStrips +
              (numberOfStrips - 1) * 16 +
              128,
            minWidth: '0',
            padding: '64px',
          }}
          onMouseLeave={handleContactSheetMouseLeave}
          onMouseDown={handleContactSheetMouseDown}
          ref={contactSheetRef}
        >
          {/* Forward the original ref to the first child for download functionality */}
          <div ref={ref} className="absolute inset-0 pointer-events-none" />

          {Array.from({ length: numberOfStrips }, (_, i) => {
            const startIndex = i * 6;
            const endIndex = Math.min(startIndex + 6, frames.frameOrder.length);
            const stripFrameIds = frames.frameOrder.slice(startIndex, endIndex);

            // Calculate strip rotation for authentic look
            const seed = i * 123.456;
            const stripRotation = Math.sin(seed) * 0.5;

            return (
              <NegativeStrip
                key={`strip-${i}`}
                rotation={stripRotation}
                framesCount={stripFrameIds.length}
              >
                {stripFrameIds.map((frameId, index) => (
                  <Frame
                    key={frameId}
                    frameId={frameId}
                    frame={frames.frames[frameId]}
                    frameNumber={startIndex + index + 1}
                    filmStock={filmStock}
                    selectedToolbarAction={selectedToolbarAction}
                    onFrameClick={handleFrameClick}
                  />
                ))}
              </NegativeStrip>
            );
          })}

          {/* Stickers */}
          {localStickerOrder &&
            localStickerOrder.map(stickerId => {
              const sticker = localStickerData[stickerId];
              if (!sticker) return null;

              const stickerConfig = STICKER_CONFIGS[sticker.type];
              if (!stickerConfig) return null;

              const isFocused = focusedStickerId === stickerId;

              // Handle text stickers differently
              if (sticker.type === 'text') {
                const isEditing = editingStickerId === stickerId;

                return (
                  <div
                    key={`sticker-${stickerId}`}
                    data-sticker-id={stickerId}
                    style={{
                      position: 'absolute',
                      top: `${sticker.top - 4}px`,
                      left: `${sticker.left - 4}px`,
                      padding: '4px',
                    }}
                  >
                    {/* Text element with contenteditable */}
                    <div
                      key={`text-${stickerId}-${isEditing ? 'editing' : 'display'}`}
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      className="absolute select-none font-rock-salt"
                      style={{
                        top: '4px',
                        left: '4px',
                        minWidth: `${stickerConfig.width}px`,
                        minHeight: `${Math.max(stickerConfig.height, 32)}px`,
                        cursor: isEditing
                          ? 'text'
                          : isFocused && !isEditing
                            ? 'grab'
                            : 'pointer',
                        zIndex: 10,
                        color: sticker.color || TEXT_COLORS.white,
                        fontSize: '18px',
                        lineHeight: '1.1',
                        padding: '2px',
                        outline: isFocused ? '2px solid white' : 'none',
                        background: !isFocused
                          ? 'rgba(0,0,0,0.3)'
                          : isEditing
                            ? 'rgba(0,0,0,0.9)'
                            : 'transparent',
                        borderRadius: '2px',
                        whiteSpace: 'nowrap',
                        userSelect: isEditing ? 'text' : 'none',
                      }}
                      onInput={() => {
                        // Don't update state during typing - let contenteditable handle it naturally
                        // We'll capture the final value when editing is committed
                      }}
                      onKeyDown={event => {
                        if (
                          isEditing &&
                          (event.key === 'Enter' || event.key === 'Escape')
                        ) {
                          event.preventDefault();
                          // Commit text changes when exiting edit mode
                          const finalText =
                            event.currentTarget.textContent || '';
                          const updatedStickerData = {
                            ...localStickerData,
                            [stickerId]: {
                              ...sticker,
                              text: finalText,
                            },
                          };
                          setLocalStickerData(updatedStickerData);
                          if (onStickerDataChange) {
                            onStickerDataChange(
                              updatedStickerData,
                              localStickerOrder
                            );
                          }
                          setEditingStickerId(null);
                          setFocusedStickerId(null);
                          event.currentTarget.blur();
                        }
                        event.stopPropagation();
                      }}
                      onBlur={event => {
                        // Always commit text changes when losing focus, regardless of editing state
                        // (the editing state might have been reset by other event handlers)
                        const finalText = event.currentTarget.textContent || '';
                        const updatedStickerData = {
                          ...localStickerData,
                          [stickerId]: {
                            ...sticker,
                            text: finalText,
                          },
                        };
                        setLocalStickerData(updatedStickerData);
                        if (onStickerDataChange) {
                          onStickerDataChange(
                            updatedStickerData,
                            localStickerOrder
                          );
                        }
                        setEditingStickerId(null);
                        setFocusedStickerId(null);
                      }}
                      onMouseDown={event => {
                        event.stopPropagation();

                        // Always focus this sticker when clicked (handles sticker-to-sticker transitions)
                        setFocusedStickerId(stickerId);

                        if (isFocused && !isEditing) {
                          // If this sticker was already focused but not editing: start dragging
                          handleStickerMouseDown(stickerId, event);
                        }
                        // If already editing, let the contenteditable handle it
                      }}
                      onDoubleClick={event => {
                        event.stopPropagation();
                        // Double click when focused: start editing
                        if (isFocused && !isEditing) {
                          setEditingStickerId(stickerId);
                          // Focus will be handled by useEffect
                        }
                      }}
                      ref={el => {
                        textStickerRefs.current[stickerId] = el;
                      }}
                    >
                      {!isEditing
                        ? sticker.text || 'Click to edit'
                        : sticker.text || 'Edit me'}
                    </div>
                  </div>
                );
              }

              // Regular image stickers
              return (
                <div
                  key={`sticker-${stickerId}`}
                  data-sticker-id={stickerId}
                  className="absolute select-none"
                  style={{
                    top: `${sticker.top}px`,
                    left: `${sticker.left}px`,
                    width: `${stickerConfig.width}px`,
                    height: `${stickerConfig.height}px`,
                    backgroundImage: `url(${stickerConfig.image})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    userSelect: 'none',
                    transform: stickerConfig.transform || '',
                    transformOrigin: 'center center',
                    outline: isFocused ? '2px solid white' : 'none',
                  }}
                  onMouseDown={event => {
                    event.stopPropagation();

                    // Always focus this sticker when clicked (handles sticker-to-sticker transitions)
                    setFocusedStickerId(stickerId);

                    if (isFocused) {
                      // If this sticker was already focused: start dragging
                      handleStickerMouseDown(stickerId, event);
                    }
                  }}
                />
              );
            })}
        </div>
      </>
    );
  }
);

ContactSheet.displayName = 'ContactSheet';
