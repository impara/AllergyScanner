// src/services/analytics.ts

import analytics from '@react-native-firebase/analytics';

export enum AdType {
  REWARDED = 'rewarded',
  INTERSTITIAL = 'interstitial'
}

export enum AdEvent {
  LOAD_ATTEMPT = 'load_attempt',
  LOAD_SUCCESS = 'load_success',
  LOAD_FAILURE = 'load_failure',
  SHOW_ATTEMPT = 'show_attempt',
  SHOW_SUCCESS = 'show_success',
  SHOW_FAILURE = 'show_failure',
  REWARD_EARNED = 'reward_earned',
  CLOSED = 'closed',
  CLICKED = 'clicked',
  INITIALIZATION_START = 'initialization_start',
  INITIALIZATION_COMPLETE = 'initialization_complete',
  INITIALIZATION_ERROR = 'initialization_error'
}

export interface AdEventParams {
  ad_type: AdType;
  ad_unit_id?: string;
  error_message?: string;
  error_code?: string;
  trigger_location?: string;
  time_since_app_start?: number;
  time_since_last_ad?: number;
  total_ads_shown?: number;
  attempt_number?: number;
}

/**
 * Logs an event to Firebase Analytics with error handling and retry logic.
 */
export const logEvent = async (
  eventName: string,
  params?: Record<string, any>,
  retryCount = 0
): Promise<void> => {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;

  try {
    if (__DEV__) {
      console.log('Analytics Event:', eventName, params);
    }
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error('Analytics error:', error);
    
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return logEvent(eventName, params, retryCount + 1);
    }
  }
};

export const logScan = async (productId: string, success: boolean) => {
  await logEvent('product_scan', {
    product_id: productId,
    success,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Logs ad-related events with standardized parameters and Firebase Analytics events
 */
export const logAdEvent = async (
  event: AdEvent,
  params: AdEventParams
): Promise<void> => {
  // Small delay to ensure state is updated
  await new Promise(resolve => setTimeout(resolve, 0));

  const baseParams = {
    ...params,
    timestamp: new Date().toISOString(),
    environment: __DEV__ ? 'development' : 'production'
  };

  const eventName = `ad_${event}`;
  await logEvent(eventName, baseParams);

  // Log standard Firebase Analytics events
  switch (event) {
    case AdEvent.LOAD_SUCCESS:
      await logEvent('ad_impression', {
        ad_platform: 'admob',
        ad_source: params.ad_unit_id,
        ad_format: params.ad_type,
        ad_unit_name: params.trigger_location
      });
      break;
    
    case AdEvent.CLICKED:
      await logEvent('ad_click', {
        ad_platform: 'admob',
        ad_source: params.ad_unit_id,
        ad_format: params.ad_type,
        ad_unit_name: params.trigger_location
      });
      break;

    case AdEvent.REWARD_EARNED:
      await logEvent('ad_reward_earned', {
        ad_platform: 'admob',
        ad_source: params.ad_unit_id,
        ad_format: params.ad_type,
        ad_unit_name: params.trigger_location,
        reward_type: 'virtual_currency',
        reward_amount: 1
      });
      break;

    case AdEvent.INITIALIZATION_COMPLETE:
      await logEvent('admob_initialization_complete', {
        success: true,
        attempt_number: params.attempt_number
      });
      break;

    case AdEvent.INITIALIZATION_ERROR:
      await logEvent('admob_initialization_error', {
        error_message: params.error_message,
        error_code: params.error_code,
        attempt_number: params.attempt_number
      });
      break;
  }
};

/**
 * Logs ad revenue data with retry logic
 */
export const logAdRevenue = async (
  params: AdEventParams & {
    currency_code: string;
    value: number;
  }
): Promise<void> => {
  await logEvent('ad_revenue', {
    ...params,
    timestamp: new Date().toISOString(),
    environment: __DEV__ ? 'development' : 'production'
  });
};
