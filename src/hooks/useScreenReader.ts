import { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useScreenReader = () => {
  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  return { announce };
}; 