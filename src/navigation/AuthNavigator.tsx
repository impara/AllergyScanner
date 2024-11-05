// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/auth/AuthScreen';

type AuthStackParamList = {
  Auth: undefined;
  // Add other auth-related screens here if needed
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const commonScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: 'white' },
};

const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator screenOptions={commonScreenOptions}>
      <AuthStack.Screen name="Auth" component={AuthScreen} />
      {/* Add other auth-related screens here */}
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
