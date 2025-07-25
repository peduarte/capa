import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NegativeStrip } from './NegativeStrip';
import { Frame } from './Frame';
import {
  MEASUREMENTS,
  FilmStock,
  FILM_STOCKS,
  Frame as FrameData,
  StickerType,
  STICKER_CONFIGS,
  Sticker,
  ContactSheetState,
  TextColor,
  TEXT_COLORS,
} from '../utils/constants';

interface ContactSheetProps {
  frames: ContactSheetState;
  filmStock: FilmStock;
  selectedToolbarAction: string;
  stickers?: Sticker[];
  ref: React.RefObject<HTMLDivElement | null>;
  onFrameUpdate?: (frameId: string, updatedFrame: FrameData) => void;
  onImageDelete?: (frameNumber: number) => void;
  onStickerUpdate?: (stickers: Sticker[]) => void;
  disableLoupe?: boolean;
  onFocusedTextStickerChange?: (color: TextColor | null) => void;
  onFocusedStickerIndexChange?: (index: number) => void;
}

export const ContactSheet = React.forwardRef<HTMLDivElement, ContactSheetProps>(
  (
    {
      frames,
      filmStock,
      selectedToolbarAction,
      stickers,
      onFrameUpdate,
      onImageDelete,
      onStickerUpdate,
      disableLoupe = false,
      onFocusedTextStickerChange,
      onFocusedStickerIndexChange,
    },
    ref
  ) => {
    const textStickerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const contactSheetRef = useRef<HTMLDivElement>(null);

    // Internal state for focus and editing
    const [focusedStickerIndex, setFocusedStickerIndex] = useState<number>(-1);
    const [editingStickerIndex, setEditingStickerIndex] = useState<number>(-1);

    // Internal state for dragging
    const [isDraggingSticker, setIsDraggingSticker] = useState(false);
    const [draggingStickerIndex, setDraggingStickerIndex] =
      useState<number>(-1);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
    const [localStickers, setLocalStickers] = useState<Sticker[]>([]);

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

    // Sync local stickers with props when not dragging
    useEffect(() => {
      if (!isDraggingSticker) {
        setLocalStickers(stickers || []);
      }
    }, [stickers, isDraggingSticker]);

    // Clear focused sticker when toolbar action changes
    useEffect(() => {
      setFocusedStickerIndex(-1);
      setEditingStickerIndex(-1);
    }, [selectedToolbarAction]);

    // Communicate focused text sticker color to parent
    useEffect(() => {
      if (onFocusedTextStickerChange) {
        if (
          focusedStickerIndex >= 0 &&
          localStickers[focusedStickerIndex]?.type === 'text'
        ) {
          const focusedSticker = localStickers[focusedStickerIndex];
          const color = focusedSticker.color;
          // Find the matching TextColor key for this color value
          const colorKey = Object.entries(TEXT_COLORS).find(
            ([key, value]) => value === color
          )?.[0] as TextColor;
          onFocusedTextStickerChange(colorKey || 'white');
        } else {
          onFocusedTextStickerChange(null);
        }
      }
    }, [focusedStickerIndex, localStickers, onFocusedTextStickerChange]);

    // Communicate focused sticker index to parent
    useEffect(() => {
      if (onFocusedStickerIndexChange) {
        onFocusedStickerIndexChange(focusedStickerIndex);
      }
    }, [focusedStickerIndex, onFocusedStickerIndexChange]);

    // Global event handlers for sticker dragging
    useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (
          isDraggingSticker &&
          draggingStickerIndex >= 0 &&
          contactSheetRef.current
        ) {
          const contactSheetRect =
            contactSheetRef.current.getBoundingClientRect();
          const mouseX = e.clientX - contactSheetRect.left;
          const mouseY = e.clientY - contactSheetRect.top;

          // Get the sticker config for bounds calculation
          const currentSticker = localStickers[draggingStickerIndex];
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

          // Update local stickers only (no parent callback during drag)
          const updatedStickers = localStickers.map((sticker, index) =>
            index === draggingStickerIndex
              ? { ...sticker, left: newLeft, top: newTop }
              : sticker
          );
          setLocalStickers(updatedStickers);
        }
      };

      const handleGlobalMouseUp = () => {
        if (isDraggingSticker && draggingStickerIndex >= 0 && onStickerUpdate) {
          // Check for sticker deletion before resetting drag state
          if (selectedToolbarAction.startsWith('sticker-')) {
            const currentSticker = localStickers[draggingStickerIndex];
            const selectedStickerType = selectedToolbarAction.replace(
              'sticker-',
              ''
            );

            // Check if the sticker didn't move (within a small tolerance) and types match
            const tolerance = 2; // pixels
            const didNotMove =
              Math.abs(currentSticker.left - dragStartPosition.x) < tolerance &&
              Math.abs(currentSticker.top - dragStartPosition.y) < tolerance;

            if (didNotMove && currentSticker.type === selectedStickerType) {
              // Delete the sticker and commit to parent
              const updatedStickers = localStickers.filter(
                (_, index) => index !== draggingStickerIndex
              );
              onStickerUpdate(updatedStickers);
            } else {
              // Commit the final position to parent
              onStickerUpdate(localStickers);
            }
          } else {
            // Commit the final position to parent
            onStickerUpdate(localStickers);
          }
        }

        setIsDraggingSticker(false);
        setDraggingStickerIndex(-1);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }, [
      isDraggingSticker,
      draggingStickerIndex,
      dragOffset,
      localStickers,
      dragStartPosition,
      selectedToolbarAction,
      onStickerUpdate,
    ]);

    // Internal sticker mouse down handler
    const handleStickerMouseDown = (
      stickerIndex: number,
      event: React.MouseEvent
    ) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDraggingSticker(true);
      setDraggingStickerIndex(stickerIndex);

      // Store the initial position of the sticker being dragged
      const contactSheetRect = contactSheetRef.current?.getBoundingClientRect();
      if (contactSheetRect && localStickers && localStickers[stickerIndex]) {
        setDragStartPosition({
          x: localStickers[stickerIndex].left,
          y: localStickers[stickerIndex].top,
        });

        // Calculate offset from mouse to sticker's current position
        const mouseX = event.clientX - contactSheetRect.left;
        const mouseY = event.clientY - contactSheetRect.top;
        const sticker = localStickers[stickerIndex];

        setDragOffset({
          x: mouseX - sticker.left,
          y: mouseY - sticker.top,
        });
      }
    };

    // Focus the contenteditable when a text sticker enters editing mode
    useEffect(() => {
      if (
        editingStickerIndex >= 0 &&
        localStickers &&
        localStickers[editingStickerIndex]?.type === 'text'
      ) {
        const element = textStickerRefs.current[editingStickerIndex];
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
    }, [editingStickerIndex]);

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
      // Check if it's a sticker mode or text mode
      if (
        (selectedToolbarAction.startsWith('sticker-') ||
          selectedToolbarAction === 'text') &&
        onStickerUpdate
      ) {
        // If a sticker is already focused, just unfocus it (don't place new)
        if (focusedStickerIndex !== -1) {
          // Save text if we're currently editing a text sticker
          if (
            editingStickerIndex !== -1 &&
            localStickers[editingStickerIndex]?.type === 'text'
          ) {
            const element = textStickerRefs.current[editingStickerIndex];
            if (element) {
              const finalText = element.textContent || '';
              const updatedStickers = localStickers.map((s, i) =>
                i === editingStickerIndex ? { ...s, text: finalText } : s
              );
              setLocalStickers(updatedStickers);
              if (onStickerUpdate) {
                onStickerUpdate(updatedStickers);
              }
            }
          }

          setFocusedStickerIndex(-1);
          setEditingStickerIndex(-1); // Also clear editing state
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

        const newStickers = [...(localStickers || []), newSticker];
        setLocalStickers(newStickers);
        onStickerUpdate?.(newStickers); // Commit new sticker immediately

        // Focus the newly created sticker with a small delay to ensure rendering
        const newStickerIndex = newStickers.length - 1;
        setTimeout(() => {
          setFocusedStickerIndex(newStickerIndex);
          // For text stickers, immediately start editing
          if (stickerType === 'text') {
            setEditingStickerIndex(newStickerIndex);
          }
        }, 0);
      } else {
        // No sticker tool selected, unfocus any focused stickers
        // Save text if we're currently editing a text sticker
        if (
          editingStickerIndex !== -1 &&
          localStickers[editingStickerIndex]?.type === 'text'
        ) {
          const element = textStickerRefs.current[editingStickerIndex];
          if (element) {
            const finalText = element.textContent || '';
            const updatedStickers = localStickers.map((s, i) =>
              i === editingStickerIndex ? { ...s, text: finalText } : s
            );
            setLocalStickers(updatedStickers);
            if (onStickerUpdate) {
              onStickerUpdate(updatedStickers);
            }
          }
        }

        setFocusedStickerIndex(-1);
        setEditingStickerIndex(-1);
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
              stickers={localStickers}
              onFrameUpdate={() => {}} // No-op for loupe
              onImageDelete={() => {}} // No-op for loupe
              onStickerUpdate={() => {}} // No-op for loupe
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
          {localStickers &&
            localStickers.map((sticker, index) => {
              const stickerConfig = STICKER_CONFIGS[sticker.type];
              if (!stickerConfig) return null;

              const isFocused = focusedStickerIndex === index;

              // Handle text stickers differently
              if (sticker.type === 'text') {
                const isEditing = editingStickerIndex === index;

                return (
                  <div
                    key={`sticker-${index}`}
                    style={{
                      position: 'absolute',
                      top: `${sticker.top - 4}px`,
                      left: `${sticker.left - 4}px`,
                      padding: '4px',
                    }}
                  >
                    {/* Text element with contenteditable */}
                    <div
                      key={`text-${index}-${isEditing ? 'editing' : 'display'}`}
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      className="absolute select-none font-permanent-marker"
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
                        fontSize: '28px',
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
                      onInput={event => {
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
                          const updatedStickers = localStickers.map((s, i) =>
                            i === index ? { ...s, text: finalText } : s
                          );
                          setLocalStickers(updatedStickers);
                          if (onStickerUpdate) {
                            onStickerUpdate(updatedStickers);
                          }
                          setEditingStickerIndex(-1);
                          setFocusedStickerIndex(-1);
                          event.currentTarget.blur();
                        }
                        event.stopPropagation();
                      }}
                      onBlur={event => {
                        // Always commit text changes when losing focus, regardless of editing state
                        // (the editing state might have been reset by other event handlers)
                        const finalText = event.currentTarget.textContent || '';
                        const updatedStickers = localStickers.map((s, i) =>
                          i === index ? { ...s, text: finalText } : s
                        );
                        setLocalStickers(updatedStickers);
                        if (onStickerUpdate) {
                          onStickerUpdate(updatedStickers);
                        }
                        setEditingStickerIndex(-1);
                        setFocusedStickerIndex(-1);
                      }}
                      onMouseDown={event => {
                        event.stopPropagation();

                        if (!isFocused) {
                          // First click: focus the sticker
                          setFocusedStickerIndex(index);
                        } else if (!isEditing) {
                          // If focused but not editing: start dragging
                          handleStickerMouseDown(index, event);
                        }
                        // If already editing, let the contenteditable handle it
                      }}
                      onDoubleClick={event => {
                        event.stopPropagation();
                        // Double click when focused: start editing
                        if (isFocused && !isEditing) {
                          setEditingStickerIndex(index);
                          // Focus will be handled by useEffect
                        }
                      }}
                      ref={el => {
                        textStickerRefs.current[index] = el;
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
                  key={`sticker-${index}`}
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

                    if (!isFocused) {
                      // First click: focus the sticker
                      setFocusedStickerIndex(index);
                    } else {
                      // Second click on non-text stickers: start dragging
                      handleStickerMouseDown(index, event);
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
