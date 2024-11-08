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
        // Run Firebase and Google Sign-In initialization in parallel
        await Promise.all([
          firebase.initializeFirebase(),
          initializeGoogleSignIn(),
        ]);

        // Remove the artificial delay for ads initialization
        if (Platform.OS !== 'web') {
          // Remove the setTimeout
          await adsWrapper.initialize();
          await adService.initialize();
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
    // Render a loading screen or splash screen
    return null;
  }

  if (error) {
    // Render an error screen or message
    return null;
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
