import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { MEASUREMENTS } from '../../contact-sheet/utils/constants';

// Types for the request payload
interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}

interface ContactSheetRequest {
  images: string[];
  highlights?: FrameHighlight[];
  xMarks?: number[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    const body: ContactSheetRequest = await request.json();
    const { images, highlights = [], xMarks = [] } = body;

    console.log(
      'Received images:',
      images.length,
      'highlights:',
      highlights.length,
      'xMarks:',
      xMarks.length
    );

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
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security', // Allow cross-origin images
        '--allow-running-insecure-content',
      ],
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
      baseUrl
    );
    console.log('HTML generated, length:', html.length);
    
    // Debug: log highlights info and sample HTML when highlights exist
    if (highlights.length > 0) {
      console.log('Highlights detected:', highlights);
      console.log('Sample HTML snippet:', html.substring(0, 1000));
    }

    // Set the page content and wait for images to load
    console.log('Setting page content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });

    console.log('Waiting for images to load...');
    // Wait for all images to be loaded
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.addEventListener('load', () => resolve(undefined));
            img.addEventListener('error', () => resolve(undefined));
          });
        })
      );
    });

    // Get the dimensions of the contact sheet
    const dimensions = getContactSheetDimensions(images.length);
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
  baseUrl: string
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
                src="${imagePath.startsWith('data:') ? imagePath : `${baseUrl}/hp5/${imagePath}`}"
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
              />
            </div>
          `
              : ''
          }
          
          <!-- Ilford title overlay -->
          <div style="
            position: absolute;
            pointer-events: none;
            top: 0;
            left: 0;
            width: 188px;
            height: 11px;
            background-image: url('${baseUrl}/ilford-title.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 10;
          "></div>

          <!-- Ilford footer overlay -->
          <div style="
            position: absolute;
            pointer-events: none;
            bottom: 0;
            left: 0;
            width: 188px;
            height: 11px;
            background-image: url('${baseUrl}/ilford-footer.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 10;
          "></div>

          <!-- Frame index number (left) -->
          <div style="
            position: absolute;
            pointer-events: none;
            bottom: 0px;
            left: 74px;
            font-size: 10px;
            line-height: 1;
            font-family: Courier, monospace;
            color: white;
            z-index: 15;
            text-align: center;
            width: 24px;
            font-weight: bold;
            opacity: 0.9;
          ">
            ▸${frameNumber}<span style="font-size: 8px;">A</span>
          </div>

          <!-- Frame index number (right) -->
          <div style="
            position: absolute;
            pointer-events: none;
            right: 0px;
            bottom: 0px;
            font-size: 13px;
            line-height: 1;
            font-family: Courier, monospace;
            color: white;
            z-index: 15;
            text-align: right;
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
          width: ${maxStripWidth + 32}px;
          height: ${FRAME_HEIGHT * numberOfStrips + (numberOfStrips - 1) * 16 + 32}px;
          min-width: 0;
          padding: 16px;
        ">
          ${stripsHTML}
        </div>
      </body>
    </html>
  `;
}

function getHighlightImage(type: 'default' | 'scribble' | 'circle'): string {
  if (type === 'scribble') return '/frame-highlight-scribble.png';
  if (type === 'circle') return '/frame-highlight-circle.png';
  return '/frame-highlight-select.png';
}

function getContactSheetDimensions(imageCount: number) {
  const numberOfStrips = Math.ceil(imageCount / 6);
  const maxFramesPerStrip = Math.min(6, imageCount);
  const maxStripWidth = maxFramesPerStrip * MEASUREMENTS.frameWidth;

  return {
    x: 0,
    y: 0,
    width: maxStripWidth + 32,
    height:
      MEASUREMENTS.frameHeight * numberOfStrips +
      (numberOfStrips - 1) * 16 +
      32,
  };
}
