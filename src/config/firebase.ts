// src/config/firebase.ts

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from '@env';

import i18n from '../localization/i18n';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Update IngredientsProfile type to include 'lang?: string' and 'category?: string'
export type IngredientsProfile = Record<string, {
  selected: boolean;
  name: string;
  lang?: string;
  category?: string;
}>;

export const signInWithGoogleCredential = async (idToken: string, accessToken?: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // Create Firestore document for new user
      await setDoc(userDocRef, { ingredients: {} }, { merge: true });
      console.log('User signed in with Google and Firestore document initialized.');
    } else {
      console.log('User signed in with Google and Firestore document already exists.');
    }
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    await firebaseSignInWithEmailAndPassword(auth, email, password);
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

export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { ingredients: {} }, { merge: true });

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
  return firebaseSignOut(auth);
};

export const getUserIngredients = async (): Promise<IngredientsProfile> => {
  if (!auth.currentUser) {
    throw new Error('No user is signed in');
  }
  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
  return userDoc.data()?.ingredients || {};
};

export const updateUserIngredients = async (ingredients: IngredientsProfile) => {
  if (!auth.currentUser) {
    throw new Error('No user is signed in');
  }
  try {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    // Replace the entire 'ingredients' object instead of merging
    await setDoc(userDocRef, { ingredients }, { merge: false });
    console.log('Ingredients updated successfully.');
  } catch (error) {
    console.error('Error updating ingredients:', error);
    throw error;
  }
};

export { auth, db };
export default app;
