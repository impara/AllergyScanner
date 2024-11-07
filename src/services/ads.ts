import { Platform } from 'react-native';
import mobileAds, {
  TestIds,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';

const {
  ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
  ADMOB_IOS_REWARDED_AD_UNIT_ID,
} = (Constants as any).expoConfig?.extra || {};

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private unsubscribeCallbacks: (() => void)[] = [];
  private isInitialized: boolean = false;

  async initialize() {
    if (Platform.OS === 'web') {
      console.log('Ads not supported on web platform');
      return;
    }

    try {
      // Initialize the Mobile Ads SDK
      await mobileAds()
        .setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        })
        .then(() => {
          return mobileAds().initialize();
        });

      const adUnitId = Platform.select({
        ios: __DEV__ ? TestIds.REWARDED : ADMOB_IOS_REWARDED_AD_UNIT_ID,
        android: __DEV__ ? TestIds.REWARDED : ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
        default: TestIds.REWARDED,
      });

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);
      
      // Load the first ad
      await this.loadAd();
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ads:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private async loadAd(): Promise<void> {
    if (!this.rewardedAd) return;

    return new Promise((resolve) => {
      const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.LOADED,
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
    if (!this.isInitialized || !this.rewardedAd) {
      console.log('Ad not initialized');
      // Try to reinitialize
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to reinitialize ads:', error);
        return false;
      }
      if (!this.isInitialized || !this.rewardedAd) {
        return false;
      }
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
