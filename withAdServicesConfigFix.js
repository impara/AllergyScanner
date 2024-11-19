// withAdServicesConfigFix.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAdServicesConfigFix(config) {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults;

        // Ensure xmlns:tools is declared
        if (!manifest.manifest.$['xmlns:tools']) {
            manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }

        const application = manifest.manifest.application[0];

        // Ensure 'property' is an array
        if (!application['property']) {
            application['property'] = [];
        }

        let propertyModified = false;

        // Modify existing 'property' element if it exists
        for (const property of application['property']) {
            if (property.$['android:name'] === 'android.adservices.AD_SERVICES_CONFIG') {
                property.$['tools:replace'] = 'android:resource';
                propertyModified = true;
                break;
            }
        }

        // Add the 'property' element if it doesn't exist
        if (!propertyModified) {
            application['property'].push({
                $: {
                    'android:name': 'android.adservices.AD_SERVICES_CONFIG',
                    'android:resource': '@xml/gma_ad_services_config',
                    'tools:replace': 'android:resource',
                },
            });
        }

        return config;
    });
};
