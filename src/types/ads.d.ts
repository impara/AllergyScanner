import mobileAds, { 
  RewardedAd, 
  TestIds,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { ADMOB_ANDROID_REWARDED_AD_UNIT_ID, ADMOB_IOS_REWARDED_AD_UNIT_ID } from '@env';
import Constants from 'expo-constants';

class AdService {
  private rewardedAd: RewardedAd | null = null;

  initialize = async () => {
    try {
      const result = await mobileAds().initialize();
      console.log('Mobile Ads initialized successfully');
      return result;
    } catch (error) {
      console.error('Error initializing mobile ads:', error);
      return false;
    }
  };

  showRewardedAd = async () => {
    try {
      const adUnitId = __DEV__ 
        ? TestIds.REWARDED 
        : Constants.platform?.ios 
          ? ADMOB_IOS_REWARDED_AD_UNIT_ID 
          : ADMOB_ANDROID_REWARDED_AD_UNIT_ID;

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);

      return new Promise<boolean>((resolve) => {
        this.rewardedAd?.load();

        const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            this.rewardedAd?.show();
          }
        );

        const unsubscribeEarned = this.rewardedAd?.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            resolve(true);
            cleanup();
          }
        );

        const unsubscribeError = this.rewardedAd?.addAdEventListener(
          AdEventType.ERROR,
          () => {
            resolve(false);
            cleanup();
          }
        );

        const cleanup = () => {
          unsubscribeLoaded?.();
          unsubscribeEarned?.();
          unsubscribeError?.();
        };
      });
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return false;
    }
  };

  cleanup = () => {
    if (this.rewardedAd) {
      this.rewardedAd = null;
    }
  };
}

export const adService = new AdService();
