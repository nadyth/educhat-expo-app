# iOS Release Build Guide

> **App:** EduChat AI  
> **Bundle ID:** `com.devnadeem.educhat`  
> **Xcode Scheme:** `EduChatAI`  
> **Workspace:** `ios/EduChatAI.xcworkspace`

---

## Prerequisites

- macOS with Xcode 15+
- Apple Developer account ($99/year) — [developer.apple.com](https://developer.apple.com)
- A valid provisioning profile for `com.devnadeem.educhat`
- CocoaPods: `sudo gem install cocoapods`
- Node.js 18+ and npm/yarn
- Run `npm install` in the project root

---

## Quick Reference

| Task | Command |
|---|---|
| Generate native project | `npx expo prebuild` |
| Generate native project (clean) | `npx expo prebuild --clean` |
| Run release on simulator | `npm run ios:release` |
| Run release on physical device | `npm run ios:release -- --device` |
| Run release (full clean rebuild) | `npm run ios:release:clean` |
| Build archive (CLI) | `xcodebuild archive -workspace EduChatAI.xcworkspace -scheme EduChatAI -configuration Release -archivePath build/EduChatAI.xcarchive -destination 'generic/platform=iOS'` |
| Upload to App Store | `xcrun altool --upload-app` or Transporter app |

---

## 1. Generate the native iOS project

```bash
# Fast (reuses cached prebuild)
npx expo prebuild

# Full clean rebuild
npx expo prebuild --clean
```

This creates/refreshes the `ios/` directory with the latest native config from `app.json`.

---

## 2. Configure signing in Xcode

1. Open the workspace:
   ```bash
   open ios/EduChatAI.xcworkspace
   ```
2. In Xcode, select the **EduChatAI** project in the navigator
3. Select the **EduChatAI** target
4. Go to **Signing & Capabilities**
5. Check **Automatically manage signing** (or manually select your team/profile)
6. Select your **Team** (Apple Developer account)
7. Verify **Bundle Identifier** is `com.devnadeem.educhat`

---

## 3. Build & run release

### On a simulator

```bash
# Fast (reuses cached prebuild)
npm run ios:release

# Full clean rebuild
npm run ios:release:clean
```

### On a physical device

Connect your iPhone via USB, then:

```bash
npm run ios:release -- --device
```

---

## 4. Archive for App Store distribution

### Option A: Xcode GUI

1. Set the scheme to **Any iOS Device** (top toolbar → device dropdown → Any iOS Device)
2. Go to **Product → Archive**
3. Wait for the archive to complete
4. The Organizer window opens — select your archive and click **Distribute App**

### Option B: Command line

```bash
cd ios

# Archive
xcodebuild archive \
  -workspace EduChatAI.xcworkspace \
  -scheme EduChatAI \
  -configuration Release \
  -archivePath build/EduChatAI.xcarchive \
  -destination 'generic/platform=iOS'

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/EduChatAI.xcarchive \
  -exportPath build/output \
  -exportOptionsPlist ExportOptions.plist
```

> You need an `ExportOptions.plist` file in the `ios/` directory for command-line export. See the [ExportOptions.plist template](#exportoptionsplist-template) below.

---

## 5. Upload to App Store Connect

### Option A: Command line

```bash
xcrun altool --upload-app \
  --type ios \
  --file build/output/EduChatAI.ipa \
  --apiKey YOUR_API_KEY \
  --apiIssuer YOUR_ISSUER_ID
```

### Option B: Transporter

Open the **Transporter** app (included with Xcode) and drag in the `.ipa` file.

---

## Troubleshooting

### "No signing certificate" error

- Open Xcode → Preferences → Accounts → Add your Apple ID
- Make sure your team is selected under Signing & Capabilities

### `expo prebuild` fails

```bash
rm -rf ios node_modules/.cache
npx expo prebuild --clean
```

### CocoaPods issues

```bash
cd ios && pod install --repo-update
```

### Clearing everything and starting fresh

```bash
rm -rf node_modules ios
npx expo prebuild --clean
npm install
```

---

## Appendix: ExportOptions.plist template

Create this file as `ios/ExportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
</dict>
</plist>
```

Replace `YOUR_TEAM_ID` with your Apple Developer Team ID (found at [developer.apple.com/account](https://developer.apple.com/account) → Membership).