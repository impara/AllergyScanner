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
      console.log('Initializing Google Mobile Ads SDK...');
      
      // Shorter delays for development builds
      const initDelay = __DEV__ ? 1000 : 3000;
      await new Promise(resolve => setTimeout(resolve, initDelay));

      // Set configuration before initialization
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      // Initialize immediately in dev mode
      if (__DEV__) {
        await mobileAds().initialize();
        console.log('Mobile Ads SDK initialized in dev mode');
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          await mobileAds().initialize();
        } catch (initError) {
          console.warn('Ads initialization warning:', initError);
          await new Promise(resolve => setTimeout(resolve, 2000));
          await mobileAds().initialize();
        }
      }

      // Always use test IDs in development
      const adUnitId = __DEV__ 
        ? TestIds.REWARDED 
        : Platform.select({
            ios: ADMOB_IOS_REWARDED_AD_UNIT_ID,
            android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
          });

      if (!adUnitId) {
        throw new Error('No valid Ad Unit ID found for this platform.');
      }

      // Create ad request immediately in dev mode
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['test']
      });

      // Load first ad
      if (__DEV__) {
        this.loadAd();
      } else {
        setTimeout(() => this.loadAd(), 3000);
      }

      this.isInitialized = true;
      console.log('AdMob initialized successfully.');
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
      return false;
    }

    return new Promise((resolve) => {
      let hasEarnedReward = false;

      const unsubscribeEarned = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          console.log('User earned reward');
          hasEarnedReward = true;
        }
      );

      const unsubscribeClosed = this.rewardedAd?.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          if (unsubscribeClosed) unsubscribeClosed();
          if (unsubscribeEarned) unsubscribeEarned();
          this.loadAd(); // Preload next ad
          resolve(hasEarnedReward);
        }
      );

      const unsubscribeError = this.rewardedAd?.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error('Ad error:', error);
          if (unsubscribeClosed) unsubscribeClosed();
          if (unsubscribeEarned) unsubscribeEarned();
          if (unsubscribeError) unsubscribeError();
          resolve(false);
        }
      );

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
