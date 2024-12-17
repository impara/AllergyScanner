import { useCallback, useRef } from 'react';
import { adService } from '../services/ads';

// Environment detection
const isProduction = !__DEV__;

// Frequency settings based on environment
const FREQUENCY_SETTINGS = {
  MIN_INTERVAL_BETWEEN_ADS: isProduction ? 120000 : 30000, // 2 min prod, 30 sec dev
  SESSION_AD_LIMIT: isProduction ? 12 : 20, // 12 prod, 20 dev
  INITIAL_AD_DELAY: isProduction ? 45000 : 15000, // 45 sec prod, 15 sec dev
  MIN_TIME_IN_APP: isProduction ? 90000 : 20000, // 90 sec prod, 20 sec dev
};

export const useInterstitialAd = () => {
  const lastAdTimeRef = useRef<number>(0);
  const adCountRef = useRef<number>(0);
  const initialDelayPassedRef = useRef<boolean>(false);
  const firstAdShownRef = useRef<boolean>(false);

  const showInterstitialAd = useCallback(async () => {
    const now = Date.now();
    const timeSinceStart = now - global.appStartTime;

    // Log frequency control in development
    if (!isProduction) {
      console.log('[AdFrequency]', {
        timeSinceStart,
        timeSinceLastAd: now - lastAdTimeRef.current,
        adCount: adCountRef.current,
        isFirstAd: !firstAdShownRef.current,
        initialDelayPassed: initialDelayPassedRef.current
      });
    }

    // Check minimum time in app
    if (!firstAdShownRef.current && timeSinceStart < FREQUENCY_SETTINGS.MIN_TIME_IN_APP) {
      !isProduction && console.log('[AdFrequency] Too soon for first ad');
      return false;
    }

    // Check initial delay
    if (!initialDelayPassedRef.current && timeSinceStart < FREQUENCY_SETTINGS.INITIAL_AD_DELAY) {
      !isProduction && console.log('[AdFrequency] Initial delay not passed');
      return false;
    }

    // Check frequency cap
    const timeSinceLastAd = now - lastAdTimeRef.current;
    if (timeSinceLastAd < FREQUENCY_SETTINGS.MIN_INTERVAL_BETWEEN_ADS) {
      !isProduction && console.log('[AdFrequency] Frequency cap hit');
      return false;
    }

    // Check session limit
    if (adCountRef.current >= FREQUENCY_SETTINGS.SESSION_AD_LIMIT) {
      !isProduction && console.log('[AdFrequency] Session limit reached');
      return false;
    }

    try {
      const success = await adService.showInterstitialAd();
      if (success) {
        lastAdTimeRef.current = now;
        adCountRef.current += 1;
        firstAdShownRef.current = true;
        initialDelayPassedRef.current = true;
        !isProduction && console.log('[AdFrequency] Ad shown successfully', {
          totalAdsShown: adCountRef.current
        });
      }
      return success;
    } catch (error) {
      console.error('[useInterstitialAd] Error showing ad:', error);
      return false;
    }
  }, []);

  return { showInterstitialAd };
}; 