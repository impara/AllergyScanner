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

      if (!lastResetDate || lastResetDate !== today) {
        // It's a new day or first launch, reset to default
        await resetDaily();
      } else if (storedScansRemaining !== null) {
        // Same day, load stored value
        const remaining = parseInt(storedScansRemaining, 10);
        // Validate the parsed value
        if (!isNaN(remaining) && remaining >= 0) {
          setScansRemaining(remaining);
        } else {
          // Invalid stored value, reset to default
          await resetDaily();
        }
      } else {
        // No stored value but same day, reset to default
        await resetDaily();
      }
    } catch (error) {
      console.error('Error initializing scan limit:', error);
      // Fallback to default value on error
      setScansRemaining(DAILY_SCAN_LIMIT);
    }
  };

  const resetDaily = async () => {
    try {
      const today = new Date().toDateString();
      // Set both values atomically
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, today),
        AsyncStorage.setItem(SCANS_REMAINING_KEY, DAILY_SCAN_LIMIT.toString())
      ]);
      setScansRemaining(DAILY_SCAN_LIMIT);
      console.log('[ScanLimit] Reset daily limit to:', DAILY_SCAN_LIMIT);
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

      console.log('[ScanLimit] Attempting to show rewarded ad...');
      const success = await adService.showRewardedAd();

      if (success) {
        console.log('[ScanLimit] Ad completed successfully, adding scans');
        await grantExtraScans();
      } else {
        console.log('[ScanLimit] Ad was not completed, granting reward anyway');
        Alert.alert(
          i18n.t('ads.completionError'),
          i18n.t('ads.completionErrorDesc'),
          [{ text: i18n.t('common.ok') }]
        );
        await grantExtraScans();
      }
    } catch (error) {
      console.error('[ScanLimit] Error in watchAdForScans:', error);
      Alert.alert(
        i18n.t('ads.loadError'),
        i18n.t('ads.loadErrorDesc'),
        [{ text: i18n.t('common.ok') }]
      );
      await grantExtraScans();
    } finally {
      setIsAdLoading(false);
    }
  };

  // Helper function to grant extra scans
  const grantExtraScans = async () => {
    try {
      const newCount = Math.min(DAILY_SCAN_LIMIT, (scansRemaining || 0) + SCANS_PER_AD);
      await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
      setScansRemaining(newCount);
      Alert.alert(
        i18n.t('ads.rewarded'),
        i18n.t('ads.rewardedDesc'),
        [{ text: i18n.t('common.ok') }]
      );
    } catch (error) {
      console.error('[ScanLimit] Error updating scans:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('ads.errorDesc'),
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
