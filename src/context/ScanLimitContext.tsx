import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adService } from '../services';
import { logRewardedAdWatch } from '../services/analytics';
import { Platform, Alert } from 'react-native';


interface ScanLimitContextType {
  scansRemaining: number;
  resetDaily: () => Promise<void>;
  useOneScan: () => Promise<boolean>;
  watchAdForScans: () => Promise<void>;
  isAdLoading: boolean;
}

const ScanLimitContext = createContext<ScanLimitContextType>({
  scansRemaining: 5,
  resetDaily: async () => {},
  useOneScan: async () => false,
  watchAdForScans: async () => {},
  isAdLoading: false,
});

const DAILY_SCAN_LIMIT = 5;
const SCANS_PER_AD = 3;
const STORAGE_KEY = '@lastResetDate';
const SCANS_REMAINING_KEY = '@scansRemaining';

export const ScanLimitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scansRemaining, setScansRemaining] = useState(DAILY_SCAN_LIMIT);
  const [isAdLoading, setIsAdLoading] = useState(false);

  useEffect(() => {
    initializeScanLimit();
    return () => {
      // Cleanup ads when component unmounts
      adService.cleanup();
    };
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
        console.log('[ScanLimit] Ads not initialized, attempting to initialize...');
        try {
          await adService.initialize();
        } catch (error) {
          console.error('[ScanLimit] Failed to initialize ads:', error);
          Alert.alert(
            'Ads Unavailable',
            'Sorry, ads are not available right now. Please try again later.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      if (!adService.isAdReady()) {
        console.log('[ScanLimit] Ad not ready, attempting to load...');
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!adService.isAdReady()) {
            console.log('[ScanLimit] Ad still not ready after waiting');
            Alert.alert(
              'Ad Not Available',
              'No ads are available right now. Please try again in a few minutes.',
              [{ text: 'OK' }]
            );
            return;
          }
        } catch (error) {
          console.error('[ScanLimit] Error loading ad:', error);
          Alert.alert(
            'Ad Loading Error',
            'Failed to load the ad. Please try again later.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      console.log('[ScanLimit] Attempting to show rewarded ad...');
      const success = await adService.showRewardedAd();

      if (success) {
        console.log('[ScanLimit] Ad completed successfully, adding scans');
        try {
          const newCount = Math.min(DAILY_SCAN_LIMIT, (scansRemaining || 0) + 3);
          await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
          setScansRemaining(newCount);
          Alert.alert(
            'Reward Earned',
            'You earned 3 additional scans!',
            [{ text: 'OK' }]
          );
        } catch (error) {
          console.error('[ScanLimit] Error updating scans after ad:', error);
          Alert.alert(
            'Error',
            'Failed to add reward scans. Please contact support.',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('[ScanLimit] Ad was not completed successfully');
        Alert.alert(
          'Ad Not Completed',
          'Please watch the entire ad to receive additional scans.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ScanLimit] Error in watchAdForScans:', error);
      
      const errorMessage = error instanceof Error && error.message.includes('no-fill')
        ? 'No ads are available right now. Please try again later.'
        : 'There was an error showing the ad. Please try again later.';
      
      Alert.alert(
        'Ad Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsAdLoading(false);
    }
  };

  return (
    <ScanLimitContext.Provider value={{
      scansRemaining,
      resetDaily,
      useOneScan,
      watchAdForScans,
      isAdLoading,
    }}>
      {children}
    </ScanLimitContext.Provider>
  );
};

export const useScanLimit = () => useContext(ScanLimitContext);
