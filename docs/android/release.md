# Android Release Build Guide

> **App:** EduChat AI  
> **Package:** `com.devnadeem.educhat`  
> **Version:** `1.0.0` (versionCode: `1`)

---

## Prerequisites

- Android Studio with SDK 34+
- A release keystore (see [Generate a release keystore](#1-generate-a-release-keystore))
- Node.js 18+ and npm/yarn
- Run `npm install` in the project root

---

## Quick Reference

| Task | Command |
|---|---|
| Generate native project | `npx expo prebuild --clean` |
| Run release on connected device | `npx expo prebuild --clean && npx expo run:android --variant release` |
| Build release APK | `npx expo prebuild --clean && cd android && ./gradlew assembleRelease` |
| Build release AAB | `npx expo prebuild --clean && cd android && ./gradlew bundleRelease` |
| Debug build (npm script) | `npm run android` |
| Release APK (npm script) | `npm run android:release` |
| Release AAB (npm script) | `npm run android:bundle` |

---

## 1. Generate a release keystore

If you don't have one yet:

```bash
cd android/app
keytool -genkey -v -keystore release.keystore \
  -alias educhat \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype PKCS12
```

Save the passwords — you'll need them in the next step.

> **Important:** Add `release.keystore` to `.gitignore` to avoid committing secrets.

---

## 2. Configure release signing

Edit `android/app/build.gradle` and add the release signing config:

```gradle
android {
    ...
    signingConfigs {
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
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

Add these entries to `android/gradle.properties` (or `~/.gradle/gradle.properties` to keep secrets out of version control):

```properties
EDUCHAT_RELEASE_STORE_FILE=release.keystore
EDUCHAT_RELEASE_STORE_PASSWORD=your_store_password
EDUCHAT_RELEASE_KEY_ALIAS=educhat
EDUCHAT_RELEASE_KEY_PASSWORD=your_key_password
```

---

## 3. Build & run release on a connected device

```bash
npx expo prebuild --clean
npx expo run:android --variant release
```

---

## 4. Build a release APK

```bash
npx expo prebuild --clean
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 5. Build a release AAB (App Bundle)

```bash
npx expo prebuild --clean
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 6. Upload to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Create an app with package name `com.devnadeem.educhat`
3. Go to **Production → Create new release**
4. Upload the `.aab` file from `android/app/build/outputs/bundle/release/`

---

## Troubleshooting

### SDK location not found

Create `android/local.properties`:

```properties
sdk.dir=/Users/YOUR_USER/Library/Android/sdk
```

### Release build fails with signing error

- Verify `release.keystore` exists in `android/app/`
- Double-check all four `EDUCHAT_RELEASE_*` properties in `gradle.properties`
- Make sure passwords match what you set during `keytool`

### `./gradlew` permission denied

```bash
chmod +x android/gradlew
```

### Gradle cache issues

```bash
cd android
./gradlew clean
```

### Clearing everything and starting fresh

```bash
rm -rf node_modules android
npx expo prebuild --clean
npm install
```

---

## Appendix: NPM scripts

These are already configured in `package.json`:

```json
{
  "android": "expo run:android",
  "android:release": "expo prebuild --clean && cd android && ./gradlew clean && ./gradlew assembleRelease",
  "android:bundle": "expo prebuild --clean && cd android && ./gradlew clean && ./gradlew bundleRelease",
  "android:clean": "cd android && ./gradlew clean"
}
```

- `npm run android` — debug build on connected device
- `npm run android:release` — release APK
- `npm run android:bundle` — release AAB (for Play Store)
- `npm run android:clean` — clean Android build artifacts