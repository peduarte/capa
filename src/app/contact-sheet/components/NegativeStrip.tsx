import React from 'react';
import Image from 'next/image';
import {
  MEASUREMENTS,
  FilmStock,
  FILM_STOCKS,
  Frame,
} from '../utils/constants';

interface StripFrame {
  id: string;
  frame: Frame;
  frameNumber: number;
}

interface NegativeStripProps {
  frames: StripFrame[];
  rotation: number;
  filmStock: FilmStock;
  selectedHighlightType: string;
  onFrameUpdate?: (frameId: string, updatedFrame: Frame) => void;
  onImageDelete?: (frameNumber: number) => void;
}

export const NegativeStrip = ({
  frames: frames,
  rotation,
  filmStock,
  selectedHighlightType,
  onFrameUpdate,
  onImageDelete,
}: NegativeStripProps) => {
  const framesInStrip = frames.length;
  const stripWidth = framesInStrip * MEASUREMENTS.frameWidth;

  const handleFrameClick = (frameNumber: number) => {
    // Do nothing if no highlight type is selected or if loupe is selected
    if (!selectedHighlightType || selectedHighlightType === 'loupe') {
      return;
    }

    // For sticker mode, let the event bubble up to ContactSheet
    if (selectedHighlightType === 'sticker') {
      return;
    }

    if (selectedHighlightType === 'delete') {
      // Handle image deletion
      if (onImageDelete) {
        onImageDelete(frameNumber);
      }
      return;
    }

    // Find the frame by frameNumber
    const stripFrame = frames.find(sf => sf.frameNumber === frameNumber);
    if (!stripFrame || !onFrameUpdate) return;

    const { id: frameId, frame } = stripFrame;

    // Map selectedHighlightType to highlight type
    let highlightType: 'default' | 'scribble' | 'circle' | 'cross';
    if (selectedHighlightType === 'scribble') {
      highlightType = 'scribble';
    } else if (selectedHighlightType === 'circle') {
      highlightType = 'circle';
    } else if (selectedHighlightType === 'cross') {
      highlightType = 'cross';
    } else if (selectedHighlightType === 'rectangle') {
      highlightType = 'default';
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
      {frames.map((stripFrame, index) => {
        const { id: frameId, frame, frameNumber } = stripFrame;

        if (!frame) return null;

        const getHighlightImage = (type: string) => {
          if (type === 'scribble') return '/frame-highlight-scribble.png';
          if (type === 'circle') return '/frame-highlight-circle.png';
          if (type === 'cross') return '/frame-highlight-x.png';
          return '/frame-highlight-rectangle.png';
        };

        return (
          <div
            key={frameId}
            className="relative cursor-inherit flex items-center justify-center"
            style={{
              width: `${MEASUREMENTS.frameWidth}px`,
              height: `${MEASUREMENTS.frameHeight}px`,
              backgroundImage: `url(/${FILM_STOCKS[filmStock].id}/frame.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => handleFrameClick(frameNumber)}
          >
            <div
              className="relative"
              style={{
                width: `${MEASUREMENTS.imageWidth}px`,
                height: `${MEASUREMENTS.imageHeight}px`,
                backgroundColor: 'black',
              }}
              onClick={event => {
                // Don't stop propagation for sticker mode - let it bubble to ContactSheet
                if (selectedHighlightType !== 'sticker') {
                  event.stopPropagation();
                }
                handleFrameClick(frameNumber);
              }}
            >
              {frame.src && (
                <Image
                  src={
                    frame.src.startsWith('blob:')
                      ? frame.src
                      : `/default-frames/${frame.src}`
                  }
                  alt={`Frame ${frameNumber}`}
                  width={MEASUREMENTS.imageWidth}
                  height={MEASUREMENTS.imageHeight}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                  crossOrigin="anonymous"
                  unoptimized={frame.src.startsWith('blob:')}
                />
              )}
            </div>

            {/* Film stock title overlay */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: 0,
                left: 0,
                width: '188px',
                height: '11px',
                backgroundImage: `url(/${FILM_STOCKS[filmStock].id}/title.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 1,
              }}
            />

            {/* Film DX overlay */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '1px',
                left: 0,
                width: '188px',
                height: '11px',
                backgroundImage: `url(/${FILM_STOCKS[filmStock].id}/dx.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 1,
              }}
            />

            {/* Frame index overlay */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '0px',
                left: 0,
                width: '188px',
                height: '11px',
                backgroundImage: `url(/${FILM_STOCKS[filmStock].id}/index-${frameNumber}.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 1,
              }}
            />

            {/* Sprockets overlay - top */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '11px',
                left: 0,
                width: '188px',
                height: '14px',
                backgroundImage: `url(/${FILM_STOCKS[filmStock].id}/sprockets.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 1,
              }}
            />

            {/* Sprockets overlay - bottom */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '11px',
                left: 0,
                width: '188px',
                height: '14px',
                backgroundImage: `url(/${FILM_STOCKS[filmStock].id}/sprockets.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 1,
              }}
            />

            {/* Highlight overlays */}
            {Object.entries(frame.highlights)
              .filter(([type, isActive]) => isActive)
              .map(([highlight], highlightIndex) => (
                <div
                  key={`${frameId}-${highlight}-${highlightIndex}`}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${getHighlightImage(highlight)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 20,
                    opacity: highlight === 'scribble' ? 1 : 0.9,
                  }}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
};

NegativeStrip.displayName = 'NegativeStrip';
