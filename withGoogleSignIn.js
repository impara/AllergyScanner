// withGoogleSignIn.js

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleSignIn = (config) => {
    const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;
    const googleServiceInfoPlist = process.env.GOOGLE_SERVICE_INFO_PLIST;

    // For local development
    const isLocalDev = process.env.NODE_ENV === 'development';
    if (isLocalDev) {
        try {
            // Use fs to check if files exist instead of require
            const hasGoogleServicesJson = fs.existsSync('./google-services.json');
            const hasGoogleServiceInfoPlist = fs.existsSync('./GoogleService-Info.plist');

            if (hasGoogleServicesJson) {
                const jsonContent = fs.readFileSync('./google-services.json', 'utf8');
                process.env.GOOGLE_SERVICES_JSON = Buffer.from(jsonContent).toString('base64');
            }

            if (hasGoogleServiceInfoPlist) {
                const plistContent = fs.readFileSync('./GoogleService-Info.plist', 'utf8');
                process.env.GOOGLE_SERVICE_INFO_PLIST = Buffer.from(plistContent).toString('base64');
            }

            console.log('Local development config:', {
                hasAndroidConfig: hasGoogleServicesJson,
                hasIOSConfig: hasGoogleServiceInfoPlist
            });

            return config;
        } catch (error) {
            console.warn('Local Google Services files not found:', error.message);
            return config;
        }
    }

    // Add debug logging
    console.log('Google Services Config:', {
        hasAndroidConfig: !!googleServicesJson,
        hasIOSConfig: !!googleServiceInfoPlist
    });

    if (!googleServicesJson && !googleServiceInfoPlist) {
        console.warn('Google Services environment variables are not set.');
        return config;
    }

    // Handle Android
    if (googleServicesJson) {
        config = withDangerousMod(config, [
            'android',
            async (config) => {
                try {
                    const modRequest = config.modRequest;
                    if (!modRequest?.projectRoot) {
                        throw new Error('Project root not found');
                    }

                    // Decode base64 content
                    const decodedJson = Buffer.from(googleServicesJson, 'base64').toString('utf-8');

                    // Write to android/app/google-services.json
                    const androidAppDir = path.join(modRequest.projectRoot, 'android', 'app');
                    fs.mkdirSync(androidAppDir, { recursive: true });
                    fs.writeFileSync(path.join(androidAppDir, 'google-services.json'), decodedJson);

                    console.log('Successfully wrote google-services.json');
                } catch (error) {
                    console.error('Error writing google-services.json:', error);
                    throw error;
                }
                return config;
            },
        ]);
    }

    // Handle iOS
    if (googleServiceInfoPlist) {
        config = withDangerousMod(config, [
            'ios',
            async (config) => {
                try {
                    const modRequest = config.modRequest;
                    if (!modRequest?.projectRoot) {
                        throw new Error('Project root not found');
                    }

                    // Decode base64 content
                    const decodedPlist = Buffer.from(googleServiceInfoPlist, 'base64').toString('utf-8');

                    // Write to ios directory
                    const iosDir = path.join(modRequest.projectRoot, 'ios');
                    fs.mkdirSync(iosDir, { recursive: true });
                    fs.writeFileSync(path.join(iosDir, 'GoogleService-Info.plist'), decodedPlist);

                    console.log('Successfully wrote GoogleService-Info.plist');
                } catch (error) {
                    console.error('Error writing GoogleService-Info.plist:', error);
                    throw error;
                }
                return config;
            },
        ]);
    }

    return config;
};

module.exports = withGoogleSignIn;
