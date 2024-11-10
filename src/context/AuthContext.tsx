// src/context/AuthContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import auth from '@react-native-firebase/auth';
import { signOutGoogle } from '../config/googleSignIn';
import { getFirebaseDb } from '../config/firebase';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  signOutUser: () => Promise<void>;
  showLanguageSelection: boolean;
  setShowLanguageSelection: (show: boolean) => void;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  signOutUser: async () => {},
  showLanguageSelection: false,
  setShowLanguageSelection: () => {},
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user);
      setIsAuthenticated(!!user);

      if (user) {
        // Check if user has selected language
        const db = getFirebaseDb();
        const userDoc = await db.collection('users').doc(user.uid).get();
        const hasSelectedLanguage = userDoc.data()?.hasSelectedLanguage;
        
        if (!hasSelectedLanguage) {
          setShowLanguageSelection(true);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    try {
      console.log('Signing out user...');
      await auth().signOut();
      await signOutGoogle();
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        loading, 
        signOutUser,
        showLanguageSelection,
        setShowLanguageSelection
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
