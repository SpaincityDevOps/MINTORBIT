export type DayName =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface RoutineTask {
  id: string;
  task: string;
  time: string;
  completed?: boolean;
  completedAt?: string | null;
  notificationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RoutinesMap = Record<DayName, RoutineTask[]>;

export interface CalendarEvent {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export type EventsMap = Record<string, CalendarEvent[]>;

export interface Note {
  id: string;
  title: string;
  text: string;
  date: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppPreferences {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  oneHourReminder: boolean;
  ongoingStatusEnabled: boolean;
  weekStartsOn: 0 | 1;
  defaultDayView: 'today' | 'sunday';
  sortNotes: 'newest' | 'oldest' | 'title' | 'pinned';
  showArchived: boolean;
  storageVersion: number;
}

export interface AppStats {
  routinesCompletedTotal: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  notesCreated: number;
  eventsCreated: number;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  routines: RoutinesMap;
  events: EventsMap;
  notes: Note[];
  preferences: AppPreferences;
  stats: AppStats;
}

export type TabKey = 'calendar' | 'routine' | 'streams' | 'agenda' | 'settings';

export interface UndoAction {
  type: 'note' | 'event' | 'routine';
  payload: unknown;
  label: string;
  expiresAt: number;
}
