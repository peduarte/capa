'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { HighlightType } from '../utils/constants';

interface FramePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface FrameHighlight {
  position: FramePosition;
  type: HighlightType;
}

interface ContactSheetContextType {
  // Highlights state - now storing positions directly
  frameHighlights: Map<number, FrameHighlight>;
  xMarkedFrames: Map<number, FramePosition>;
  setFrameHighlight: (
    frameNumber: number,
    position: FramePosition,
    type: HighlightType
  ) => void;
  setXMark: (frameNumber: number, position: FramePosition) => void;
  clearFrameHighlight: (frameNumber: number) => void;
  clearXMark: (frameNumber: number) => void;
  clearAllHighlights: () => void;

  // Contact sheet ref for downloads
  contactSheetRef: React.RefObject<HTMLDivElement | null>;
}

const ContactSheetContext = createContext<ContactSheetContextType | null>(null);

interface ContactSheetProviderProps {
  children: ReactNode;
}

export const ContactSheetProvider = ({
  children,
}: ContactSheetProviderProps) => {
  const [frameHighlights, setFrameHighlights] = useState<
    Map<number, FrameHighlight>
  >(new Map());
  const [xMarkedFrames, setXMarkedFrames] = useState<
    Map<number, FramePosition>
  >(new Map());
  const contactSheetRef = useRef<HTMLDivElement>(null);

  const setFrameHighlight = useCallback(
    (frameNumber: number, position: FramePosition, type: HighlightType) => {
      setFrameHighlights(prev => {
        const newMap = new Map(prev);
        newMap.set(frameNumber, { position, type });
        return newMap;
      });
    },
    []
  );

  const setXMark = useCallback(
    (frameNumber: number, position: FramePosition) => {
      setXMarkedFrames(prev => {
        const newMap = new Map(prev);
        newMap.set(frameNumber, position);
        return newMap;
      });
    },
    []
  );

  const clearFrameHighlight = useCallback((frameNumber: number) => {
    setFrameHighlights(prev => {
      const newMap = new Map(prev);
      newMap.delete(frameNumber);
      return newMap;
    });
  }, []);

  const clearXMark = useCallback((frameNumber: number) => {
    setXMarkedFrames(prev => {
      const newMap = new Map(prev);
      newMap.delete(frameNumber);
      return newMap;
    });
  }, []);

  const clearAllHighlights = useCallback(() => {
    setFrameHighlights(new Map());
    setXMarkedFrames(new Map());
  }, []);

  return (
    <ContactSheetContext.Provider
      value={{
        frameHighlights,
        xMarkedFrames,
        setFrameHighlight,
        setXMark,
        clearFrameHighlight,
        clearXMark,
        clearAllHighlights,
        contactSheetRef,
      }}
    >
      {children}
    </ContactSheetContext.Provider>
  );
};

export const useContactSheet = () => {
  const context = useContext(ContactSheetContext);
  if (!context) {
    throw new Error(
      'useContactSheet must be used within a ContactSheetProvider'
    );
  }
  return context;
};
