// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppStackNavigator from './AppStackNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? (
          <AppStackNavigator />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
