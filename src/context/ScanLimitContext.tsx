import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adService } from '../services';
import { Platform, Alert } from 'react-native';
import i18n from '../localization/i18n';


interface ScanLimitContextType {
  scansRemaining: number;
  resetDaily: () => Promise<void>;
  useOneScan: () => Promise<boolean>;
  watchAdForScans: () => Promise<void>;
  isAdLoading: boolean;
  isAdReady: boolean;
}

const ScanLimitContext = createContext<ScanLimitContextType>({
  scansRemaining: 3,
  resetDaily: async () => {},
  useOneScan: async () => false,
  watchAdForScans: async () => {},
  isAdLoading: false,
  isAdReady: false,
});

const DAILY_SCAN_LIMIT = 3;
const SCANS_PER_AD = 3;
const STORAGE_KEY = '@lastResetDate';
const SCANS_REMAINING_KEY = '@scansRemaining';

export const ScanLimitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scansRemaining, setScansRemaining] = useState(DAILY_SCAN_LIMIT);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isAdReady, setIsAdReady] = useState(false);

  useEffect(() => {
    initializeScanLimit();
    return () => {
      // Cleanup ads when component unmounts
      adService.cleanup();
    };
  }, []);

  useEffect(() => {
    const checkAdStatus = () => {
      if (Platform.OS !== 'web') {
        const ready = adService.isAdReady();
        setIsAdReady(ready);
      }
    };

    // Check initially
    checkAdStatus();

    // Set up interval to check periodically
    const interval = setInterval(checkAdStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const initializeScanLimit = async () => {
    try {
      const lastResetDate = await AsyncStorage.getItem(STORAGE_KEY);
      const storedScansRemaining = await AsyncStorage.getItem(SCANS_REMAINING_KEY);
      const today = new Date().toDateString();
      let initialScans = DAILY_SCAN_LIMIT; // Default for first launch or errors

      if (lastResetDate && storedScansRemaining !== null) {
        const remaining = parseInt(storedScansRemaining, 10);
        if (!isNaN(remaining) && remaining >= 0) {
          if (lastResetDate === today) {
            // Same day, just load the stored value
            initialScans = remaining;
            console.log('[ScanLimit] Initializing same day scans:', initialScans);
          } else {
            // New day, check if previous day ended with > 0 scans
            if (remaining > 0) {
              initialScans = DAILY_SCAN_LIMIT; // Reset to full limit
              console.log('[ScanLimit] Initializing new day reset (had scans remaining):', initialScans);
            } else {
              initialScans = 0; // Start new day with 0 scans
              console.log('[ScanLimit] Initializing new day (had 0 scans remaining):', initialScans);
            }
          }
        } else {
           console.warn('[ScanLimit] Invalid stored scan count, resetting to default.');
        }
      } else {
        console.log('[ScanLimit] First launch or no stored data, resetting to default.');
      }
      
      // Set the initial state and update storage for the new day if needed
      setScansRemaining(initialScans);
      await AsyncStorage.setItem(STORAGE_KEY, today); 
      await AsyncStorage.setItem(SCANS_REMAINING_KEY, initialScans.toString());

    } catch (error) {
      console.error('Error initializing scan limit:', error);
      // Fallback to default value on error
      setScansRemaining(DAILY_SCAN_LIMIT);
      try {
        // Attempt to reset storage on error as well
        const todayOnError = new Date().toDateString();
        await AsyncStorage.setItem(STORAGE_KEY, todayOnError);
        await AsyncStorage.setItem(SCANS_REMAINING_KEY, DAILY_SCAN_LIMIT.toString());
      } catch (storageError) {
        console.error('Error resetting storage during fallback:', storageError);
      }
    }
  };

  const resetDaily = async () => {
    try {
      const today = new Date().toDateString();
      // This function is now primarily for manual resets or potentially future use cases
      // The main daily logic is handled in initializeScanLimit
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, today),
        AsyncStorage.setItem(SCANS_REMAINING_KEY, DAILY_SCAN_LIMIT.toString())
      ]);
      setScansRemaining(DAILY_SCAN_LIMIT);
      console.log('[ScanLimit] Manual reset daily limit to:', DAILY_SCAN_LIMIT);
    } catch (error) {
      console.error('Error resetting scan limit:', error);
      // Fallback to default value on error
      setScansRemaining(DAILY_SCAN_LIMIT);
    }
  };

  const useOneScan = async (): Promise<boolean> => {
    // Add validation
    if (typeof scansRemaining !== 'number' || scansRemaining <= 0) {
      console.log('[ScanLimit] No scans remaining:', scansRemaining);
      return false;
    }
    
    try {
      const newCount = Math.max(0, scansRemaining - 1); // Ensure non-negative
      await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
      setScansRemaining(newCount);
      console.log('[ScanLimit] Used scan, remaining:', newCount);
      return true;
    } catch (error) {
      console.error('[ScanLimit] Error updating scan count:', error);
      return false;
    }
  };

  const watchAdForScans = async () => {
    try {
      setIsAdLoading(true);

      if (!adService.getInitializationStatus()) {
        console.log('[ScanLimit] Ads not initialized, proceeding with reward...');
        Alert.alert(
          i18n.t('ads.notInitialized'),
          i18n.t('ads.notInitializedDesc'),
          [{ text: i18n.t('common.ok') }]
        );
        await grantExtraScans();
        return;
      }

      if (!adService.isAdReady()) {
        console.log('[ScanLimit] Ad not ready, proceeding with reward...');
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!adService.isAdReady()) {
            console.log('[ScanLimit] Ad still not ready, granting reward anyway');
            Alert.alert(
              i18n.t('ads.notReady'),
              i18n.t('ads.notReadyDesc'),
              [{ text: i18n.t('common.ok') }]
            );
            await grantExtraScans();
            return;
          }
        } catch (error) {
          console.error('[ScanLimit] Error loading ad, granting reward:', error);
          Alert.alert(
            i18n.t('ads.loadError'),
            i18n.t('ads.loadErrorDesc'),
            [{ text: i18n.t('common.ok') }]
          );
          await grantExtraScans();
          return;
        }
      }

      // Now, attempt to show the ad using the service
      console.log('[ScanLimit] Attempting to show rewarded ad...');
      const success = await adService.showRewardedAd();

      if (success) {
        // Ad was shown and completed successfully
        console.log('[ScanLimit] Ad completed successfully, adding scans');
        await grantExtraScans();
      } else {
        // Ad was not shown successfully (e.g., internal error, network issue during show)
        // OR the user closed the ad without completing the reward requirements.
        console.log('[ScanLimit] Ad was not completed or failed to show. No scans granted.');
        Alert.alert(
          i18n.t('ads.completionError'), // Title: "Ad Not Completed"
          i18n.t('ads.completionErrorDesc'), // Body: "The ad didn't finish. Please try again for more scans."
          [{ text: i18n.t('common.ok') }]
        );
        // Ensure no scans are granted in this case
      }
    } catch (error) {
      // Catch errors specifically from the adService.showRewardedAd() call itself
      // These are likely more severe errors than just the ad not completing.
      console.error('[ScanLimit] Error trying to show rewarded ad:', error);
      Alert.alert(
        i18n.t('ads.showError'), // Title: "Ad Display Error"
        i18n.t('ads.showErrorDesc'), // Body: "Could not display ad. Please check connection and try again."
        [{ text: i18n.t('common.ok') }]
      );
       // Ensure no scans are granted on error
    } finally {
      setIsAdLoading(false);
    }
  };

  // Helper function to grant extra scans
  const grantExtraScans = async () => {
    try {
      // Intentionally allow exceeding DAILY_SCAN_LIMIT if user watches multiple ads
      const newCount = (scansRemaining || 0) + SCANS_PER_AD; 
      await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
      setScansRemaining(newCount);
      Alert.alert(
        i18n.t('ads.rewarded'),
        i18n.t('ads.rewardedDesc', { count: SCANS_PER_AD }), // Pass count to i18n
        [{ text: i18n.t('common.ok') }]
      );
    } catch (error) {
      console.error('[ScanLimit] Error updating scans after reward:', error);
      Alert.alert(
        i18n.t('ads.grantError'),
        i18n.t('ads.grantErrorDesc'),
        [{ text: i18n.t('common.ok') }]
      );
    }
  };

  return (
    <ScanLimitContext.Provider value={{
      scansRemaining,
      resetDaily,
      useOneScan,
      watchAdForScans,
      isAdLoading,
      isAdReady,
    }}>
      {children}
    </ScanLimitContext.Provider>
  );
};

export const useScanLimit = () => useContext(ScanLimitContext);