// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState, useContext } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, DefaultTheme } from 'styled-components/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { theme, colors } from './src/theme';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { View, ActivityIndicator, Platform, Text, StyleSheet } from 'react-native';
import * as firebase from './src/config/firebase';
import { LogBox } from 'react-native';
import { adService } from './src/services/ads';
import { initializeGoogleSignIn } from './src/config/googleSignIn';
import Constants from 'expo-constants';
import LanguageSelectionModal from './src/components/LanguageSelectionModal';

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
        // Initialize Firebase first with retries
        await firebase.initializeFirebase();
        
        // Only proceed with Google Sign-In after Firebase is ready
        if (firebase.isFirebaseInitialized()) {
          await initializeGoogleSignIn();
          console.log('Firebase and Google Sign-In initialized successfully');
        } else {
          throw new Error('Firebase initialization check failed');
        }

        // Initialize AdMob only after Firebase and Google Sign-In are ready
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

          if (!adMobConfig.appId) {
            throw new Error('AdMob App ID not configured');
          }

          console.log('Initializing AdMob...', {
            appId: adMobConfig.appId,
            hasRewardedId: !!adMobConfig.rewardedId,
          });
          
          // Add retry logic for AdMob initialization
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const adInitResult = await adService.initialize();
              console.log('AdMob initialization result:', adInitResult);
              
              // Since adInitResult is a boolean, we check it directly
              if (adInitResult) {
                break;
              }
              throw new Error('AdMob initialization incomplete, do you use an adblocker?');
            } catch (error) {
              retryCount++;
              console.warn(`AdMob initialization attempt ${retryCount} failed:`, error);
              if (retryCount === maxRetries) {
                throw error;
              }
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        setAppReady(true);
      } catch (error) {
        console.error('Critical initialization error:', error);
        // Log additional error details for debugging
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
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
          <AuthProvider>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

// Create a new component to handle the content that needs both contexts
const AppContent: React.FC = () => {
  const { showLanguageSelection, setShowLanguageSelection } = useContext(AuthContext);
  
  return (
    <>
      <AppNavigator />
      <LanguageSelectionModal
        visible={showLanguageSelection}
        onDismiss={() => setShowLanguageSelection(false)}
      />
    </>
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
