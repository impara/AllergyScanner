import { Platform } from 'react-native';
import {
  AdEventType,
  RewardedAdEventType,
  RewardedInterstitialAd,
} from 'react-native-google-mobile-ads';
import {
  ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
  ADMOB_IOS_REWARDED_AD_UNIT_ID,
} from '@env';
import mobileAdsWrapper from './adsWrapper';

class AdService {
  private rewardedAd: RewardedInterstitialAd | null = null;
  private isInitialized: boolean = false;
  private isLoading: boolean = false;

  async initialize() {
    if (Platform.OS === 'web') return;

    try {
      // Initialize Mobile Ads SDK first
      await mobileAdsWrapper.initialize();

      const adUnitId = Platform.select({
        ios: ADMOB_IOS_REWARDED_AD_UNIT_ID,
        android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
        default: '',
      });

      this.rewardedAd = RewardedInterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['health', 'food', 'nutrition'],
      });

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      throw error; // Propagate the error for better debugging
    }
  }

  async showRewardedAd(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    if (!this.isInitialized || !this.rewardedAd) return false;
    if (this.isLoading) return false;

    try {
      this.isLoading = true;
      
      return new Promise((resolve) => {
        const unsubscribeLoaded = this.rewardedAd?.addAdEventListener(RewardedAdEventType.LOADED, () => {
          this.rewardedAd?.show();
        });

        const unsubscribeEarnedReward = this.rewardedAd?.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          cleanup();
          resolve(true);
        });

        const unsubscribeError = this.rewardedAd?.addAdEventListener(AdEventType.ERROR, () => {
          cleanup();
          resolve(false);
        });

        const unsubscribeClosed = this.rewardedAd?.addAdEventListener(AdEventType.CLOSED, () => {
          cleanup();
          resolve(false);
        });

        const cleanup = () => {
          unsubscribeLoaded?.();
          unsubscribeEarnedReward?.();
          unsubscribeError?.();
          unsubscribeClosed?.();
          this.isLoading = false;
        };

        try {
          this.rewardedAd?.load();
        } catch {
          cleanup();
          resolve(false);
        }
      });
    } catch {
      this.isLoading = false;
      return false;
    }
  }

  cleanup() {
    if (this.rewardedAd) {
      this.rewardedAd.removeAllListeners();
      this.rewardedAd = null;
      this.isLoading = false;
    }
  }
}

export const adService = new AdService();
