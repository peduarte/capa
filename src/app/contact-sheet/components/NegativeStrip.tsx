import React from 'react';
import Image from 'next/image';
import { MEASUREMENTS, FilmStock, FILM_STOCKS } from '../utils/constants';

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
  filmStock: FilmStock;
  selectedHighlightType: string;
  onImageDelete?: (frameNumber: number) => void;
}

export const NegativeStrip = ({
  images,
  startIndex,
  highlights,
  xMarks,
  onHighlightsChange,
  onXMarksChange,
  filmStock,
  selectedHighlightType,
  onImageDelete,
}: NegativeStripProps) => {
  const framesInStrip = Math.min(6, images.length - startIndex);
  const stripIndex = Math.floor(startIndex / 6);
  const seed = stripIndex * 123.456;
  const rotation = Math.sin(seed) * 0.25;
  const stripWidth = framesInStrip * MEASUREMENTS.frameWidth;

  const handleFrameClick = (frameNumber: number) => {
    // Do nothing if no highlight type is selected or if loupe is selected
    if (!selectedHighlightType || selectedHighlightType === 'loupe') {
      return;
    }

    if (selectedHighlightType === 'delete') {
      // Handle image deletion
      if (onImageDelete) {
        onImageDelete(frameNumber);
      }
      return;
    }

    if (selectedHighlightType === 'x') {
      // Handle X marking
      onXMarksChange(
        xMarks.includes(frameNumber)
          ? xMarks.filter(num => num !== frameNumber)
          : [...xMarks, frameNumber]
      );
    } else {
      // Handle highlights using selected type - toggle individual highlight types
      let highlightType: 'default' | 'scribble' | 'circle' = 'default';
      if (selectedHighlightType === 'scribble') {
        highlightType = 'scribble';
      } else if (selectedHighlightType === 'circle') {
        highlightType = 'circle';
      } else if (selectedHighlightType === 'rectangle') {
        highlightType = 'default';
      }

      // Check if this specific highlight type already exists for this frame
      const existingHighlight = highlights.find(
        h => h.frameNumber === frameNumber && h.type === highlightType
      );

      if (existingHighlight) {
        // Remove only this specific highlight type
        onHighlightsChange(
          highlights.filter(
            h => !(h.frameNumber === frameNumber && h.type === highlightType)
          )
        );
      } else {
        // Add new highlight of this type if a valid type is selected
        if (
          ['scribble', 'circle', 'rectangle'].includes(selectedHighlightType)
        ) {
          onHighlightsChange([
            ...highlights,
            { frameNumber, type: highlightType },
          ]);
        }
      }
    }
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
      {Array.from({ length: framesInStrip }, (_, index) => {
        const imageIndex = startIndex + index;
        const imagePath = images[imageIndex];
        const frameNumber = imageIndex + 1;

        // Get all highlights for this frame
        const frameHighlights = highlights.filter(
          h => h.frameNumber === frameNumber
        );
        const hasXMark = xMarks.includes(frameNumber);

        const getHighlightImage = (type: string) => {
          if (type === 'scribble') return '/frame-highlight-scribble.png';
          if (type === 'circle') return '/frame-highlight-circle.png';
          return '/frame-highlight-rectangle.png';
        };

        return (
          <div
            key={index}
            className="relative cursor-inherit flex items-center justify-center"
            style={{
              width: `${MEASUREMENTS.frameWidth}px`,
              height: `${MEASUREMENTS.frameHeight}px`,
              backgroundImage: 'url(/frame.png)',
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
                event.stopPropagation();
                handleFrameClick(frameNumber);
              }}
            >
              {imagePath && (
                <Image
                  src={
                    imagePath.startsWith('blob:')
                      ? imagePath
                      : `/default-frames/${imagePath}`
                  }
                  alt={`Frame ${imageIndex + 1}`}
                  width={MEASUREMENTS.imageWidth}
                  height={MEASUREMENTS.imageHeight}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  crossOrigin="anonymous"
                  unoptimized={imagePath.startsWith('blob:')}
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
                zIndex: 10,
              }}
            />

            {/* Film stock footer overlay */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '0px',
                left: 0,
                width: '188px',
                height: '11px',
                backgroundImage: `url(/${FILM_STOCKS[filmStock].id}/dx.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 10,
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
                zIndex: 11,
              }}
            />

            {/* Multiple highlight overlays */}
            {frameHighlights.map((highlight, highlightIndex) => (
              <div
                key={`${frameNumber}-${highlight.type}-${highlightIndex}`}
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${getHighlightImage(highlight.type)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 20 + highlightIndex,
                  opacity: highlight.type === 'scribble' ? 1 : 0.9,
                }}
              />
            ))}

            {/* Conditional X mark overlay */}
            {hasXMark && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'url(/frame-highlight-x.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 20,
                  opacity: '0.9',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

NegativeStrip.displayName = 'NegativeStrip';
