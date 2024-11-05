import { Theme as PaperTheme } from 'react-native-paper';
import { Theme as NavigationTheme } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Shadows } from '../theme/shadows';

export interface CustomTheme extends PaperTheme {
  colors: Colors;
  typography: {
    [key: string]: import('react-native').TextStyle;
  };
  spacing: Spacing;
  shadows: Shadows;
}

export interface CustomNavigationTheme extends NavigationTheme {
  colors: NavigationTheme['colors'] & Pick<Colors, 'primary' | 'background' | 'text'> & {
    card: string;
  };
}