import { colors } from '../theme';

// Helper function to calculate relative luminance
const getLuminance = (hexColor: string): number => {
  try {
    // Handle rgba colors
    if (hexColor.includes('rgba')) {
      return 0.05; // Default to dark for transparent backgrounds
    }
    
    // Remove # if present
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch (error) {
    console.warn('Invalid color format:', hexColor);
    return 0.05; // Default to dark
  }
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
};

export interface ContrastCheckResult {
  isValid: boolean;
  ratio: number;
  requiredRatio: number;
  message: string;
}

export const checkContrast = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): ContrastCheckResult => {
  try {
    const ratio = getContrastRatio(foreground, background);
    const requiredRatio = isLargeText ? 3 : 4.5;
    const isValid = ratio >= requiredRatio;

    return {
      isValid,
      ratio,
      requiredRatio,
      message: isValid
        ? `Contrast ratio ${ratio.toFixed(2)}:1 meets WCAG AA standards`
        : `Warning: Contrast ratio ${ratio.toFixed(2)}:1 does not meet WCAG AA minimum of ${requiredRatio}:1`
    };
  } catch (error) {
    console.warn('Error checking contrast:', error);
    return {
      isValid: false,
      ratio: 1,
      requiredRatio: isLargeText ? 3 : 4.5,
      message: 'Error calculating contrast ratio'
    };
  }
};

export const getContrastColor = (backgroundColor: string): string => {
  // For transparent backgrounds, return dark text
  if (backgroundColor.includes('rgba')) {
    return colors.textOnLight;
  }
  
  const ratio = getContrastRatio(colors.textOnLight, backgroundColor);
  return ratio >= 4.5 ? colors.textOnLight : colors.textOnDark;
};

export const getAccessibleFontSize = (size: number): number => {
  return Math.max(size, 16); // Ensure minimum readable size
};

export const getAccessibleColor = (foreground: string, background: string): string => {
  const contrastResult = checkContrast(foreground, background);
  return contrastResult.isValid ? foreground : colors.highContrastText;
}; 