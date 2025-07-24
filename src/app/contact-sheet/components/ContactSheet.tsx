import React from 'react';
import { NegativeStrip } from './NegativeStrip';
import {
  MEASUREMENTS,
  FilmStock,
  Frame,
  Sticker,
  STICKER_CONFIGS,
  StickerType,
} from '../utils/constants';

interface ContactSheetProps {
  frames: Record<string, Frame>;
  frameOrder: string[];
  filmStock: FilmStock;
  selectedHighlightType: string;
  stickers?: Sticker[];
  ref: React.RefObject<HTMLDivElement | null>;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onFrameUpdate?: (frameId: string, updatedFrame: Frame) => void;
  onImageDelete?: (frameNumber: number) => void;
  onStickerMouseDown?: (stickerIndex: number, event: React.MouseEvent) => void;
  onStickerUpdate?: (stickers: Sticker[]) => void;
}

export const ContactSheet = ({
  frames,
  frameOrder,
  filmStock,
  selectedHighlightType,
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

  const handleContactSheetMouseDown = (event: React.MouseEvent) => {
    // Check if it's a sticker mode
    if (selectedHighlightType.startsWith('sticker-') && onStickerUpdate) {
      // Calculate click position relative to the contact sheet
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Extract sticker type from selectedHighlightType (e.g., "sticker-dot" -> "dot")
      const stickerType = selectedHighlightType.replace(
        'sticker-',
        ''
      ) as StickerType;
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
      };

      onStickerUpdate([...(stickers || []), newSticker]);
    }
  };

  return (
    <div
      className="relative bg-black"
      style={{
        width: maxStripWidth + 32,
        height:
          MEASUREMENTS.frameHeight * numberOfStrips +
          (numberOfStrips - 1) * 16 +
          32,
        minWidth: '0',
        padding: '16px',
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

        const stripFrames = stripFrameIds.map((frameId, index) => ({
          id: frameId,
          frame: frames[frameId],
          frameNumber: startIndex + index + 1,
        }));

        // Calculate strip rotation for authentic look
        const seed = i * 123.456;
        const stripRotation = Math.sin(seed) * 0.5;

        return (
          <NegativeStrip
            key={`strip-${i}`}
            frames={stripFrames}
            rotation={stripRotation}
            filmStock={filmStock}
            selectedHighlightType={selectedHighlightType}
            onFrameUpdate={onFrameUpdate}
            onImageDelete={onImageDelete}
          />
        );
      })}

      {/* Stickers */}
      {stickers &&
        stickers.map((sticker, index) => {
          const stickerConfig = STICKER_CONFIGS[sticker.type];
          if (!stickerConfig) return null;

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
