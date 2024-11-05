// src/context/AuthContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

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
      await firebaseSignOut(auth);
      console.log('User signed out');
      // No need to manually set isAuthenticated; onAuthStateChanged handles it
    } catch (error) {
      console.error('Error signing out:', error);
      // Optionally, handle the error (e.g., show a toast)
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
