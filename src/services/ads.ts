import mobileAds, { 
  RewardedAd, 
  TestIds,
  RewardedAdEventType,
  AdEventType,
  AdapterStatus
} from 'react-native-google-mobile-ads';
import { ADMOB_ANDROID_REWARDED_AD_UNIT_ID, ADMOB_IOS_REWARDED_AD_UNIT_ID } from '@env';
import Constants from 'expo-constants';
import type { AdService } from '../types/ads';

class AdServiceImpl implements AdService {
  private rewardedAd: RewardedAd | null = null;

  initialize = async (): Promise<AdapterStatus[] | false> => {
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

      console.log('Creating rewarded ad with unit ID:', adUnitId);
      
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);

      return new Promise<boolean>((resolve) => {
        let hasResolved = false;

        const cleanup = () => {
          if (unsubscribeLoaded) unsubscribeLoaded();
          if (unsubscribeEarned) unsubscribeEarned();
          if (unsubscribeError) unsubscribeError();
          if (unsubscribeClosed) unsubscribeClosed();
        };

        const resolveOnce = (success: boolean) => {
          if (!hasResolved) {
            hasResolved = true;
            resolve(success);
            cleanup();
          }
        };

        const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            console.log('Rewarded ad loaded, attempting to show');
            this.rewardedAd?.show();
          }
        );

        const unsubscribeEarned = this.rewardedAd?.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            console.log('Reward earned');
            resolveOnce(true);
          }
        );

        const unsubscribeError = this.rewardedAd?.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            console.error('Ad error:', error);
            resolveOnce(false);
          }
        );

        const unsubscribeClosed = this.rewardedAd?.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('Ad closed without reward');
            resolveOnce(false);
          }
        );

        console.log('Loading rewarded ad...');
        this.rewardedAd?.load();

        // Add timeout to prevent hanging
        setTimeout(() => {
          resolveOnce(false);
        }, 30000); // 30 second timeout
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

const adService = new AdServiceImpl();
export { adService };
export type { AdService };
