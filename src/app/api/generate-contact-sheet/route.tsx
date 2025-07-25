import { NextRequest } from 'next/server';
import { ImageResponse } from '@vercel/og';
import {
  FilmStock,
  FILM_STOCKS,
  Frame as FrameData,
  MEASUREMENTS,
  STICKER_CONFIGS,
  Sticker,
  ContactSheetState,
} from '../../contact-sheet/utils/constants';

// Load the Rock Salt font
async function loadRockSaltFont() {
  try {
    const response = await fetch(
      'https://fonts.googleapis.com/css2?family=Rock+Salt:wght@400&display=swap'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch font CSS');
    }

    const css = await response.text();
    // Extract the font URL from the CSS
    const fontUrlMatch = css.match(/url\(([^)]+)\)/);

    if (!fontUrlMatch) {
      throw new Error('Font URL not found in CSS');
    }

    const fontUrl = fontUrlMatch[1].replace(/['"]/g, '');
    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error('Failed to fetch font file');
    }

    return fontResponse.arrayBuffer();
  } catch (error) {
    console.warn('Failed to load Rock Salt font:', error);
    // Return null to indicate font loading failed
    return null;
  }
}

// Types for the request payload
interface Frame {
  src: string;
  highlights: {
    rectangle: boolean;
    circle: boolean;
    scribble: boolean;
    cross: boolean;
  };
}

interface ContactSheetRequest {
  frames: Record<string, Frame>;
  frameOrder: string[];
  filmStock?: FilmStock;
  rotation?: number;
  stickers?: Sticker[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    const body = await request.json();

    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate the request body structure
    if (!body.frames || !body.frameOrder) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid request format. Expected object with "frames" and "frameOrder" properties.',
          received: body,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      frames,
      frameOrder,
      filmStock = 'ilford-hp5',
      rotation = 0,
      stickers = [],
    } = body as ContactSheetRequest;

    console.log(
      'Received frames:',
      Object.keys(frames).length,
      'frameOrder:',
      frameOrder.length,
      'rotation:',
      rotation
    );

    if (!Array.isArray(frameOrder)) {
      return new Response('frameOrder must be an array', { status: 400 });
    }

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    console.log('Base URL:', baseUrl);

    // Load the font
    const rockSaltFont = await loadRockSaltFont();

    // Calculate dimensions with high DPI scaling
    const scaleFactor = 2; // 2x scaling for high resolution output
    const baseDimensions = getContactSheetDimensions(
      frameOrder.length,
      rotation
    );
    const dimensions = {
      width: baseDimensions.width * scaleFactor,
      height: baseDimensions.height * scaleFactor,
    };

    // Generate the contact sheet using React components
    const contactSheet = (
      <div
        style={{
          position: 'relative',
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: rockSaltFont ? 'Rock Salt, cursive' : 'serif',
        }}
      >
        <ContactSheetContent
          frames={{ frames, frameOrder }}
          baseUrl={baseUrl}
          filmStock={filmStock}
          rotation={rotation}
          scaleFactor={scaleFactor}
          stickers={stickers}
        />
      </div>
    );

    return new ImageResponse(contactSheet, {
      width: dimensions.width,
      height: dimensions.height,
      fonts: rockSaltFont
        ? [
            {
              name: 'Rock Salt',
              data: rockSaltFont,
              style: 'normal',
              weight: 400,
            },
          ]
        : [],
    });
  } catch (error) {
    console.error('Error generating contact sheet:', error);
    return new Response('Failed to generate contact sheet', { status: 500 });
  }
}

