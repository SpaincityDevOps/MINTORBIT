# Build Report — MintOrbit 2.1

## Stack
| Item | Value |
|------|-------|
| App version | 2.1.0 |
| Android versionCode | 21 |
| Expo SDK | ~54.0.33 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| Package | com.spaincity.myroutine |
| compileSdk | 35 |
| targetSdk | 35 |
| minSdk | 24 |
| NDK | 27.1.12297006 |
| Hermes | Enabled (Expo default) |
| New Architecture | Enabled |
| Proguard | Enabled (release) |
| Shrink resources | Enabled (release) |

## Build result (local, 2026-07-19)

| Artifact | Status | Size | Path |
|----------|--------|------|------|
| `MintOrbit.apk` | **SUCCESS** | ~29 MB | `builds/MintOrbit.apk` |
| `MintOrbit.aab` | **SUCCESS** | ~23 MB | `builds/MintOrbit.aab` |

Gradle: `BUILD SUCCESSFUL`  
Architecture built: `arm64-v8a`  
Typecheck: `tsc --noEmit` clean  

### Notes
- Local release APK uses the Expo/Android debug signing config unless you configure a upload keystore. For Play Store, use EAS production with a managed or local keystore.
- On Windows, set `GRADLE_USER_HOME=C:\g` (short path) to avoid MAX_PATH failures.
- Project path contains spaces (`SPAINCITY EVO`); short Gradle home mitigates native CMake path limits.

## EAS profiles
- `development` — dev client, APK  
- `preview` — internal APK  
- `production` — Play Store AAB  
- `production-apk` — shareable release APK  

```bash
npm install
eas login
eas build -p android --profile production-apk
eas build -p android --profile production
```

## Local rebuild

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:GRADLE_USER_HOME = "C:\g"
cd android
.\gradlew.bat assembleRelease bundleRelease -PreactNativeArchitectures=arm64-v8a
# outputs copied to builds/ via scripts/build-release.bat
```
