export const MEASUREMENTS = {
  frameHeight: 175,
  frameWidth: 188,
  imageWidth: 180,
  imageHeight: 120,
};

export const getStripRotation = (stripIndex: number) => {
  const seed = stripIndex * 123.456;
  return Math.sin(seed) * 0.5;
};

export type HighlightType = 'default' | 'scribble' | 'circle';
