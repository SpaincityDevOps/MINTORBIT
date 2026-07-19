# MintOrbit: DayStream Velocity

Offline-first productivity suite for Android (Expo / React Native).

**Package:** `com.spaincity.myroutine`  
**Version:** 2.1.0  

## Repository layout

```text
MINTORBIT/
├── app/                 # Production application source
├── legacy/              # Original 1.0 project (unchanged)
├── assets/
├── docs/
├── scripts/
├── builds/              # MintOrbit.apk / MintOrbit.aab
├── android/             # Native project (Expo prebuild)
├── README.md
├── CHANGELOG.md
├── package.json
├── app.json
└── eas.json
```

## Features

- **Today** — agenda, upcoming reminders, streaks, insights  
- **Calendar** — year grid, per-day activities  
- **Routine** — weekly timed tasks with completion + notifications  
- **Streams** — notebook with search, pin, archive, undo  
- **Settings** — notifications, haptics, backup export/import, wipe data  

## Quick start

```bash
npm install
npx expo start
```

Use a **development build** (not Expo Go) for MMKV + full notifications:

```bash
npx expo run:android
```

## Production builds

See [docs/BUILD.md](docs/BUILD.md). Artifacts land in [`builds/`](builds/).

```bash
# Shareable APK
npx eas build -p android --profile production-apk

# Play Store AAB
npx eas build -p android --profile production

# Local release (Windows)
npm run build:local
```

## Documentation

| Doc | Description |
|-----|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Release notes |
| [docs/AUDIT.md](docs/AUDIT.md) | Pre-refactor audit |
| [docs/MIGRATION.md](docs/MIGRATION.md) | Architecture decisions |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Performance work |
| [docs/BUILD.md](docs/BUILD.md) | Android / EAS build |

## Legacy

[`legacy/`](legacy/) holds the archived 1.0 prototype. Data migrates automatically from `@mint_*` keys on first launch of 2.1.
