import { DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { Theme as NavigationTheme } from '@react-navigation/native/lib/typescript/src/types';
import { colors } from './colors';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

// Define a custom theme that extends both Paper and Navigation themes
export const theme: NavigationTheme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.divider,
    notification: colors.brightLemon,
  },
};

export { colors } from './colors';
export { shadows } from './shadows';
export { spacing } from './spacing';
export { typography } from './typography';