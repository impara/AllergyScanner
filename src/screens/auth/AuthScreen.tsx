// src/screens/auth/AuthScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, TextInput, Title, Text } from 'react-native-paper';
import {
  signInWithGoogleCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '../../config/firebase';
import { Toast } from '../../components';
import { spacing, shadows, typography } from '../../theme/theme';
import { colors } from '../../theme/colors';
import { Provider as PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import i18n from '../../localization/i18n';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithGoogle } from '../../config/googleSignIn';
import { getAccessibleFontSize } from '../../utils/accessibility';
import { useScreenReader } from '../../hooks/useScreenReader';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} = (Constants as any).expoConfig?.extra || {};

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  const { announce } = useScreenReader();
  const prefersReducedMotion = useReducedMotion();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    announce(i18n.t('auth.screenTitle'));
  }, []);

  useEffect(() => {
    // Focus email input when screen mounts
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    if (hasError) {
      announce(i18n.t('auth.errorRecovery'));
    }
  }, [hasError]);

  useEffect(() => {
    return () => {
      setEmail('');
      setPassword('');
      setIsLoading(false);
      setIsSigningIn(false);
      setHasError(false);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    
    try {
      setIsSigningIn(true);
      announce(i18n.t('auth.signingInWithGoogle'));
      
      const { idToken, accessToken } = await signInWithGoogle();
      if (idToken) {
        await signInWithGoogleCredential(idToken, accessToken);
        handleSuccessfulAuth();
        announce(i18n.t('auth.googleSignInSuccess'));
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        fullError: JSON.stringify(error, null, 2)
      });
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
        return;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showToast(i18n.t('auth.playServicesUnavailable'));
      } else {
        showToast(i18n.t('auth.googleSignInFailed'));
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return i18n.t('auth.passwordTooShort');
    }
    if (!/[A-Z]/.test(password)) {
      return i18n.t('auth.passwordNeedsUppercase');
    }
    if (!/[0-9]/.test(password)) {
      return i18n.t('auth.passwordNeedsNumber');
    }
    return null;
  };

  const validateInputs = () => {
    if (!email || !password) {
      const errorMessage = i18n.t('auth.enterEmailAndPassword');
      announce(errorMessage);
      showToast(errorMessage);
      return false;
    }

    if (!validateEmail(email)) {
      const errorMessage = i18n.t('auth.invalidEmail');
      announce(errorMessage);
      showToast(errorMessage);
      return false;
    }

    if (isRegistering) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        announce(passwordError);
        showToast(passwordError);
        return false;
      }
    }

    return true;
  };

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true);
      if (!validateInputs()) {
        setIsLoading(false);
        return;
      }

      if (isRegistering) {
        await createUserWithEmailAndPassword(email, password);
        handleSuccessfulAuth();
        showToast(i18n.t('auth.accountCreated'));
      } else {
        await signInWithEmailAndPassword(email, password);
        handleSuccessfulAuth();
        showToast(i18n.t('auth.signedIn'));
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
      setIsSigningIn(false);
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

  const handleSuccessfulAuth = () => {
    announce(i18n.t('auth.signedIn'));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    if (!isLoading && !isSigningIn) {
      handleEmailAuth();
    }
  };

  const handleError = (error: any) => {
    setHasError(true);
    console.error('Auth Error:', error);
    const errorMessage = error.message || i18n.t('auth.unknownError');
    announce(errorMessage);
    showToast(errorMessage);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setIsLoading(false);
    setIsSigningIn(false);
    setHasError(false);
    emailInputRef.current?.focus();
  };

  return (
    <PaperProvider theme={{ colors: { primary: colors.primary } }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 20}
      >
        <LinearGradient 
          colors={[colors.primary, colors.secondary]} 
          style={styles.gradient}
        />
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          accessible={true}
          accessibilityLabel={i18n.t('auth.screenTitle')}
        >
          <View 
            style={styles.logoContainer}
            accessible={true}
            accessibilityLabel={i18n.t('auth.appLogo')}
          >
            <MaterialCommunityIcons 
              name="food-apple-outline" 
              size={80} 
              color={colors.surface}
              accessible={true}
              accessibilityLabel={i18n.t('auth.appLogoIcon')}
            />
          </View>
          <View style={styles.content}>
            <Title style={styles.title}>{i18n.t('auth.welcome')}</Title>
            <Text style={styles.subtitle}>{i18n.t('auth.subtitle')}</Text>
            <TextInput
              ref={emailInputRef}
              label={i18n.t('auth.email')}
              value={email}
              onChangeText={setEmail}
              error={email !== '' && !validateEmail(email)}
              style={styles.input}
              mode="outlined"
              theme={inputTheme}
              left={
                <TextInput.Icon 
                  icon="email" 
                  color={colors.coolGray}
                  style={styles.inputIcon}
                  accessibilityLabel={i18n.t('auth.emailIcon')}
                />
              }
              outlineColor={colors.coolGray}
              activeOutlineColor={colors.primary}
              keyboardType="email-address"
              autoCapitalize="none"
              accessible={true}
              accessibilityLabel={i18n.t('auth.emailInput')}
              accessibilityHint={i18n.t('auth.emailInputHint')}
              importantForAccessibility="yes"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              accessibilityState={{ 
                disabled: isLoading,
                selected: !!email,
              }}
            />
            <TextInput
              label={i18n.t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              theme={inputTheme}
              left={
                <TextInput.Icon 
                  icon="lock" 
                  color={colors.coolGray}
                  style={styles.inputIcon}
                  accessibilityLabel={i18n.t('auth.passwordIcon')}
                />
              }
              outlineColor={colors.coolGray}
              activeOutlineColor={colors.primary}
              accessible={true}
              accessibilityLabel={i18n.t('auth.passwordInput')}
              accessibilityHint={i18n.t('auth.passwordInputHint')}
              ref={passwordInputRef}
              importantForAccessibility="yes"
              returnKeyType="done"
              onSubmitEditing={handleEmailAuth}
              accessibilityState={{ 
                disabled: isLoading,
                selected: !!password,
              }}
            />
            <Button
              mode="contained"
              onPress={handleEmailAuth}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: colors.surface }]}
              disabled={isLoading || isSigningIn}
              loading={isLoading}
              accessible={true}
              accessibilityLabel={isRegistering ? i18n.t('auth.signUp') : i18n.t('auth.signIn')}
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading || isSigningIn, busy: isLoading }}
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
              disabled={isSigningIn || isLoading}
              loading={isSigningIn}
              accessible={true}
              accessibilityLabel={i18n.t('auth.googleSignInButton')}
              accessibilityRole="button"
              accessibilityState={{ 
                disabled: isSigningIn || isLoading,
                busy: isSigningIn 
              }}
            >
              {i18n.t('auth.googleSignIn')}
            </Button>
            <Button
              mode="text"
              onPress={() => setIsRegistering(!isRegistering)}
              style={styles.switchButton}
              labelStyle={styles.switchButtonLabel}
              accessible={true}
              accessibilityLabel={isRegistering ? i18n.t('auth.haveAccountButton') : i18n.t('auth.noAccountButton')}
              accessibilityRole="button"
            >
              {isRegistering ? i18n.t('auth.haveAccount') : i18n.t('auth.noAccount')}
            </Button>
            {hasError && (
              <Button
                mode="text"
                onPress={resetForm}
                style={styles.resetButton}
                accessible={true}
                accessibilityLabel={i18n.t('auth.resetForm')}
                accessibilityRole="button"
              >
                {i18n.t('auth.tryAgain')}
              </Button>
            )}
          </View>
        </ScrollView>
        <Toast
          message={toastMessage}
          visible={toastVisible}
          onDismiss={() => setToastVisible(false)}
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
    fontSize: getAccessibleFontSize(24),
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    fontSize: getAccessibleFontSize(16),
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.text,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  button: {
    marginBottom: spacing.sm,
    borderRadius: 25,
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonContent: {
    height: 48,
    minWidth: 48,
  },
  buttonLabel: {
    ...typography.button,
    fontWeight: 'bold',
    fontSize: 16,
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
    fontSize: 16,
  },
  inputIcon: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    marginTop: spacing.md,
  },
});

export default AuthScreen;
