export const colors = {
  // Base colors
  primary: '#9CAC3C',
  secondary: '#2ecc71',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666', // Added for secondary text
  divider: '#e0e0e0',
  success: '#27ae60',
  warning: '#e67e22',
  error: '#e74c3c',
  coolGray: '#95a5a6',
  shadow: '#000000', // Added for shadows

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
  placeholder: '#A0A0A0',
} as const;

export const theme = {
  colors: colors,
  primary: colors.primary, // Added this property
  secondary: colors.secondary,
  background: colors.background,
  surface: colors.surface,
  accent: colors.accent,
  error: colors.error,
  text: colors.text,
  onSurface: colors.text,
  disabled: colors.coolGray,
  placeholder: colors.placeholder,
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: colors.brightLemon,
};

export type Colors = typeof colors;
export type Theme = typeof theme;
