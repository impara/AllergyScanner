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
        ios: ADMOB_IOS_APP_ID,
        android: ADMOB_ANDROID_APP_ID,
        default: '',
      });

      if (!appId) {
        throw new Error('No valid AdMob App ID found');
      }

      console.log('[AdService] Initializing with App ID:', appId);

      // Set configuration
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      // Initialize with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const result = await Promise.race([
            mobileAds().initialize(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Initialization timeout')), 5000)
            )
          ]);

          console.log('[AdService] SDK initialized successfully');
          this.isInitialized = true;

          // Initialize Rewarded Ad
          await this.initializeRewardedAd();
          
          // Initialize Interstitial Ad
          await this.initializeInterstitialAd();

          return result;
        } catch (error) {
          console.warn(`[AdService] Initialization attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          if (retryCount === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      return false;
    } catch (error) {
      console.error('[AdService] Initialization error:', error);
      this.isInitialized = false;
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
    console.log('[AdService] Starting to load rewarded ad...');

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
          this.isLoading = false;
          clearTimeout(timeoutId);
          reject(error);
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
