// withGoogleSignIn.js

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleSignIn = (config) => {
    // Check for EAS build environment variables first
    const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;
    const googleServiceInfoPlist = process.env.GOOGLE_SERVICE_INFO_PLIST;

    // For EAS builds
    if (googleServicesJson || googleServiceInfoPlist) {
        console.log('Using EAS secrets for Google Services configuration');

        if (googleServicesJson) {
            config = withDangerousMod(config, [
                'android',
                async (config) => {
                    try {
                        const modRequest = config.modRequest;
                        if (!modRequest?.projectRoot) {
                            throw new Error('Project root not found');
                        }

                        // Read directly from the file path provided by EAS
                        const jsonContent = fs.readFileSync(googleServicesJson, 'utf-8');
                        const androidAppDir = path.join(modRequest.projectRoot, 'android', 'app');
                        fs.mkdirSync(androidAppDir, { recursive: true });
                        fs.writeFileSync(
                            path.join(androidAppDir, 'google-services.json'),
                            jsonContent
                        );
                        console.log('Successfully wrote google-services.json from EAS file secret');
                    } catch (error) {
                        console.error('Error writing google-services.json:', error);
                        throw error;
                    }
                    return config;
                },
            ]);
        }

        if (googleServiceInfoPlist) {
            config = withDangerousMod(config, [
                'ios',
                async (config) => {
                    try {
                        const modRequest = config.modRequest;
                        if (!modRequest?.projectRoot) {
                            throw new Error('Project root not found');
                        }

                        // Read directly from the file path provided by EAS
                        const plistContent = fs.readFileSync(googleServiceInfoPlist, 'utf-8');
                        const iosDir = path.join(modRequest.projectRoot, 'ios');
                        fs.mkdirSync(iosDir, { recursive: true });
                        fs.writeFileSync(
                            path.join(iosDir, 'GoogleService-Info.plist'),
                            plistContent
                        );
                        console.log('Successfully wrote GoogleService-Info.plist from EAS file secret');
                    } catch (error) {
                        console.error('Error writing GoogleService-Info.plist:', error);
                        throw error;
                    }
                    return config;
                },
            ]);
        }
    } else {
        // For local development, check for files in project root
        try {
            const hasGoogleServicesJson = fs.existsSync('./google-services.json');
            const hasGoogleServiceInfoPlist = fs.existsSync('./GoogleService-Info.plist');

            if (hasGoogleServicesJson) {
                const androidAppDir = path.join(process.cwd(), 'android', 'app');
                fs.mkdirSync(androidAppDir, { recursive: true });
                fs.copyFileSync(
                    path.join(process.cwd(), 'google-services.json'),
                    path.join(androidAppDir, 'google-services.json')
                );
                console.log('Successfully copied google-services.json for local development');

                // Ensure that Google Mobile Ads initialization is included
                fs.copyFileSync(
                    path.join(process.cwd(), 'google-services.json'),
                    path.join(androidAppDir, 'google-services.json')
                );
                console.log('Google Mobile Ads initialized');
            }

            if (hasGoogleServiceInfoPlist) {
                const iosDir = path.join(process.cwd(), 'ios');
                fs.mkdirSync(iosDir, { recursive: true });
                fs.copyFileSync(
                    path.join(process.cwd(), 'GoogleService-Info.plist'),
                    path.join(iosDir, 'GoogleService-Info.plist')
                );
                console.log('Successfully copied GoogleService-Info.plist for local development');
            }

            console.log('Local development config:', {
                hasAndroidConfig: hasGoogleServicesJson,
                hasIOSConfig: hasGoogleServiceInfoPlist
            });
        } catch (error) {
            console.warn('Local Google Services files not found:', error.message);
        }
    }

    return config;
};

module.exports = withGoogleSignIn;
