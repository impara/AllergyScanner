import { Theme as NavigationTheme } from '@react-navigation/native';
import { Colors } from '../theme/colors';

export interface NavigationColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
  textSecondary: string;
  divider: string;
  shadow: string;
  coolGray: string;
  lightGray: string;
}

export interface CustomNavigationTheme {
  dark: boolean;
  colors: NavigationColors;
  roundness?: number;
}

declare module '@react-navigation/native' {
  export interface Theme extends CustomNavigationTheme {}
} 