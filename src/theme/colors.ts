import { getContrastRatio } from '../utils/accessibility';

// First define base colors
const baseColors = {
  // Base colors
  primary: '#9CAC3C',
  secondary: '#2ecc71',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#222222',
  textSecondary: '#545454',
  divider: '#e0e0e0',
  success: '#1a7740',
  warning: '#c44e00',
  error: '#e74c3c',
  coolGray: '#545454',
  shadow: '#000000',

  // Additional colors
  primaryDark: '#217dbb',
  secondaryDark: '#219d58',
  primaryLight: '#85c1e9',
  secondaryLight: '#7dce91',
  accent: '#ff69b4',
  brightLemon: '#f9e547',
  skyBlue: '#87ceeb',
  charcoalGray: '#36454f',
  white: '#FFF',
  lightGray: '#F2F2F7',
  paleGray: '#E5E5EA',
  softBlue: '#6A8CAF',
  mintGreen: '#98FB98',
  ripple: 'rgba(0, 0, 0, 0.1)',
  placeholder: '#666666',
} as const;

// Export the colors object
export const colors = {
  ...baseColors,
  // High contrast colors
  textOnDark: '#FFFFFF',
  textOnLight: '#000000',
  highContrastText: '#000000',
  
  // Semi-transparent backgrounds with better contrast
  overlayBackground: 'rgba(0,0,0,0.95)',
  safeBackgroundColor: `${baseColors.success}50`,
  warningBackgroundColor: `${baseColors.warning}50`,
  
  // Contrast helpers
  contrast: {
    high: '#000000',
    medium: '#454545',
    low: '#666666',
  },
  
  // High contrast backgrounds
  surfaceHighContrast: '#FFFFFF',
  backgroundHighContrast: '#F8F8F8',
  
  // Background opacity levels for better readability
  surfaceOpaque: 'rgba(255, 255, 255, 0.98)',
  backgroundOpaque: 'rgba(245, 245, 245, 0.98)',
  
  // Ensure these have good contrast with text
  surface: '#FFFFFF',
  background: '#F5F5F5',
  
  // Add contrast checking utilities
  getBackgroundColor: (color: string) => {
    const contrastWithLight = getContrastRatio(color, '#FFFFFF');
    const contrastWithDark = getContrastRatio(color, '#F5F5F5');
    return contrastWithLight > contrastWithDark ? '#FFFFFF' : '#F5F5F5';
  }
} as const;

// Export theme separately
export const theme = {
  colors,
  primary: colors.primary,
  // ... (rest of theme properties)
} as const;

export type Colors = typeof colors;
export type Theme = typeof theme;
