import { useMemo } from 'react';
import { checkContrast, getContrastColor } from '../utils/accessibility';

export const useContrastCheck = (foreground: string, background: string, isLargeText = false) => {
  return useMemo(() => {
    const contrastResult = checkContrast(foreground, background, isLargeText);
    
    return {
      ...contrastResult,
      suggestedColor: contrastResult.isValid 
        ? foreground 
        : getContrastColor(background),
    };
  }, [foreground, background, isLargeText]); 
}