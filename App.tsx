// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, DefaultTheme } from 'styled-components/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { theme, colors } from './src/theme';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { View, ActivityIndicator, Platform, Text, StyleSheet } from 'react-native';
import * as firebase from './src/config/firebase';
import { LogBox } from 'react-native';
import { adService } from './src/services/ads';
import { initializeGoogleSignIn } from './src/config/googleSignIn';
import Constants from 'expo-constants';

// Ignore specific warnings
LogBox.ignoreLogs(['Setting a timer for a long period of time']);

// Create a custom theme that extends MD3LightTheme
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    onSurface: colors.text,
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

const App: React.FC = () => {
  const [isAppReady, setAppReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First initialize Firebase and Google Sign-In
        await Promise.all([
          firebase.initializeFirebase(),
          initializeGoogleSignIn(),
        ]);
        console.log('Firebase and Google Sign-In initialized');

        // Then initialize AdMob with more detailed logging
        if (Platform.OS !== 'web') {
          const adMobConfig = {
            appId: Platform.select({
              android: Constants.expoConfig?.extra?.ADMOB_ANDROID_APP_ID,
              ios: Constants.expoConfig?.extra?.ADMOB_IOS_APP_ID,
            }),
            rewardedId: Platform.select({
              android: Constants.expoConfig?.extra?.ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
              ios: Constants.expoConfig?.extra?.ADMOB_IOS_REWARDED_AD_UNIT_ID,
            }),
          };

          console.log('Initializing AdMob...', {
            appId: adMobConfig.appId,
            hasRewardedId: !!adMobConfig.rewardedId,
          });
          
          const adInitResult = await adService.initialize();
          console.log('AdMob initialization result:', adInitResult);
        }

        setAppReady(true);
      } catch (error) {
        console.error('Critical initialization error:', error);
        setError(error as Error);
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider theme={theme}>
          <LanguageProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});

export default App;
