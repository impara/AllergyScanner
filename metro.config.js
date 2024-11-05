const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
    const defaultConfig = await getDefaultConfig(__dirname);

    defaultConfig.resolver.sourceExts = [
        ...defaultConfig.resolver.sourceExts,
        'web.ts',
        'web.tsx',
        'ts',
        'tsx',
        'svg',
        'cjs'
    ];

    // Filter out 'svg' from assetExts and add 'svg' to sourceExts
    defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(
        (ext) => ext !== 'svg'
    );
    defaultConfig.resolver.sourceExts = [...defaultConfig.resolver.sourceExts, 'svg', 'cjs'];

    defaultConfig.transformer.getTransformOptions = async () => ({
        transform: {
            experimentalImportSupport: false,
            inlineRequires: true,
        },
    });

    return defaultConfig;
})();