const {
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

/**
 * Expo config plugin that configures Android release signing.
 *
 * Reads passwords from env vars (set in .env / .env.production / CI):
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
    let src = cfg.modResults.contents;

    // Remove any existing release signingConfig (from previous plugin runs or manual edits)
    src = src.replace(/release\s*\{[^}]*signingConfig signingConfigs\.release[^}]*\}/gs, '');

    // Add release signingConfig block after the debug block
    src = src.replace(
      /signingConfigs\s*\{\s*debug\s*\{[^}]*\}\s*\}/s,
      `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('EDUCHAT_RELEASE_STORE_FILE')) {
                storeFile file(EDUCHAT_RELEASE_STORE_FILE)
                storePassword EDUCHAT_RELEASE_STORE_PASSWORD
                keyAlias EDUCHAT_RELEASE_KEY_ALIAS
                keyPassword EDUCHAT_RELEASE_KEY_PASSWORD
            }
        }
    }`
    );

    // Point release buildType to release signing
    src = src.replace(
      /signingConfig signingConfigs\.debug/,
      'signingConfig signingConfigs.release'
    );

    // If release block was removed, re-add it with release signing
    if (!src.includes('signingConfig signingConfigs.release')) {
      src = src.replace(
        /buildTypes\s*\{\s*debug\s*\{[^}]*\}\s*release\s*\{/,
        `buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release`
      );
    }

    cfg.modResults.contents = src;
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