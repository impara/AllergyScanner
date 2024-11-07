import 'dotenv/config';

export default {
    expo: {
        name: 'PurePlate',
        slug: 'pureplate',
        version: '1.0.1',
        owner: 'impara1',
        runtimeVersion: '1.0.1',
        scheme: 'pureplate',
        icon: './assets/icons/icon_1024x1024.png',
        splash: {
            image: './assets/images/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
        },
        assetBundlePatterns: ['assets/*', 'assets/**/*'],
        android: {
            package: 'com.pureplate',
            adaptiveIcon: {
                foregroundImage: './assets/icons/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            jsEngine: "hermes",
        },
        ios: {
            bundleIdentifier: "com.pureplate",
            jsEngine: "hermes",
        },
        plugins: [
            [
                'expo-build-properties',
                {
                    android: {
                        extraProguardRules: `-keepattributes *Annotation*
-dontwarn com.google.android.gms.**
-keep class com.google.android.gms.** { *; }`,
                    },
                },
            ],
            [
                'react-native-google-mobile-ads',
                {
                    androidAppId: process.env.ADMOB_ANDROID_APP_ID,
                    iosAppId: process.env.ADMOB_IOS_APP_ID,
                    delayAppMeasurementInit: true,
                }
            ],
            './withGoogleSignIn',
            [
                "@react-native-firebase/app",
                {
                    // Your native Firebase config from google-services.json (Android) and GoogleService-Info.plist (iOS)
                    android_client_id: process.env.FIREBASE_ANDROID_CLIENT_ID,
                    ios_client_id: process.env.FIREBASE_IOS_CLIENT_ID,
                    appId: process.env.FIREBASE_APP_ID,
                    apiKey: process.env.FIREBASE_API_KEY,
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
                },
            ],
        ],
        updates: {
            enabled: true,
            checkAutomatically: 'ON_LOAD',
            fallbackToCacheTimeout: 0,
            url: 'https://u.expo.dev/c2ceb6a3-210e-4d75-b3cf-38878dd25b98',
        },
        extra: {
            eas: {
                projectId: 'c2ceb6a3-210e-4d75-b3cf-38878dd25b98',
            },
            // Environment variables for your app
            GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID || null,
            GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID || null,
            GOOGLE_EXPO_CLIENT_ID: process.env.GOOGLE_EXPO_CLIENT_ID || null,
            FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || null,
            FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || null,
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || null,
            FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || null,
            FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
            FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || null,
            FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || null,
            FOOD_REPO_API_KEY: process.env.FOOD_REPO_API_KEY || null,
            ADMOB_ANDROID_REWARDED_AD_UNIT_ID: process.env.ADMOB_ANDROID_REWARDED_AD_UNIT_ID || null,
            ADMOB_IOS_REWARDED_AD_UNIT_ID: process.env.ADMOB_IOS_REWARDED_AD_UNIT_ID || null,
            DATABASE_URL: process.env.FIREBASE_DATABASE_URL || null,
        },
    },
};
