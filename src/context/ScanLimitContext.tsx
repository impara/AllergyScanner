import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adService } from '../services/ads';
import { logRewardedAdWatch } from '../services/analytics';
import { Platform } from 'react-native';


interface ScanLimitContextType {
  scansRemaining: number;
  resetDaily: () => Promise<void>;
  useOneScan: () => Promise<boolean>;
  watchAdForScans: () => Promise<void>;
}

const ScanLimitContext = createContext<ScanLimitContextType>({
  scansRemaining: 5,
  resetDaily: async () => {},
  useOneScan: async () => false,
  watchAdForScans: async () => {},
});

const DAILY_SCAN_LIMIT = 5;
const SCANS_PER_AD = 3;
const STORAGE_KEY = '@lastResetDate';
const SCANS_REMAINING_KEY = '@scansRemaining';

export const ScanLimitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scansRemaining, setScansRemaining] = useState(DAILY_SCAN_LIMIT);

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
      const today = new Date().toDateString();

      if (lastResetDate !== today) {
        await resetDaily();
      } else {
        const remaining = await AsyncStorage.getItem(SCANS_REMAINING_KEY);
        if (remaining !== null) {
          setScansRemaining(parseInt(remaining, 10));
        }
      }
    } catch (error) {
      console.error('Error initializing scan limit:', error);
    }
  };

  const resetDaily = async () => {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(STORAGE_KEY, today);
      await AsyncStorage.setItem(SCANS_REMAINING_KEY, DAILY_SCAN_LIMIT.toString());
      setScansRemaining(DAILY_SCAN_LIMIT);
    } catch (error) {
      console.error('Error resetting scan limit:', error);
    }
  };

  const useOneScan = async (): Promise<boolean> => {
    if (scansRemaining <= 0) return false;
    
    try {
      const newCount = scansRemaining - 1;
      await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
      setScansRemaining(newCount);
      return true;
    } catch (error) {
      console.error('Error updating scan count:', error);
      return false;
    }
  };

  const watchAdForScans = async () => {
    try {
      // For web platform, automatically grant scans without showing ad
      if (Platform.OS === 'web') {
        console.log('[ScanLimit] Auto-granting scans on web platform');
        const newCount = scansRemaining + SCANS_PER_AD;
        await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
        setScansRemaining(newCount);
        return;
      }

      console.log('[ScanLimit] Attempting to show rewarded ad');
      const success = await adService.showRewardedAd();
      console.log('[ScanLimit] Ad result:', success);
      
      await logRewardedAdWatch(success);
      
      if (success) {
        const newCount = scansRemaining + SCANS_PER_AD;
        await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
        setScansRemaining(newCount);
        console.log('[ScanLimit] Scans updated:', newCount);
      }
    } catch (error) {
      console.error('[ScanLimit] Error showing rewarded ad:', error);
    }
  };

  return (
    <ScanLimitContext.Provider value={{
      scansRemaining,
      resetDaily,
      useOneScan,
      watchAdForScans,
    }}>
      {children}
    </ScanLimitContext.Provider>
  );
};

export const useScanLimit = () => useContext(ScanLimitContext);
