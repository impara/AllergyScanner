import 'styled-components/native';
import { Theme } from '../theme';

declare module 'styled-components/native' {
  export interface DefaultTheme extends Theme {
    // Add any additional theme properties here if needed
  }
}

declare module '@react-navigation/native' {
  export const DefaultTheme: Theme;
  export const DarkTheme: Theme;
}