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

      // Log initialization details
      console.log('[AdService] Initializing with:', { 
        appId, 
        rewardedAdUnitId,
        isDev: __DEV__,
        platform: Platform.OS 
      });

      // Initialize the SDK with configuration
      await mobileAds().setRequestConfiguration({
        // This is the COPPA setting
        tagForChildDirectedTreatment: false,
        // This is for GDPR
        tagForUnderAgeOfConsent: false,
        // Set max ad content rating
        maxAdContentRating: MaxAdContentRating.PG,
      });

      await mobileAds().initialize();
      
      // Create the rewarded ad instance
      this.rewardedAd = RewardedAd.createForAdRequest(
        __DEV__ ? TestIds.REWARDED : rewardedAdUnitId,
        {
          requestNonPersonalizedAdsOnly: true,
          keywords: ['health', 'food', 'nutrition']
        }
      );

      // Attempt to load the first ad
      await this.loadRewardedAd();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[AdService] Initialization error:', error);
      return false;
    }
  }

  private async initializeRewardedAd() {
    const adUnitId = __DEV__ 
      ? TestIds.REWARDED 
      : Platform.select({
          ios: ADMOB_IOS_REWARDED_AD_UNIT_ID,
          android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
        });

    if (!adUnitId) throw new Error('No valid Rewarded Ad Unit ID found');

    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['test']
    });

    await this.loadRewardedAd();
  }

  private async initializeInterstitialAd() {
    const adUnitId = __DEV__ 
      ? TestIds.INTERSTITIAL 
      : Platform.select({
          ios: ADMOB_IOS_REWARDED_AD_UNIT_ID, // Replace with actual interstitial ID
          android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID, // Replace with actual interstitial ID
        });

    if (!adUnitId) throw new Error('No valid Interstitial Ad Unit ID found');

    this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    await this.loadInterstitialAd();
  }

  private async loadRewardedAd(): Promise<void> {
    if (!this.rewardedAd || this.isLoading) {
      return this.adLoadPromise || Promise.reject('Rewarded ad not ready');
    }

    this.isLoading = true;
    
    // Get device info for debugging
    const deviceInfo = {
      adUnitId: this.rewardedAd.adUnitId,
      isDev: __DEV__,
      platform: Platform.OS,
    };
    
    console.log('[AdService] Starting to load rewarded ad...', deviceInfo);

    this.adLoadPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Ad load timeout'));
        this.isLoading = false;
      }, 15000);

      const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('[AdService] Rewarded ad loaded successfully');
          this.isLoading = false;
          clearTimeout(timeoutId);
          resolve();
        }
      );

      const unsubscribeError = this.rewardedAd?.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error('[AdService] Rewarded ad loading error:', error);
          // Check if it's a "No fill" error
          if (error.message?.includes('no-fill')) {
            console.log('[AdService] No ads available, will retry later');
            this.isInitialized = true; // Still mark as initialized
            resolve(); // Resolve instead of reject for no-fill
          } else {
            reject(error);
          }
          this.isLoading = false;
          clearTimeout(timeoutId);
        }
      );

      if (unsubscribeLoaded) this.unsubscribeCallbacks.push(unsubscribeLoaded);
      if (unsubscribeError) this.unsubscribeCallbacks.push(unsubscribeError);

      this.rewardedAd?.load();
    });

    return this.adLoadPromise;
  }

  private async loadInterstitialAd(): Promise<void> {
    if (!this.interstitialAd) {
      return Promise.reject('Interstitial ad not initialized');
    }

    return new Promise((resolve, reject) => {
      const unsubscribeLoaded = this.interstitialAd?.addAdEventListener(
        AdEventType.LOADED,
        () => {
          console.log('[AdService] Interstitial ad loaded successfully');
          resolve();
        }
      );

      const unsubscribeError = this.interstitialAd?.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error('[AdService] Interstitial ad loading error:', error);
          reject(error);
        }
      );

      if (unsubscribeLoaded) this.unsubscribeCallbacks.push(unsubscribeLoaded);
      if (unsubscribeError) this.unsubscribeCallbacks.push(unsubscribeError);

      this.interstitialAd?.load();
    });
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.isInitialized || !this.rewardedAd) {
      console.log('[AdService] Cannot show rewarded ad: not initialized');
      return false;
    }

    try {
      await this.adLoadPromise;
      
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
            console.log('[AdService] Rewarded ad closed');
            if (unsubscribeClosed) unsubscribeClosed();
            if (unsubscribeEarned) unsubscribeEarned();
            
            this.loadRewardedAd(); // Preload next ad
            resolve(hasEarnedReward);
          }
        );

        this.rewardedAd?.show().catch(error => {
          console.error('[AdService] Show rewarded ad error:', error);
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

  async showInterstitialAd(): Promise<boolean> {
    if (!this.isInitialized || !this.interstitialAd) {
      console.log('[AdService] Cannot show interstitial ad: not initialized');
      return false;
    }

    try {
      return new Promise((resolve) => {
        const unsubscribeClosed = this.interstitialAd?.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('[AdService] Interstitial ad closed');
            if (unsubscribeClosed) unsubscribeClosed();
            this.loadInterstitialAd(); // Preload next ad
            resolve(true);
          }
        );

        this.interstitialAd?.show().catch(error => {
          console.error('[AdService] Show interstitial ad error:', error);
          if (unsubscribeClosed) unsubscribeClosed();
          resolve(false);
        });
      });
    } catch (error) {
      console.error('[AdService] Error in showInterstitialAd:', error);
      return false;
    }
  }

  cleanup() {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.rewardedAd = null;
    this.interstitialAd = null;
    this.isLoading = false;
    console.log('[AdService] Cleanup completed');
  }

  isAdReady(): boolean {
    return (this.rewardedAd !== null || this.interstitialAd !== null) && !this.isLoading;
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export const adService = new AdService();
