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
  | 'kodak-ultramax-400';

export interface FilmStockConfig {
  id: FilmStock;
  name: string;
  titleImage: string;
  footerImage: string;
  color: string;
  smallIndex: {
    bottom: string;
    left?: string;
    right?: string;
  };
  largeIndex: {
    bottom: string;
    left?: string;
    right?: string;
  };
}

export const FILM_STOCKS: Record<FilmStock, FilmStockConfig> = {
  'ilford-hp5': {
    id: 'ilford-hp5',
    name: 'Ilford HP5',
    titleImage: '/ihp5-title.png',
    footerImage: '/ihp5-footer.png',
    color: 'white',
    smallIndex: {
      bottom: '0px',
      left: '74px',
    },
    largeIndex: {
      right: '0px',
      bottom: '0px',
    },
  },
  'ilford-xp2': {
    id: 'ilford-xp2',
    name: 'Ilford XP2',
    titleImage: '/ixp2-title.png',
    footerImage: '/ixp2-footer.png',
    color: 'white',
    smallIndex: {
      bottom: '0px',
      left: '74px',
    },
    largeIndex: {
      right: '0px',
      bottom: '0px',
    },
  },
  'kodak-portra-400': {
    id: 'kodak-portra-400',
    name: 'Kodak Portra 400',
    titleImage: '/kp400-title.png',
    footerImage: '/kp400-footer.png',
    color: '#DA7201',
    smallIndex: {
      bottom: '0px',
      left: '90px',
    },
    largeIndex: {
      left: '4px',
      bottom: '0px',
    },
  },
  'kodak-ultramax-400': {
    id: 'kodak-ultramax-400',
    name: 'Kodak Ultramax 400',
    titleImage: '/kum400-title.png',
    footerImage: '/kum400-footer.png',
    color: '#DA7201',
    smallIndex: {
      bottom: '0px',
      left: '90px',
    },
    largeIndex: {
      left: '4px',
      bottom: '0px',
    },
  },
};

export const DEFAULT_FILM_STOCK: FilmStock = 'ilford-hp5';
