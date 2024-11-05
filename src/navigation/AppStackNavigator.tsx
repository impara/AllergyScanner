// src/navigation/AppStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import ProductInfoScreen from '../screens/main/ProductInfoScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/main/TermsOfServiceScreen';

export interface DetectedIngredient {
    id: string;
    lang?: string;
}
  
export type AppStackParamList = {
  MainTabs: undefined;
  ProductInfo: {
    productInfo: any; // This would contain the nutriments data
    detectedIngredients: DetectedIngredient[];
    ingredientsList: string[];
  };
  Settings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

const AppStack = createNativeStackNavigator<AppStackParamList>();

const AppStackNavigator: React.FC = () => {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false, // Hide header for all screens by default
        contentStyle: { backgroundColor: 'white' },
      }}
    >
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
      <AppStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }} // Header remains hidden
      />
      <AppStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ 
          title: 'Privacy Policy',
          headerShown: true, // Show header for PrivacyPolicyScreen
          headerBackTitle: 'Back', // Optional: Customize back button title
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
