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
  | 'kodak-ultramax';

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
  'kodak-ultramax': {
    id: 'kodak-ultramax',
    name: 'Kodak Ultramax 400',
  },
};

export const DEFAULT_FILM_STOCK: FilmStock = 'ilford-hp5';

// New object-based state management types
export interface Frame {
  src: string;
  highlights: {
    default: boolean;
    circle: boolean;
    scribble: boolean;
    cross: boolean;
  };
  fileName?: string; // Optional original filename
  uploadedAt?: number; // Optional timestamp
}

export interface ContactSheetState {
  frames: Record<string, Frame>;
  frameOrder: string[];
}

// Legacy format types for backward compatibility
export interface FrameHighlight {
  frameNumber: number;
  type: 'default' | 'scribble' | 'circle';
}
