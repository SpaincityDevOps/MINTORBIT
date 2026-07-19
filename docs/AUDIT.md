# MintOrbit Production Audit Report

**Date:** 2026-07-19  
**Target:** production v2.1.0 (application source in `app/`)  
**Package:** `com.spaincity.myroutine`

## Findings (pre-refactor)

| Area | Severity | Issue |
|------|----------|--------|
| Architecture | High | Flat source tree with monolithic page files (250–350 LOC) mixing UI, storage, and side effects |
| Storage | High | No migration from 1.0 keys (`@mint_*`) → data loss on upgrade |
| Storage | Medium | Raw JSON + AsyncStorage on JS thread; no schema versioning/validation |
| Notifications | High | Basic weekly schedule only; no channels, 1h reminder, ongoing status, or reschedule-on-pref-change |
| Notifications | Medium | Android 13+ POST_NOTIFICATIONS not explicitly modeled in UX |
| Dependencies | Low | Unused `roman-numerals`; alarm assets unused |
| UI | Medium | No Settings, Agenda, search, pin/archive, completion, streaks |
| Build | High | No EAS profiles, Proguard/shrink, target SDK 35, versionCode strategy |
| Resilience | Medium | Partial error handling; COLORS exported from App.js (tight coupling) |
| A11y | Medium | Missing roles/labels on many controls; mixed touch targets |
| Security | Low | Unvalidated JSON parse; no input length caps |
| Performance | Medium | Inline handlers; calendar re-renders; no list virtualization tuning |

## Resolutions

All critical and high items addressed in v2.1 architecture (see MIGRATION.md / CHANGELOG.md).
