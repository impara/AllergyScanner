declare module 'react-native-reanimated' {
  import { ViewStyle, View } from 'react-native';

  export function createAnimatedComponent<T extends React.ComponentType<any>>(
    component: T
  ): React.ComponentType<AnimateProps<React.ComponentPropsWithoutRef<T>>>;

  export interface AnimateProps<T> extends T {
    entering?: any;
    exiting?: any;
  }

  declare module 'react-native-reanimated' {
    export * from 'react-native-reanimated/lib/typescript/Animated';
  }

  export const FadeIn: any;
  export const FadeInDown: any;
  export const ZoomIn: any;
  export const FadeInRight: any;
  export const FadeInLeft: any;
  export const FadeInUp: any;

  export default {
    View: typeof View,
    createAnimatedComponent,
  };
}