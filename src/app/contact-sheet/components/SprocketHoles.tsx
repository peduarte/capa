import {
  MEASUREMENTS,
  STRIP_PADDING,
  sprocketSpacing,
  sprocketStyle,
} from '../utils/constants';

interface SprocketHolesProps {
  frameCount: number;
}

export const SprocketHoles = ({ frameCount }: SprocketHolesProps) => {
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
