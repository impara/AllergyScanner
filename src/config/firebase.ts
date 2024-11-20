// src/config/firebase.ts

import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Constants from 'expo-constants';
import i18n from '../localization/i18n';
import NetInfo from '@react-native-community/netinfo';
import { FirebaseConfig, validateFirebaseConfig } from '../types/environment';

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_DATABASE_URL,
} = Constants.expoConfig?.extra || {};

const firebaseConfig: Partial<FirebaseConfig> = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
  databaseURL: FIREBASE_DATABASE_URL,
};

if (!validateFirebaseConfig(firebaseConfig)) {
  throw new Error('Invalid Firebase configuration');
}

/**
 * Initializes Firebase App and Analytics.
 * Should be called once during app startup.
 */
export const initializeFirebase = async (attempt = 1, maxAttempts = 3): Promise<void> => {
  try {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      throw new Error('No network connection available');
    }

    if (!firebase.apps.length) {
      validateFirebaseConfig(firebaseConfig);
      await firebase.initializeApp(firebaseConfig);
      firestore();
    }
  } catch (error: any) {
    if (attempt < maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeFirebase(attempt + 1, maxAttempts);
    }
    throw error;
  }
};

export const isFirebaseInitialized = () => {
  return firebase.apps.length > 0;
};

export const getFirebaseAuth = () => {
  return auth();
};

export const getFirebaseDb = () => {
  return firestore();
};

export type IngredientsProfile = Record<
  string,
  {
    selected: boolean;
    name: string;
    lang?: string;
    category?: string;
  }
>;

// Add retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const RETRYABLE_ERRORS = [
  'firestore/unavailable',
  'firestore/network-request-failed',
  'firestore/deadline-exceeded',
  'firestore/resource-exhausted'
];

const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && RETRYABLE_ERRORS.includes(error?.code)) {
      console.warn(`Retrying operation due to error: ${error.code}`);
      await wait(delay);
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Update the sign in method with retry logic
export const signInWithGoogleCredential = async (
  idToken: string,
  accessToken?: string
) => {
  try {
    if (!idToken) {
      throw new Error('No ID token provided');
    }

    const credential = auth.GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await auth().signInWithCredential(credential);
    const user = userCredential.user;

    if (!user) {
      throw new Error('No user returned from credential sign-in');
    }

    const db = getFirebaseDb();

    // Wrap Firestore operations with retry logic
    await withRetry(async () => {
      const userDocRef = db.collection('users').doc(user.uid);
      
      // Use transaction for atomic operation
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(userDocRef);
        
        if (!doc.exists) {
          transaction.set(userDocRef, {
            ingredients: {},
            hasSelectedLanguage: false,
            createdAt: firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firestore.FieldValue.serverTimestamp(),
          });
        } else {
          transaction.update(userDocRef, {
            lastLoginAt: firestore.FieldValue.serverTimestamp(),
          });
        }
      });
    });

    return user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      fullError: JSON.stringify(error)
    });
    throw error;
  }
};

export const signInWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  try {
    await auth().signInWithEmailAndPassword(email, password);
  } catch (error: any) {
    console.error('Firebase auth error:', error.code, error.message);

    // Map Firebase error codes directly to our translation keys
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-email':
      case 'auth/too-many-requests':
      case 'auth/network-request-failed':
        // Remove the 'auth/' prefix from the error code
        const errorKey = error.code.replace('auth/', '');
        throw new Error(i18n.t(`auth.errors.${errorKey}`));
      default:
        throw new Error(i18n.t('auth.errors.default'));
    }
  }
};

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    const db = getFirebaseDb();
    const userDocRef = db.collection('users').doc(user.uid);
    await userDocRef.set(
      { 
        ingredients: {},
        hasSelectedLanguage: false,
      },
      { merge: true }
    );
  } catch (error: any) {
    console.error('Firebase auth error:', error.code, error.message);

    // Map Firebase error codes directly to our translation keys
    switch (error.code) {
      case 'auth/email-already-in-use':
      case 'auth/weak-password':
      case 'auth/invalid-email':
      case 'auth/network-request-failed':
        // Remove the 'auth/' prefix from the error code
        const errorKey = error.code.replace('auth/', '');
        throw new Error(i18n.t(`auth.errors.${errorKey}`));
      default:
        throw new Error(i18n.t('auth.errors.signUpFailed'));
    }
  }
};

export const signOut = () => {
  return auth().signOut();
};

/**
 * Helper function to implement retry logic with exponential backoff
 * @param fn - The Firestore function to retry
 * @param retries - Number of retry attempts
 * @param delay - Initial delay in milliseconds
 */
const retryFirestoreOperation = async (
  fn: () => Promise<any>,
  retries: number = 3,
  delay: number = 1000
): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || !isTransientFirestoreError(error)) {
      throw error;
    }
    console.warn(`Retrying Firestore operation due to error: ${error.message}`);
    await new Promise(res => setTimeout(res, delay));
    return retryFirestoreOperation(fn, retries - 1, delay * 2);
  }
};

/**
 * Determines if the Firestore error is transient
 * @param error - The error thrown by Firestore
 */
const isTransientFirestoreError = (error: any): boolean => {
  return error.code === 'firestore/unavailable';
};

// Update getUserIngredients with retry logic
export const getUserIngredients = async (): Promise<IngredientsProfile> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  return withRetry(async () => {
    const db = getFirebaseDb();
    const doc = await db.collection('users').doc(currentUser.uid).get();
    const data = doc.data();
    return (data?.ingredients || {}) as IngredientsProfile;
  });
};

export const updateUserIngredients = async (
  ingredients: IngredientsProfile
) => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No user is signed in');
  }
  try {
    const db = getFirebaseDb();
    const userDocRef = db.collection('users').doc(currentUser.uid);
    // Replace the entire 'ingredients' object instead of merging
    await userDocRef.set({ ingredients }, { merge: false });
    console.log('Ingredients updated successfully.');
  } catch (error) {
    console.error('Error updating ingredients:', error);
    throw error;
  }
};
