import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const updateReducedMotion = (isReduced: boolean) => {
      setPrefersReducedMotion(isReduced);
    };

    AccessibilityInfo.isReduceMotionEnabled().then(updateReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      updateReducedMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return prefersReducedMotion;
};