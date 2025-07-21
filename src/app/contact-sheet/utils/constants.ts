// Film measurements (mm) scaled to 175px negative height
const SCALE = 175 / 35; // 5px per mm
export const STRIP_PADDING = 8; // px
export const FRAME_GAP = 8; // px

export const MEASUREMENTS = {
  negativeHeight: 175,
  frameWidth: 36 * SCALE,
  frameHeight: 24 * SCALE,
  sprocketWidth: 1.85 * SCALE,
  sprocketHeight: 2.79 * SCALE,
  frameToSprocketGap: 0.5 * SCALE,
};

// Calculate uniform sprocket spacing
export const sprocketSpacing = (MEASUREMENTS.frameWidth + FRAME_GAP) / 8;

// Consistent rotation generator based on strip index
export const getStripRotation = (stripIndex: number) => {
  // Use stripIndex as seed for consistent rotation
  const seed = stripIndex * 123.456;
  return Math.sin(seed) * 0.5 * 1; // Small rotation between -0.5 and 0.5 degrees
};

// Common sprocket styles
export const sprocketStyle = {
  position: 'absolute' as const,
  backgroundColor: 'black',
  borderRadius: `${MEASUREMENTS.sprocketWidth}px / 25%`,
  boxShadow:
    'inset -1px 0px 0px 0px rgba(255, 255, 255, 0.1), -1px 0px 0px 0px rgba(255, 255, 255, 0.1)',
  width: MEASUREMENTS.sprocketWidth,
  height: MEASUREMENTS.sprocketHeight,
};

export type HighlightType = 'rectangle' | 'circle';
