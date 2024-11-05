import 'styled-components/native';

declare module 'styled-components/native' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      error: string;
      success: string;
    };
    typography: {
      fontFamily: string;
      fontSize: {
        small: number;
        medium: number;
        large: number;
        extraLarge: number;
      };
    };
    spacing: {
      small: number;
      medium: number;
      large: number;
    };
  }
}