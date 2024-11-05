import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const commonConfig: Partial<ExpoConfig> = {
    name: "PurePlate",
    slug: "pureplate",
    version: "1.0.0",
    scheme: "com.pureplate",
    owner: "impara1",
    runtimeVersion: "1.0.0",
    extra: {
      eas: {
        projectId: "c2ceb6a3-210e-4d75-b3cf-38878dd25b98"
      }
    }
  };

  if (!process.env.EAS_BUILD) {
    // Only include these configs when not building with EAS
    Object.assign(commonConfig, {
      orientation: "portrait",
      icon: "./assets/icons/icon_1024x1024.png",
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      updates: {
        fallbackToCacheTimeout: 0,
        url: "https://u.expo.dev/c2ceb6a3-210e-4d75-b3cf-38878dd25b98"
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        icon: "./assets/icons/icon_180x180.png",
        supportsTablet: true,
        bundleIdentifier: "com.pureplate",
        infoPlist: {
          NSUserTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you.",
          SKAdNetworkItems: [
            {
              SKAdNetworkIdentifier: "cstr6suwn9.skadnetwork"
            }
          ],
          GADApplicationIdentifier: "ca-app-pub-8734794506325240~2807396312",
          CFBundleURLTypes: [
            {
              CFBundleURLSchemes: ["com.pureplate"]
            }
          ]
        },
        associatedDomains: [
          "applinks:pureplate-b70f9.firebaseapp.com"
        ]
      },
      android: {
        icon: "./assets/icons/icon_512x512.png",
        adaptiveIcon: {
          foregroundImage: "./assets/icons/icon_192x192.png",
          backgroundColor: "#FFFFFF"
        },
        package: "com.pureplate",
        googleServicesFile: "./google-services.json",
        permissions: ["android.permission.CAMERA"],
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "com.pureplate",
                host: "*"
              }
            ],
            category: ["BROWSABLE", "DEFAULT"]
          }
        ]
      },
      plugins: [
        "expo-localization",
        "expo-dev-client",
        [
          "expo-build-properties",
          {
            "ios": {
              "useFrameworks": "static"
            },
            "android": {
              "compileSdkVersion": 34,
              "targetSdkVersion": 34,
              "minSdkVersion": 23,
              "usesCleartextTraffic": true
            }
          }
        ],
        "@react-native-firebase/app",
        [
          "react-native-google-mobile-ads",
          {
            "androidAppId": "ca-app-pub-8734794506325240~2300834127",
            "iosAppId": "ca-app-pub-8734794506325240~2807396312"
          }
        ]
      ]
    });
  }

  return commonConfig as ExpoConfig;
}; 