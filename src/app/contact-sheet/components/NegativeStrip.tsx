import React from 'react';
import { MEASUREMENTS } from '../utils/constants';

interface NegativeStripProps {
  rotation: number;
  framesCount: number;
  children: React.ReactNode;
}

export const NegativeStrip = ({
  rotation,
  framesCount,
  children,
}: NegativeStripProps) => {
  const stripWidth = framesCount * MEASUREMENTS.frameWidth;

  return (
    <div
      className="relative mb-4 overflow-hidden flex flex-shrink-0 negative-strip-container user-select-none"
      style={{
        height: `${MEASUREMENTS.frameHeight}px`,
        width: `${stripWidth}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
};

NegativeStrip.displayName = 'NegativeStrip';
