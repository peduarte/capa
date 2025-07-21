'use client';

import { useState, useEffect, useMemo, useRef, createRef } from 'react';
import Image from 'next/image';

// Film measurements (mm) scaled to 175px negative height
const SCALE = 175 / 35; // 5px per mm
const STRIP_PADDING = 8; // px
const FRAME_GAP = 8; // px

const MEASUREMENTS = {
  negativeHeight: 175,
  frameWidth: 36 * SCALE,
  frameHeight: 24 * SCALE,
  sprocketWidth: 1.85 * SCALE,
  sprocketHeight: 2.79 * SCALE,
  frameToSprocketGap: 0.5 * SCALE,
};

// Calculate uniform sprocket spacing
const sprocketSpacing = (MEASUREMENTS.frameWidth + FRAME_GAP) / 8;

// Consistent rotation generator based on strip index
const getStripRotation = (stripIndex: number) => {
  // Use stripIndex as seed for consistent rotation
  const seed = stripIndex * 123.456;
  return Math.sin(seed) * 0.5 * 1; // Small rotation between -0.5 and 0.5 degrees
};

// Common sprocket styles
const sprocketStyle = {
  position: 'absolute' as const,
  backgroundColor: 'black',
  borderRadius: `${MEASUREMENTS.sprocketWidth}px / 25%`,
  boxShadow:
    'inset -1px 0px 0px 0px rgba(255, 255, 255, 0.1), -1px 0px 0px 0px rgba(255, 255, 255, 0.1)',
  width: MEASUREMENTS.sprocketWidth,
  height: MEASUREMENTS.sprocketHeight,
};

const SprocketHoles = ({ frameCount }: { frameCount: number }) => {
  const frameTop = (MEASUREMENTS.negativeHeight - MEASUREMENTS.frameHeight) / 2;
  const totalSprockets = frameCount * 8;
  const holes = [];

  for (let i = 0; i < totalSprockets; i++) {
    const left = STRIP_PADDING + i * sprocketSpacing;
    const topY =
      frameTop - MEASUREMENTS.frameToSprocketGap - MEASUREMENTS.sprocketHeight;
    const bottomY =
      frameTop + MEASUREMENTS.frameHeight + MEASUREMENTS.frameToSprocketGap;

    holes.push(
      <div key={`${i}-top`} style={{ ...sprocketStyle, left, top: topY }} />,
      <div
        key={`${i}-bottom`}
        style={{ ...sprocketStyle, left, top: bottomY }}
      />
    );
  }

  return <>{holes}</>;
};

