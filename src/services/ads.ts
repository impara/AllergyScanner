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
import { logAdEvent, AdType, AdEvent, AdEventParams } from './analytics';
import type { AdError } from '../types/ads';

// Initialize app start time
if (typeof global.appStartTime === 'undefined') {
  global.appStartTime = Date.now();
}

const {
  ADMOB_ANDROID_APP_ID,
  ADMOB_IOS_APP_ID,
  ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
  ADMOB_IOS_REWARDED_AD_UNIT_ID,
  ADMOB_ANDROID_INTERSTITIAL_AD_UNIT_ID,
  ADMOB_IOS_INTERSTITIAL_AD_UNIT_ID,
} = Constants.expoConfig?.extra || {};

const MIN_INTERSTITIAL_INTERVAL = 60000; // 1 minute minimum between interstitials

class AdService {
  private isInitialized = false;
  private isInitializing = false;
  private initializationAttempts = 0;
  private readonly MAX_INIT_ATTEMPTS = 3;
  private readonly INIT_RETRY_DELAY = 2000;
  private readonly AD_LOAD_TIMEOUT = 30000; // Increased timeout for initial load
  private isLoading = false;
  private rewardedAd: RewardedAd | null = null;
  private interstitialAd: InterstitialAd | null = null;
  private adLoadPromise: Promise<void> | null = null;
  private interstitialLoadPromise: Promise<void> | null = null;
  private unsubscribeCallbacks: Array<() => void> = [];
  private lastInterstitialShow = 0;
  private totalAdsShown = 0;
  private initializationPromise: Promise<boolean> | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.initializationPromise) return this.initializationPromise;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.initializationAttempts++;

    this.initializationPromise = (async () => {
      try {
        console.log('Initializing AdMob...', {
          appId: Platform.select({
            android: ADMOB_ANDROID_APP_ID,
            ios: ADMOB_IOS_APP_ID,
          }),
          hasRewardedId: Boolean(this.getRewardedAdUnitId()),
          attempt: this.initializationAttempts
        });

        await mobileAds().initialize();
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: true,
          tagForUnderAgeOfConsent: true,
        });

        // Initialize ads sequentially to avoid race conditions
        this.rewardedAd = RewardedAd.createForAdRequest(this.getRewardedAdUnitId(), {
          requestNonPersonalizedAdsOnly: true,
          keywords: ['health', 'food', 'nutrition']
        });

        this.interstitialAd = InterstitialAd.createForAdRequest(this.getInterstitialAdUnitId(), {
          requestNonPersonalizedAdsOnly: true,
          keywords: ['health', 'food', 'nutrition']
        });

        // Load ads one at a time with retry logic
        await this.loadInitialAds();

        this.isInitialized = true;
        this.isInitializing = false;
        console.log('AdMob initialization result:', true);
        return true;
      } catch (error) {
        console.warn(`AdMob initialization attempt ${this.initializationAttempts} failed:`, error);
        this.isInitializing = false;

        if (this.initializationAttempts < this.MAX_INIT_ATTEMPTS) {
          // Retry initialization after delay
          await new Promise(resolve => setTimeout(resolve, this.INIT_RETRY_DELAY));
          this.initializationPromise = null;
          return this.initialize();
        }

        return false;
      }
    })();

    return this.initializationPromise;
  }

  private async loadInitialAds(): Promise<void> {
    try {
      // Load rewarded ad first with retries
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await this.logAdEventWithMetadata(AdEvent.LOAD_ATTEMPT, {
            ad_type: AdType.REWARDED,
            ad_unit_id: this.getRewardedAdUnitId(),
            trigger_location: 'initialization',
            attempt_number: attempt
          });
          await this.loadRewardedAd();
          break;
        } catch (error) {
          console.error(`[AdService] Initial rewarded ad load error (attempt ${attempt}):`, error);
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // Then load interstitial ad with retries
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await this.logAdEventWithMetadata(AdEvent.LOAD_ATTEMPT, {
            ad_type: AdType.INTERSTITIAL,
            ad_unit_id: this.getInterstitialAdUnitId(),
            trigger_location: 'initialization',
            attempt_number: attempt
          });
          await this.loadInterstitialAd();
          break;
        } catch (error) {
          console.error(`[AdService] Initial interstitial ad load error (attempt ${attempt}):`, error);
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    } catch (error) {
      console.error('[AdService] Initial ad load error:', error);
      throw error;
    }
  }

  private getRewardedAdUnitId(): string {
    return __DEV__
      ? TestIds.REWARDED
      : Platform.select({
          android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
          ios: ADMOB_IOS_REWARDED_AD_UNIT_ID,
          default: TestIds.REWARDED,
        }) || TestIds.REWARDED;
  }

  private getInterstitialAdUnitId(): string {
    return __DEV__
      ? TestIds.INTERSTITIAL
      : Platform.select({
          android: ADMOB_ANDROID_INTERSTITIAL_AD_UNIT_ID,
          ios: ADMOB_IOS_INTERSTITIAL_AD_UNIT_ID,
          default: TestIds.INTERSTITIAL,
        }) || TestIds.INTERSTITIAL;
  }

  private async logAdEventWithMetadata(event: AdEvent, params: AdEventParams): Promise<void> {
    const timeSinceAppStart = global.appStartTime ? Date.now() - global.appStartTime : undefined;
    const timeSinceLastAd = this.lastInterstitialShow ? Date.now() - this.lastInterstitialShow : undefined;

    await logAdEvent(event, {
      ...params,
      time_since_app_start: timeSinceAppStart,
      time_since_last_ad: timeSinceLastAd,
      total_ads_shown: this.totalAdsShown
    });
  }

  private createAdLoadPromise(
    ad: RewardedAd | InterstitialAd,
    adType: AdType,
    location: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.isLoading = false;
        if (timeoutId) clearTimeout(timeoutId);
        if (unsubscribeLoaded) unsubscribeLoaded();
        if (unsubscribeError) unsubscribeError();
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Ad load timeout'));
      }, 15000);

      let unsubscribeLoaded: (() => void) | null = null;
      let unsubscribeError: (() => void) | null = null;

      const handleError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorCode = (error as { code?: string })?.code || 'unknown';
        
        void (async () => {
          await this.logAdEventWithMetadata(AdEvent.LOAD_FAILURE, {
            ad_type: adType,
            ad_unit_id: ad.adUnitId,
            error_message: errorMessage,
            error_code: errorCode,
            trigger_location: location
          });
          cleanup();
          if (errorMessage.includes('no-fill')) {
            resolve();
          } else {
            reject(new Error(errorMessage));
          }
        })();
      };

      if (adType === AdType.REWARDED && ad instanceof RewardedAd) {
        unsubscribeLoaded = ad.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            void (async () => {
              await this.logAdEventWithMetadata(AdEvent.LOAD_SUCCESS, {
                ad_type: adType,
                ad_unit_id: ad.adUnitId,
                trigger_location: location
              });
              cleanup();
              resolve();
            })();
          }
        );

        unsubscribeError = ad.addAdEventListener(
          AdEventType.ERROR,
          handleError
        );
      } else if (ad instanceof InterstitialAd) {
        unsubscribeLoaded = ad.addAdEventListener(
          AdEventType.LOADED,
          () => {
            void (async () => {
              await this.logAdEventWithMetadata(AdEvent.LOAD_SUCCESS, {
                ad_type: adType,
                ad_unit_id: ad.adUnitId,
                trigger_location: location
              });
              cleanup();
              resolve();
            })();
          }
        );

        unsubscribeError = ad.addAdEventListener(
          AdEventType.ERROR,
          handleError
        );
      }

      if (unsubscribeLoaded) this.unsubscribeCallbacks.push(unsubscribeLoaded);
      if (unsubscribeError) this.unsubscribeCallbacks.push(unsubscribeError);
      ad.load();
    });
  }

  private async loadRewardedAd(): Promise<void> {
    if (!this.rewardedAd) return Promise.reject(new Error('Rewarded ad not initialized'));
    if (this.adLoadPromise) return this.adLoadPromise;
    if (this.isLoading) return Promise.reject(new Error('Ad load already in progress'));

    this.isLoading = true;
    this.adLoadPromise = this.createAdLoadPromise(this.rewardedAd, AdType.REWARDED, 'load_rewarded');
    return this.adLoadPromise;
  }

  private async loadInterstitialAd(): Promise<void> {
    if (!this.interstitialAd) return Promise.reject(new Error('Interstitial ad not initialized'));
    if (this.interstitialLoadPromise) return this.interstitialLoadPromise;
    if (this.isLoading) return Promise.reject(new Error('Ad load already in progress'));

    this.isLoading = true;
    this.interstitialLoadPromise = this.createAdLoadPromise(
      this.interstitialAd,
      AdType.INTERSTITIAL,
      'load_interstitial'
    );
    return this.interstitialLoadPromise;
  }

  private async showAd(
    ad: RewardedAd | InterstitialAd,
    adType: AdType,
    location: string
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.isInitialized || !ad) {
        console.warn(`[AdService] Attempted to show ${adType} ad before initialization or without ad object.`)
        await this.logAdEventWithMetadata(AdEvent.SHOW_FAILURE, {
          ad_type: adType,
          ad_unit_id: ad?.adUnitId,
          error_message: 'Not initialized or ad object missing',
          trigger_location: location
        });
        return resolve(false);
      }

      // Check if ad is already loaded, if not, attempt to load it now
      if (!ad.loaded) {
        console.log(`[AdService] ${adType} ad not loaded. Attempting to load before showing...`);
        try {
          if (adType === AdType.REWARDED) {
            await this.loadRewardedAd();
          } else {
            await this.loadInterstitialAd();
          }
          if (!ad.loaded) {
             console.warn(`[AdService] Failed to load ${adType} ad immediately before showing.`);
             await this.logAdEventWithMetadata(AdEvent.SHOW_FAILURE, {
                ad_type: adType,
                ad_unit_id: ad.adUnitId,
                error_message: 'Failed to load ad before show',
                trigger_location: location
              });
             return resolve(false); // Resolve false if still not loaded
          }
        } catch (error: any) {
          console.error(`[AdService] Error loading ${adType} ad immediately before show:`, error);
          await this.logAdEventWithMetadata(AdEvent.SHOW_FAILURE, {
            ad_type: adType,
            ad_unit_id: ad.adUnitId,
            error_message: `Load error before show: ${error.message}`,
            error_code: (error as AdError).code,
            trigger_location: location
          });
          return resolve(false); // Resolve false on load error
        }
      }

      let adShown = false;
      let earnedReward = false;

      const cleanup = async () => {
        console.log(`[AdService] Cleaning up listeners for ${adType} show.`);
        if (unsubscribeError) unsubscribeError();
        if (unsubscribeOpened) unsubscribeOpened();
        if (unsubscribeClosed) unsubscribeClosed();
        if (unsubscribeRewarded) unsubscribeRewarded();

        // --- Proactive Reloading Logic --- 
        if (adType === AdType.REWARDED) {
          // Regardless of whether the ad was shown successfully or closed early,
          // attempt to load the next one immediately.
          console.log("[AdService] Triggering proactive reload for next rewarded ad.");
          try {
            // Don't await this, let it run in the background
            this.loadRewardedAd().catch(err => {
              console.warn("[AdService] Proactive rewarded ad reload failed:", err);
            });
          } catch (err) {
            // Catch potential synchronous errors from loadRewardedAd if any
             console.warn("[AdService] Error initiating proactive rewarded ad reload:", err);
          }
        }
        // --- End Proactive Reloading Logic ---
      };

      let unsubscribeError: (() => void) | null = null;
      let unsubscribeOpened: (() => void) | null = null;
      let unsubscribeClosed: (() => void) | null = null;
      let unsubscribeRewarded: (() => void) | null = null;

      const handleShowError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown show error';
        const errorCode = (error as { code?: string })?.code || 'unknown';
        console.error(`[AdService] Failed to show ${adType} ad:`, error);
        void (async () => {
          await this.logAdEventWithMetadata(AdEvent.SHOW_FAILURE, {
            ad_type: adType,
            ad_unit_id: ad.adUnitId,
            error_message: errorMessage,
            error_code: errorCode,
            trigger_location: location
          });
          await cleanup();
          resolve(false); // Ad failed to show
        })();
      };
      
      // --- Listener Setup --- 
      if (adType === AdType.REWARDED && ad instanceof RewardedAd) {
        // Listeners specific to RewardedAd
        const rewardedAd = ad as RewardedAd; // Assert type for clarity
        
        unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, handleShowError);
        unsubscribeOpened = rewardedAd.addAdEventListener(AdEventType.OPENED, () => {
            console.log(`[AdService] Rewarded ad opened.`);
            adShown = true;
            this.totalAdsShown++;
        });
        unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
            console.log(`[AdService] Rewarded ad closed.`);
            void (async () => {
               await this.logAdEventWithMetadata(AdEvent.CLOSED, {
                ad_type: adType,
                ad_unit_id: rewardedAd.adUnitId,
                trigger_location: location
              });
              await cleanup();
              resolve(earnedReward); // Resolve with reward status for rewarded ads
            })();
        });
        unsubscribeRewarded = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
            console.log(`[AdService] User earned reward:`, reward);
            earnedReward = true;
            void this.logAdEventWithMetadata(AdEvent.REWARD_EARNED, {
                ad_type: adType,
                ad_unit_id: rewardedAd.adUnitId,
                trigger_location: location
            });
        });

      } else if (adType === AdType.INTERSTITIAL && ad instanceof InterstitialAd) {
        // Listeners specific to InterstitialAd
        const interstitialAd = ad as InterstitialAd; // Assert type

        unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, handleShowError);
        unsubscribeOpened = interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
            console.log(`[AdService] Interstitial ad opened.`);
            adShown = true;
            this.totalAdsShown++;
            this.lastInterstitialShow = Date.now();
        });
        unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
            console.log(`[AdService] Interstitial ad closed.`);
            void (async () => {
                await this.logAdEventWithMetadata(AdEvent.CLOSED, {
                    ad_type: adType,
                    ad_unit_id: interstitialAd.adUnitId,
                    trigger_location: location
                });
                await cleanup();
                resolve(adShown); // Resolve with shown status for interstitial
            })();
        });
      } else {
          // Should not happen if ad object and adType are consistent
          console.error("[AdService] Mismatch between adType and ad object type in listener setup.");
          return resolve(false);
      }
      // --- End Listener Setup ---

      try {
        console.log(`[AdService] Attempting to show ${adType} ad.`);
        await ad.show();
        // If ad.show() resolves without error, it means the show process initiated.
        // The actual success/failure/reward is handled by the listeners.
        // We don't resolve the promise here; it's resolved in the CLOSED listener.
      } catch (error) {
        // This catch block might handle synchronous errors from ad.show()
        handleShowError(error);
      }
    });
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.isInitialized || !this.rewardedAd) return false;
    return this.showAd(this.rewardedAd, AdType.REWARDED, 'show_rewarded');
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.isInitialized || !this.interstitialAd) return false;
    if (Date.now() - this.lastInterstitialShow < MIN_INTERSTITIAL_INTERVAL) return false;
    return this.showAd(this.interstitialAd, AdType.INTERSTITIAL, 'show_interstitial');
  }

  cleanup(): void {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.rewardedAd = null;
    this.interstitialAd = null;
    this.isLoading = false;
    this.isInitialized = false;
    this.adLoadPromise = null;
    this.interstitialLoadPromise = null;
  }

  isAdReady(): boolean {
    return this.rewardedAd?.loaded ?? false;
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  getLoadingStatus(): boolean {
    return this.isLoading;
  }

  getAdUnitId(): string | undefined {
    return this.rewardedAd?.adUnitId;
  }

  resetState(): void {
    this.isLoading = false;
    this.adLoadPromise = null;
  }

  handleError(error: Error | unknown, context: string): void {
    if (error instanceof Error && error.message?.includes('no-fill')) return;
    this.cleanup();
    this.isInitialized = false;
  }

  getLastInterstitialShowTime(): number {
    return this.lastInterstitialShow;
  }

  getTotalAdsShown(): number {
    return this.totalAdsShown;
  }
}

export const adService = new AdService();
