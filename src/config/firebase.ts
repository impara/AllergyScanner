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

/**
 * Initializes Firebase App and Analytics.
 * Should be called once during app startup.
 */
export const initializeFirebase = async () => {
  try {
    if (!firebase.apps.length) {
      await firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    }

    // Initialize Analytics after Firebase is initialized
    try {
      await analytics().setAnalyticsCollectionEnabled(true);
      console.log('Firebase Analytics initialized successfully');
    } catch (error) {
      console.warn('Analytics initialization error:', error);
      // Continue even if analytics fails
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
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
      { ingredients: {} },
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

export const getUserIngredients = async (): Promise<IngredientsProfile> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No user is signed in');
  }
  const db = getFirebaseDb();
  const userDoc = await db.collection('users').doc(currentUser.uid).get();
  return userDoc.data()?.ingredients || {};
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
