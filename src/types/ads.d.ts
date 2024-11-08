import { AdapterStatus } from 'react-native-google-mobile-ads';

export interface AdService {
  initialize(): Promise<AdapterStatus[] | false>;
  showRewardedAd(): Promise<boolean>;
  showInterstitialAd(): Promise<boolean>;
  cleanup(): void;
  isAdReady(): boolean;
  getInitializationStatus(): boolean;
  isLoading: boolean;
  getLoadingStatus(): boolean;
}
