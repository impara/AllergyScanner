// src/navigation/AppStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomTheme } from '../types/theme';
import BottomTabNavigator from './BottomTabNavigator';
import ProductInfoScreen from '../screens/main/ProductInfoScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/main/TermsOfServiceScreen';
import IngredientProfileScreen from '../screens/main/IngredientProfileScreen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseProduct } from '../types/product';

export interface DetectedIngredient {
    id: string;
    lang?: string;
}
  
export type AppStackParamList = {
  MainTabs: undefined;
  ProductInfo: {
    productInfo: BaseProduct;
    detectedIngredients: DetectedIngredient[];
    ingredientsList: string[];
    presentation?: 'modal';
    source?: 'scan' | 'search';
  };
  Settings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  IngredientsProfile: {
    ingredientId: string;
    category?: string;
    name?: string;
    source?: 'scan' | 'search';
  };
};

export type ProductInfoScreenProps = NativeStackScreenProps<AppStackParamList, 'ProductInfo'> & {
  theme?: CustomTheme;
};

const AppStack = createNativeStackNavigator<AppStackParamList>();

const AppStackNavigator: React.FC = () => {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
      }}
    >
      <AppStack.Screen name="MainTabs" component={BottomTabNavigator} />
      <AppStack.Screen
        name="ProductInfo"
        component={ProductInfoScreen as React.ComponentType<any>}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
          fullScreenGestureEnabled: true,
        }}
      />
      <AppStack.Screen
        name="IngredientsProfile"
        component={IngredientProfileScreen}
        options={{
          headerShown: true,
          title: 'Ingredient Details',
          headerBackTitle: 'Back',
        }}
      />
      <AppStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <AppStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ 
          title: 'Privacy Policy',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <AppStack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ 
          title: 'Terms of Service',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
    </AppStack.Navigator>
  );
};

export default AppStackNavigator;
