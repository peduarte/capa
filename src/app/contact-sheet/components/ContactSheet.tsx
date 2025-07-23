import React from 'react';
import { NegativeStrip } from './NegativeStrip';
import { MEASUREMENTS, FilmStock, Frame } from '../utils/constants';

interface ContactSheetProps {
  frames: Record<string, Frame>;
  frameOrder: string[];
  filmStock: FilmStock;
  selectedHighlightType: string;
  ref: React.RefObject<HTMLDivElement | null>;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onFrameUpdate?: (frameId: string, updatedFrame: Frame) => void;
  onImageDelete?: (frameNumber: number) => void;
}

export const ContactSheet = ({
  frames,
  frameOrder,
  filmStock,
  selectedHighlightType,
  ref,
  onMouseMove,
  onMouseLeave,
  onFrameUpdate,
  onImageDelete,
}: ContactSheetProps) => {
  const numberOfStrips = Math.ceil(frameOrder.length / 6);
  const maxFramesPerStrip = Math.min(6, frameOrder.length);
  const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;

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
    </div>
  );
};
