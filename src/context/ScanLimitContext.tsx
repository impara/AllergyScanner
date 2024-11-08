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
      // First check if ads are available
      if (Platform.OS === 'web' || !adService.getInitializationStatus()) {
        console.log('[ScanLimit] Ads not available, auto-granting scans');
        const newCount = scansRemaining + SCANS_PER_AD;
        await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
        setScansRemaining(newCount);
        return;
      }

      // Show the rewarded ad
      console.log('[ScanLimit] Showing rewarded ad...');
      const success = await adService.showRewardedAd();
      console.log('[ScanLimit] Ad result:', success);
      
      // Log the ad watch attempt
      await logRewardedAdWatch(success);
      
      if (success) {
        // Calculate new scan count
        const currentScans = await AsyncStorage.getItem(SCANS_REMAINING_KEY);
        const currentCount = currentScans ? parseInt(currentScans, 10) : 0;
        const newCount = currentCount + SCANS_PER_AD;
        
        // Update storage and state
        await AsyncStorage.setItem(SCANS_REMAINING_KEY, newCount.toString());
        setScansRemaining(newCount);
        console.log('[ScanLimit] Added scans. New total:', newCount);
      } else {
        console.log('[ScanLimit] Ad was not completed successfully');
      }
    } catch (error) {
      console.error('[ScanLimit] Error in watchAdForScans:', error);
      // Don't auto-grant scans on error anymore - this could be exploited
      Alert.alert(
        'Error',
        'There was an error showing the ad. Please try again.'
      );
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
