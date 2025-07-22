import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MEASUREMENTS } from '../utils/constants';

interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}

interface NegativeStripProps {
  images: string[];
  startIndex: number;
  highlights: FrameHighlight[];
  xMarks: number[];
  onHighlightsChange: (highlights: FrameHighlight[]) => void;
  onXMarksChange: (xMarks: number[]) => void;
}

export const NegativeStrip = ({
  images,
  startIndex,
  highlights,
  xMarks,
  onHighlightsChange,
  onXMarksChange,
}: NegativeStripProps) => {
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

  const framesInStrip = Math.min(6, images.length - startIndex);
  const stripIndex = Math.floor(startIndex / 6);
  const seed = stripIndex * 123.456;
  const rotation = Math.sin(seed) * 0.25;
  const stripWidth = framesInStrip * MEASUREMENTS.frameWidth;

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeysPressed(prev => new Set(prev).add(event.key.toLowerCase()));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.key.toLowerCase());
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleFrameClick = (frameNumber: number, event: React.MouseEvent) => {
    if (keysPressed.has('x')) {
      // Handle X marking
      onXMarksChange(
        xMarks.includes(frameNumber)
          ? xMarks.filter(num => num !== frameNumber)
          : [...xMarks, frameNumber]
      );
    } else {
      // Handle highlights (default/scribble for option key/circle for cmd key)
      const highlightType = event.metaKey
        ? 'circle'
        : event.altKey
          ? 'scribble'
          : 'default';
      const existing = highlights.find(h => h.frameNumber === frameNumber);
      if (existing) {
        // Remove existing highlight
        onHighlightsChange(
          highlights.filter(h => h.frameNumber !== frameNumber)
        );
      } else {
        // Add new highlight
        onHighlightsChange([
          ...highlights,
          { frameNumber, type: highlightType },
        ]);
      }
    }
  };

  // Calculate positions for highlights in this strip
  const getFramePosition = (frameIndex: number) => ({
    left: frameIndex * MEASUREMENTS.frameWidth,
    top: 0,
    width: MEASUREMENTS.frameWidth,
    height: MEASUREMENTS.frameHeight,
  });

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
      {Array.from({ length: framesInStrip }, (_, index) => {
        const imageIndex = startIndex + index;
        const imagePath = images[imageIndex];
        const frameNumber = imageIndex + 1;

        return (
          <div
            key={index}
            className="relative cursor-pointer flex items-center justify-center"
            style={{
              width: `${MEASUREMENTS.frameWidth}px`,
              height: `${MEASUREMENTS.frameHeight}px`,
              backgroundImage: 'url(/frame.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={event => handleFrameClick(frameNumber, event)}
          >
            {imagePath && (
              <div
                className="relative"
                style={{
                  width: `${MEASUREMENTS.imageWidth}px`,
                  height: `${MEASUREMENTS.imageHeight}px`,
                }}
                onClick={event => {
                  event.stopPropagation();
                  handleFrameClick(frameNumber, event);
                }}
              >
                <Image
                  src={
                    imagePath.startsWith('blob:')
                      ? imagePath
                      : `/hp5/${imagePath}`
                  }
                  alt={`Frame ${imageIndex + 1}`}
                  width={MEASUREMENTS.imageWidth}
                  height={MEASUREMENTS.imageHeight}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  crossOrigin="anonymous"
                  unoptimized={imagePath.startsWith('blob:')}
                />
              </div>
            )}

            {/* Ilford title overlay */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: 0,
                left: 0,
                width: '188px',
                height: '11px',
                backgroundImage: 'url(/ilford-title.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 10,
              }}
            />

            {/* Ilford footer overlay */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: 0,
                left: 0,
                width: '188px',
                height: '11px',
                backgroundImage: 'url(/ilford-footer.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 10,
              }}
            />

            {/* Frame index number */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '0px',
                left: '74px',
                fontSize: '10px',
                lineHeight: '1',
                fontFamily: 'Courier, monospace',
                color: 'white',
                zIndex: 15,
                textAlign: 'center',
                width: '24px',
                fontWeight: 'bold',
                opacity: '0.9',
              }}
            >
              ▸{frameNumber}
              <span style={{ fontSize: '8px' }}>A</span>
            </div>

            {/* Frame index number */}
            <div
              className="absolute pointer-events-none"
              style={{
                right: '0px',
                bottom: '0px',
                fontSize: '13px',
                lineHeight: '1',
                fontFamily: 'Courier, monospace',
                color: 'white',
                zIndex: 15,
                textAlign: 'right',
                fontWeight: 'bold',
                opacity: '0.9',
              }}
            >
              {frameNumber}
            </div>
          </div>
        );
      })}

      {/* Simple highlight overlays using background images */}
      {highlights.map(({ frameNumber, type }) => {
        const frameIndex = frameNumber - startIndex - 1;
        if (frameIndex < 0 || frameIndex >= framesInStrip) return null;
        const position = getFramePosition(frameIndex);

        const getHighlightImage = () => {
          if (type === 'scribble') return '/frame-highlight-scribble.png';
          if (type === 'circle') return '/frame-highlight-circle.png';
          return '/frame-highlight-select.png';
        };

        return (
          <div
            key={`highlight-${frameNumber}`}
            className="absolute pointer-events-none"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              height: position.height,
              backgroundImage: `url(${getHighlightImage()})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 20,
            }}
          />
        );
      })}

      {/* X mark overlays */}
      {xMarks.map(frameNumber => {
        const frameIndex = frameNumber - startIndex - 1;
        if (frameIndex < 0 || frameIndex >= framesInStrip) return null;
        const position = getFramePosition(frameIndex);

        return (
          <div
            key={`x-mark-${frameNumber}`}
            className="absolute pointer-events-none"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              height: position.height,
              backgroundImage: 'url(/frame-highlight-x.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 20,
            }}
          />
        );
      })}
    </div>
  );
};

NegativeStrip.displayName = 'NegativeStrip';
