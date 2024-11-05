// src/navigation/AppStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import ProductInfoScreen from '../screens/main/ProductInfoScreen';

export interface DetectedIngredient {
    id: string;
    lang?: string;
}
  
type AppStackParamList = {
  MainTabs: undefined;
  ProductInfo: {
    productInfo: any; // This would contain the nutriments data
    detectedIngredients: DetectedIngredient[];
    ingredientsList: string[];
  };
};

const commonScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: 'white' },
};

const AppStack = createNativeStackNavigator<AppStackParamList>();

const AppStackNavigator: React.FC = () => {
  return (
    <AppStack.Navigator screenOptions={commonScreenOptions}>
      <AppStack.Screen name="MainTabs" component={BottomTabNavigator} />
      <AppStack.Screen
        name="ProductInfo"
        component={ProductInfoScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
          fullScreenGestureEnabled: true,
        }}
      />
    </AppStack.Navigator>
  );
};

export default AppStackNavigator;
