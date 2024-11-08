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
  private adLoadPromise: Promise<void> | null = null;

  async initialize() {
    if (Platform.OS === 'web') {
      console.log('[AdService] Ads not supported on web platform');
      return false;
    }

    try {
      console.log('[AdService] Initializing Google Mobile Ads SDK...');
      
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      const result = await Promise.race([
        mobileAds().initialize(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        )
      ]);

      this.isInitialized = true;
      console.log('[AdService] SDK initialized successfully');

      const adUnitId = __DEV__ 
        ? TestIds.REWARDED 
        : Platform.select({
            ios: ADMOB_IOS_REWARDED_AD_UNIT_ID,
            android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
          });

      if (!adUnitId) throw new Error('No valid Ad Unit ID found');

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['test']
      });

      await this.loadAd();
      return true;
    } catch (error) {
      console.error('[AdService] Initialization error:', error);
      this.isInitialized = false;
      return false;
    }
  }

  private async loadAd(): Promise<void> {
    if (!this.rewardedAd || this.isLoading) {
      return this.adLoadPromise || Promise.reject('Ad not ready');
    }

    this.isLoading = true;
    console.log('[AdService] Starting to load ad...');

    this.adLoadPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Ad load timeout'));
        this.isLoading = false;
      }, 15000);

      const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('[AdService] Ad loaded successfully');
          this.isLoading = false;
          clearTimeout(timeoutId);
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
          console.error('[AdService] Ad loading error:', error);
          this.isLoading = false;
          clearTimeout(timeoutId);
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

    return this.adLoadPromise;
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.isInitialized || !this.rewardedAd) {
      console.log('[AdService] Cannot show ad: not initialized');
      return false;
    }

    try {
      await this.adLoadPromise;
      
      console.log('[AdService] Attempting to show ad...');
      return new Promise((resolve) => {
        let hasEarnedReward = false;

        const unsubscribeEarned = this.rewardedAd?.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            console.log('[AdService] User earned reward');
            hasEarnedReward = true;
          }
        );

        const unsubscribeClosed = this.rewardedAd?.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('[AdService] Ad closed');
            if (unsubscribeClosed) unsubscribeClosed();
            if (unsubscribeEarned) unsubscribeEarned();
            
            this.adLoadPromise = this.loadAd();
            
            resolve(hasEarnedReward);
          }
        );

        this.rewardedAd?.show().catch(error => {
          console.error('[AdService] Show ad error:', error);
          if (unsubscribeClosed) unsubscribeClosed();
          if (unsubscribeEarned) unsubscribeEarned();
          resolve(false);
        });
      });
    } catch (error) {
      console.error('[AdService] Error in showRewardedAd:', error);
      return false;
    }
  }

  cleanup() {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.rewardedAd = null;
    this.isLoading = false;
    console.log('[AdService] Cleanup completed');
  }

  isAdReady(): boolean {
    return this.rewardedAd !== null && !this.isLoading;
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export const adService = new AdService();
