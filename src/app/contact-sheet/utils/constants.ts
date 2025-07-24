export const MEASUREMENTS = {
  frameHeight: 175,
  frameWidth: 188,
  imageWidth: 180,
  imageHeight: 120,
};

// Film stock types and configurations
export type FilmStock =
  | 'ilford-hp5'
  | 'kodak-portra-400'
  | 'ilford-xp2'
  | 'kodak-ultramax-400'
  | 'kodak-gold-200';

export interface FilmStockConfig {
  id: FilmStock;
  name: string;
}

export const FILM_STOCKS: Record<FilmStock, FilmStockConfig> = {
  'ilford-hp5': {
    id: 'ilford-hp5',
    name: 'Ilford HP5',
  },
  'ilford-xp2': {
    id: 'ilford-xp2',
    name: 'Ilford XP2',
  },
  'kodak-portra-400': {
    id: 'kodak-portra-400',
    name: 'Kodak Portra 400',
  },
  'kodak-ultramax-400': {
    id: 'kodak-ultramax-400',
    name: 'Kodak Ultramax 400',
  },
  'kodak-gold-200': {
    id: 'kodak-gold-200',
    name: 'Kodak Gold 200',
  },
};

// New object-based state management types
export interface Frame {
  src: string;
  highlights: {
    rectangle: boolean;
    circle: boolean;
    scribble: boolean;
    cross: boolean;
  };
  uploadedAt?: number;
}

export type StickerType = 'twin-check' | 'dot';

export interface Sticker {
  type: StickerType;
  top: number;
  left: number;
}

export interface StickerConfig {
  id: StickerType;
  name: string;
  image: string;
  width: number;
  height: number;
  transform?: string;
  defaultTop: number;
  defaultLeft: number;
}

export const STICKER_CONFIGS: Record<StickerType, StickerConfig> = {
  'twin-check': {
    id: 'twin-check',
    name: 'Twin Check',
    image: '/sticker-twin-check.png',
    width: 51,
    height: 26,
    transform: 'rotate(90deg)',
    defaultTop: MEASUREMENTS.frameHeight / 2,
    defaultLeft: 0,
  },
  dot: {
    id: 'dot',
    name: 'Dot',
    image: '/sticker-dot.png',
    width: 26,
    height: 26,
    defaultTop: MEASUREMENTS.frameHeight / 2,
    defaultLeft: MEASUREMENTS.frameWidth / 2,
  },
};

export interface ContactSheetState {
  frames: Record<string, Frame>;
  frameOrder: string[];
}

// Legacy format types for backward compatibility
export interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}
