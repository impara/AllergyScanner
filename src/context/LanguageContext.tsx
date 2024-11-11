import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n, { changeLanguage, initializeLanguage } from '../localization/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { getFirebaseDb } from '../config/firebase';

interface LanguageState {
  isInitialized: boolean;
  hasUserSelected: boolean;
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
    hasUserSelected: false,
    currentLocale: 'en'
  });
  const [forceRender, setForceRender] = useState(0);

  // Synchronized initialization
  useEffect(() => {
    const initializeLanguageState = async () => {
      try {
        const currentUser = auth().currentUser;
        const [savedLanguage, userDoc] = await Promise.all([
          AsyncStorage.getItem('@userLanguage'),
          currentUser ? getFirebaseDb().collection('users').doc(currentUser.uid).get() : null
        ]);

        let finalLocale = 'en';
        let hasSelected = false;

        if (savedLanguage && userDoc?.exists) {
          // Both exist - check for conflicts
          const firebaseLanguage = userDoc.data()?.selectedLanguage;
          if (savedLanguage !== firebaseLanguage) {
            // Conflict - prefer Firebase version
            finalLocale = firebaseLanguage || savedLanguage;
            await AsyncStorage.setItem('@userLanguage', finalLocale);
          } else {
            finalLocale = savedLanguage;
          }
          hasSelected = userDoc.data()?.hasSelectedLanguage || false;
        } else if (savedLanguage) {
          // Only AsyncStorage exists
          finalLocale = savedLanguage;
          if (currentUser) {
            // Sync to Firebase
            await getFirebaseDb().collection('users').doc(currentUser.uid).update({
              selectedLanguage: savedLanguage,
              hasSelectedLanguage: true
            });
          }
          hasSelected = true;
        } else if (userDoc?.exists && userDoc.data()?.selectedLanguage) {
          // Only Firebase exists
          finalLocale = userDoc.data()?.selectedLanguage;
          await AsyncStorage.setItem('@userLanguage', finalLocale);
          hasSelected = userDoc.data()?.hasSelectedLanguage || false;
        } else {
          // Neither exists - initialize with device language
          await initializeLanguage();
          finalLocale = i18n.locale;
          hasSelected = false;
        }

        await changeLanguage(finalLocale);
        setState({
          isInitialized: true,
          hasUserSelected: hasSelected,
          currentLocale: finalLocale
        });
      } catch (error) {
        console.error('Language initialization error:', error);
        // Fallback to default state
        setState({
          isInitialized: true,
          hasUserSelected: false,
          currentLocale: 'en'
        });
      }
    };

    initializeLanguageState();
  }, []);

  // Atomic update handler
  const handleSetLocale = async (newLocale: string): Promise<void> => {
    try {
      const currentUser = auth().currentUser;
      
      // Prepare all promises
      const updatePromises: Promise<any>[] = [
        changeLanguage(newLocale),
        AsyncStorage.setItem('@userLanguage', newLocale)
      ];

      if (currentUser) {
        updatePromises.push(
          getFirebaseDb().collection('users').doc(currentUser.uid).update({
            selectedLanguage: newLocale,
            hasSelectedLanguage: true,
            lastLanguageUpdate: new Date().toISOString()
          })
        );
      }

      // Execute all updates atomically
      await Promise.all(updatePromises);

      // Update local state only after all external updates succeed
      setState(prev => ({
        ...prev,
        hasUserSelected: true,
        currentLocale: newLocale
      }));
      setForceRender(prev => prev + 1);

    } catch (error) {
      console.error('Language update failed:', error);
      // Attempt recovery
      await reconcileLanguageState();
      throw new Error('Failed to update language. Please try again.');
    }
  };

  // Recovery mechanism
  const reconcileLanguageState = async () => {
    try {
      const currentUser = auth().currentUser;
      const [storageLanguage, userDoc] = await Promise.all([
        AsyncStorage.getItem('@userLanguage'),
        currentUser ? getFirebaseDb().collection('users').doc(currentUser.uid).get() : null
      ]);

      const firebaseLanguage = userDoc?.data()?.selectedLanguage;
      
      if (storageLanguage !== firebaseLanguage) {
        // Prefer Firebase version, fall back to storage version, then default
        const finalLanguage = firebaseLanguage || storageLanguage || 'en';
        
        // Reconcile all storage locations
        await Promise.all([
          AsyncStorage.setItem('@userLanguage', finalLanguage),
          currentUser ? getFirebaseDb().collection('users').doc(currentUser.uid).update({
            selectedLanguage: finalLanguage,
            hasSelectedLanguage: true,
            lastLanguageUpdate: new Date().toISOString()
          }) : Promise.resolve(),
          changeLanguage(finalLanguage)
        ]);

        setState(prev => ({
          ...prev,
          currentLocale: finalLanguage
        }));
        setForceRender(prev => prev + 1);
      }
    } catch (error) {
      console.error('Language state reconciliation failed:', error);
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
