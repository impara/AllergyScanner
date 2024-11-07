// src/services/ads.ts
import { Platform } from 'react-native';
import mobileAds, {
  MaxAdContentRating,
  RewardedAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';

const {
  ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
  ADMOB_IOS_REWARDED_AD_UNIT_ID,
} = Constants.expoConfig?.extra || {};

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private unsubscribeCallbacks: (() => void)[] = [];
  public isLoading: boolean = false;
  public isInitialized: boolean = false;

  async initialize() {
    if (Platform.OS === 'web') {
      console.log('Ads not supported on web platform');
      return;
    }

    try {
      // Add delay before initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fix the promise chain
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      try {
        await mobileAds().initialize();
      } catch (initError) {
        console.warn('Ads initialization warning:', initError);
      }

      const adUnitId = Platform.select({
        ios: __DEV__ ? TestIds.REWARDED : ADMOB_IOS_REWARDED_AD_UNIT_ID,
        android: __DEV__ ? TestIds.REWARDED : ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
      });

      if (!adUnitId) {
        throw new Error('No valid ad unit ID found for this platform');
      }

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);

      // Load the first ad with a delay
      setTimeout(() => this.loadAd(), 2000);
      
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.warn('Non-critical error initializing ads:', error);
      this.isInitialized = false;
    }
  }

  private async loadAd(): Promise<void> {
    if (!this.rewardedAd || this.isLoading) return;

    this.isLoading = true;
    return new Promise((resolve, reject) => {
      const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          this.isLoading = false;
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
          this.isLoading = false;
          console.error('Ad loading error:', error);
          if (unsubscribeError) {
            unsubscribeError();
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeError);
          }
          reject(error);
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

  // Add a method to check if ad is ready
  isAdReady(): boolean {
    return this.rewardedAd !== null && !this.isLoading;
  }

  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export const adService = new AdService();
