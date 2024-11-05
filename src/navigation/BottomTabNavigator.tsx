// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Text } from 'react-native';
import i18n from '../localization/i18n';
import { ScanLimitProvider } from '../context/ScanLimitContext';

import ScanScreen from '../screens/main/ScanScreen';
import IngredientProfileScreen from '../screens/main/IngredientProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();

// Create a wrapper component for ScanScreen
const ScanScreenWrapper = (props: any) => (
  <ScanLimitProvider>
    <ScanScreen {...props} />
  </ScanLimitProvider>
);

const BottomTabNavigator = ({ initialRouteName = 'Ingredients' }) => {
  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.coolGray,
        tabBarStyle: {
          backgroundColor: colors.background,
          height: 80,
          paddingBottom: 20,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 5,
        },
      }}
    >
      <Tab.Screen
        name="Scan"
        component={ScanScreenWrapper} // Use the wrapper component instead of inline function
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color }}>{i18n.t('navigation.scan')}</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="barcode-scan" color={color} size={size + 6} />
          ),
        }}
      />
      <Tab.Screen
        name="Ingredients"
        component={IngredientProfileScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color }}>{i18n.t('navigation.ingredients')}</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food-apple" color={color} size={size + 6} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color }}>{i18n.t('navigation.settings')}</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size + 6} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
