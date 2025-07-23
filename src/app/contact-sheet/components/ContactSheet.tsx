import React from 'react';
import { NegativeStrip } from './NegativeStrip';
import { MEASUREMENTS, FilmStock } from '../utils/constants';

interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}

interface ContactSheetProps {
  images: string[];
  highlights: FrameHighlight[];
  xMarks: number[];
  onHighlightsChange: (highlights: FrameHighlight[]) => void;
  onXMarksChange: (xMarks: number[]) => void;
  filmStock: FilmStock;
  selectedHighlightType: string;
  ref: React.RefObject<HTMLDivElement | null>;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

export const ContactSheet = ({
  images,
  highlights,
  xMarks,
  onHighlightsChange,
  onXMarksChange,
  filmStock,
  selectedHighlightType,
  ref,
  onMouseMove,
  onMouseLeave,
}: ContactSheetProps) => {
  const numberOfStrips = Math.ceil(images.length / 6);
  const maxFramesPerStrip = Math.min(6, images.length);
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

      {Array.from({ length: numberOfStrips }, (_, i) => (
        <NegativeStrip
          key={`strip-${i}`}
          images={images}
          startIndex={i * 6}
          highlights={highlights}
          xMarks={xMarks}
          onHighlightsChange={onHighlightsChange}
          onXMarksChange={onXMarksChange}
          filmStock={filmStock}
          selectedHighlightType={selectedHighlightType}
        />
      ))}
    </div>
  );
};
