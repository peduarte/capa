import React, { useEffect, useRef } from 'react';
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
} from '../utils/constants';

interface ContactSheetProps {
  frames: Record<string, FrameData>;
  frameOrder: string[];
  filmStock: FilmStock;
  selectedToolbarAction: string;
  stickers?: Sticker[];
  ref: React.RefObject<HTMLDivElement | null>;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onFrameUpdate?: (frameId: string, updatedFrame: FrameData) => void;
  onImageDelete?: (frameNumber: number) => void;
  onStickerMouseDown?: (stickerIndex: number, event: React.MouseEvent) => void;
  onStickerUpdate?: (stickers: Sticker[]) => void;
  focusedStickerIndex?: number;
  editingStickerIndex?: number;
  onStickerFocus?: (index: number | null) => void;
  onStickerEdit?: (index: number | null) => void;
}

export const ContactSheet = React.forwardRef<HTMLDivElement, ContactSheetProps>(
  (
    {
      frames,
      frameOrder,
      filmStock,
      selectedToolbarAction,
      stickers,
      onMouseMove,
      onMouseLeave,
      onFrameUpdate,
      onImageDelete,
      onStickerMouseDown,
      onStickerUpdate,
      focusedStickerIndex = -1,
      editingStickerIndex = -1,
      onStickerFocus,
      onStickerEdit,
    },
    ref
  ) => {
    const textStickerRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Focus the contenteditable when a text sticker enters editing mode
    useEffect(() => {
      if (
        editingStickerIndex >= 0 &&
        stickers &&
        stickers[editingStickerIndex]?.type === 'text'
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

    const numberOfStrips = Math.ceil(frameOrder.length / 6);
    const maxFramesPerStrip = Math.min(6, frameOrder.length);
    const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;

    const handleFrameClick = (frameNumber: number) => {
      if (selectedToolbarAction === 'delete') {
        onImageDelete?.(frameNumber);
        return;
      }

      // Check if we have a valid frame to update
      const frameId = frameOrder[frameNumber - 1];
      const frame = frames[frameId];
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
          onStickerFocus?.(null);
          onStickerEdit?.(null); // Also clear editing state
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
        };

        const newStickers = [...(stickers || []), newSticker];
        onStickerUpdate(newStickers);

        // Focus the newly created sticker with a small delay to ensure rendering
        const newStickerIndex = newStickers.length - 1;
        setTimeout(() => {
          onStickerFocus?.(newStickerIndex);
          // For text stickers, immediately start editing
          if (stickerType === 'text') {
            onStickerEdit?.(newStickerIndex);
          }
        }, 0);
      } else {
        // No sticker tool selected, unfocus any focused stickers
        onStickerFocus?.(null);
        onStickerEdit?.(null);
      }
    };

    return (
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
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseDown={handleContactSheetMouseDown}
      >
        {/* Forward the original ref to the first child for download functionality */}
        <div ref={ref} className="absolute inset-0 pointer-events-none" />

        {Array.from({ length: numberOfStrips }, (_, i) => {
          const startIndex = i * 6;
          const endIndex = Math.min(startIndex + 6, frameOrder.length);
          const stripFrameIds = frameOrder.slice(startIndex, endIndex);

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
                  frame={frames[frameId]}
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
        {stickers &&
          stickers.map((sticker, index) => {
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
                      color: 'white',
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
                      if (isEditing && onStickerUpdate) {
                        const newText = event.currentTarget.textContent || '';
                        const updatedStickers = stickers.map((s, i) =>
                          i === index ? { ...s, text: newText } : s
                        );
                        onStickerUpdate(updatedStickers);
                      }
                    }}
                    dangerouslySetInnerHTML={
                      isEditing
                        ? undefined
                        : { __html: sticker.text || 'Click to edit' }
                    }
                    onKeyDown={event => {
                      if (
                        isEditing &&
                        (event.key === 'Enter' || event.key === 'Escape')
                      ) {
                        event.preventDefault();
                        onStickerEdit?.(null);
                        onStickerFocus?.(null);
                        event.currentTarget.blur();
                      }
                      event.stopPropagation();
                    }}
                    onBlur={() => {
                      if (isEditing) {
                        onStickerEdit?.(null);
                        onStickerFocus?.(null);
                      }
                    }}
                    onMouseDown={event => {
                      event.stopPropagation();

                      if (!isFocused) {
                        // First click: focus the sticker
                        onStickerFocus?.(index);
                      } else if (!isEditing) {
                        // If focused but not editing: start dragging
                        onStickerMouseDown?.(index, event);
                      }
                      // If already editing, let the contenteditable handle it
                    }}
                    onDoubleClick={event => {
                      event.stopPropagation();
                      // Double click when focused: start editing
                      if (isFocused && !isEditing) {
                        onStickerEdit?.(index);
                        // Focus will be handled by useEffect
                      }
                    }}
                    ref={el => {
                      textStickerRefs.current[index] = el;
                    }}
                  ></div>
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
                    onStickerFocus?.(index);
                  } else {
                    // Second click on non-text stickers: start dragging
                    onStickerMouseDown?.(index, event);
                  }
                }}
              />
            );
          })}
      </div>
    );
  }
);

ContactSheet.displayName = 'ContactSheet';
