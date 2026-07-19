# Performance Report — MintOrbit 2.1

## Optimizations applied

### React render path
- `React.memo` on `CalendarCell`, `RoutineItem`, `NoteCard`, header, buttons
- Custom `areEqual` for calendar cells and routine items (primitive props)
- Stable `useCallback` handlers in screens and `DataContext`
- `useMemo` for calendar year sections, filtered notes, agenda insights

### Lists
- `FlatList` / `SectionList` with `initialNumToRender`, `windowSize`, `removeClippedSubviews`
- Year picker uses `getItemLayout` + `initialScrollIndex`
- Pager `offscreenPageLimit={1}` to limit inactive tab work

### Storage
- MMKV synchronous reads when available (faster than AsyncStorage bridge)
- Normalized writes avoid repeated schema drift
- Context batches domain updates; notifications fire as non-blocking side effects

### Startup
- Single migration pass then parallel fetch of routines/events/notes/prefs/stats
- Channels + permissions bootstrapped once

### Bundle / native
- Removed unused `roman-numerals`
- Proguard + shrink resources in release
- Hermes (Expo default) retained

## Expected impact
- Fewer calendar grid re-renders when typing in modals
- Faster preference/storage access on release builds with MMKV
- Lower memory for inactive pager pages
- Smaller release APK/AAB via shrinking
