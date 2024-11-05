import { TextStyle } from 'react-native';

export const typography: { [key: string]: TextStyle } = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h6: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle1: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: '500',
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
};

export type Typography = typeof typography;