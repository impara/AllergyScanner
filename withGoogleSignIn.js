// withGoogleSignIn.js

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleSignIn = (config) => {
    const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;
    const googleServiceInfoPlist = process.env.GOOGLE_SERVICE_INFO_PLIST;

    if (googleServicesJson || googleServiceInfoPlist) {
        if (googleServicesJson) {
            config = withDangerousMod(config, [
                'android',
                async (config) => {
                    try {
                        const modRequest = config.modRequest;
                        if (!modRequest?.projectRoot) throw new Error('Project root not found');

                        const jsonContent = fs.readFileSync(googleServicesJson, 'utf-8');
                        const androidAppDir = path.join(modRequest.projectRoot, 'android', 'app');
                        fs.mkdirSync(androidAppDir, { recursive: true });
                        fs.writeFileSync(
                            path.join(androidAppDir, 'google-services.json'),
                            jsonContent
                        );
                    } catch (error) {
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
                        if (!modRequest?.projectRoot) throw new Error('Project root not found');

                        const plistContent = fs.readFileSync(googleServiceInfoPlist, 'utf-8');
                        const iosDir = path.join(modRequest.projectRoot, 'ios');
                        fs.mkdirSync(iosDir, { recursive: true });
                        fs.writeFileSync(
                            path.join(iosDir, 'GoogleService-Info.plist'),
                            plistContent
                        );
                    } catch (error) {
                        throw error;
                    }
                    return config;
                },
            ]);
        }
    } else {
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
            }

            if (hasGoogleServiceInfoPlist) {
                const iosDir = path.join(process.cwd(), 'ios');
                fs.mkdirSync(iosDir, { recursive: true });
                fs.copyFileSync(
                    path.join(process.cwd(), 'GoogleService-Info.plist'),
                    path.join(iosDir, 'GoogleService-Info.plist')
                );
            }
        } catch (error) {
            // Silently fail for local development
        }
    }

    return config;
};

module.exports = withGoogleSignIn;
