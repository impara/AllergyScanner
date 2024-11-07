// withGoogleSignIn.js

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleSignIn = (config) => {
    const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;
    const googleServiceInfoPlist = process.env.GOOGLE_SERVICE_INFO_PLIST;

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

                    // Ensure android/app directory exists
                    const androidAppDir = path.join(modRequest.projectRoot, 'android', 'app');
                    if (!fs.existsSync(androidAppDir)) {
                        fs.mkdirSync(androidAppDir, { recursive: true });
                    }

                    // Write to android/app/google-services.json
                    const androidPath = path.join(androidAppDir, 'google-services.json');
                    fs.writeFileSync(androidPath, decodedJson);

                    // Also write to project root for compatibility
                    const rootPath = path.join(modRequest.projectRoot, 'google-services.json');
                    fs.writeFileSync(rootPath, decodedJson);

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

                    // Ensure ios directory exists
                    const iosDir = path.join(modRequest.projectRoot, 'ios');
                    if (!fs.existsSync(iosDir)) {
                        fs.mkdirSync(iosDir, { recursive: true });
                    }

                    // Write to ios/GoogleService-Info.plist
                    const iosPath = path.join(iosDir, 'GoogleService-Info.plist');
                    fs.writeFileSync(iosPath, decodedPlist);

                    // Also write to project root for compatibility
                    const rootPath = path.join(modRequest.projectRoot, 'GoogleService-Info.plist');
                    fs.writeFileSync(rootPath, decodedPlist);

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
