import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n, { changeLanguage, supportedLanguages } from '../localization/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { getFirebaseDb } from '../config/firebase';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isInitialized: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: async () => {},
  isInitialized: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
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
          setLocale('en');
          setIsInitialized(true);
        }
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  // Handle language changes
  const handleSetLocale = async (newLocale: string): Promise<void> => {
    let succeeded = false;
    const previousLocale = locale;
    
    try {
      if (!supportedLanguages.includes(newLocale)) {
        throw new Error(`Unsupported language: ${newLocale}`);
      }

      // First update local state
      await changeLanguage(newLocale);
      setLocale(newLocale);
      succeeded = true;

      // Then update Firebase (don't wait for it)
      const currentUser = auth().currentUser;
      if (currentUser) {
        getFirebaseDb().collection('users').doc(currentUser.uid).update({
          selectedLanguage: newLocale,
          hasSelectedLanguage: true
        }).catch(error => {
          console.error('Firebase language update failed:', error);
        });
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

  return (
    <LanguageContext.Provider 
      value={{ 
        locale,
        setLocale: handleSetLocale,
        isInitialized
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
