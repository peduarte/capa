import { NextRequest } from 'next/server';
import { ImageResponse } from '@vercel/og';
import {
  MEASUREMENTS,
  FilmStock,
  FILM_STOCKS,
} from '../../contact-sheet/utils/constants';

// Types for the request payload
interface Frame {
  src: string;
  highlights: {
    default: boolean;
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

    return new ImageResponse(
      (
        <div
          style={{
            position: 'relative',
            background: 'black',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier, monospace',
          }}
        >
          <ContactSheetContent
            frames={frames}
            frameOrder={frameOrder}
            baseUrl={baseUrl}
            filmStock={filmStock}
            rotation={rotation}
            scaleFactor={scaleFactor}
          />
        </div>
      ),
      {
        width: dimensions.width,
        height: dimensions.height,
      }
    );
  } catch (error) {
    console.error('Error generating contact sheet:', error);
    return new Response('Failed to generate contact sheet', { status: 500 });
  }
}

function ContactSheetContent({
  frames,
  frameOrder,
  baseUrl,
  filmStock,
  rotation = 0,
  scaleFactor = 1,
}: {
  frames: Record<string, Frame>;
  frameOrder: string[];
  baseUrl: string;
  filmStock: FilmStock;
  rotation: number;
  scaleFactor: number;
}) {
  // Scale all measurements for higher resolution
  const FRAME_WIDTH = MEASUREMENTS.frameWidth * scaleFactor;
  const FRAME_HEIGHT = MEASUREMENTS.frameHeight * scaleFactor;
  const IMAGE_WIDTH = MEASUREMENTS.imageWidth * scaleFactor;
  const IMAGE_HEIGHT = MEASUREMENTS.imageHeight * scaleFactor;

  const numberOfStrips = Math.ceil(frameOrder.length / 6);
  const maxFramesPerStrip = Math.min(6, frameOrder.length);
  const maxStripWidth = maxFramesPerStrip * FRAME_WIDTH;

  // Calculate container dimensions
  const baseWidth = maxStripWidth;
  const baseHeight =
    numberOfStrips * FRAME_HEIGHT + (numberOfStrips - 1) * 16 * scaleFactor;

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
      }}
    >
      {Array.from({ length: numberOfStrips }, (_, stripIndex) => {
        const startIndex = stripIndex * 6;
        const framesInStrip = Math.min(6, frameOrder.length - startIndex);
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
              const frameId = frameOrder[imageIndex];
              const frame = frames[frameId];
              const frameNumber = imageIndex + 1;

              // Determine highlight type from frame data
              const highlightType = Object.entries(frame.highlights).find(
                ([type, isActive]) => isActive && type !== 'cross'
              )?.[0] as 'default' | 'scribble' | 'circle' | undefined;

              const isXMarked = frame.highlights.cross;

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
                    src={`${baseUrl}/frame.png`}
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
                      zIndex: 10,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Film stock footer overlay */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/dx.png`}
                    style={{
                      position: 'absolute',
                      bottom: 2 * scaleFactor,
                      left: 0,
                      width: 188 * scaleFactor,
                      height: 11 * scaleFactor,
                      zIndex: 10,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Frame index overlay */}
                  <img
                    src={`${baseUrl}/${FILM_STOCKS[filmStock].id}/index-${frameNumber}.png`}
                    style={{
                      position: 'absolute',
                      bottom: 2 * scaleFactor,
                      left: 0,
                      width: 188 * scaleFactor,
                      height: 11 * scaleFactor,
                      zIndex: 11,
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
                        zIndex: 5,
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

                  {/* Highlight overlay */}
                  {highlightType && (
                    <img
                      src={`${baseUrl}${getHighlightImage(highlightType)}`}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: FRAME_WIDTH,
                        height: FRAME_HEIGHT,
                        zIndex: 20,
                        objectFit: 'cover',
                      }}
                    />
                  )}

                  {/* X mark overlay */}
                  {isXMarked && (
                    <img
                      src={`${baseUrl}/frame-highlight-x.png`}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: FRAME_WIDTH,
                        height: FRAME_HEIGHT,
                        zIndex: 20,
                        objectFit: 'cover',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function getHighlightImage(type: 'default' | 'scribble' | 'circle'): string {
  if (type === 'scribble') return '/frame-highlight-scribble.png';
  if (type === 'circle') return '/frame-highlight-circle.png';
  return '/frame-highlight-rectangle.png';
}

function getContactSheetDimensions(
  imageCount: number,
  rotation: number = 0
): { width: number; height: number } {
  const { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT } = MEASUREMENTS;

  const numberOfStrips = Math.ceil(imageCount / 6);
  const maxFramesPerStrip = Math.min(6, imageCount);
  const maxStripWidth = maxFramesPerStrip * FRAME_WIDTH;

  // Base content dimensions
  const baseWidth = maxStripWidth;
  const baseHeight = numberOfStrips * FRAME_HEIGHT + (numberOfStrips - 1) * 16;

  // Add balanced padding on all sides - reduced since outer container will center
  const padding = 120; // 60px padding on each side for better balance

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
