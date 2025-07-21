import React from 'react';
import { NegativeStrip } from './NegativeStrip';
import { HighlightOverlay } from './HighlightOverlay';
import useIsSafari from '../hooks/useIsSafari';

interface ContactSheetProps {
  images: string[];
  showHighlights?: boolean;
  onFrameClick?: (frameNumber: number, event: React.MouseEvent) => void;
  className?: string;
}

export const ContactSheet = React.memo(
  ({
    images,
    showHighlights = false,
    onFrameClick,
    className,
  }: ContactSheetProps) => {
    const isSafari = useIsSafari();
    return (
      <div
        className={`w-fit mx-auto relative ${className || ''}`}
        data-contact-sheet
      >
        {Array.from({ length: Math.ceil(images.length / 6) }, (_, i) => (
          <NegativeStrip
            key={`strip-${i}`}
            images={images}
            startIndex={i * 6}
            onFrameClick={onFrameClick}
            isSafari={isSafari}
          />
        ))}
        {showHighlights && <HighlightOverlay />}
      </div>
    );
  }
);

ContactSheet.displayName = 'ContactSheet';
