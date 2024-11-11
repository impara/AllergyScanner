import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n, { changeLanguage, initializeLanguage } from '../localization/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { getFirebaseDb } from '../config/firebase';

interface LanguageState {
  isInitialized: boolean;
  currentLocale: string;
}

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  forceRender: number;
  isInitialized: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: async () => {},
  forceRender: 0,
  isInitialized: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LanguageState>({
    isInitialized: false,
    currentLocale: 'en'
  });
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@userLanguage');
        if (savedLanguage) {
          await changeLanguage(savedLanguage);
          setState({
            isInitialized: true,
            currentLocale: savedLanguage
          });
        } else {
          await initializeLanguage();
          setState({
            isInitialized: true,
            currentLocale: i18n.locale
          });
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        setState({
          isInitialized: true,
          currentLocale: 'en'
        });
      }
    };

    init();
  }, []);

  const handleSetLocale = async (newLocale: string): Promise<void> => {
    try {
      const currentUser = auth().currentUser;
      
      // Update i18n and AsyncStorage
      await Promise.all([
        changeLanguage(newLocale),
        AsyncStorage.setItem('@userLanguage', newLocale)
      ]);

      // Update Firebase if user is logged in
      if (currentUser) {
        await getFirebaseDb().collection('users').doc(currentUser.uid).update({
          selectedLanguage: newLocale,
          hasSelectedLanguage: true
        });
      }

      setState(prev => ({
        ...prev,
        currentLocale: newLocale
      }));
      setForceRender(prev => prev + 1);

    } catch (error) {
      console.error('Language update failed:', error);
      throw new Error('Failed to update language');
    }
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        locale: state.currentLocale, 
        setLocale: handleSetLocale,
        forceRender,
        isInitialized: state.isInitialized
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