const HighlightOverlay = ({
  images,
  selectedFrames,
  xMarkedFrames,
  stripRefs,
}: {
  images: string[];
  selectedFrames: Map<number, HighlightType>;
  xMarkedFrames: Set<number>;
  stripRefs: React.RefObject<HTMLDivElement | null>[];
}) => {
  const [, forceUpdate] = useState({});

  // Force re-render when selections change to recalculate positions
  useEffect(() => {
    const timer = setTimeout(() => forceUpdate({}), 50);
    return () => clearTimeout(timer);
  }, [selectedFrames, xMarkedFrames]);
  const getFramePosition = (frameNumber: number) => {
    const frameIndex = frameNumber - 1; // Convert to 0-indexed
    const stripIndex = Math.floor(frameIndex / 6);
    const frameInStrip = frameIndex % 6;

    const stripElement = stripRefs[stripIndex]?.current;
    if (!stripElement) return null;

    const stripRect = stripElement.getBoundingClientRect();
    const containerRect =
      stripElement.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };

    // Account for strip rotation - use consistent rotation
    const rotation = getStripRotation(stripIndex);
    const rotationRad = (rotation * Math.PI) / 180;

    // Frame position within the strip
    const frameLeft =
      STRIP_PADDING + frameInStrip * (MEASUREMENTS.frameWidth + FRAME_GAP);
    const frameTop =
      (MEASUREMENTS.negativeHeight - MEASUREMENTS.frameHeight) / 2;

    // Apply rotation transformation
    const centerX = stripRect.width / 2;
    const centerY = stripRect.height / 2;

    const relativeX = frameLeft + MEASUREMENTS.frameWidth / 2 - centerX;
    const relativeY = frameTop + MEASUREMENTS.frameHeight / 2 - centerY;

    const rotatedX =
      relativeX * Math.cos(rotationRad) - relativeY * Math.sin(rotationRad);
    const rotatedY =
      relativeX * Math.sin(rotationRad) + relativeY * Math.cos(rotationRad);

    const absoluteX =
      stripRect.left -
      containerRect.left +
      centerX +
      rotatedX -
      MEASUREMENTS.frameWidth / 2;
    const absoluteY =
      stripRect.top -
      containerRect.top +
      centerY +
      rotatedY -
      MEASUREMENTS.frameHeight / 2;

    return {
      left: absoluteX,
      top: absoluteY,
      frameNumber,
    };
  };

  const w = MEASUREMENTS.frameWidth;
  const h = MEASUREMENTS.frameHeight;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1000 }}
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        style={{
          opacity: 0.6,
          mixBlendMode: 'color-dodge',
        }}
      >
        <defs>
          <filter
            x="-2%"
            y="-2%"
            width="104%"
            height="104%"
            filterUnits="objectBoundingBox"
            id="PencilTexture"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.2"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              xChannelSelector="R"
              yChannelSelector="G"
              scale="3"
              in="SourceGraphic"
              result="newSource"
            />
          </filter>
        </defs>

        {Array.from(selectedFrames.entries()).map(
          ([frameNumber, highlightType]) => {
            const position = getFramePosition(frameNumber);
            if (!position) return null;

            // Generate hand-drawn path with slight randomness for each frame
            const jitter = (base: number, variance: number) =>
              base + Math.sin(frameNumber * 123.456 + base * 0.1) * variance;

            if (highlightType === 'circle') {
              // White hand-drawn oval highlight
              const centerX = position.left + w / 2;
              const centerY = position.top + h / 2;
              const radiusX = w / 2 + 15;
              const radiusY = h / 2 + 12;

              // Create hand-drawn oval using quadratic curves
              const ovalPath = `
                M ${jitter(centerX - radiusX, 6)} ${jitter(centerY, 8)}
                Q ${jitter(centerX - radiusX, 6)} ${jitter(centerY - radiusY, 8)} ${jitter(centerX, 8)} ${jitter(centerY - radiusY, 6)}
                Q ${jitter(centerX + radiusX, 8)} ${jitter(centerY - radiusY, 6)} ${jitter(centerX + radiusX, 6)} ${jitter(centerY, 8)}
                Q ${jitter(centerX + radiusX, 6)} ${jitter(centerY + radiusY, 8)} ${jitter(centerX, 8)} ${jitter(centerY + radiusY, 6)}
                Q ${jitter(centerX - radiusX, 8)} ${jitter(centerY + radiusY, 6)} ${jitter(centerX - radiusX, 6)} ${jitter(centerY, 8)}
                Z`;

              return (
                <path
                  key={frameNumber}
                  d={ovalPath}
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                  filter="url(#PencilTexture)"
                />
              );
            } else {
              // Red rectangle highlight (existing)
              return (
                <path
                  key={frameNumber}
                  d={`M ${jitter(position.left + 8, 3)} ${jitter(position.top + 6, 4)} 
                  Q ${jitter(position.left + 4, 2)} ${jitter(position.top + 8, 3)} ${jitter(position.left + 18, 4)} ${jitter(position.top + 4, 2)}
                  Q ${jitter(position.left + 12 + w / 3, 6)} ${jitter(position.top + 4, 2)} ${jitter(position.left + 12 + (w * 2) / 3, 6)} ${jitter(position.top + 8, 3)}
                  Q ${jitter(position.left + 12 + w - 6, 4)} ${jitter(position.top + 4, 2)} ${jitter(position.left + 12 + w + 6, 3)} ${jitter(position.top + 6, 4)}
                  Q ${jitter(position.left + 12 + w + 8, 3)} ${jitter(position.top + 12 + h / 3, 6)} ${jitter(position.left + 12 + w + 6, 3)} ${jitter(position.top + 12 + (h * 2) / 3, 6)}
                  Q ${jitter(position.left + 12 + w + 8, 3)} ${jitter(position.top + 12 + h - 6, 4)} ${jitter(position.left + 12 + w + 6, 3)} ${jitter(position.top + 12 + h + 6, 3)}
                  Q ${jitter(position.left + 12 + (w * 2) / 3, 6)} ${jitter(position.top + 12 + h + 8, 3)} ${jitter(position.left + 12 + w / 3, 6)} ${jitter(position.top + 12 + h + 6, 3)}
                  Q ${jitter(position.left + 18, 4)} ${jitter(position.top + 12 + h + 8, 3)} ${jitter(position.left + 4, 2)} ${jitter(position.top + 12 + h + 6, 3)}
                  Q ${jitter(position.left + 2, 2)} ${jitter(position.top + 12 + (h * 2) / 3, 6)} ${jitter(position.left + 4, 2)} ${jitter(position.top + 12 + h / 3, 6)}
                  Q ${jitter(position.left + 2, 2)} ${jitter(position.top + 18, 4)} ${jitter(position.left + 8, 3)} ${jitter(position.top + 6, 4)} Z`}
                  fill="none"
                  stroke="red"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#PencilTexture)"
                />
              );
            }
          }
        )}

        {/* X marks as separate overlay layer */}
        {Array.from(xMarkedFrames).map(frameNumber => {
          const position = getFramePosition(frameNumber);
          if (!position) return null;

          const jitter = (base: number, variance: number) =>
            base + Math.sin(frameNumber * 123.456 + base * 0.1) * variance;

          // Red hand-drawn X highlight
          const centerX = position.left + w / 2;
          const centerY = position.top + h / 2;
          const size = Math.min(w, h) * 0.6; // X size relative to frame

          // Create two crossing lines for the X
          const line1 = `
            M ${jitter(centerX - size / 2, 4)} ${jitter(centerY - size / 2, 4)}
            Q ${jitter(centerX - size / 4, 6)} ${jitter(centerY - size / 4, 6)} ${jitter(centerX, 4)} ${jitter(centerY, 4)}
            Q ${jitter(centerX + size / 4, 6)} ${jitter(centerY + size / 4, 6)} ${jitter(centerX + size / 2, 4)} ${jitter(centerY + size / 2, 4)}`;

          const line2 = `
            M ${jitter(centerX + size / 2, 4)} ${jitter(centerY - size / 2, 4)}
            Q ${jitter(centerX + size / 4, 6)} ${jitter(centerY - size / 4, 6)} ${jitter(centerX, 4)} ${jitter(centerY, 4)}
            Q ${jitter(centerX - size / 4, 6)} ${jitter(centerY + size / 4, 6)} ${jitter(centerX - size / 2, 4)} ${jitter(centerY + size / 2, 4)}`;

          return (
            <g key={`x-${frameNumber}`}>
              <path
                d={line1}
                fill="none"
                stroke="red"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
                filter="url(#PencilTexture)"
              />
              <path
                d={line2}
                fill="none"
                stroke="red"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
                filter="url(#PencilTexture)"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const NegativeStrip = ({
  images,
  startIndex,
  onFrameClick,
  stripRef,
}: {
  images: string[];
  startIndex: number;
  onFrameClick: (frameNumber: number, event: React.MouseEvent) => void;
  stripRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const framesInStrip = Math.min(6, images.length - startIndex);
  const stripWidth =
    framesInStrip * MEASUREMENTS.frameWidth +
    (framesInStrip - 1) * FRAME_GAP +
    STRIP_PADDING * 2;
  const frameTop = (MEASUREMENTS.negativeHeight - MEASUREMENTS.frameHeight) / 2;

  // Use consistent rotation based on strip index
  const stripIndex = Math.floor(startIndex / 6);
  const rotation = getStripRotation(stripIndex);
  const textStartingOffset = useMemo(() => {
    // Use startIndex as seed for consistent offset
    const seed = startIndex * 456.789;
    return Math.sin(seed) * 40; // Range of -40 to 40
  }, [startIndex]);

  return (
    <div
      ref={stripRef}
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
              onClick={event => onFrameClick(frameNumber, event)}
            >
              {imagePath && (
                <Image
                  src={`/hp5/${imagePath}`}
                  alt={`Frame ${imageIndex + 1}`}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

type HighlightType = 'rectangle' | 'circle';

export default function ContactSheetClaude() {
  const [images, setImages] = useState<string[]>([]);
  const [selectedFrames, setSelectedFrames] = useState<
    Map<number, HighlightType>
  >(new Map());
  const [xMarkedFrames, setXMarkedFrames] = useState<Set<number>>(new Set());

  const imageList = useMemo(
    () => [
      '000000160024.jpeg',
      '000000180006.jpeg',
      '000004310026.jpeg',
      '000004340020.jpeg',
      '000004350036.jpeg',
      '000004350039.jpeg',
      '000004360009.jpeg',
      '000004390004.jpeg',
      '000004390011.jpeg',
      '000014740026.jpeg',
      '000014750008.jpeg',
      '000014800037.jpeg',
      '000016800013.jpeg',
      '000016800019.jpeg',
      '000016800023.jpeg',
      '000019050039.jpeg',
      '000019670023.jpeg',
      '000028.jpeg',
      '000032250013.jpeg',
      '000036270021.jpeg',
      '000790--005--VK.jpeg',
      '000790--026--VK.jpeg',
      '000791--003--VK.jpeg',
      '000791--022--VK.jpeg',
      '000791--028--VK.jpeg',
      '000811--004--VK.jpeg',
      '002364--017--VK.jpeg',
      '008229--027--VK.jpeg',
      '008281--009--VK.jpeg',
      '008325--016--VK.jpeg',
      '008325--020--VK.jpeg',
      '25530026.jpeg',
      'IMG_1078.jpeg',
      'IMG_6347.jpeg',
      'IMG_6377.jpeg',
      'IMG_6476.jpeg',
      'IMG_7136.jpeg',
      'IMG_7138.jpeg',
    ],
    []
  );

  const stripCount = Math.ceil(imageList.length / 6);
  const stripRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]);

  // Initialize refs array with createRef instead of useRef
  if (stripRefs.current.length !== stripCount) {
    stripRefs.current = Array.from({ length: stripCount }, () =>
      createRef<HTMLDivElement>()
    );
  }

  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setImages(imageList);
  }, [imageList]);

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
      // Handle X marking separately
      setXMarkedFrames(prev => {
        const newSet = new Set(prev);
        if (newSet.has(frameNumber)) {
          newSet.delete(frameNumber);
        } else {
          newSet.add(frameNumber);
        }
        return newSet;
      });
    } else {
      // Handle normal highlights (rectangle/circle)
      setSelectedFrames(prev => {
        const newMap = new Map(prev);
        const highlightType: HighlightType = event.altKey
          ? 'circle'
          : 'rectangle';

        if (newMap.has(frameNumber)) {
          newMap.delete(frameNumber);
        } else {
          newMap.set(frameNumber, highlightType);
        }
        return newMap;
      });
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-fit mx-auto relative" data-contact-sheet>
        {Array.from({ length: Math.ceil(images.length / 6) }, (_, i) => (
          <NegativeStrip
            key={i * 6}
            images={images}
            startIndex={i * 6}
            onFrameClick={handleFrameClick}
            stripRef={stripRefs.current[i]}
          />
        ))}
        <HighlightOverlay
          images={images}
          selectedFrames={selectedFrames}
          xMarkedFrames={xMarkedFrames}
          stripRefs={stripRefs.current}
        />
      </div>
    </div>
  );
}
