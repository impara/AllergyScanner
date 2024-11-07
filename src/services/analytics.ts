import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { getApp } from 'firebase/app';

let analytics: ReturnType<typeof getAnalytics> | null = null;

/**
 * Initializes Firebase Analytics. Must be called after Firebase App is initialized.
 */
export const initializeAnalytics = () => {
  try {
    analytics = getAnalytics(getApp());
    console.log('Firebase Analytics initialized');
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
    if (analytics) {
      await firebaseLogEvent(analytics, eventName, params);
    } else {
      console.warn('Analytics not initialized');
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
