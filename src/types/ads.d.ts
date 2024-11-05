import mobileAds, { 
  RewardedAd, 
  TestIds,
  RewardedAdEventType,
  AdEventType,
  AdapterStatus,
} from 'react-native-google-mobile-ads';
import { ADMOB_ANDROID_REWARDED_AD_UNIT_ID, ADMOB_IOS_REWARDED_AD_UNIT_ID } from '@env';
import Constants from 'expo-constants';

export interface AdService {
  initialize(): Promise<AdapterStatus[] | false>;
  showRewardedAd(): Promise<boolean>;
  cleanup(): void;
}
