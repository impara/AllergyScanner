// app.config.js
require('dotenv').config();
const withGoogleSignIn = require('./withGoogleSignIn');
const withAdServicesConfigFix = require('./withAdServicesConfigFix');

// Ensure AdMob app IDs are set
if (!process.env.ADMOB_ANDROID_APP_ID || !process.env.ADMOB_IOS_APP_ID) {
    throw new Error(
        'AdMob App IDs are not set. Please define ADMOB_ANDROID_APP_ID and ADMOB_IOS_APP_ID in your environment variables.'
    );
}

// Validate AdMob Configuration
const validateAdMobConfig = () => {
    const requiredVars = [
        'ADMOB_ANDROID_APP_ID',
        'ADMOB_IOS_APP_ID',
        'ADMOB_ANDROID_REWARDED_AD_UNIT_ID',
        'ADMOB_IOS_REWARDED_AD_UNIT_ID',
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);
    if (missing.length > 0) {
        console.warn('Missing AdMob configuration:', missing.join(', '));
    }
};

validateAdMobConfig();

module.exports = ({ config }) => {
    // Validate Google Sign-In Configuration
    if (!process.env.GOOGLE_ANDROID_CLIENT_ID || !process.env.GOOGLE_EXPO_CLIENT_ID) {
        console.warn('Google Sign-In configuration is incomplete:', {
            androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
            webClientId: process.env.GOOGLE_EXPO_CLIENT_ID,
        });
    }

    // Manually set versioning
    const newVersion = '1.0.5'; // Incremented version
    const newAndroidVersionCode = 5; // Incremented versionCode
    const newiOSBuildNumber = '5'; // Incremented buildNumber
    const newRuntimeVersion = `${newVersion}+${newAndroidVersionCode}`; // "1.0.4+4"

    console.log(`Setting version to: ${newVersion}`);
    console.log(`Setting Android versionCode to: ${newAndroidVersionCode}`);
    console.log(`Setting iOS buildNumber to: ${newiOSBuildNumber}`);
    console.log(`Setting runtimeVersion to: ${newRuntimeVersion}`);

    return {
        ...config,
        name: 'PurePlate',
        slug: 'pureplate',
        version: newVersion,
        orientation: 'portrait',
        icon: './assets/icons/icon_ios_1024x1024.png',
        splash: {
            image: './assets/images/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
        },
        updates: {
            url: 'https://u.expo.dev/c2ceb6a3-210e-4d75-b3cf-38878dd25b98',
            enabled: true,
            checkAutomatically: 'ON_LOAD',
        },
        runtimeVersion: newRuntimeVersion,
        android: {
            ...config.android,
            package: 'com.pureplate',
            versionCode: newAndroidVersionCode,
            runtimeVersion: newRuntimeVersion,
            adaptiveIcon: {
                foregroundImage: './assets/icons/icon_android_192x192.png',
                backgroundColor: '#FFFFFF',
            },
            icon: './assets/icons/icon_android_192x192.png',
            permissions: [
                'CAMERA',
                'INTERNET',
                'ACCESS_NETWORK_STATE',
                'com.google.android.gms.permission.AD_ID',
                'android.permission.WAKE_LOCK',
                'com.google.android.c2dm.permission.RECEIVE',
            ],
            intentFilters: [
                {
                    action: 'VIEW',
                    data: [
                        {
                            scheme: process.env.GOOGLE_ANDROID_CLIENT_ID
                                ? `com.googleusercontent.apps.${process.env.GOOGLE_ANDROID_CLIENT_ID}`
                                : 'placeholder_scheme',
                            host: 'oauth2callback',
                        },
                    ],
                    category: ['BROWSABLE', 'DEFAULT'],
                },
            ],
            config: {
                googleMobileAds: {
                    delayAppMeasurementInit: true,
                },
            },
        },
        ios: {
            ...config.ios,
            bundleIdentifier: 'com.pureplate',
            buildNumber: newiOSBuildNumber,
            deploymentTarget: '15.1',
            runtimeVersion: newRuntimeVersion,
            icon: './assets/icons/icon_ios_1024x1024.png',
            infoPlist: {
                CFBundleIcons: {
                    CFBundlePrimaryIcon: {
                        CFBundleIconFiles: [
                            './assets/icons/icon_ios_60x60.png',
                            './assets/icons/icon_ios_76x76.png',
                            './assets/icons/icon_ios_83.5x83.5.png',
                            './assets/icons/icon_ios_120x120.png',
                            './assets/icons/icon_ios_152x152.png',
                            './assets/icons/icon_ios_167x167.png',
                            './assets/icons/icon_ios_180x180.png',
                        ],
                        UIPrerenderedIcon: true,
                    },
                },
                NSUserTrackingUsageDescription: 'This identifier will be used to deliver personalized ads to you.',
            },
            hermesEnabled: false,
        },
        plugins: [
            ...(config.plugins || []),
            withGoogleSignIn,
            [
                'expo-build-properties',
                {
                    android: {
                        compileSdkVersion: 34,
                        targetSdkVersion: 34,
                        buildToolsVersion: '34.0.0',
                        minSdkVersion: 24,
                        hermesEnabled: false,
                        kotlinVersion: '1.9.24',
                        enableProguardInReleaseBuilds: true,
                        extraProguardRules: `
              -keepclassmembers class com.google.android.gms.ads.** { *; }
              -keep public class com.google.android.gms.ads.** {*;}
              -keep public class com.google.ads.** {*;}
            `,
                    },
                    ios: {
                        deploymentTarget: '15.1',
                        hermesEnabled: false,
                    },
                },
            ],
            ['@react-native-google-signin/google-signin'],
            [
                'react-native-google-mobile-ads',
                {
                    androidAppId: process.env.ADMOB_ANDROID_APP_ID,
                    iosAppId: process.env.ADMOB_IOS_APP_ID,
                    userTrackingPermission: 'This identifier will be used to deliver personalized ads to you.',
                },
            ],
            withAdServicesConfigFix,
        ],
        extra: {
            eas: {
                projectId: 'c2ceb6a3-210e-4d75-b3cf-38878dd25b98',
            },
            GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID,
            GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID,
            GOOGLE_EXPO_CLIENT_ID: process.env.GOOGLE_EXPO_CLIENT_ID,
            FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || null,
            FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || null,
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || null,
            FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || null,
            FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
            FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || null,
            FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || null,
            FOOD_REPO_API_KEY: process.env.FOOD_REPO_API_KEY || null,
            ADMOB_ANDROID_APP_ID: process.env.ADMOB_ANDROID_APP_ID || null,
            ADMOB_IOS_APP_ID: process.env.ADMOB_IOS_APP_ID || null,
            ADMOB_ANDROID_REWARDED_AD_UNIT_ID: process.env.ADMOB_ANDROID_REWARDED_AD_UNIT_ID || null,
            ADMOB_IOS_REWARDED_AD_UNIT_ID: process.env.ADMOB_IOS_REWARDED_AD_UNIT_ID || null,
            FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || null,
        },
    };
};
