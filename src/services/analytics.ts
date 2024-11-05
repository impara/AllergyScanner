import analytics from '@react-native-firebase/analytics';

export const logEvent = async (eventName: string, params?: Record<string, any>) => {
  try {
    if (__DEV__) {
      console.log('Analytics Event:', eventName, params);
    }
    await analytics().logEvent(eventName, params);
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
