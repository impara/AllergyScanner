import { Platform } from 'react-native';
import mobileAds, {
  TestIds,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { ADMOB_ANDROID_REWARDED_AD_UNIT_ID, ADMOB_IOS_REWARDED_AD_UNIT_ID } from '@env';

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private unsubscribeCallbacks: (() => void)[] = [];

  async initialize() {
    if (Platform.OS === 'web') {
      console.log('Ads not supported on web platform');
      return;
    }

    try {
      // Initialize the Mobile Ads SDK
      await mobileAds().initialize();

      const adUnitId = Platform.select({
        ios: __DEV__ ? TestIds.REWARDED : ADMOB_IOS_REWARDED_AD_UNIT_ID,
        android: __DEV__ ? TestIds.REWARDED : ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
        default: TestIds.REWARDED,
      });

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);
      
      // Load the first ad
      await this.loadAd();
    } catch (error) {
      console.error('Failed to initialize ads:', error);
    }
  }

  private async loadAd(): Promise<void> {
    if (!this.rewardedAd) return;

    return new Promise((resolve) => {
      const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
        AdEventType.LOADED,
        () => {
          if (unsubscribeLoaded) {
            unsubscribeLoaded();
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeLoaded);
          }
          resolve();
        }
      );

      const unsubscribeError = this.rewardedAd?.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error('Ad loading error:', error);
          if (unsubscribeError) {
            unsubscribeError();
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeError);
          }
          resolve();
        }
      );

      if (unsubscribeLoaded) this.unsubscribeCallbacks.push(unsubscribeLoaded);
      if (unsubscribeError) this.unsubscribeCallbacks.push(unsubscribeError);

      this.rewardedAd?.load();
    });
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.rewardedAd) {
      console.log('Ad not initialized');
      return false;
    }

    return new Promise((resolve) => {
      const unsubscribeEarned = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          if (unsubscribeEarned) {
            unsubscribeEarned();
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeEarned);
          }
          resolve(true);
        }
      );

      const unsubscribeClosed = this.rewardedAd?.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          if (unsubscribeClosed) {
            unsubscribeClosed();
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeClosed);
          }
          this.loadAd(); // Preload the next ad
          resolve(false);
        }
      );

      if (unsubscribeEarned) this.unsubscribeCallbacks.push(unsubscribeEarned);
      if (unsubscribeClosed) this.unsubscribeCallbacks.push(unsubscribeClosed);

      this.rewardedAd?.show();
    });
  }

  cleanup() {
    // Unsubscribe from all event listeners
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
    
    // Clear the rewarded ad
    this.rewardedAd = null;
  }
}

export const adService = new AdService();
