// withGoogleSignIn.js

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleSignIn = (config) => {
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const googleServices = process.env.GOOGLE_SERVICES_JSON;

            if (!googleServices) {
                throw new Error('GOOGLE_SERVICES_JSON environment variable is not set.');
            }

            const destPath = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'google-services.json'
            );

            fs.writeFileSync(destPath, googleServices);
            return config;
        },
    ]);

    return config;
};

module.exports = withGoogleSignIn;