function ContactSheetContent({
  frames,
  baseUrl,
  filmStock,
  rotation = 0,
  scaleFactor = 1,
  stickers = [],
}: {
  frames: ContactSheetState;
  baseUrl: string;
  filmStock: FilmStock;
  rotation: number;
  scaleFactor: number;
  stickers: Sticker[];
}) {
  // Scale all measurements for higher resolution
  const FRAME_WIDTH = MEASUREMENTS.frameWidth * scaleFactor;
  const FRAME_HEIGHT = MEASUREMENTS.frameHeight * scaleFactor;
  const IMAGE_WIDTH = MEASUREMENTS.imageWidth * scaleFactor;
  const IMAGE_HEIGHT = MEASUREMENTS.imageHeight * scaleFactor;

  const numberOfStrips = Math.ceil(frames.frameOrder.length / 6);
  const maxFramesPerStrip = Math.min(6, frames.frameOrder.length);
  const maxStripWidth = maxFramesPerStrip * FRAME_WIDTH;

  // Calculate container dimensions - match ContactSheet.tsx exactly
  const baseWidth = maxStripWidth + 128 * scaleFactor; // 64px padding on each side
  const baseHeight =
    numberOfStrips * FRAME_HEIGHT +
    (numberOfStrips - 1) * 16 * scaleFactor +
    128 * scaleFactor; // 64px padding top/bottom

  return (
    <div
      style={{
        position: 'relative',
        background: 'black',
        width: baseWidth,
        height: baseHeight,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        padding: 64 * scaleFactor, // 64px padding to match ContactSheet
      }}
    >
      {Array.from({ length: numberOfStrips }, (_, stripIndex) => {
        const startIndex = stripIndex * 6;
        const framesInStrip = Math.min(
          6,
          frames.frameOrder.length - startIndex
        );
        const stripWidth = framesInStrip * FRAME_WIDTH;

        // Add slight rotation for authenticity
        const seed = stripIndex * 123.456;
        const stripRotation = Math.sin(seed) * 0.5;

        return (
          <div
            key={stripIndex}
            style={{
              position: 'relative',
              display: 'flex',
              marginBottom:
                stripIndex < numberOfStrips - 1 ? 16 * scaleFactor : 0,
              width: stripWidth,
              height: FRAME_HEIGHT,
              transform: `rotate(${stripRotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Generate frames for this strip */}
            {Array.from({ length: framesInStrip }, (_, frameIndex) => {
              const imageIndex = startIndex + frameIndex;
              const frameId = frames.frameOrder[imageIndex];
              const frame = frames.frames[frameId];
              const frameNumber = imageIndex + 1;

              return (
                <div
                  key={frameIndex}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: FRAME_WIDTH,
                    height: FRAME_HEIGHT,
                  }}
                >
                  {/* Frame background */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/frame.png`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: FRAME_WIDTH,
                      height: FRAME_HEIGHT,
                      zIndex: 1,
                      objectFit: 'cover',
                    }}
                  />
                  {/* Film stock title overlay */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/title.png`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 188 * scaleFactor,
                      height: 11 * scaleFactor,
                      zIndex: 1,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Film DX overlay */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/dx.png`}
                    style={{
                      position: 'absolute',
                      bottom: 1 * scaleFactor,
                      left: 0,
                      width: 188 * scaleFactor,
                      height: 11 * scaleFactor,
                      zIndex: 1,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Frame index overlay */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/index-${frameNumber}.png`}
                    style={{
                      position: 'absolute',
                      bottom: 1 * scaleFactor,
                      left: 0,
                      width: 188 * scaleFactor,
                      height: 11 * scaleFactor,
                      zIndex: 1,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Sprockets overlay - top */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/sprockets.png`}
                    style={{
                      position: 'absolute',
                      top: 11 * scaleFactor,
                      left: 0,
                      width: 188 * scaleFactor,
                      height: 14 * scaleFactor,
                      zIndex: 1,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Sprockets overlay - bottom */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/sprockets.png`}
                    style={{
                      position: 'absolute',
                      bottom: 11 * scaleFactor,
                      left: 0,
                      width: 188 * scaleFactor,
                      height: 14 * scaleFactor,
                      zIndex: 1,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Image */}
                  {frame.src && (
                    <div
                      style={{
                        position: 'relative',
                        width: IMAGE_WIDTH,
                        height: IMAGE_HEIGHT,
                        display: 'flex',
                        zIndex: 10,
                      }}
                    >
                      <img
                        src={
                          frame.src.startsWith('data:')
                            ? frame.src
                            : `${baseUrl}/default-frames/${frame.src}`
                        }
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}

                  {/* Highlight overlays - render ALL active highlights like ContactSheet */}
                  {Object.entries(frame.highlights)
                    .filter(([type, isActive]) => isActive)
                    .map(([highlight], highlightIndex) => (
                      <img
                        key={`${frameId}-${highlight}-${highlightIndex}`}
                        src={`${baseUrl}${getHighlightImage(highlight as 'rectangle' | 'scribble' | 'circle' | 'cross')}`}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: FRAME_WIDTH,
                          height: FRAME_HEIGHT,
                          zIndex: 20,
                          objectFit: 'cover',
                          opacity: highlight === 'scribble' ? 1 : 0.9,
                        }}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Stickers */}
      {stickers.map((sticker, index) => {
        const stickerConfig = STICKER_CONFIGS[sticker.type];
        if (!stickerConfig) return null;

        // Handle text stickers differently
        if (sticker.type === 'text') {
          return (
            <div
              key={`sticker-${index}`}
              style={{
                position: 'absolute',
                top: sticker.top * scaleFactor,
                left: sticker.left * scaleFactor,
                minWidth: stickerConfig.width * scaleFactor,
                minHeight: stickerConfig.height * scaleFactor,
                color: 'white',
                fontSize: 18 * scaleFactor,
                fontFamily: 'Rock Salt, serif',
                lineHeight: 1.1,
                zIndex: 30,
                whiteSpace: 'nowrap',
              }}
            >
              {sticker.text || 'Edit me'}
            </div>
          );
        }

        // Regular image stickers
        // Use the image path directly
        const imagePath = stickerConfig.image;

        return (
          <img
            key={`sticker-${index}`}
            src={`${baseUrl}${imagePath}`}
            style={{
              position: 'absolute',
              top: sticker.top * scaleFactor,
              left: sticker.left * scaleFactor,
              width: stickerConfig.width * scaleFactor,
              height: stickerConfig.height * scaleFactor,
              objectFit: 'cover',
              zIndex: 30,
              transform: stickerConfig.transform || '',
              transformOrigin: 'center center',
            }}
          />
        );
      })}
    </div>
  );
}

function getHighlightImage(type: string): string {
  return `/frame-highlight-${type}.png`;
}

function getContactSheetDimensions(
  imageCount: number,
  rotation: number = 0
): { width: number; height: number } {
  const { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT } = MEASUREMENTS;

  const numberOfStrips = Math.ceil(imageCount / 6);
  const maxFramesPerStrip = Math.min(6, imageCount);
  const maxStripWidth = maxFramesPerStrip * FRAME_WIDTH;

  // Base content dimensions - match ContactSheet.tsx exactly
  const baseWidth = maxStripWidth;
  const baseHeight = numberOfStrips * FRAME_HEIGHT + (numberOfStrips - 1) * 16;

  // Add 64px padding on all sides to match ContactSheet
  const padding = 128; // 64px padding on each side

  const contentWidth = baseWidth + padding;
  const contentHeight = baseHeight + padding;

  if (rotation === 0) {
    return {
      width: contentWidth,
      height: contentHeight,
    };
  }

  // For rotated content, calculate proper bounding box
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  const rotatedWidth = contentWidth * cos + contentHeight * sin;
  const rotatedHeight = contentWidth * sin + contentHeight * cos;

  return {
    width: Math.ceil(rotatedWidth),
    height: Math.ceil(rotatedHeight),
  };
}
