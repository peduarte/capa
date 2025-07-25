import React from 'react';
import { NegativeStrip } from './NegativeStrip';
import { Frame } from './Frame';
import {
  MEASUREMENTS,
  FilmStock,
  Frame as FrameData,
  Sticker,
  STICKER_CONFIGS,
  StickerType,
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
}

export const ContactSheet = ({
  frames,
  frameOrder,
  filmStock,
  selectedToolbarAction,
  stickers,
  ref,
  onMouseMove,
  onMouseLeave,
  onFrameUpdate,
  onImageDelete,
  onStickerMouseDown,
  onStickerUpdate,
}: ContactSheetProps) => {
  const numberOfStrips = Math.ceil(frameOrder.length / 6);
  const maxFramesPerStrip = Math.min(6, frameOrder.length);
  const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;

  const handleFrameClick = (frameNumber: number) => {
    if (selectedToolbarAction === 'delete') {
      // Handle image deletion
      if (onImageDelete) {
        onImageDelete(frameNumber);
      }
      return;
    }

    // Find the frame by frameNumber
    const frameIndex = frameNumber - 1;
    if (frameIndex < 0 || frameIndex >= frameOrder.length) return;

    const frameId = frameOrder[frameIndex];
    const frame = frames[frameId];
    if (!frame || !onFrameUpdate) return;

    // Map selectedToolbarAction to highlight type
    let highlightType: 'rectangle' | 'scribble' | 'circle' | 'cross';
    if (selectedToolbarAction === 'scribble') {
      highlightType = 'scribble';
    } else if (selectedToolbarAction === 'circle') {
      highlightType = 'circle';
    } else if (selectedToolbarAction === 'cross') {
      highlightType = 'cross';
    } else if (selectedToolbarAction === 'rectangle') {
      highlightType = 'rectangle';
    } else {
      return; // Unknown highlight type
    }

    // Toggle this highlight type
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

      onStickerUpdate([...(stickers || []), newSticker]);

      // If it's a text sticker, focus it after it's created
      if (stickerType === 'text') {
        setTimeout(() => {
          try {
            const textElements = document.querySelectorAll(
              '[contenteditable="true"]'
            );
            const lastTextElement = textElements[
              textElements.length - 1
            ] as HTMLElement;
            if (
              lastTextElement &&
              typeof lastTextElement.focus === 'function'
            ) {
              lastTextElement.focus();
              // Select all text for easy replacement
              const selection = window.getSelection();
              if (selection) {
                const range = document.createRange();
                range.selectNodeContents(lastTextElement);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          } catch (error) {
            console.warn('Failed to focus text element:', error);
          }
        }, 100); // Increased delay to ensure the element is fully rendered
      }
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

          // Handle text stickers differently
          if (sticker.type === 'text') {
            return (
              <div
                key={`sticker-${index}`}
                className="absolute select-text font-permanent-marker focus:outline-white focus:outline-2 focus:outline"
                style={{
                  top: `${sticker.top}px`,
                  left: `${sticker.left}px`,
                  minWidth: `${stickerConfig.width}px`,
                  minHeight: `${stickerConfig.height}px`,
                  cursor: 'text',
                  zIndex: 10,
                  color: 'white',
                  fontSize: '28px',
                  lineHeight: '1.1',
                  padding: '2px',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                  whiteSpace: 'nowrap',
                }}
                contentEditable
                suppressContentEditableWarning={true}
                tabIndex={0}
                onMouseDown={event => {
                  // If clicking on the text itself, allow editing
                  event.stopPropagation();
                  // Focus the element for editing
                  setTimeout(() => {
                    event.currentTarget.focus();
                  }, 0);
                }}
                onFocus={event => {
                  // Add visible focus styling
                  event.currentTarget.style.outline = '2px solid white';
                }}
                onBlur={event => {
                  // Remove focus styling
                  event.currentTarget.style.outline = 'none';
                }}
                onInput={event => {
                  const newText = event.currentTarget.textContent || '';
                  if (onStickerUpdate) {
                    const updatedStickers = stickers.map((s, i) =>
                      i === index ? { ...s, text: newText } : s
                    );
                    onStickerUpdate(updatedStickers);
                  }
                }}
                onKeyDown={event => {
                  // Prevent Enter key from creating new lines
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur(); // Exit editing mode
                  }
                  // Stop propagation to prevent any keyboard shortcuts from interfering
                  event.stopPropagation();
                }}
                // Add drag handle - a small invisible area for dragging
              >
                {sticker.text || 'Edit me'}
                {/* Drag handle - positioned at top-left corner */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '-10px',
                    width: '20px',
                    height: '20px',
                    cursor: 'grab',
                    background: 'transparent',
                    zIndex: 1,
                  }}
                  onMouseDown={event => {
                    event.stopPropagation();
                    onStickerMouseDown?.(index, event);
                  }}
                />
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
                cursor: 'grab',
                zIndex: 10,
                userSelect: 'none',
                transform: stickerConfig.transform || '',
                transformOrigin: 'center center',
              }}
              onMouseDown={event => onStickerMouseDown?.(index, event)}
            />
          );
        })}
    </div>
  );
};
