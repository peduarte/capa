import React from 'react';
import { NegativeStrip } from './NegativeStrip';
import { MEASUREMENTS } from '../utils/constants';

interface ContactSheetProps {
  images: string[];
  ref: React.RefObject<HTMLDivElement | null>;
}

export const ContactSheet = ({ images, ref }: ContactSheetProps) => {
  const numberOfStrips = Math.ceil(images.length / 6);
  const maxFramesPerStrip = Math.min(6, images.length);
  const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;

  return (
    <div
      ref={ref}
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
    >
      {Array.from({ length: numberOfStrips }, (_, i) => (
        <NegativeStrip key={`strip-${i}`} images={images} startIndex={i * 6} />
      ))}
    </div>
  );
};
