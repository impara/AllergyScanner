import { AdapterStatus } from 'react-native-google-mobile-ads';

export interface AdService {
  initialize(): Promise<AdapterStatus[] | false>;
  showRewardedAd(): Promise<boolean>;
  cleanup(): void;
}
