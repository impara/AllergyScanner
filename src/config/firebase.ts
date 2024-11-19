// src/config/firebase.ts

import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Constants from 'expo-constants';
import i18n from '../localization/i18n';

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

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
  databaseURL: FIREBASE_DATABASE_URL,
};

const validateFirebaseConfig = () => {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'databaseURL'
  ];
  
  console.log('Firebase Config Debug:', {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    databaseURL: !!firebaseConfig.databaseURL,
    rawConfig: firebaseConfig
  });
  
  const missing = required.filter(key => !firebaseConfig[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }
};

/**
 * Initializes Firebase App and Analytics.
 * Should be called once during app startup.
 */
export const initializeFirebase = async (attempt = 1, maxAttempts = 3): Promise<void> => {
  try {
    if (!firebase.apps.length) {
      validateFirebaseConfig();
      
      const app = await firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully on attempt', attempt);
      
      // Initialize Firestore but don't test access yet
      const db = firestore();
      
      // Don't test collection access here - it will fail without auth
      return;
    }
  } catch (error: any) {
    console.error(`Firebase initialization attempt ${attempt} failed:`, error);
    console.error('Error code:', error.code);
    
    if (attempt < maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${delay}ms...`);
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

// Update your authentication methods accordingly
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

    // Check if user document exists
    const userDocRef = db.collection('users').doc(user.uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      // Create Firestore document for new user
      await userDocRef.set({
        ingredients: {},
        hasSelectedLanguage: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log(
        'User signed in with Google and Firestore document initialized.'
      );
    } else {
      // Update last login timestamp
      await userDocRef.update({
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log(
        'User signed in with Google and Firestore document updated.'
      );
    }

    return user;
  } catch (error) {
    console.error('Error signing in with Google', error);
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

/**
 * Example function to get user ingredients with retry logic
 */
export const getUserIngredients = async (): Promise<IngredientsProfile> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No user is signed in');
  }
  
  return retryFirestoreOperation(async () => {
    const snapshot = await firestore().collection('users').doc(currentUser.uid).get();
    if (!snapshot.exists) {
      throw new Error('User not found');
    }
    return snapshot.data() as IngredientsProfile;
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
