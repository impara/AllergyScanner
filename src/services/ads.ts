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
      console.log('[AdService] Ads not supported on web platform');
      return;
    }

    try {
      console.log('[AdService] Initializing Google Mobile Ads SDK...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await mobileAds().initialize();
          break;
        } catch (error) {
          console.warn(`[AdService] Initialization attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.isInitialized = true;
      console.log('[AdService] SDK initialized successfully');

      const adUnitId = __DEV__ 
        ? TestIds.REWARDED 
        : Platform.select({
            ios: ADMOB_IOS_REWARDED_AD_UNIT_ID,
            android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
          });

      if (!adUnitId) {
        throw new Error('No valid Ad Unit ID found');
      }

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['test']
      });

      let adLoadRetries = 0;
      const maxAdLoadRetries = 2;
      
      while (adLoadRetries < maxAdLoadRetries) {
        try {
          await this.loadAd();
          console.log('[AdService] Initial ad loaded successfully');
          break;
        } catch (error) {
          console.warn(`[AdService] Ad load attempt ${adLoadRetries + 1} failed:`, error);
          adLoadRetries++;
          if (adLoadRetries === maxAdLoadRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('[AdService] Initialization error:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private async loadAd(): Promise<void> {
    if (!this.rewardedAd || this.isLoading) {
      console.log('[AdService] Skip loading: already loading or no ad instance');
      return;
    }

    this.isLoading = true;
    console.log('[AdService] Starting to load ad...');

    return new Promise((resolve, reject) => {
      const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('[AdService] Ad loaded successfully');
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
          console.error('[AdService] Ad loading error:', error);
          this.isLoading = false;
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
      console.log('[AdService] Cannot show ad: not initialized');
      return false;
    }

    if (this.isLoading) {
      console.log('[AdService] Ad is still loading, waiting...');
      try {
        await this.loadAd();
      } catch (error) {
        console.error('[AdService] Failed to load ad:', error);
        return false;
      }
    }

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
          
          this.loadAd().catch(error => {
            console.error('[AdService] Failed to preload next ad:', error);
          });
          
          resolve(hasEarnedReward);
        }
      );

      const unsubscribeError = this.rewardedAd?.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error('[AdService] Show ad error:', error);
          if (unsubscribeClosed) unsubscribeClosed();
          if (unsubscribeEarned) unsubscribeEarned();
          if (unsubscribeError) unsubscribeError();
          resolve(false);
        }
      );

      try {
        this.rewardedAd?.show();
      } catch (error) {
        console.error('[AdService] Error showing ad:', error);
        resolve(false);
      }
    });
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
