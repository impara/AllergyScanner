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

// Initialize Firebase at app startup
initializeFirebase();

// Define a type for the ad service
interface AdServiceType {
  initialize?: () => Promise<void>;
}

// Import ad service based on platform
const AdService: AdServiceType = Platform.select({
  web: {},
  default: require('./src/services/ads')
});

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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Firebase first
        await initializeFirebase();
        console.log('Firebase initialized successfully');

        // Then initialize AdService
        if (Platform.OS !== 'web' && AdService.initialize) {
          try {
            await AdService.initialize();
            console.log('AdService initialized successfully');
          } catch (error) {
            console.error('AdService initialization failed:', error);
            // Continue with app initialization even if ads fail
          }
        }
      } catch (error) {
        console.error('Error initializing services:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeServices();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
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
