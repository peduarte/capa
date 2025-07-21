import { useContactSheet } from '../context/ContactSheetContext';

export const HighlightOverlay = () => {
  const { frameHighlights, xMarkedFrames } = useContactSheet();

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

        {/* Regular highlights (rectangles and circles) */}
        {Array.from(frameHighlights.entries()).map(
          ([frameNumber, { position, type }]) => {
            // Generate hand-drawn path with slight randomness for each frame
            const jitter = (base: number, variance: number) =>
              base + Math.sin(frameNumber * 123.456 + base * 0.1) * variance;

            if (type === 'circle') {
              // White hand-drawn oval highlight
              const centerX = position.left + position.width / 2;
              const centerY = position.top + position.height / 2;
              const radiusX = position.width / 2 + 15;
              const radiusY = position.height / 2 + 12;

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
              // Red rectangle highlight
              return (
                <path
                  key={frameNumber}
                  d={`M ${jitter(position.left + 8, 3)} ${jitter(position.top + 6, 4)} 
                  Q ${jitter(position.left + 4, 2)} ${jitter(position.top + 8, 3)} ${jitter(position.left + 18, 4)} ${jitter(position.top + 4, 2)}
                  Q ${jitter(position.left + 12 + position.width / 3, 6)} ${jitter(position.top + 4, 2)} ${jitter(position.left + 12 + (position.width * 2) / 3, 6)} ${jitter(position.top + 8, 3)}
                  Q ${jitter(position.left + 12 + position.width - 6, 4)} ${jitter(position.top + 4, 2)} ${jitter(position.left + 12 + position.width + 6, 3)} ${jitter(position.top + 6, 4)}
                  Q ${jitter(position.left + 12 + position.width + 8, 3)} ${jitter(position.top + 12 + position.height / 3, 6)} ${jitter(position.left + 12 + position.width + 6, 3)} ${jitter(position.top + 12 + (position.height * 2) / 3, 6)}
                  Q ${jitter(position.left + 12 + position.width + 8, 3)} ${jitter(position.top + 12 + position.height - 6, 4)} ${jitter(position.left + 12 + position.width + 6, 3)} ${jitter(position.top + 12 + position.height + 6, 3)}
                  Q ${jitter(position.left + 12 + (position.width * 2) / 3, 6)} ${jitter(position.top + 12 + position.height + 8, 3)} ${jitter(position.left + 12 + position.width / 3, 6)} ${jitter(position.top + 12 + position.height + 6, 3)}
                  Q ${jitter(position.left + 18, 4)} ${jitter(position.top + 12 + position.height + 8, 3)} ${jitter(position.left + 4, 2)} ${jitter(position.top + 12 + position.height + 6, 3)}
                  Q ${jitter(position.left + 2, 2)} ${jitter(position.top + 12 + (position.height * 2) / 3, 6)} ${jitter(position.left + 4, 2)} ${jitter(position.top + 12 + position.height / 3, 6)}
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
        {Array.from(xMarkedFrames.entries()).map(([frameNumber, position]) => {
          const jitter = (base: number, variance: number) =>
            base + Math.sin(frameNumber * 123.456 + base * 0.1) * variance;

          // Red hand-drawn X highlight
          const centerX = position.left + position.width / 2;
          const centerY = position.top + position.height / 2;
          const size = Math.min(position.width, position.height) * 0.6; // X size relative to frame

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
