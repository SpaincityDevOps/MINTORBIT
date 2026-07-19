import type { AppPreferences, AppStats, DayName, RoutinesMap } from '../types';

export const APP_NAME = 'MintOrbit';
export const APP_TAGLINE = 'DayStream Velocity';
export const PACKAGE_NAME = 'com.spaincity.myroutine';
export const APP_VERSION = '2.1.0';
export const STORAGE_SCHEMA_VERSION = 2;

export const DAYS: DayName[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DAY_LABELS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export const STORAGE_KEYS = {
  ROUTINES: '@mintorbit_routines',
  EVENTS: '@mintorbit_events',
  NOTES: '@mintorbit_notes',
  PREFERENCES: '@mintorbit_preferences',
  STATS: '@mintorbit_stats',
  SCHEMA: '@mintorbit_schema_version',
  MIGRATION_DONE: '@mintorbit_migration_v2',
} as const;

/** Legacy 1.0 keys — migrated automatically on first launch */
export const LEGACY_KEYS = {
  ROUTINES: '@mint_routines',
  EVENTS: '@mint_events',
  NOTES: '@mint_notes',
} as const;

export const DEFAULT_PREFERENCES: AppPreferences = {
  notificationsEnabled: true,
  soundEnabled: false,
  hapticsEnabled: true,
  oneHourReminder: true,
  ongoingStatusEnabled: true,
  weekStartsOn: 0,
  defaultDayView: 'today',
  sortNotes: 'newest',
  showArchived: false,
  storageVersion: STORAGE_SCHEMA_VERSION,
};

export const DEFAULT_STATS: AppStats = {
  routinesCompletedTotal: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletionDate: null,
  notesCreated: 0,
  eventsCreated: 0,
};

export function emptyRoutines(): RoutinesMap {
  return DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as RoutinesMap);
}

export const YEAR_RANGE = { start: 1990, end: 2090 } as const;

export const NOTIFICATION_CHANNEL = {
  id: 'mintorbit-routines',
  name: 'Routine Reminders',
  description: 'Weekly and upcoming routine alerts',
} as const;

export const ONGOING_CHANNEL = {
  id: 'mintorbit-ongoing',
  name: 'Active DayStream',
  description: 'Ongoing status for the current or upcoming task',
} as const;

export const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
] as const;

export const UNDO_TTL_MS = 6000;
