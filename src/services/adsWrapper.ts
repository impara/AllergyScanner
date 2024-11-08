import mobileAds, {
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const {
  ADMOB_IOS_APP_ID,
  ADMOB_ANDROID_APP_ID,
} = Constants.expoConfig?.extra || {};

const mobileAdsWrapper = {
  initialize: async () => {
    try {
      const appId = Platform.select({
        ios: ADMOB_IOS_APP_ID,
        android: ADMOB_ANDROID_APP_ID,
        default: '',
      });

      if (!appId) {
        throw new Error('No valid AdMob App ID found');
      }

      console.log('[AdsWrapper] Initializing with App ID:', appId);

      // Set configuration first
      await mobileAds()
        .setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });

      // Initialize with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const result = await mobileAds().initialize();
          console.log('[AdsWrapper] Initialization result:', result);
          return result;
        } catch (error) {
          console.warn(`[AdsWrapper] Initialization attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          if (retryCount === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('[AdsWrapper] Error initializing Google Mobile Ads:', error);
      throw error;
    }
  }
};

export default mobileAdsWrapper; 