// src/services/ads.ts
import { Platform } from 'react-native';
import mobileAds, {
  MaxAdContentRating,
  RewardedAd,
  InterstitialAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';

const {
  ADMOB_ANDROID_APP_ID,
  ADMOB_IOS_APP_ID,
  ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
  ADMOB_IOS_REWARDED_AD_UNIT_ID,
} = Constants.expoConfig?.extra || {};

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private interstitialAd: InterstitialAd | null = null;
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
      const appId = Platform.select({
        ios: Constants.expoConfig?.extra?.ADMOB_IOS_APP_ID,
        android: Constants.expoConfig?.extra?.ADMOB_ANDROID_APP_ID,
      });

      console.log('[AdService] Initializing with App ID:', appId);

      const rewardedAdUnitId = Platform.select({
        ios: Constants.expoConfig?.extra?.ADMOB_IOS_REWARDED_AD_UNIT_ID,
        android: Constants.expoConfig?.extra?.ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
      });

      if (!appId || !rewardedAdUnitId) {
        console.error('[AdService] Missing required AdMob IDs:', { 
          appId, 
          rewardedAdUnitId,
          environment: __DEV__ ? 'development' : 'production'
        });
        return false;
      }

      // Initialize the SDK with configuration
      await mobileAds().setRequestConfiguration({
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: MaxAdContentRating.PG,
      });

      const initStatus = await mobileAds().initialize();
      console.log('[AdService] SDK initialization status:', initStatus);

      // Create and load the rewarded ad
      const adUnitId = __DEV__ ? TestIds.REWARDED : rewardedAdUnitId;
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['health', 'food', 'nutrition']
      });

      try {
        await this.loadRewardedAd();
        this.isInitialized = true;
        return true;
      } catch (error: any) {
        console.error('[AdService] Initial ad load failed:', error);
        if (error.message?.includes('no-fill')) {
          this.isInitialized = true;
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('[AdService] Initialization error:', error);
      return false;
    }
  }

  private async loadRewardedAd(): Promise<void> {
    if (!this.rewardedAd) {
      return Promise.reject(new Error('Rewarded ad not initialized'));
    }

    if (this.isLoading) {
      return this.adLoadPromise || Promise.reject(new Error('Ad load already in progress'));
    }

    this.isLoading = true;
    console.log('[AdService] Starting to load rewarded ad...', {
      adUnitId: this.rewardedAd.adUnitId,
      isDev: __DEV__,
      platform: Platform.OS,
    });

    this.adLoadPromise = new Promise((resolve, reject) => {
      const cleanup = () => {
        this.isLoading = false;
        this.adLoadPromise = null;
        if (timeoutId) clearTimeout(timeoutId);
        if (unsubscribeLoaded) {
          this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeLoaded);
          unsubscribeLoaded();
        }
        if (unsubscribeError) {
          this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeError);
          unsubscribeError();
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Ad load timeout'));
      }, 15000);

      const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('[AdService] Rewarded ad loaded successfully');
          cleanup();
          resolve();
        }
      );

      const unsubscribeError = this.rewardedAd?.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error('[AdService] Rewarded ad loading error:', error);
          cleanup();
          if (error.message?.includes('no-fill')) {
            resolve(); // Resolve for no-fill errors
          } else {
            reject(error);
          }
        }
      );

      this.rewardedAd?.load();

      if (unsubscribeLoaded) this.unsubscribeCallbacks.push(unsubscribeLoaded);
      if (unsubscribeError) this.unsubscribeCallbacks.push(unsubscribeError);
    });

    return this.adLoadPromise;
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.isInitialized || !this.rewardedAd) {
      console.log('[AdService] Cannot show rewarded ad: not initialized');
      return false;
    }

    try {
      // Add loading state check
      if (this.isLoading) {
        console.log('[AdService] Ad is currently loading');
        await this.adLoadPromise;
      }

      if (!this.rewardedAd.loaded) {
        console.log('[AdService] Ad not loaded, attempting to load...');
        await this.loadRewardedAd();
        
        if (!this.rewardedAd.loaded) {
          console.log('[AdService] Failed to load ad');
          return false;
        }
      }

      return new Promise((resolve) => {
        let hasEarnedReward = false;
        let hasResolved = false;

        const cleanup = () => {
          if (unsubscribeEarned) {
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeEarned);
            unsubscribeEarned();
          }
          if (unsubscribeClosed) {
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeClosed);
            unsubscribeClosed();
          }
          if (unsubscribeError) {
            this.unsubscribeCallbacks = this.unsubscribeCallbacks.filter(cb => cb !== unsubscribeError);
            unsubscribeError();
          }
          if (!hasResolved) {
            hasResolved = true;
            resolve(hasEarnedReward);
          }
          // Attempt to preload next ad
          this.loadRewardedAd().catch(error => 
            console.error('[AdService] Failed to preload next ad:', error)
          );
        };

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
            console.log('[AdService] Rewarded ad closed');
            cleanup();
          }
        );

        const unsubscribeError = this.rewardedAd?.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            console.error('[AdService] Show rewarded ad error:', error);
            cleanup();
          }
        );

        this.rewardedAd?.show().catch(error => {
          console.error('[AdService] Show rewarded ad error:', error);
          cleanup();
        });

        if (unsubscribeEarned) this.unsubscribeCallbacks.push(unsubscribeEarned);
        if (unsubscribeClosed) this.unsubscribeCallbacks.push(unsubscribeClosed);
        if (unsubscribeError) this.unsubscribeCallbacks.push(unsubscribeError);
      });
    } catch (error) {
      console.error('[AdService] Error in showRewardedAd:', error);
      return false;
    }
  }

  cleanup() {
    try {
      this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    } catch (error) {
      console.error('[AdService] Cleanup error');
    } finally {
      this.unsubscribeCallbacks = [];
      this.rewardedAd = null;
      this.interstitialAd = null;
      this.isLoading = false;
      this.isInitialized = false;
      this.adLoadPromise = null;
    }
  }

  isAdReady(): boolean {
    return this.rewardedAd?.loaded ?? false;
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  private resetState() {
    this.isLoading = false;
    this.adLoadPromise = null;
  }

  getLoadingStatus(): boolean {
    return this.isLoading;
  }

  getAdUnitId(): string | undefined {
    return this.rewardedAd?.adUnitId;
  }

  private handleError(error: any, context: string) {
    if (error.message?.includes('no-fill')) return;
    this.cleanup();
    this.isInitialized = false;
  }
}

export const adService = new AdService();
