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
import { View, ActivityIndicator, Platform } from 'react-native';
import { initializeFirebase } from './src/config/firebase';
import { LogBox } from 'react-native';

// Import AdService based on platform
import { adService } from './src/services/ads';

// Ignore specific warnings (optional)
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

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Firebase first
        await initializeFirebase();

        // Initialize Ads if not on web, but don't wait for it
        if (Platform.OS !== 'web') {
          adService.initialize().catch(error => {
            // Log the error but don't prevent app from loading
            console.warn('Ad initialization failed:', error);
          });
        }

        // Set app as ready even if ads fail
        setAppReady(true);
      } catch (error) {
        console.error('Critical initialization error:', error);
        // You might want to show an error screen here
        setAppReady(true); // Still set app as ready to not block the user
      }
    };

    initializeApp();
  }, []);

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
