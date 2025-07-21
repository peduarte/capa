'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ImageFile {
  name: string;
  src: string;
}

// Real-world measurements in mm - calculated from frame constraints
const REAL_MEASUREMENTS = {
  negativeHeight: 35,
  frameWidth: 36,
  frameHeight: 24,
  sprocketWidth: 2.5, // Calculated: 8 sprockets + 7 gaps = 36mm
  sprocketHeight: 2.5, // Fits in available space above/below frame
  sprocketGap: 16 / 7, // Calculated: (36 - 8×2.5) ÷ 7 = 2.29mm
  frameToSprocketGap: 2.5, // Centers sprockets in remaining space
  framesPerStrip: 6,
  sprocketsPerFrame: 8,
};

// Calculate scale factor based on desired 175px negative height
const SCALE_FACTOR = 175 / REAL_MEASUREMENTS.negativeHeight; // 5px/mm

// Scaled measurements for UI
const MEASUREMENTS = {
  negativeHeight: REAL_MEASUREMENTS.negativeHeight * SCALE_FACTOR, // 175px
  frameWidth: REAL_MEASUREMENTS.frameWidth * SCALE_FACTOR,
  frameHeight: REAL_MEASUREMENTS.frameHeight * SCALE_FACTOR,
  sprocketWidth: REAL_MEASUREMENTS.sprocketWidth * SCALE_FACTOR,
  sprocketHeight: REAL_MEASUREMENTS.sprocketHeight * SCALE_FACTOR,
  sprocketCenterGap: REAL_MEASUREMENTS.sprocketGap * SCALE_FACTOR,
  frameToSprocketGap: REAL_MEASUREMENTS.frameToSprocketGap * SCALE_FACTOR,
  framesPerStrip: REAL_MEASUREMENTS.framesPerStrip,
  sprocketsPerFrame: REAL_MEASUREMENTS.sprocketsPerFrame,
};

const SprocketHole = ({ style }: { style?: React.CSSProperties }) => (
  <div
    className="bg-black rounded-sm"
    style={{
      width: `${MEASUREMENTS.sprocketWidth}px`,
      height: `${MEASUREMENTS.sprocketHeight}px`,
      ...style,
    }}
  />
);

const SprocketStrip = ({ frameCount }: { frameCount: number }) => {
  const holes = [];
  const totalStripWidth = frameCount * MEASUREMENTS.frameWidth;

  // Calculate total sprockets across the entire strip
  const totalSprockets = frameCount * MEASUREMENTS.sprocketsPerFrame;

  // Calculate consistent spacing across the entire strip
  // We need the sprockets to be evenly distributed across the total width
  // such that each frame gets exactly 8 sprockets aligned with its edges
  const sprocketSpacing =
    MEASUREMENTS.frameWidth / MEASUREMENTS.sprocketsPerFrame;

  for (let i = 0; i < totalSprockets; i++) {
    // Position sprockets with consistent spacing across entire strip
    const x = i * sprocketSpacing;

    holes.push(
      <SprocketHole
        key={i}
        style={{
          position: 'absolute',
          left: `${x}px`,
        }}
      />
    );
  }

  return (
    <div
      className="relative"
      style={{
        width: `${totalStripWidth}px`,
        height: `${MEASUREMENTS.sprocketHeight}px`,
      }}
    >
      {holes}
    </div>
  );
};

const FilmStrip = ({ images }: { images: ImageFile[] }) => {
  const frameCount = Math.min(images.length, MEASUREMENTS.framesPerStrip);
  const stripWidth = frameCount * MEASUREMENTS.frameWidth;

  // Calculate positions
  const frameTop = (MEASUREMENTS.negativeHeight - MEASUREMENTS.frameHeight) / 2;
  const topSprocketTop =
    frameTop - MEASUREMENTS.frameToSprocketGap - MEASUREMENTS.sprocketHeight;
  const bottomSprocketTop =
    frameTop + MEASUREMENTS.frameHeight + MEASUREMENTS.frameToSprocketGap;

  return (
    <div className="mb-8">
      {/* Film negative container */}
      <div
        className="bg-gray-800 relative"
        style={{
          width: `${stripWidth}px`,
          height: `${MEASUREMENTS.negativeHeight}px`,
        }}
      >
        {/* Top sprocket holes */}
        <div className="absolute" style={{ top: `${topSprocketTop}px` }}>
          <SprocketStrip frameCount={frameCount} />
        </div>

        {/* Image frames */}
        <div
          className="absolute flex"
          style={{
            top: `${frameTop}px`,
            height: `${MEASUREMENTS.frameHeight}px`,
          }}
        >
          {images.slice(0, MEASUREMENTS.framesPerStrip).map((image, index) => (
            <div
              key={image.name}
              className="relative border border-gray-600 overflow-hidden bg-white"
              style={{
                width: `${MEASUREMENTS.frameWidth}px`,
                height: `${MEASUREMENTS.frameHeight}px`,
              }}
            >
              <Image
                src={image.src}
                alt={`Frame ${index + 1}`}
                fill
                className="object-cover"
                style={{
                  imageRendering: 'crisp-edges',
                }}
              />
              {/* Frame number overlay */}
              <div
                className="absolute bottom-1 right-1 text-black text-xs font-mono bg-white bg-opacity-70 px-1"
                style={{ fontSize: '8px' }}
              >
                {String(index + 1).padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom sprocket holes */}
        <div
          className="absolute"
          style={{
            top: `${bottomSprocketTop}px`,
          }}
        >
          <SprocketStrip frameCount={frameCount} />
        </div>
      </div>
    </div>
  );
};

export default function ContactSheetCursor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images?folder=hp5');
        const imageFiles = await response.json();

        const imageList: ImageFile[] = imageFiles.map((filename: string) => ({
          name: filename,
          src: `/hp5/${filename}`,
        }));

        setImages(imageList);
      } catch (error) {
        console.error('Failed to fetch images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading contact sheet...</div>
      </div>
    );
  }

  // Split images into strips of 6
  const strips = [];
  for (let i = 0; i < images.length; i += MEASUREMENTS.framesPerStrip) {
    strips.push(images.slice(i, i + MEASUREMENTS.framesPerStrip));
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-none">
        {strips.map((stripImages, stripIndex) => (
          <FilmStrip key={stripIndex} images={stripImages} />
        ))}
      </div>
    </div>
  );
}
