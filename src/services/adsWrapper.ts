import mobileAds, {
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import {
  ADMOB_ANDROID_APP_ID,
  ADMOB_IOS_APP_ID,
} from '@env';

const mobileAdsWrapper = {
  initialize: async () => {
    try {
      const appId = Platform.select({
        ios: ADMOB_IOS_APP_ID,
        android: ADMOB_ANDROID_APP_ID,
        default: '',
      });

      await mobileAds()
        .setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        })
        .then(() => {
          return mobileAds().initialize();
        });

      return true;
    } catch (error) {
      console.error('Error initializing Google Mobile Ads:', error);
      throw error;
    }
  }
};

export default mobileAdsWrapper; 