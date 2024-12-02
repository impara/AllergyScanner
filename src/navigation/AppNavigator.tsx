// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import AuthNavigator from './AuthNavigator';
import AppStackNavigator from './AppStackNavigator';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
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

  return isAuthenticated ? <AppStackNavigator /> : <AuthNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
