import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const {
    GOOGLE_IOS_CLIENT_ID,
    GOOGLE_ANDROID_CLIENT_ID,
    GOOGLE_EXPO_CLIENT_ID,
} = Constants.expoConfig?.extra || {};

export const initializeGoogleSignIn = () => {
    if (!GOOGLE_IOS_CLIENT_ID && Platform.OS === 'ios') {
        console.warn('iOS Google Client ID not configured');
    }
    if (!GOOGLE_EXPO_CLIENT_ID) {
        console.warn('Web Client ID not configured');
    }

    console.log('Initializing Google Sign-In with:', {
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        webClientId: GOOGLE_EXPO_CLIENT_ID,
        platform: Platform.OS
    });

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