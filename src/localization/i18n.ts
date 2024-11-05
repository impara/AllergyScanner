import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Import all translations
import en from './translations/en';
import es from './translations/es';
import fi from './translations/fi';
import da from './translations/da';
import de from './translations/de';

// Set translations
i18n.translations = {
  en,
  es,
  fi,
  da,
  de,
};

// Supported languages
export const supportedLanguages = ['en', 'es', 'fi', 'da', 'de'];

// Set the default locale
i18n.defaultLocale = 'en';
i18n.fallbacks = true;

// Function to change the language
export const changeLanguage = async (language: string) => {
  try {
    // Validate language code
    if (!supportedLanguages.includes(language)) {
      console.warn(`Unsupported language: ${language}, falling back to English`);
      language = 'en';
    }

    // Update the locale
    i18n.locale = language;
    
    // Force RTL/LTR
    const isRTL = language === 'ar' || language === 'he';
    I18nManager.forceRTL(isRTL);
    
    // Save to storage
    await AsyncStorage.setItem('@userLanguage', language);
    
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Function to initialize the language from storage
export const initializeLanguage = async () => {
  try {
    // Try to get saved language
    const savedLanguage = await AsyncStorage.getItem('@userLanguage');
    
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      await changeLanguage(savedLanguage);
    } else {
      // Get device language (first two chars only)
      const deviceLanguage = Localization.locale.split('-')[0];
      
      // Check if device language is supported
      if (supportedLanguages.includes(deviceLanguage)) {
        await changeLanguage(deviceLanguage);
      } else {
        // Fall back to English if device language is not supported
        await changeLanguage('en');
      }
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
    // Fall back to English in case of error
    i18n.locale = 'en';
  }
};

// Initialize language immediately
initializeLanguage();

export default i18n;
