import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Import all translations statically
import en from './translations/en';
import es from './translations/es';
import fi from './translations/fi';
import da from './translations/da';
import de from './translations/de';
import fr from './translations/fr';

// Set translations
i18n.translations = {
  en,
  es,
  fi,
  da,
  de,
  fr,
};

// Supported languages
export const supportedLanguages = ['en', 'es', 'fi', 'da', 'de', 'fr'];

// Set the default locale
i18n.defaultLocale = 'en';
i18n.fallbacks = true;

// Function to change the language
export const changeLanguage = async (language: string): Promise<void> => {
  try {
    // Validate language first
    if (!supportedLanguages.includes(language)) {
      console.warn(`Unsupported language: ${language}, falling back to English`);
      language = 'en';
    }

    // Update storage first
    await AsyncStorage.setItem('@userLanguage', language);
    
    // Then update i18n (sync operation)
    i18n.locale = language;
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
};

// Function to initialize the language from storage
export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('@userLanguage');
    
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      await changeLanguage(savedLanguage);
    } else {
      const deviceLanguage = Localization.locale.split('-')[0];
      
      if (supportedLanguages.includes(deviceLanguage)) {
        await changeLanguage(deviceLanguage);
      } else {
        await changeLanguage('en');
      }
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
    i18n.locale = 'en';
  }
};

export default i18n;
