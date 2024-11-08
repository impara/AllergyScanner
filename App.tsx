// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'styled-components/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { theme, colors } from './src/theme';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import * as firebase from './src/config/firebase';
import { LogBox } from 'react-native';
import { adService } from './src/services/ads';
import { initializeGoogleSignIn } from './src/config/googleSignIn';
import adsWrapper from './src/services/adsWrapper';

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
        // Initialize Firebase first
        await firebase.initializeFirebase();
        console.log('Firebase initialized successfully.');

        // Initialize Google Sign-In
        initializeGoogleSignIn();
        console.log('Google Sign-In initialized successfully.');

        // Set app as ready
        setAppReady(true);

        // Initialize Ads with proper timing
        if (Platform.OS !== 'web') {
          // Longer delay for ad initialization
          await new Promise(resolve => setTimeout(resolve, 3000));
          try {
            // First initialize the wrapper
            await adsWrapper.initialize();
            // Then initialize the service
            await adService.initialize();
          } catch (error) {
            console.warn('Ad initialization failed:', error);
          }
        }
      } catch (error) {
        console.error('Critical initialization error:', error);
        setError(error as Error);
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
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

export default App;
