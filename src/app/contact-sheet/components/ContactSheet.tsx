import React from 'react';
import { NegativeStrip } from './NegativeStrip';
import { MEASUREMENTS } from '../utils/constants';

interface ContactSheetProps {
  images: string[];
  ref: React.RefObject<HTMLDivElement | null>;
}

export const ContactSheet = ({ images, ref }: ContactSheetProps) => {
  const numberOfStrips = Math.ceil(images.length / 6);
  return (
    <div
      ref={ref}
      className="relative"
      style={{
        width: MEASUREMENTS.frameWidth * 6,
        height: MEASUREMENTS.frameHeight * numberOfStrips + numberOfStrips * 16,
        minWidth: '0',
        transform: 'scale(1)',
      }}
    >
      {Array.from({ length: numberOfStrips }, (_, i) => (
        <NegativeStrip key={`strip-${i}`} images={images} startIndex={i * 6} />
      ))}
    </div>
  );
};
