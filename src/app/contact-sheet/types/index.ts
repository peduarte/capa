export type HighlightType = 'rectangle' | 'circle';

export interface ContactSheetProps {
  images: string[];
  selectedFrames?: Map<number, HighlightType>;
  xMarkedFrames?: Set<number>;
  onFrameClick?: (frameNumber: number, event: React.MouseEvent) => void;
  className?: string;
}

export interface NegativeStripProps {
  images: string[];
  startIndex: number;
  onFrameClick?: (frameNumber: number, event: React.MouseEvent) => void;
  stripRef?: React.RefObject<HTMLDivElement>;
}

export interface HighlightOverlayProps {
  images: string[];
  selectedFrames: Map<number, HighlightType>;
  xMarkedFrames: Set<number>;
  stripRefs: React.RefObject<HTMLDivElement | null>[];
}

export interface SprocketHolesProps {
  frameCount: number;
}
