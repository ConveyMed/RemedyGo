# Duplication Guide - Quick Reference

This guide shows exactly what files to update when duplicating this template for a new client.

---

## Files to Update

### 1. Supabase Credentials
**File:** `src/config/supabase.js`
```javascript
const supabaseUrl = '[CHANGE: Supabase Project URL]';
const supabaseAnonKey = '[CHANGE: Supabase Anon Key]';
```

### 2. OneSignal Credentials
**File:** `.env`
```
REACT_APP_ONESIGNAL_APP_ID=[CHANGE: OneSignal App ID]
REACT_APP_ONESIGNAL_REST_API_KEY=[CHANGE: OneSignal REST API Key]
```

### 3. Capacitor Config
**File:** `capacitor.config.ts`
```typescript
appId: '[CHANGE: com.clientname.app]',
appName: '[CHANGE: ClientName]',
```

### 4. Package Name
**File:** `package.json`
```json
{
  "name": "[CHANGE: clientname]",
  ...
}
```

### 5. HTML Meta Tags
**File:** `public/index.html`
- `<title>` - App title
- `<meta name="description">` - App description
- `<meta name="theme-color">` - Primary color
- `<meta property="og:*">` - Open Graph tags
- `<meta name="twitter:*">` - Twitter cards
- All URLs (canonical, og:url, etc.)

### 6. PWA Manifest
**File:** `public/manifest.json`
```json
{
  "short_name": "[CHANGE: ClientName]",
  "name": "[CHANGE: ClientName - Full Description]",
  "description": "[CHANGE: App description]",
  "theme_color": "[CHANGE: #HexColor]",
  ...
}
```

### 7. Theme Colors (if different from blue)
**File:** `src/App.css`
```css
:root {
  --primary-blue: [CHANGE: #HexColor];
  --primary-blue-light: [CHANGE: lighter shade];
  --primary-blue-dark: [CHANGE: darker shade];
  --accent-blue: [CHANGE: accent shade];
}
```

### 8. Logo/Icon Files - GENERATE FROM CLIENT LOGO

**Input Required:** One high-resolution logo (minimum 1024x1024 PNG with transparency)

**Generate these files for `public/`:**

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 16x16, 32x32, 48x48 | Browser tab icon |
| `favicon-16.png` | 16x16 | Small favicon |
| `favicon-32.png` | 32x32 | Standard favicon |
| `logo192.png` | 192x192 | PWA icon, Android |
| `logo512.png` | 512x512 | PWA splash, Android |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `og-image.png` | 1200x630 | Social sharing (logo centered on brand color background) |

**Generate for `public/icons/`:**

| File | Size |
|------|------|
| `icon-72.png` | 72x72 |
| `icon-96.png` | 96x96 |
| `icon-128.png` | 128x128 |
| `icon-144.png` | 144x144 |
| `icon-152.png` | 152x152 |
| `icon-384.png` | 384x384 |

**iOS App Icons (after `npx cap add ios`):**
Location: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

| Size | Scale | Filename |
|------|-------|----------|
| 20x20 | 1x, 2x, 3x | AppIcon-20@1x.png, etc. |
| 29x29 | 1x, 2x, 3x | AppIcon-29@1x.png, etc. |
| 40x40 | 1x, 2x, 3x | AppIcon-40@1x.png, etc. |
| 60x60 | 2x, 3x | AppIcon-60@2x.png, etc. |
| 76x76 | 1x, 2x | AppIcon-76@1x.png, etc. |
| 83.5x83.5 | 2x | AppIcon-83.5@2x.png |
| 1024x1024 | 1x | AppIcon-1024.png (App Store) |

**Android App Icons (after `npx cap add android`):**
Location: `android/app/src/main/res/`

| Folder | Size |
|--------|------|
| `mipmap-mdpi/` | 48x48 |
| `mipmap-hdpi/` | 72x72 |
| `mipmap-xhdpi/` | 96x96 |
| `mipmap-xxhdpi/` | 144x144 |
| `mipmap-xxxhdpi/` | 192x192 |

