import { MD3Theme as PaperTheme } from 'react-native-paper';
import { TextStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Shadows } from '../theme/shadows';

// Typography types
export interface Typography {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  h6: TextStyle;
  subtitle1: TextStyle;
  subtitle2: TextStyle;
  body: TextStyle;
  body1: TextStyle;
  body2: TextStyle;
  button: TextStyle;
  caption: TextStyle;
  overline: TextStyle;
}

// Theme interfaces
export interface CustomTheme extends Omit<PaperTheme, 'colors' | 'animation'> {
  colors: Colors & {
    ripple?: string;
    brightLemon?: string;
    coolGray: string;
    lightGray: string;
    surface: string;
    background: string;
    text: string;
    textSecondary: string;
    primary: string;
    error: string;
    warning: string;
    success: string;
    divider: string;
    shadow: string;
    border: string;
  };
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  roundness: number;
  animation: {
    scale: number;
    defaultAnimationDuration?: number;
  };
}

// Only keep styled-components declaration here
declare module 'styled-components/native' {
  export interface DefaultTheme extends CustomTheme {}
} 