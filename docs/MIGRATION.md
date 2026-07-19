# Architecture Migration — MintOrbit 2.1

## Decision summary

### 1. Modular feature architecture
Monolithic page files were split into `app/screens/`, `app/components/`, `app/services/`, `app/contexts/`, `app/hooks/`, `app/theme/`, `app/utils/`, and `app/constants/`. Each screen owns presentation; `DataContext` owns domain state and persistence orchestration.

### 2. Typed domain model
Introduced TypeScript with strict mode for routines, events, notes, preferences, stats, and backups. Runtime `normalize*` helpers coerce legacy shapes safely.

### 3. Storage: MMKV + AsyncStorage dual-write
- Prefer `react-native-mmkv` when the native module is present (dev client / release builds).
- Fall back to AsyncStorage automatically (Expo Go / missing native module).
- Dual-write mirrors MMKV → AsyncStorage for backup portability.
- Schema version key `@mintorbit_schema_version` enables forward migrations.

### 4. Automatic legacy migration
On first boot, copies `@mint_routines|events|notes` → `@mintorbit_*` when new keys are empty, then normalizes payloads. Idempotent via `@mintorbit_migration_v2`.

### 5. Notification engine
- Android channels for routines + ongoing status
- Weekly exact triggers
- Optional 1-hour pre-reminder
- Ongoing low-priority status notification
- Full reschedule when preferences change
- Cleanup on delete

### 6. Settings + backup
Settings modal covers notification toggles, haptics, archive visibility, JSON export/import, and wipe. Export uses `expo-file-system` + `expo-sharing`; import uses `expo-document-picker`.

### 7. Product surface expansion
Added **Today/Agenda** tab (insights, upcoming, streak), routine completion, note pin/archive/search/sort, and undo snackbar for deletes.

### 8. Android production config
- `version` 2.1.0 / `versionCode` 21
- compile/target SDK 35, min SDK 24
- Proguard + resource shrinking via `expo-build-properties`
- Exact alarm + POST_NOTIFICATIONS permissions
- EAS profiles: development, preview (APK), production (AAB), production-apk

### 9. Branding preserved
MintOrbit / DayStream Velocity identity, AMOLED palette (`#0D0E12` / `#00E676`), offline-first behavior retained.
