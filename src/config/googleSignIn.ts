import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleSignInConfig, validateGoogleSignInConfig } from '../types/environment';

const {
    GOOGLE_IOS_CLIENT_ID,
    GOOGLE_ANDROID_CLIENT_ID,
    GOOGLE_EXPO_CLIENT_ID,
} = Constants.expoConfig?.extra || {};

const googleSignInConfig: Partial<GoogleSignInConfig> = {
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    expoClientId: GOOGLE_EXPO_CLIENT_ID
};

if (!validateGoogleSignInConfig(googleSignInConfig)) {
    throw new Error('Invalid Google Sign-In configuration');
}

export const initializeGoogleSignIn = () => {
    console.log('Google Sign-In Config:', {
        hasIosClientId: !!GOOGLE_IOS_CLIENT_ID,
        hasAndroidClientId: !!GOOGLE_ANDROID_CLIENT_ID,
        hasExpoClientId: !!GOOGLE_EXPO_CLIENT_ID,
        platform: Platform.OS
    });

    if (!GOOGLE_IOS_CLIENT_ID && Platform.OS === 'ios') {
        console.error('iOS Google Client ID not configured - Sign in will fail on iOS');
    }
    if (!GOOGLE_ANDROID_CLIENT_ID && Platform.OS === 'android') {
        console.error('Android Google Client ID not configured - Sign in will fail on Android');
    }
    if (!GOOGLE_EXPO_CLIENT_ID) {
        console.error('Web Client ID not configured - OAuth flow may fail');
    }

    GoogleSignin.configure({
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        webClientId: GOOGLE_EXPO_CLIENT_ID,
        offlineAccess: true
    });
};

export type GoogleSignInError = {
    code: number;
    message: string;
};

export const signInWithGoogle = async () => {
    try {
        const hasPlayServices = await GoogleSignin.hasPlayServices({ 
            showPlayServicesUpdateDialog: true 
        });
        
        if (!hasPlayServices) {
            throw new Error('Play Services not available');
        }

        const userInfo = await GoogleSignin.signIn();
        if (!userInfo) {
            throw new Error('Sign-in failed - no user info');
        }

        const { idToken, accessToken } = await GoogleSignin.getTokens();
        if (!idToken) {
            throw new Error('Sign-in failed - no ID token');
        }

        return { idToken, accessToken };
    } catch (error: any) {
        console.error('Google Sign-In error:', error);
        
        // Rethrow with better error structure
        if (error.code) {
            throw error; // Already a GoogleSignInError
        }
        throw {
            code: statusCodes.SIGN_IN_REQUIRED,
            message: error.message || 'Sign-in failed'
        };
    }
};

export const signOutGoogle = async () => {
    try {
        await GoogleSignin.signOut();
    } catch (error) {
        console.error('Google Sign-Out error:', error);
        // Don't throw on sign-out errors
    }
};

export const isPlayServicesAvailable = async () => {
    try {
        await GoogleSignin.hasPlayServices({ 
            showPlayServicesUpdateDialog: true 
        });
        return true;
    } catch (error) {
        return false;
    }
};

export const refreshGoogleToken = async () => {
    try {
        const { accessToken } = await GoogleSignin.getTokens();
        if (!accessToken) {
            await GoogleSignin.signInSilently();
            return await GoogleSignin.getTokens();
        }
        return { accessToken };
    } catch (error) {
        console.error('Token refresh failed:', error);
        throw error;
    }
}; 