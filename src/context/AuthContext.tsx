// src/context/AuthContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  signOutUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  signOutUser: async () => {},
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    try {
      console.log('Signing out user...');
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
