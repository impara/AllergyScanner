import { DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { colors } from './colors';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';
import { CustomTheme, Typography } from '../types/theme';

// Create a properly typed typography object
const typographyWithStyles: Typography = {
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  h4: typography.h4,
  h5: typography.h5,
  h6: typography.h6,
  subtitle1: typography.subtitle1,
  subtitle2: typography.subtitle2,
  body: typography.body,
  body1: typography.body1,
  body2: typography.body2,
  button: typography.button,
  caption: typography.caption,
  overline: typography.overline,
};

export const theme: CustomTheme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...colors,
    border: colors.divider,
  },
  typography: typographyWithStyles,
  spacing,
  shadows,
  roundness: 4,
  animation: {
    scale: 1,
    defaultAnimationDuration: 200,
  },
};

export { colors, spacing, typography, shadows };