const {
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

/**
 * Expo config plugin that configures Android release signing.
 *
 * Expects these env vars (set them in .env or CI):
 *   EDUCHAT_RELEASE_STORE_PASSWORD
 *   EDUCHAT_RELEASE_KEY_PASSWORD
 *
 * The keystore file should be at `keystores/release.keystore` in the project root.
 */

const SIGNING_CONFIG = {
  storeFile: '../../keystores/release.keystore',
  storePassword: process.env.EDUCHAT_RELEASE_STORE_PASSWORD || '',
  keyAlias: 'educhat',
  keyPassword: process.env.EDUCHAT_RELEASE_KEY_PASSWORD || '',
};

function withAndroidReleaseSigning(config) {
  // 1. Inject signing config into build.gradle
  config = withAppBuildGradle(config, (cfg) => {
    const src = cfg.modResults.contents;

    // Only inject if not already present
    if (src.includes('EDUCHAT_RELEASE_STORE_FILE')) {
      return cfg;
    }

    // Replace the debug-only signingConfigs block with debug + release
    cfg.modResults.contents = src.replace(
      /signingConfigs\s*\{\s*debug\s*\{[^}]*\}\s*\}/s,
      `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file('${SIGNING_CONFIG.storeFile}')
            storePassword '${SIGNING_CONFIG.storePassword}'
            keyAlias '${SIGNING_CONFIG.keyAlias}'
            keyPassword '${SIGNING_CONFIG.keyPassword}'
        }
    }`
    );

    // Point release buildType to release signing instead of debug
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /release\s*\{\s*signingConfig signingConfigs\.debug/,
      `release {
            signingConfig signingConfigs.release`
    );

    return cfg;
  });

  // 2. Add gradle properties
  config = withGradleProperties(config, (cfg) => {
    const props = [
      { key: 'EDUCHAT_RELEASE_STORE_FILE', value: SIGNING_CONFIG.storeFile },
      { key: 'EDUCHAT_RELEASE_STORE_PASSWORD', value: SIGNING_CONFIG.storePassword },
      { key: 'EDUCHAT_RELEASE_KEY_ALIAS', value: SIGNING_CONFIG.keyAlias },
      { key: 'EDUCHAT_RELEASE_KEY_PASSWORD', value: SIGNING_CONFIG.keyPassword },
    ];

    for (const { key, value } of props) {
      // Remove existing if present
      cfg.modResults = cfg.modResults.filter(
        (p) => p.type !== 'property' || p.key !== key
      );
      cfg.modResults.push({ type: 'property', key, value });
    }

    return cfg;
  });

  return config;
}

module.exports = withAndroidReleaseSigning;