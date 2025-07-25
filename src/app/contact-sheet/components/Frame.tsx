import React from 'react';
import Image from 'next/image';
import {
  MEASUREMENTS,
  FilmStock,
  FILM_STOCKS,
  Frame as FrameData,
} from '../utils/constants';

interface FrameProps {
  frameId: string;
  frame: FrameData;
  frameNumber: number;
  filmStock: FilmStock;
  selectedToolbarAction: string;
  onFrameClick: (frameNumber: number) => void;
}

export const Frame = ({
  frameId,
  frame,
  frameNumber,
  filmStock,
  selectedToolbarAction,
  onFrameClick,
}: FrameProps) => {
  if (!frame) return null;

  const getHighlightImage = (type: string) => {
    return `/frame-highlight-${type}.png`;
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
      onClick={event => {
        // Do nothing if no highlight type is selected or if loupe is selected
        if (!selectedToolbarAction || selectedToolbarAction === 'loupe') {
          return;
        }

        // For sticker mode and text mode, let the event bubble up to ContactSheet (don't process or stop propagation)
        if (
          selectedToolbarAction.startsWith('sticker-') ||
          selectedToolbarAction === 'text'
        ) {
          return;
        }

        // For non-sticker modes, stop propagation and handle the click
        event.stopPropagation();
        onFrameClick(frameNumber);
      }}
    >
      <div
        className="relative"
        style={{
          width: `${MEASUREMENTS.imageWidth}px`,
          height: `${MEASUREMENTS.imageHeight}px`,
          backgroundColor: 'black',
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
};
