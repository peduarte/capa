import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import {
  MEASUREMENTS,
  FilmStock,
  FILM_STOCKS,
  DEFAULT_FILM_STOCK,
} from '../../contact-sheet/utils/constants';

// Types for the request payload
interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}

interface ContactSheetRequest {
  images: string[];
  highlights?: FrameHighlight[];
  xMarks?: number[];
  filmStock?: FilmStock;
  rotation?: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    const body: ContactSheetRequest = await request.json();
    const {
      images,
      highlights = [],
      xMarks = [],
      filmStock = DEFAULT_FILM_STOCK,
      rotation = 0,
    } = body;

    console.log(
      'Received images:',
      images.length,
      'highlights:',
      highlights.length,
      'xMarks:',
      xMarks.length,
      'rotation:',
      rotation
    );

    // Debug: Log image types
    images.forEach((img, index) => {
      if (img) {
        const isDataUrl = img.startsWith('data:');
        const isBlobUrl = img.startsWith('blob:');
        const isPath = !isDataUrl && !isBlobUrl;
        console.log(
          `Image ${index + 1}: ${isDataUrl ? 'Data URL' : isBlobUrl ? 'Blob URL' : 'Path'} (length: ${img.length})`
        );
      }
    });

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Invalid images array' },
        { status: 400 }
      );
    }

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    console.log('Base URL:', baseUrl);
    console.log('Starting Puppeteer browser...');
    // Launch Puppeteer browser
    const isProduction = process.env.NODE_ENV === 'production';

    // Dynamic import based on environment
    const puppeteer = isProduction
      ? (await import('puppeteer-core')).default
      : (await import('puppeteer')).default;

    const browser = await puppeteer.launch({
      args: isProduction
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        isLandscape: true,
      },
      executablePath: isProduction
        ? await chromium.executablePath()
        : undefined,
      headless: isProduction ? 'shell' : true,
    });

    console.log('Browser launched successfully');
    const page = await browser.newPage();

    // Set viewport to ensure consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2,
    });

    console.log('Generating HTML...');
    // Create the HTML content with embedded ContactSheet component
    const html = await generateContactSheetHTML(
      images,
      highlights,
      xMarks,
      baseUrl,
      filmStock,
      rotation
    );
    console.log('HTML generated, length:', html.length);

    // Set the page content and wait for images to load
    console.log('Setting page content...');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    console.log('Waiting for images to load...');
    // Wait for all images to be loaded
    try {
      await page.waitForSelector('img', { timeout: 30000 });
      console.log('Images found, waiting for loading...');

      // Give extra time for large data URLs to load
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.warn('Image loading timeout, proceeding anyway:', error);
    }

    // Get the dimensions of the contact sheet
    const dimensions = getContactSheetDimensions(images.length, rotation);
    console.log('Screenshot dimensions:', dimensions);

    // Take screenshot of the specific element
    console.log('Taking screenshot...');
    const screenshot = await page.screenshot({
      type: 'png',
      clip: dimensions,
    });

    console.log('Screenshot taken, size:', screenshot.length);
    await browser.close();

    // Return the image
    return new NextResponse(screenshot, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="contact-sheet.png"',
      },
    });
  } catch (error) {
    console.error('Error generating contact sheet:', error);
    return NextResponse.json(
      { error: 'Failed to generate contact sheet' },
      { status: 500 }
    );
  }
}

