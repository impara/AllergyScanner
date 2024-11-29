// src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BaseProduct } from './product';
import { CustomTheme } from './theme';
import { RouteProp } from '@react-navigation/native';

export interface NavigationScreenProps {
  theme?: CustomTheme;
}

export interface DetectedIngredient {
  id: string;
  lang?: string;
  name?: string;
  category?: string;
  isAdditive?: boolean;
  eNumber?: string;
  selected?: boolean;
  categories?: string[];
  matchType?: 'exact' | 'label' | 'synonym' | 'parent' | 'child';
  matchScore?: number;
}

export interface IngredientData {
  selected: boolean;
  name: string;
  lang?: string;
  category?: string;
}

export interface IngredientMatch {
  ingredientId: string;
  matchedTerm: string;
  score: number;
  matchType: 'exact' | 'label' | 'synonym' | 'parent' | 'child';
  language: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Home: {
    screen?: 'Scan' | 'Ingredients' | 'Settings';
    params?: {
      showTutorial?: boolean;
    };
  };
  ProductInfo: {
    productInfo: BaseProduct;
    detectedIngredients: DetectedIngredient[];
    ingredientsList?: string[];
    presentation?: 'modal';
    source?: 'scan' | 'search';
  };
  IngredientsProfile: {
    ingredientId: string;
    category?: string;
    name?: string;
    source?: 'scan' | 'search';
  };
};

export type BottomTabParamList = {
  Scan: undefined;
  Ingredients: undefined;
  Settings: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<BottomTabParamList>;
export type ProductInfoScreenRouteProp = RouteProp<RootStackParamList, 'ProductInfo'>;