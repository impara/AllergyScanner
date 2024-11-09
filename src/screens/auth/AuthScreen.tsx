// src/screens/auth/AuthScreen.tsx

import React, { useState, useEffect } from 'react';
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

const {
  GOOGLE_EXPO_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} = (Constants as any).expoConfig?.extra || {};

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google Sign-In...');
      const { idToken, accessToken } = await signInWithGoogle();
      console.log('Google Sign-In successful, got tokens');
      
      if (idToken) {
        await signInWithGoogleCredential(idToken, accessToken);
        showToast(i18n.t('auth.googleSignInSuccess'));
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

  return (
    <PaperProvider theme={{ colors: { primary: colors.primary } }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              left={<TextInput.Icon icon="email" color={colors.coolGray} />}
              outlineColor={colors.coolGray}
              activeOutlineColor={colors.primary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label={i18n.t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              theme={inputTheme}
              left={<TextInput.Icon icon="lock" color={colors.coolGray} />}
              outlineColor={colors.coolGray}
              activeOutlineColor={colors.primary}
            />
            <Button
              mode="contained"
              onPress={handleEmailAuth}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
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
            >
              {i18n.t('auth.googleSignIn')}
            </Button>
            <Button
              mode="text"
              onPress={() => setIsRegistering(!isRegistering)}
              style={styles.switchButton}
              labelStyle={styles.switchButtonLabel}
            >
              {isRegistering ? i18n.t('auth.haveAccount') : i18n.t('auth.noAccount')}
            </Button>
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
});

export default AuthScreen;
