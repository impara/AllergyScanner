// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState, useContext } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'styled-components/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { theme, colors, typography, spacing, shadows } from './src/theme';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { View, ActivityIndicator, Platform, Text, StyleSheet, StatusBar } from 'react-native';
import * as firebase from './src/config/firebase';
import { LogBox } from 'react-native';
import { adService } from './src/services/ads';
import { initializeGoogleSignIn } from './src/config/googleSignIn';
import Constants from 'expo-constants';
import LanguageSelectionModal from './src/components/LanguageSelectionModal';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { NavigationContainer, Theme as NavigationTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import { Button, Portal, Modal } from 'react-native-paper';
import i18n from './src/localization/i18n';

// Create a custom Paper theme
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

// Create a custom Navigation theme
const navigationTheme: NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: 'transparent',
    notification: colors.error,
  },
};

const App: React.FC = () => {
  const [isAppReady, setAppReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { hasStableConnection } = useNetworkStatus();

  useEffect(() => {
    if (hasStableConnection) {
      initializeApp();
      checkForUpdates();
    }
  }, [hasStableConnection]);

  const checkForUpdates = async () => {
    if (__DEV__) return; // Skip update check in development

    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('Update available, downloading...');
        const result = await Updates.fetchUpdateAsync();
        if (result.isNew) {
          setUpdateAvailable(true);
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      // Don't block app initialization on update check failure
      setAppReady(true);
    }
  };

  const initializeApp = async () => {
    try {
      // Initialize Firebase first with retries
      await firebase.initializeFirebase();
      
      // Wait for Firebase to be fully initialized
      const isReady = await firebase.waitForFirebaseInit();
      if (!isReady) {
        throw new Error('Firebase failed to initialize after multiple attempts');
      }
      
      // Only proceed with Google Sign-In after Firebase is fully ready
      await initializeGoogleSignIn();
      console.log('Firebase and Google Sign-In initialized successfully');

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

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {i18n.t('common.loading')}
        </Text>
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
    <SafeAreaProvider>
      <AccessibilityProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="dark-content"
          />
          <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={paperTheme}>
              <ThemeProvider theme={theme}>
                <AuthProvider>
                  <LanguageProvider>
                    <AppNavigator />
                    <Portal>
                      <Modal
                        visible={updateAvailable}
                        onDismiss={() => setUpdateAvailable(false)}
                        contentContainerStyle={styles.modalContainer}
                      >
                        <View style={styles.modalContent}>
                          <Text style={styles.modalTitle}>
                            {i18n.t('updates.availableTitle')}
                          </Text>
                          <Text style={styles.modalText}>
                            {i18n.t('updates.downloadedMessage')}
                          </Text>
                          <View style={styles.modalButtons}>
                            <Button
                              mode="contained"
                              onPress={() => setUpdateAvailable(false)}
                              style={styles.button}
                            >
                              {i18n.t('common.ok')}
                            </Button>
                          </View>
                        </View>
                      </Modal>
                    </Portal>
                  </LanguageProvider>
                </AuthProvider>
              </ThemeProvider>
            </PaperProvider>
          </GestureHandlerRootView>
        </NavigationContainer>
      </AccessibilityProvider>
    </SafeAreaProvider>
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
  modalContainer: {
    backgroundColor: colors.background,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    ...Platform.select({
      ios: shadows.medium,
      android: {
        elevation: 5,
      },
    }),
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h6,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    minWidth: 120,
    marginHorizontal: spacing.xs,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default App;
