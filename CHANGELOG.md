# Changelog — MintOrbit

## 2.1.0 — Production refactor (2026-07-19)

### Architecture
- Full TypeScript migration with strict typing
- Feature-folder structure (`screens`, `components`, `services`, `contexts`, `theme`, `utils`)
- Centralized `DataProvider` for app state
- Error boundary + boot loading state

### Storage
- Versioned schema (v2)
- MMKV with AsyncStorage fallback + dual-write
- Automatic migration from 1.0 `@mint_*` keys
- Normalization / corruption recovery on read
- Preferences + stats persistence

### Notifications
- Notification channels (Android)
- Weekly routine reminders
- 1-hour upcoming reminder
- Ongoing DayStream status notification
- Preference-driven reschedule
- Permission request UX + open system settings

### Features
- Today / Agenda dashboard with insights & streak
- Settings screen (notifications, haptics, backup)
- JSON backup export / import
- Routine completion checkmarks
- Streak tracking
- Note search, sort, pin, archive
- Undo delete snackbar (notes, events, routines)
- Calendar year picker + event CRUD retained

### UI/UX
- Shared design tokens (colors, spacing, typography)
- Accessible labels / roles on primary controls
- 48dp touch targets on primary actions
- LayoutAnimation on list mutations
- Haptics (optional)
- Empty / error / loading states

### Build / Expo
- Expo SDK 54 production config
- EAS build profiles (APK + AAB)
- Android target SDK 35, Proguard, shrink resources
- Removed unused `roman-numerals`
- Wired notification sound asset path

### Removed
- Legacy flat page JS modules
- Unused `roman-numerals` dependency
- COLORS export coupling from App shell
