import { AdapterStatus } from 'react-native-google-mobile-ads';

export interface AdError {
  code: string;
  message: string;
}

export interface AdEventPayload {
  type: string;
  error?: AdError;
}

export type AdEventCallback = (payload: AdEventPayload) => void;

export interface AdService {
  initialize(): Promise<AdapterStatus[] | false>;
  showRewardedAd(): Promise<boolean>;
  showInterstitialAd(): Promise<boolean>;
  cleanup(): void;
  isAdReady(): boolean;
  getInitializationStatus(): boolean;
  isLoading: boolean;
  getLoadingStatus(): boolean;
  getAdUnitId(): string | undefined;
  resetState(): void;
  handleError(error: Error | unknown, context: string): void;
}

export interface AdEventHandlers {
  onAdLoaded?: () => void;
  onAdError?: (error: AdError) => void;
  onAdClosed?: () => void;
  onRewardEarned?: () => void;
}
