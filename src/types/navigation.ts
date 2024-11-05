// src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/core';
import { BottomTabNavigationProp as RNBottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export interface DetectedIngredient {
  id: string;
  lang?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Home: {
    screen?: 'Scan' | 'Ingredients' | 'Settings';
  };
  ProductInfo: {
    productInfo: any; // Replace 'any' with the actual type if you have one
    detectedIngredients: DetectedIngredient[];
    ingredientsList: string[];
  };
};

export type BottomTabParamList = {
  Scan: undefined;
  Ingredients: undefined;
  Settings: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type BottomTabNavigationProp = RNBottomTabNavigationProp<BottomTabParamList>;
export type ProductInfoScreenRouteProp = RouteProp<RootStackParamList, 'ProductInfo'>;