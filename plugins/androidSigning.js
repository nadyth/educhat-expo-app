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
  config = withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    // 1. Add release signingConfig block (if not already present)
    if (!src.includes('signingConfigs.release') && !src.includes('signingConfigs {') && !src.includes('EDUCHAT_RELEASE_STORE_FILE')) {
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
    }

    // 2. Point release buildType to release signing — match inside the release { ... } block
    //    We need to be specific: only replace within the release buildTypes block
    src = src.replace(
      /buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig signingConfigs\.debug/,
      (match) => match.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release')
    );

    cfg.modResults.contents = src;
    return cfg;
  });

  // 3. Add gradle properties
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