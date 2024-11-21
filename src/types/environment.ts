import { Platform } from 'react-native';

export type Environment = 'development' | 'production' | 'test';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL: string;
}

export interface GoogleSignInConfig {
  iosClientId: string;
  webClientId: string;
}

export interface AdMobConfig {
  androidAppId: string;
  iosAppId: string;
  androidRewardedAdUnitId: string;
  iosRewardedAdUnitId: string;
}

export interface EnvironmentVariables {
  // Firebase Configuration
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID?: string;
  FIREBASE_DATABASE_URL: string;

  // Google Sign-In Configuration
  GOOGLE_IOS_CLIENT_ID: string;
  GOOGLE_WEB_CLIENT_ID: string;

  // AdMob Configuration
  ADMOB_ANDROID_APP_ID: string;
  ADMOB_IOS_APP_ID: string;
  ADMOB_ANDROID_REWARDED_AD_UNIT_ID: string;
  ADMOB_IOS_REWARDED_AD_UNIT_ID: string;

  // API Keys
  FOOD_REPO_API_KEY: string;

  // Environment
  NODE_ENV?: Environment;
}

// Helper function to validate Firebase config
export const validateFirebaseConfig = (config: Partial<FirebaseConfig>): config is FirebaseConfig => {
  const required: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
    'databaseURL'
  ];

  return required.every(key => !!config[key]);
};

// Helper function to validate Google Sign-In config
export const validateGoogleSignInConfig = (config: Partial<GoogleSignInConfig>): config is GoogleSignInConfig => {
  const required: (keyof GoogleSignInConfig)[] = [
    'webClientId',
    Platform.OS === 'ios' ? 'iosClientId' : null
  ].filter(Boolean) as (keyof GoogleSignInConfig)[];

  return required.every(key => !!config[key]);
};

// Helper function to validate AdMob config
export const validateAdMobConfig = (config: Partial<AdMobConfig>): config is AdMobConfig => {
  const required: (keyof AdMobConfig)[] = [
    'androidAppId',
    'iosAppId',
    'androidRewardedAdUnitId',
    'iosRewardedAdUnitId'
  ];

  return required.every(key => !!config[key]);
};

// Helper to get environment
export const getEnvironment = (): Environment => {
  return (process.env.NODE_ENV as Environment) || 'development';
};

// Helper to check if running in production
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

// Helper to check if running in development
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
}; 