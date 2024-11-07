import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

/**
 * Initializes Firebase Analytics. Must be called after Firebase App is initialized.
 */
export const initializeAnalytics = async () => {
  if (Platform.OS === 'web') {
    console.log('Analytics: Skipping initialization on web platform');
    return;
  }

  try {
    // Enable analytics collection
    await analytics().setAnalyticsCollectionEnabled(true);
    console.log('Firebase Analytics initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
  }
};

/**
 * Logs an event to Firebase Analytics.
 * @param eventName - Name of the event.
 * @param params - Parameters associated with the event.
 */
export const logEvent = async (eventName: string, params?: Record<string, any>) => {
  try {
    if (__DEV__) {
      console.log('Analytics Event:', eventName, params);
    }
    if (Platform.OS !== 'web') {
      await analytics().logEvent(eventName, params);
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export const logScan = async (productId: string, success: boolean) => {
  await logEvent('product_scan', {
    product_id: productId,
    success,
    timestamp: new Date().toISOString(),
  });
};

export const logRewardedAdWatch = async (success: boolean) => {
  await logEvent('rewarded_ad_watch', {
    success,
    timestamp: new Date().toISOString(),
  });
};
