# EHS Mobile App - Android Build Guide

## Setup Complete ✅

Your web app is now wrapped as an Android mobile app using Capacitor.

**Current Configuration:**
- App Name: `oasis-ehs`
- Package ID: `com.oasisehs.app`
- Backend API: `https://ehs-development.onrender.com`
- Web Assets: `frontend/www/`
- Android Project: `frontend/android/`

---

## Prerequisites for Building

### 1. **Install Android Studio**
- Download from: https://developer.android.com/studio
- Install Android SDK, API 34+, and build tools

### 2. **Set ANDROID_HOME Environment Variable**
```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\{YourUsername}\AppData\Local\Android\Sdk", "User")
```

### 3. **Install Java Development Kit (JDK)**
- Android Studio typically bundles JDK 17+
- Or download from: https://www.oracle.com/java/technologies/javase-downloads.html

---

## Build Steps

### Step 1: Update Web Assets
When you make changes to frontend files, sync them to the `www/` folder:
```bash
cd c:\CODEBASE\EHS\frontend
copy *.html www\
copy *.css www\
copy *.js www\
npx cap sync android
```

### Step 2: Build APK for Testing
```bash
cd c:\CODEBASE\EHS\frontend
npx cap open android
```
This opens Android Studio with your project ready to build.

**In Android Studio:**
- Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- APK output: `android/app/build/outputs/apk/debug/app-debug.apk`
- Install on emulator/device: `adb install app-debug.apk`

### Step 3: Build Release APK (for Google Play)
```bash
cd c:\CODEBASE\EHS\frontend\android
./gradlew assembleRelease
```
**Release APK:** `frontend/android/app/build/outputs/apk/release/app-release.apk`

---

## Deploy to Google Play Store

### 1. Create Google Play Developer Account
- Visit: https://play.google.com/console
- Pay $25 one-time registration fee
- Complete developer profile

### 2. Create App on Google Play Console
- Click **Create App**
- App name: `oasis-ehs`
- Category: Business

### 3. Sign Release APK with Keystore
Generate a signing key:
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```
**Keep this keystore safe!** You'll need it for all future updates.

### 4. Configure Android Studio for Signing
In `frontend/android/app/build.gradle`, add:
```gradle
signingConfigs {
    release {
        storeFile file('path/to/my-release-key.keystore')
        storePassword 'your_keystore_password'
        keyAlias 'my-key-alias'
        keyPassword 'your_key_password'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### 5. Upload to Google Play
1. Create **Release** in Google Play Console
2. Upload signed APK
3. Add app description, screenshots (min 2), and icon
4. Complete content rating questionnaire
5. Review pricing and distribution
6. **Submit for review** (takes 2-4 hours typically)

---

## Testing on Device

### Install on Android Device (USB debugging enabled)
```bash
adb devices  # List connected devices
adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Test on Emulator
```bash
npx cap open android
# In Android Studio: Device Manager → Create Virtual Device → Run
```

---

## Capacitor Native Plugins Available

Your app has access to:
- **@capacitor/camera** - Take photos/videos
- **@capacitor/filesystem** - Access device storage  
- **@capacitor/geolocation** - GPS location services
- **@capacitor/network** - Check network status
- **@capacitor/app** - App lifecycle events

### Example: Take Photo and Upload to S3
```javascript
import { Camera, CameraResultType } from '@capacitor/camera';

async function takeSafetyPhoto() {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Base64
  });
  // Convert to blob and upload via FormData
  const blob = await fetch(`data:image/jpeg;base64,${image.base64String}`).then(r => r.blob());
  const formData = new FormData();
  formData.append('file', blob, 'safety-photo.jpg');
  formData.append('uploadType', 'safety_incident');
  formData.append('description', 'Incident photo');
  
  fetch('https://ehs-development.onrender.com/api/files/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

---

## Troubleshooting

### APK Won't Install
- Ensure `com.oasisehs.app` isn't already installed
- Clear app data: `adb shell pm clear com.oasisehs.app`
- Reinstall: `adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Build Fails
```bash
cd frontend/android
./gradlew clean
./gradlew build
```

### White Screen on Launch
- Check browser console in Android Studio (Logcat)
- Ensure API URL is reachable from device
- Verify `capacitor.config.json` points to correct server URL

---

## Next Steps

1. ✅ Build test APK with Android Studio
2. ✅ Test on emulator or device
3. ✅ Generate signing keystore
4. ✅ Build release APK
5. ✅ Upload to Google Play Store
6. ✅ Monitor reviews and crashes (Google Play Console)

**Deployment Timeline:**
- Local testing: ~2 hours
- Google Play submission → review: ~4-24 hours
- Live in store: Same day (after approval)

---

## Version Updates

To release a new version:
1. Update `frontend/package.json` version
2. Update web assets: `npx cap sync android`
3. Increment `versionCode` in `frontend/android/app/build.gradle`
4. Build release APK
5. Upload to Google Play with release notes

---

## Support

- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio Docs: https://developer.android.com/studio/intro
- Google Play Console Help: https://support.google.com/googleplay/android-developer
