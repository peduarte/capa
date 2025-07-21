import React, { useMemo } from 'react';
import { SprocketHoles } from './SprocketHoles';
import {
  MEASUREMENTS,
  STRIP_PADDING,
  FRAME_GAP,
  getStripRotation,
} from '../utils/constants';

interface NegativeStripProps {
  images: string[];
  startIndex: number;
  onFrameClick?: (frameNumber: number, event: React.MouseEvent) => void;
}

export const NegativeStrip = React.memo(
  ({ images, startIndex, onFrameClick }: NegativeStripProps) => {
    // Calculate values first
    const framesInStrip = Math.min(6, images.length - startIndex);
    const stripIndex = Math.floor(startIndex / 6);

    // All useMemo calls
    const textStartingOffset = useMemo(() => {
      // Use startIndex as seed for consistent offset
      const seed = startIndex * 456.789;
      return Math.sin(seed) * 40; // Range of -40 to 40
    }, [startIndex]);

    const stripWidth =
      framesInStrip * MEASUREMENTS.frameWidth +
      (framesInStrip - 1) * FRAME_GAP +
      STRIP_PADDING * 2;
    const frameTop =
      (MEASUREMENTS.negativeHeight - MEASUREMENTS.frameHeight) / 2;

    // Use consistent rotation based on strip index
    const rotation = getStripRotation(stripIndex);

    return (
      <div
        className="relative bg-[#080808] mb-4 overflow-hidden"
        style={{
          height: MEASUREMENTS.negativeHeight,
          width: stripWidth,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          boxShadow:
            '1px -1px 0px rgba(255, 255, 255, 0.09), -1px 1px 0px rgba(255, 255, 255, 0.05)',
          userSelect: 'none',
        }}
      >
        {/* SVG noise filter - scoped to this strip */}
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          width="100%"
          height="100%"
        >
          <defs>
            <filter
              id={`noise-${startIndex}`}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feTurbulence
                baseFrequency="0.9"
                numOctaves="4"
                type="fractalNoise"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="saturate"
                values="0"
                result="desaturatedNoise"
              />
              <feComponentTransfer in="desaturatedNoise" result="opacityNoise">
                <feFuncA type="discrete" tableValues="0 .1 0 .05 0 .02 0" />
              </feComponentTransfer>
              <feComposite
                in="SourceGraphic"
                in2="opacityNoise"
                operator="over"
              />
            </filter>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="transparent"
            filter={`url(#noise-${startIndex})`}
          />
        </svg>

        <SprocketHoles frameCount={framesInStrip} />

        {/* Film stock text repeating every 2 frames */}
        {Array.from({ length: 7 }, (_, textIndex) => (
          <span
            key={textIndex}
            style={{
              position: 'absolute',
              top: 2,
              left:
                STRIP_PADDING +
                textIndex * (MEASUREMENTS.frameWidth + FRAME_GAP) -
                40 +
                textStartingOffset, // Use same offset for all instances
              fontSize: '9px',
              lineHeight: '1',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              fontFamily: 'monospace',
              textShadow: '0 0 1px rgba(0, 0, 0, 0.5)',
              textWrap: 'nowrap',
              userSelect: 'none',
            }}
          >
            ILFORD HP5 PLUS
          </span>
        ))}

        {/* Frame index numbers between gaps */}
        {Array.from({ length: framesInStrip }, (_, index) => {
          const frameLeft =
            STRIP_PADDING + index * (MEASUREMENTS.frameWidth + FRAME_GAP);
          const frameNumber = startIndex + index + 1; // 1-indexed frame numbers

          return (
            <span
              key={`frame-${index}`}
              style={{
                position: 'absolute',
                bottom: 0,
                left: frameLeft + MEASUREMENTS.frameWidth + FRAME_GAP / 2 - 6, // Center in gap
                fontSize: '11px',
                lineHeight: '1',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                fontFamily: 'monospace',
                textShadow: '0 0 1px rgba(0, 0, 0, 0.5)',
                userSelect: 'none',
              }}
            >
              {frameNumber}
            </span>
          );
        })}

        {/* Frame index under center of each frame */}
        {Array.from({ length: framesInStrip }, (_, index) => {
          const frameLeft =
            STRIP_PADDING + index * (MEASUREMENTS.frameWidth + FRAME_GAP);
          const frameNumber = startIndex + index + 1; // 1-indexed frame numbers

          return (
            <span
              key={`center-frame-${index}`}
              style={{
                position: 'absolute',
                bottom: 0,
                left: frameLeft + MEASUREMENTS.frameWidth / 2 - 8, // Center under frame
                fontSize: '9px',
                lineHeight: '1',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                fontFamily: 'monospace',
                textShadow: '0 0 1px rgba(0, 0, 0, 0.5)',
                userSelect: 'none',
              }}
            >
              ▸ {frameNumber}A
            </span>
          );
        })}

        {Array.from({ length: framesInStrip }, (_, index) => {
          const imageIndex = startIndex + index;
          const imagePath = images[imageIndex];
          const frameLeft =
            STRIP_PADDING + index * (MEASUREMENTS.frameWidth + FRAME_GAP);

          const frameNumber = imageIndex + 1;

          return (
            <div key={index} className="relative">
              <div
                className="absolute overflow-hidden cursor-pointer"
                style={{
                  left: frameLeft,
                  top: frameTop,
                  width: MEASUREMENTS.frameWidth,
                  height: MEASUREMENTS.frameHeight,
                }}
                onClick={
                  onFrameClick
                    ? event => onFrameClick(frameNumber, event)
                    : undefined
                }
              >
                {imagePath && (
                  <img
                    src={
                      imagePath.startsWith('blob:') ||
                      imagePath.startsWith('data:') ||
                      imagePath.startsWith('http')
                        ? imagePath
                        : `/hp5/${imagePath}`
                    }
                    alt={`Frame ${imageIndex + 1}`}
                    className="object-cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

NegativeStrip.displayName = 'NegativeStrip';
