import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import i18n, { changeLanguage, supportedLanguages } from '../localization/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getFirebaseDb } from '../config/firebase';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isInitialized: boolean;
  error: Error | null;
  forceRender: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: async () => {},
  isInitialized: false,
  error: null,
  forceRender: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [, setForceUpdate] = useState({});

  const forceRender = useCallback(() => {
    setForceUpdate({});
  }, []);

  // Initialize language
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        // Add a small delay to ensure Firebase is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const savedLanguage = await AsyncStorage.getItem('@userLanguage');
        const userLanguage = savedLanguage || i18n.locale;
        const finalLanguage = supportedLanguages.includes(userLanguage) ? userLanguage : 'en';
        
        if (!mounted) return;
        
        await changeLanguage(finalLanguage);
        if (mounted) {
          setLocale(finalLanguage);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Language initialization failed:', error);
        if (mounted) {
          setError(error as Error);
          setLocale('en');
          setIsInitialized(true);
        }
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  // Handle language changes with better error handling
  const handleSetLocale = async (newLocale: string): Promise<void> => {
    let succeeded = false;
    const previousLocale = locale;
    
    try {
      if (!supportedLanguages.includes(newLocale)) {
        throw new Error(`Unsupported language: ${newLocale}`);
      }

      // First update local state and i18n
      await changeLanguage(newLocale);
      setLocale(newLocale);
      succeeded = true;

      // Then update Firebase if user is authenticated
      const currentUser = auth().currentUser;
      if (currentUser) {
        try {
          await getFirebaseDb().collection('users').doc(currentUser.uid).update({
            selectedLanguage: newLocale,
            hasSelectedLanguage: true,
            lastUpdated: firestore.FieldValue.serverTimestamp()
          });
        } catch (firebaseError) {
          console.error('Firebase language update failed:', firebaseError);
          // Don't throw here - we still want to keep the local change
        }
      }
    } catch (error) {
      // Rollback on failure
      if (!succeeded) {
        await changeLanguage(previousLocale);
        setLocale(previousLocale);
      }
      throw error;
    }
  };

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider 
      value={{ 
        locale, 
        setLocale: handleSetLocale,
        isInitialized,
        error,
        forceRender 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
