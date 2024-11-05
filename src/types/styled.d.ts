import 'styled-components/native';

declare module 'styled-components/native' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      success: string;
      error: string;
    };
    typography: {
      fontFamily: string;
      fontSize: {
        small: number;
        medium: number;
        large: number;
        extraLarge: number;
      };
      fontWeight: {
        normal: string;
        bold: string;
      };
    };
    spacing: {
      small: number;
      medium: number;
      large: number;
    };
  }
}

declare module '@react-navigation/native' {
  export const DefaultTheme: Theme;
  export const DarkTheme: Theme;
}