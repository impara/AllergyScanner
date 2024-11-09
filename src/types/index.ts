// Base exports
export * from './theme';
export * from './navigation';
export * from './product';
export * from './environment';
export * from './ads';

// Theme types
export type { 
  CustomTheme,
  Typography 
} from './theme';

// Navigation types
export type {
  RootStackParamList,
  BottomTabParamList,
  DetectedIngredient,
  ProductInfoScreenRouteProp,
  NavigationScreenProps
} from './navigation';

// Product types
export type {
  ProductInfo,
  AlternateProductInfo,
  BaseProduct,
  Nutriments
} from './product';