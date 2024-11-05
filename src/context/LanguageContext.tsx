import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n, { changeLanguage, initializeLanguage } from '../localization/i18n';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  forceRender: number;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en', // Default to English instead of i18n.locale
  setLocale: async () => {},
  forceRender: 0,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    // Initialize language on mount
    const init = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@userLanguage');
        if (savedLanguage) {
          setLocale(savedLanguage);
        } else {
          await initializeLanguage();
          setLocale(i18n.locale);
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        setLocale('en');
      }
    };
    
    init();
  }, []);

  const handleSetLocale = async (newLocale: string) => {
    try {
      await changeLanguage(newLocale);
      setLocale(newLocale);
      setForceRender(prev => prev + 1);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, forceRender }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
