@echo off
REM MintOrbit local release build (Windows)
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set GRADLE_USER_HOME=C:\g
if not exist C:\g mkdir C:\g
cd /d "%~dp0..\android"
call gradlew.bat assembleRelease bundleRelease -PreactNativeArchitectures=arm64-v8a
if errorlevel 1 exit /b 1
cd /d "%~dp0.."
if not exist builds mkdir builds
copy /Y android\app\build\outputs\apk\release\app-release.apk builds\MintOrbit.apk
copy /Y android\app\build\outputs\bundle\release\app-release.aab builds\MintOrbit.aab
echo Done. Artifacts in builds\