async function generateContactSheetHTML(
  images: string[],
  highlights: FrameHighlight[],
  xMarks: number[],
  baseUrl: string,
  filmStock: FilmStock,
  rotation: number = 0
): Promise<string> {
  const {
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    imageWidth: IMAGE_WIDTH,
    imageHeight: IMAGE_HEIGHT,
  } = MEASUREMENTS;

  const numberOfStrips = Math.ceil(images.length / 6);
  const maxFramesPerStrip = Math.min(6, images.length);
  const maxStripWidth = maxFramesPerStrip * FRAME_WIDTH;

  // Generate strips HTML
  const stripsHTML = Array.from({ length: numberOfStrips }, (_, stripIndex) => {
    const startIndex = stripIndex * 6;
    const framesInStrip = Math.min(6, images.length - startIndex);
    const stripWidth = framesInStrip * FRAME_WIDTH;

    // Add slight rotation for authenticity (same as original)
    const seed = stripIndex * 123.456;
    const rotation = Math.sin(seed) * 0.5;

    // Generate frames for this strip
    const framesHTML = Array.from(
      { length: framesInStrip },
      (_, frameIndex) => {
        const imageIndex = startIndex + frameIndex;
        const imagePath = images[imageIndex];
        const frameNumber = imageIndex + 1;
        const isHighlighted = highlights.find(
          h => h.frameNumber === frameNumber
        );
        const isXMarked = xMarks.includes(frameNumber);

        return `
        <div style="
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${FRAME_WIDTH}px;
          height: ${FRAME_HEIGHT}px;
          background-image: url('${baseUrl}/frame.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        ">
          ${
            imagePath
              ? `
            <div style="
              position: relative;
              width: ${IMAGE_WIDTH}px;
              height: ${IMAGE_HEIGHT}px;
            ">
              <img
                src="${imagePath.startsWith('data:') ? imagePath : `${baseUrl}/default-frames/${imagePath}`}"
                alt="Frame ${frameNumber}"
                style="
                  position: absolute;
                  inset: 0;
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  pointer-events: none;
                "
                crossorigin="anonymous"
                onload="console.log('Image loaded:', '${frameNumber}')"
                onerror="console.error('Image failed to load:', '${frameNumber}', this.src.slice(0, 100))"
              />
            </div>
          `
              : ''
          }
          
          <!-- Film stock title overlay -->
          <div style="
            position: absolute;
            pointer-events: none;
            top: 0;
            left: 0;
            width: 188px;
            height: 11px;
            background-image: url('${baseUrl}${FILM_STOCKS[filmStock].titleImage}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 10;
          "></div>

          <!-- Film stock footer overlay -->
          <div style="
            position: absolute;
            pointer-events: none;
            bottom: 0;
            left: 0;
            width: 188px;
            height: 11px;
            background-image: url('${baseUrl}${FILM_STOCKS[filmStock].footerImage}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 10;
          "></div>

          <!-- Frame index number (small) -->
          <div style="
            position: absolute;
            pointer-events: none;
            ${FILM_STOCKS[filmStock].smallIndex.bottom ? `bottom: ${FILM_STOCKS[filmStock].smallIndex.bottom};` : ''}
            ${FILM_STOCKS[filmStock].smallIndex.left ? `left: ${FILM_STOCKS[filmStock].smallIndex.left};` : ''}
            ${FILM_STOCKS[filmStock].smallIndex.right ? `right: ${FILM_STOCKS[filmStock].smallIndex.right};` : ''}
            font-size: 10px;
            line-height: 1;
            font-family: Courier, monospace;
            color: ${FILM_STOCKS[filmStock].color};
            z-index: 15;
            text-align: center;
            width: 24px;
            font-weight: bold;
            opacity: 0.9;
          ">
            ▸${frameNumber}<span style="font-size: 8px;">A</span>
          </div>

          <!-- Frame index number (large) -->
          <div style="
            position: absolute;
            pointer-events: none;
            ${FILM_STOCKS[filmStock].largeIndex.bottom ? `bottom: ${FILM_STOCKS[filmStock].largeIndex.bottom};` : ''}
            ${FILM_STOCKS[filmStock].largeIndex.left ? `left: ${FILM_STOCKS[filmStock].largeIndex.left};` : ''}
            ${FILM_STOCKS[filmStock].largeIndex.right ? `right: ${FILM_STOCKS[filmStock].largeIndex.right};` : ''}
            font-size: 13px;
            line-height: 1;
            font-family: Courier, monospace;
            color: ${FILM_STOCKS[filmStock].color};
            z-index: 15;
            text-align: ${FILM_STOCKS[filmStock].largeIndex.right ? 'right' : 'left'};
            font-weight: bold;
            opacity: 0.9;
          ">
            ${frameNumber}
          </div>

          ${
            isHighlighted
              ? `
            <div style="
              position: absolute;
              pointer-events: none;
              left: 0;
              top: 0;
              width: ${FRAME_WIDTH}px;
              height: ${FRAME_HEIGHT}px;
              background-image: url('${baseUrl}${getHighlightImage(isHighlighted.type)}');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              z-index: 20;
            "></div>
          `
              : ''
          }

          ${
            isXMarked
              ? `
            <div style="
              position: absolute;
              pointer-events: none;
              left: 0;
              top: 0;
              width: ${FRAME_WIDTH}px;
              height: ${FRAME_HEIGHT}px;
              background-image: url('${baseUrl}/frame-highlight-x.png');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              z-index: 20;
            "></div>
          `
              : ''
          }
        </div>
      `;
      }
    ).join('');

    return `
      <div style="
        position: relative;
        margin-bottom: 16px;
        overflow: hidden;
        display: flex;
        flex-shrink: 0;
        user-select: none;
        height: ${FRAME_HEIGHT}px;
        width: ${stripWidth}px;
        transform: rotate(${rotation}deg);
        transform-origin: center center;
      ">
        ${framesHTML}
      </div>
    `;
  }).join('');

  // Calculate container dimensions for proper centering
  const baseWidth = maxStripWidth + 32;
  const baseHeight =
    FRAME_HEIGHT * numberOfStrips + (numberOfStrips - 1) * 16 + 32;

  // Calculate the container size needed for the screenshot
  let containerWidth = baseWidth;
  let containerHeight = baseHeight;
  const contentTransform = `rotate(${rotation}deg)`;

  if (rotation !== 0) {
    // Calculate bounding box for any rotation angle
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));

    const rotatedWidth = baseWidth * cos + baseHeight * sin;
    const rotatedHeight = baseWidth * sin + baseHeight * cos;

    const padding = 50;
    containerWidth = Math.ceil(rotatedWidth) + padding;
    containerHeight = Math.ceil(rotatedHeight) + padding;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Contact Sheet</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: black; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div style="
          position: relative;
          background: black;
          width: ${containerWidth}px;
          height: ${containerHeight}px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: relative;
            background: black;
            width: ${baseWidth}px;
            height: ${baseHeight}px;
            min-width: 0;
            padding: 16px;
            transform: ${contentTransform};
            transform-origin: center center;
          ">
            ${stripsHTML}
          </div>
        </div>
      </body>
    </html>
  `;
}

function getHighlightImage(type: 'default' | 'scribble' | 'circle'): string {
  if (type === 'scribble') return '/frame-highlight-scribble.png';
  if (type === 'circle') return '/frame-highlight-circle.png';
  return '/frame-highlight-rectangle.png';
}

function getContactSheetDimensions(imageCount: number, rotation: number = 0) {
  const numberOfStrips = Math.ceil(imageCount / 6);
  const maxFramesPerStrip = Math.min(6, imageCount);
  const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;

  const baseWidth = maxStripWidth + 32;
  const baseHeight =
    MEASUREMENTS.frameHeight * numberOfStrips + (numberOfStrips - 1) * 16 + 32;

  // Calculate bounding box for any rotation angle
  if (rotation === 0) {
    return {
      x: 0,
      y: 0,
      width: baseWidth,
      height: baseHeight,
    };
  }

  // Convert rotation to radians
  const radians = (rotation * Math.PI) / 180;

  // Calculate the bounding box of the rotated rectangle
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  const rotatedWidth = baseWidth * cos + baseHeight * sin;
  const rotatedHeight = baseWidth * sin + baseHeight * cos;

  // Add padding to ensure no cropping
  const padding = 50;

  return {
    x: 0,
    y: 0,
    width: Math.ceil(rotatedWidth) + padding,
    height: Math.ceil(rotatedHeight) + padding,
  };
}
