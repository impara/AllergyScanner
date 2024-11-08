// app.config.js
require('dotenv').config();
const { withPlugins } = require('@expo/config-plugins');
const withGoogleSignIn = require('./withGoogleSignIn');

// Check if AdMob app IDs are set
if (!process.env.ADMOB_ANDROID_APP_ID || !process.env.ADMOB_IOS_APP_ID) {
    throw new Error("AdMob App IDs are not set. Please define ADMOB_ANDROID_APP_ID and ADMOB_IOS_APP_ID in your environment variables.");
}

module.exports = ({ config }) => {
    // Add validation for Google Sign-In configuration
    if (!process.env.GOOGLE_ANDROID_CLIENT_ID || !process.env.GOOGLE_EXPO_CLIENT_ID) {
        console.warn('Google Sign-In configuration is incomplete:', {
            androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
            webClientId: process.env.GOOGLE_EXPO_CLIENT_ID
        });
    }

    config.extra = {
        ...config.extra,
        eas: {
            projectId: 'c2ceb6a3-210e-4d75-b3cf-38878dd25b98'
        },
        // Environment variables for your app
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
    };

    return {
        ...config,
        name: "PurePlate",
        slug: "pureplate",
        version: "1.0.1",
        orientation: "portrait",
        icon: "./assets/icons/icon_1024x1024.png",
        splash: {
            image: "./assets/images/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        android: {
            package: "com.pureplate",
            versionCode: 1,
            runtimeVersion: {
                policy: "appVersion"
            },
            adaptiveIcon: {
                foregroundImage: "./assets/icons/icon_1024x1024.png",
                backgroundColor: "#FFFFFF"
            },
            permissions: [
                "CAMERA",
                "INTERNET",
                "ACCESS_NETWORK_STATE"
            ]
        },
        ios: {
            bundleIdentifier: "com.pureplate",
            buildNumber: "1",
            deploymentTarget: "13.4",
            infoPlist: {
                CFBundleURLTypes: [
                    {
                        CFBundleURLSchemes: [
                            "pureplate",
                            `com.googleusercontent.apps.${process.env.GOOGLE_IOS_CLIENT_ID}`
                        ]
                    }
                ]
            }
        },
        plugins: [
            ...(config.plugins || []),
            withGoogleSignIn,
            ["expo-build-properties", {
                android: {
                    compileSdkVersion: 34,
                    targetSdkVersion: 34,
                    buildToolsVersion: "34.0.0",
                    minSdkVersion: 23,
                    hermesEnabled: true,
                    kotlinVersion: "1.8.0",
                    enableProguardInReleaseBuilds: true,
                    extraProguardRules: `
                        -keepclassmembers class com.google.android.gms.ads.** { *; }
                        -keep public class com.google.android.gms.ads.** {*;}
                        -keep public class com.google.ads.** {*;}
                    `
                },
                ios: {
                    deploymentTarget: "13.4",
                    hermesEnabled: true
                }
            }],
            ["@react-native-google-signin/google-signin"],
            ["react-native-google-mobile-ads", {
                androidAppId: process.env.ADMOB_ANDROID_APP_ID,
                iosAppId: process.env.ADMOB_IOS_APP_ID,
                delay: 3000,
                userTrackingPermission: "This identifier will be used to deliver personalized ads to you.",
                android: {
                    delayAdLoad: true,
                    appId: process.env.ADMOB_ANDROID_APP_ID
                },
                ios: {
                    delayAdLoad: true,
                    appId: process.env.ADMOB_IOS_APP_ID
                }
            }]
        ],
        updates: {
            url: "https://u.expo.dev/c2ceb6a3-210e-4d75-b3cf-38878dd25b98"
        },
        expo: {
            ...config.expo,
            extra: {
                eas: {
                    projectId: 'c2ceb6a3-210e-4d75-b3cf-38878dd25b98'
                }
            },
            android: {
                config: {
                    googleMobileAds: {
                        delayAppMeasurementInit: true
                    }
                }
            }
        }
    };
};
