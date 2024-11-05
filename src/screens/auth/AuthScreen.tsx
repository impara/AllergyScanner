// src/screens/auth/AuthScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Button, TextInput, Title, Text } from 'react-native-paper';
import {
  signInWithGoogleCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '../../config/firebase';
import * as WebBrowser from 'expo-web-browser';
import Toast from '../../components/Toast';
import { spacing, shadows, typography } from '../../theme/theme';
import { colors } from '../../theme/colors';
import { Provider as PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GOOGLE_EXPO_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';
import i18n from '../../localization/i18n';
import { makeRedirectUri, ResponseType, GoogleAuthRequestConfig } from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Configure Google Sign-In for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      GoogleSignin.configure({
        webClientId: GOOGLE_EXPO_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    }
  }, []);

  // Expo Auth Session setup for non-Android platforms
  const redirectUri = Platform.select({
    web: __DEV__ 
      ? 'http://localhost:8081'
      : 'https://your-app.firebaseapp.com',
    default: makeRedirectUri({
      scheme: 'com.pureplate',
      path: 'oauth2redirect'
    })
  });

  console.log('Platform:', Platform.OS);
  console.log('Redirect URI:', redirectUri);
  console.log('Development mode:', __DEV__);

  const config: Partial<GoogleAuthRequestConfig> = {
    clientId: Platform.OS === 'web' ? GOOGLE_EXPO_CLIENT_ID : undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri,
    responseType: ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    extraParams: {
      access_type: 'offline',
    },
  };

  const [request, response, promptAsync] = useAuthRequest(config);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignInSuccess(id_token);
    } else if (response?.type === 'error') {
      console.error('Auth Error:', response.error);
      showToast(i18n.t('auth.googleSignInFailed'));
    }
  }, [response]);

  const handleGoogleSignInSuccess = async (idToken?: string) => {
    if (!idToken) {
      showToast(i18n.t('auth.googleSignInFailed'));
      return;
    }
    try {
      await signInWithGoogleCredential(idToken);
      showToast(i18n.t('auth.googleSignInSuccess'));
    } catch (error) {
      console.error('Google Sign-In error:', error);
      showToast(i18n.t('auth.googleSignInFailed'));
    }
  };
  // New function to handle Google Sign-In using Credential Manager API on Android
  const handleGoogleSignInAndroid = async () => {
    try {
      console.log('Starting Google Sign-In...');
      await GoogleSignin.hasPlayServices();
      console.log('Play Services check passed');
      
      const signInResult = await GoogleSignin.signIn();
      console.log('Sign in result:', signInResult);
      
      const { idToken, accessToken } = await GoogleSignin.getTokens();
      console.log('Tokens retrieved:', { idToken: !!idToken, accessToken: !!accessToken });
      
      if (idToken) {
        await signInWithGoogleCredential(idToken, accessToken);
        showToast(i18n.t('auth.googleSignInSuccess'));
      } else {
        throw new Error('No ID token found');
      }
    } catch (error: any) {
      console.error('Detailed Google Sign-In error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play Services not available or outdated');
        showToast(i18n.t('auth.playServicesUnavailable'));
      } else {
        console.error('Google Sign-In error:', error);
        showToast(i18n.t('auth.googleSignInFailed'));
      }
    }
  };  

  // Updated handleGoogleSignIn to use platform-specific methods
  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'android') {
      await handleGoogleSignInAndroid();
    } else {
      // Existing Expo Auth Session method for iOS and web
      try {
        if (!request) {
          showToast('Google Sign-In not ready');
          return;
        }

        const options = Platform.OS === 'web' ? {
          windowFeatures: {
            width: 500,
            height: 600,
            centerScreen: true,
            popup: true
          }
        } : undefined;

        await promptAsync(options);
      } catch (error) {
        console.error('Google Sign-In error:', error);
        showToast(i18n.t('auth.googleSignInFailed'));
      }
    }
  };

  const handleEmailAuth = async () => {
    try {
      if (!email || !password) {
        showToast(i18n.t('auth.enterEmailAndPassword'));
        return;
      }

      if (isRegistering) {
        await createUserWithEmailAndPassword(email, password);
        showToast(i18n.t('auth.accountCreated'));
      } else {
        await signInWithEmailAndPassword(email, password);
        showToast(i18n.t('auth.signedIn'));
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      showToast(error.message);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const inputTheme = {
    colors: {
      primary: colors.primary,
      background: colors.surface,
      placeholder: colors.coolGray,
      text: colors.text,
    },
  };

  useEffect(() => {
    return () => {
      if (Platform.OS !== 'web') {
        WebBrowser.coolDownAsync().catch(console.error);
      }
    };
  }, []);

  return (
    <PaperProvider theme={{ colors: { primary: colors.primary } }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={20}
      >
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.gradient} />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="food-apple-outline" size={80} color={colors.surface} />
          </View>
          <View style={styles.content}>
            <Title style={styles.title}>{i18n.t('auth.welcome')}</Title>
            <Text style={styles.subtitle}>{i18n.t('auth.subtitle')}</Text>
            <TextInput
              label={i18n.t('auth.email')}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
              theme={inputTheme}
              left={<TextInput.Icon name="email" color={colors.coolGray} />}
              outlineColor={colors.coolGray}
              activeOutlineColor={colors.primary}
            />
            <TextInput
              label={i18n.t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              theme={inputTheme}
              left={<TextInput.Icon name="lock" color={colors.coolGray} />}
              outlineColor={colors.coolGray}
              activeOutlineColor={colors.primary}
            />
            <Button
              mode="contained"
              onPress={handleEmailAuth}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              color={colors.primary}
            >
              {isRegistering ? i18n.t('auth.signUp') : i18n.t('auth.signIn')}
            </Button>
            <Button
              mode="outlined"
              onPress={handleGoogleSignIn}
              style={[styles.button, styles.googleButton]}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: colors.primary }]}
              icon="google"
              disabled={Platform.OS === 'android' ? false : !request}
            >
              {i18n.t('auth.googleSignIn')}
            </Button>
            <Button
              mode="text"
              onPress={() => setIsRegistering(!isRegistering)}
              style={styles.switchButton}
              labelStyle={styles.switchButtonLabel}
              color={colors.primary}
            >
              {isRegistering ? i18n.t('auth.haveAccount') : i18n.t('auth.noAccount')}
            </Button>
          </View>
        </ScrollView>
        <Toast
          message={toastMessage}
          isVisible={toastVisible}
          onHide={() => setToastVisible(false)}
          duration={3000}
        />
      </KeyboardAvoidingView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.medium,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.text,
    opacity: 0.8,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  button: {
    marginBottom: spacing.sm,
    borderRadius: 25,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    ...typography.button,
    color: colors.surface,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  switchButton: {
    marginTop: spacing.sm,
  },
  switchButtonLabel: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
  toast: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
});

export default AuthScreen;