**Quick Generation Tools:**
- [realfavicongenerator.net](https://realfavicongenerator.net) - Web favicons
- [appicon.co](https://appicon.co) - iOS/Android icons from one image
- [maskable.app](https://maskable.app) - Test maskable icons

### 9. Deep Link Protocol
**File:** `src/pages/EmailConfirmed.js`
```javascript
window.location.href = 'yourapp://';  // [CHANGE] Update to your app scheme
```

### 10. Browser Toolbar Color
**File:** `src/utils/browser.js`
```javascript
toolbarColor: '#1e40af',  // [CHANGE] Update to match client primary color
```

### 11. AI Chat Integration (Optional)
**File:** `src/components/AIChatPanel.js`
- Line 78: `MINDSTUDIO_EMBED_URL` - Practice key included, update for production
- Line 215: `ConveyMed AI` - Update header text
- Line 136: Medical disclaimer - Update or remove based on use case

---

## Practice/Default Keys (Work Out of Box)

These keys are included for testing. Replace with client's own keys for production:

| Key | Location | Default |
|-----|----------|---------|
| OneSignal App ID | `.env` or `onesignal.js` fallback | `7144dde5-f28b-42e4-a826-9f5adef0a772` |
| MindStudio AI | `AIChatPanel.js` | Practice agent URL included |
| Supabase | `supabase.js` | Demo project (must replace) |

**Note:** Push notifications will work with default OneSignal key during testing but won't reach real users. Replace before production.

---

## After Duplication Checklist

### Supabase Dashboard
- [ ] Set Site URL in Authentication > URL Configuration
- [ ] Add Redirect URLs
- [ ] Run all 12 SQL files in order
- [ ] Set up email templates
- [ ] Create storage buckets (profile-images, post-images, chat-attachments, content-files)

### OneSignal Dashboard
- [ ] Configure iOS/Android platforms
- [ ] Set up web push (if using)

### Build & Deploy
- [ ] `npm install`
- [ ] `npm run build`
- [ ] Deploy to Netlify
- [ ] Test authentication flow
- [ ] Test post creation
- [ ] Test chat

### iOS Build
- [ ] `npx cap add ios`
- [ ] `npx cap sync`
- [ ] Open in Xcode: `npx cap open ios`
- [ ] Set Bundle ID in Xcode (must match `capacitor.config.ts`)
- [ ] Configure signing (Team, Provisioning Profile)
- [ ] Add push notification capability
- [ ] Update `ios/App/App/Info.plist` with URL scheme for deep links

### Android Build
- [ ] `npx cap add android`
- [ ] `npx cap sync`
- [ ] Open in Android Studio: `npx cap open android`

**Gradle Configuration** (after `npx cap add android`):

1. **Update `android/app/build.gradle`:**
   ```gradle
   android {
       defaultConfig {
           applicationId "com.clientname.app"  // Must match capacitor.config.ts
           minSdkVersion 22
           targetSdkVersion 34
       }
   }
   ```

2. **Update `android/app/src/main/res/values/strings.xml`:**
   ```xml
   <string name="app_name">ClientName</string>
   <string name="title_activity_main">ClientName</string>
   <string name="package_name">com.clientname.app</string>
   <string name="custom_url_scheme">clientname</string>
   ```

3. **For Release Builds - Create Keystore:**
   ```bash
   keytool -genkey -v -keystore android/app/release.keystore \
     -alias clientname -keyalg RSA -keysize 2048 -validity 10000
   ```

4. **Add to `android/app/build.gradle`:**
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('release.keystore')
               storePassword 'YOUR_STORE_PASSWORD'
               keyAlias 'clientname'
               keyPassword 'YOUR_KEY_PASSWORD'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

5. **Build APK/AAB:**
   ```bash
   cd android
   ./gradlew assembleRelease  # APK
   ./gradlew bundleRelease    # AAB for Play Store
   ```

### Common Android Issues
- **Gradle sync failed**: Run `cd android && ./gradlew clean`
- **SDK not found**: Set `ANDROID_HOME` environment variable
- **Build tools missing**: Install via Android Studio SDK Manager

---

*DemoTemplate - App Duplication System*
