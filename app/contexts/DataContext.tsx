import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AppPreferences,
  AppStats,
  CalendarEvent,
  DayName,
  EventsMap,
  Note,
  RoutineTask,
  RoutinesMap,
  UndoAction,
} from '../types';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_STATS,
  UNDO_TTL_MS,
  emptyRoutines,
} from '../constants';
import {
  clearAllAppData,
  fetchEvents,
  fetchNotes,
  fetchPreferences,
  fetchRoutines,
  fetchStats,
  persistNotes,
  runMigrations,
  saveEventDay,
  savePreferences,
  saveRoutineDay,
  saveStats,
} from '../services/storage';
import {
  cancelOneHourReminder,
  cancelRoutineNotification,
  rescheduleAllRoutines,
  syncTaskNotifications,
  updateOngoingStatusNotification,
} from '../services/notifications';
import { bootstrapPermissions } from '../services/permissions';
import {
  applyCompletionToStats,
  createId,
  formatDisplayDate,
  nowIso,
  sanitizeText,
} from '../utils';
import { animateLayout } from '../theme';

type DataContextValue = {
  ready: boolean;
  error: string | null;
  clearError: () => void;
  routines: RoutinesMap;
  events: EventsMap;
  notes: Note[];
  preferences: AppPreferences;
  stats: AppStats;
  undo: UndoAction | null;
  migrationNotes: string[];
  // routines
  addRoutineTask: (day: DayName, task: string, time: string) => Promise<boolean>;
  deleteRoutineTask: (day: DayName, id: string) => Promise<boolean>;
  toggleRoutineComplete: (day: DayName, id: string) => Promise<boolean>;
  // events
  addEvent: (dateId: string, text: string) => Promise<boolean>;
  updateEvent: (dateId: string, id: string, text: string) => Promise<boolean>;
  deleteEvent: (dateId: string, id: string) => Promise<boolean>;
  // notes
  addNote: (title: string, text: string) => Promise<boolean>;
  updateNote: (id: string, title: string, text: string) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  togglePinNote: (id: string) => Promise<boolean>;
  toggleArchiveNote: (id: string) => Promise<boolean>;
  // prefs / meta
  updatePreferences: (patch: Partial<AppPreferences>) => Promise<boolean>;
  refreshAll: () => Promise<void>;
  wipeData: () => Promise<boolean>;
  performUndo: () => Promise<void>;
  dismissUndo: () => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routines, setRoutines] = useState<RoutinesMap>(emptyRoutines());
  const [events, setEvents] = useState<EventsMap>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [stats, setStats] = useState<AppStats>(DEFAULT_STATS);
  const [undo, setUndo] = useState<UndoAction | null>(null);
  const [migrationNotes, setMigrationNotes] = useState<string[]>([]);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  const clearError = useCallback(() => setError(null), []);

  const pushUndo = useCallback((action: Omit<UndoAction, 'expiresAt'>) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const next: UndoAction = { ...action, expiresAt: Date.now() + UNDO_TTL_MS };
    setUndo(next);
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_TTL_MS);
  }, []);

  const dismissUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
  }, []);

  const refreshAll = useCallback(async () => {
    const [r, e, n, p, s] = await Promise.all([
      fetchRoutines(),
      fetchEvents(),
      fetchNotes(),
      fetchPreferences(),
      fetchStats(),
    ]);
    setRoutines(r);
    setEvents(e);
    setNotes(n);
    setPreferences(p);
    setStats(s);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const migration = await runMigrations();
        if (!mounted) return;
        setMigrationNotes(migration.details);
        await bootstrapPermissions();
        await refreshAll();
      } catch (e) {
        if (mounted) setError(`Startup failed: ${String(e)}`);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, [refreshAll]);

  useEffect(() => {
    if (!ready) return;
    updateOngoingStatusNotification(routines, preferences.ongoingStatusEnabled);
  }, [ready, routines, preferences.ongoingStatusEnabled]);

  const addRoutineTask = useCallback(async (day: DayName, task: string, time: string) => {
    const cleaned = sanitizeText(task, 200);
    if (!cleaned) return false;
    const newTask: RoutineTask = {
      id: createId(),
      task: cleaned,
      time,
      completed: false,
      completedAt: null,
      notificationId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    animateLayout();
    const list = [...(routines[day] || []), newTask];
    const updated = await saveRoutineDay(day, list);
    if (!updated) {
      setError('Failed to save routine task.');
      return false;
    }
    setRoutines(updated);
    const p = prefsRef.current;
    await syncTaskNotifications(newTask, day, p);
    return true;
  }, [routines]);

  const deleteRoutineTask = useCallback(async (day: DayName, id: string) => {
    const existing = (routines[day] || []).find((t) => t.id === id);
    animateLayout();
    const filtered = (routines[day] || []).filter((t) => t.id !== id);
    const updated = await saveRoutineDay(day, filtered);
    if (!updated) {
      setError('Failed to delete routine task.');
      return false;
    }
    setRoutines(updated);
    await cancelRoutineNotification(id);
    await cancelOneHourReminder(id);
    if (existing) {
      pushUndo({
        type: 'routine',
        label: 'Task deleted',
        payload: { day, task: existing },
      });
    }
    return true;
  }, [routines, pushUndo]);

  const toggleRoutineComplete = useCallback(async (day: DayName, id: string) => {
    const list = (routines[day] || []).map((t) => {
      if (t.id !== id) return t;
      const completed = !t.completed;
      return {
        ...t,
        completed,
        completedAt: completed ? nowIso() : null,
        updatedAt: nowIso(),
      };
    });
    const toggled = list.find((t) => t.id === id);
    animateLayout();
    const updated = await saveRoutineDay(day, list);
    if (!updated) {
      setError('Failed to update task.');
      return false;
    }
    setRoutines(updated);
    if (toggled?.completed) {
      const nextStats = applyCompletionToStats(stats, true);
      setStats(nextStats);
      await saveStats(nextStats);
    }
    return true;
  }, [routines, stats]);

  const addEvent = useCallback(async (dateId: string, text: string) => {
    const cleaned = sanitizeText(text, 500);
    if (!cleaned) return false;
    const event: CalendarEvent = {
      id: createId(),
      text: cleaned,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    animateLayout();
    const list = [...(events[dateId] || []), event];
    const updated = await saveEventDay(dateId, list);
    if (!updated) {
      setError('Failed to save event.');
      return false;
    }
    setEvents(updated);
    const nextStats = { ...stats, eventsCreated: stats.eventsCreated + 1 };
    setStats(nextStats);
    await saveStats(nextStats);
    return true;
  }, [events, stats]);

  const updateEvent = useCallback(async (dateId: string, id: string, text: string) => {
    const cleaned = sanitizeText(text, 500);
    if (!cleaned) return false;
    const list = (events[dateId] || []).map((e) =>
      e.id === id ? { ...e, text: cleaned, updatedAt: nowIso() } : e,
    );
    const updated = await saveEventDay(dateId, list);
    if (!updated) {
      setError('Failed to update event.');
      return false;
    }
    setEvents(updated);
    return true;
  }, [events]);

  const deleteEvent = useCallback(async (dateId: string, id: string) => {
    const existing = (events[dateId] || []).find((e) => e.id === id);
    animateLayout();
    const list = (events[dateId] || []).filter((e) => e.id !== id);
    const updated = await saveEventDay(dateId, list);
    if (!updated) {
      setError('Failed to remove event.');
      return false;
    }
    setEvents(updated);
    if (existing) {
      pushUndo({
        type: 'event',
        label: 'Event removed',
        payload: { dateId, event: existing },
      });
    }
    return true;
  }, [events, pushUndo]);

  const addNote = useCallback(async (title: string, text: string) => {
    const t = sanitizeText(title, 120).toUpperCase();
    const c = sanitizeText(text, 5000);
    if (!t || !c) return false;
    const note: Note = {
      id: createId(),
      title: t,
      text: c,
      date: formatDisplayDate(),
      pinned: false,
      archived: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    animateLayout();
    const updated = [note, ...notes];
    setNotes(updated);
    const ok = await persistNotes(updated);
    if (!ok) {
      setError('Failed to save note.');
      return false;
    }
    const nextStats = { ...stats, notesCreated: stats.notesCreated + 1 };
    setStats(nextStats);
    await saveStats(nextStats);
    return true;
  }, [notes, stats]);

  const updateNote = useCallback(async (id: string, title: string, text: string) => {
    const t = sanitizeText(title, 120).toUpperCase();
    const c = sanitizeText(text, 5000);
    if (!t || !c) return false;
    animateLayout();
    const updated = notes.map((n) =>
      n.id === id ? { ...n, title: t, text: c, updatedAt: nowIso() } : n,
    );
    setNotes(updated);
    const ok = await persistNotes(updated);
    if (!ok) setError('Failed to update note.');
    return ok;
  }, [notes]);

  const deleteNote = useCallback(async (id: string) => {
    const existing = notes.find((n) => n.id === id);
    animateLayout();
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    const ok = await persistNotes(updated);
    if (!ok) {
      setError('Failed to delete note.');
      return false;
    }
    if (existing) {
      pushUndo({ type: 'note', label: 'Stream deleted', payload: existing });
    }
    return true;
  }, [notes, pushUndo]);

  const togglePinNote = useCallback(async (id: string) => {
    animateLayout();
    const updated = notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: nowIso() } : n,
    );
    setNotes(updated);
    return persistNotes(updated);
  }, [notes]);

  const toggleArchiveNote = useCallback(async (id: string) => {
    animateLayout();
    const updated = notes.map((n) =>
      n.id === id ? { ...n, archived: !n.archived, updatedAt: nowIso() } : n,
    );
    setNotes(updated);
    return persistNotes(updated);
  }, [notes]);

  const updatePreferences = useCallback(async (patch: Partial<AppPreferences>) => {
    const next = { ...prefsRef.current, ...patch };
    setPreferences(next);
    const ok = await savePreferences(next);
    if (!ok) {
      setError('Failed to save preferences.');
      return false;
    }
    if (
      'notificationsEnabled' in patch ||
      'oneHourReminder' in patch ||
      'soundEnabled' in patch
    ) {
      await rescheduleAllRoutines(routines, {
        enabled: next.notificationsEnabled,
        oneHour: next.oneHourReminder,
        soundEnabled: next.soundEnabled,
      });
    }
    if ('ongoingStatusEnabled' in patch) {
      await updateOngoingStatusNotification(routines, next.ongoingStatusEnabled);
    }
    return true;
  }, [routines]);

  const wipeData = useCallback(async () => {
    const ok = await clearAllAppData();
    if (!ok) {
      setError('Failed to clear data.');
      return false;
    }
    await rescheduleAllRoutines(emptyRoutines(), {
      enabled: false,
      oneHour: false,
      soundEnabled: false,
    });
    setRoutines(emptyRoutines());
    setEvents({});
    setNotes([]);
    setStats(DEFAULT_STATS);
    return true;
  }, []);

  const performUndo = useCallback(async () => {
    if (!undo) return;
    const action = undo;
    dismissUndo();
    if (action.type === 'note') {
      const note = action.payload as Note;
      const updated = [note, ...notes.filter((n) => n.id !== note.id)];
      setNotes(updated);
      await persistNotes(updated);
    } else if (action.type === 'event') {
      const { dateId, event } = action.payload as { dateId: string; event: CalendarEvent };
      const list = [...(events[dateId] || []).filter((e) => e.id !== event.id), event];
      const updated = await saveEventDay(dateId, list);
      if (updated) setEvents(updated);
    } else if (action.type === 'routine') {
      const { day, task } = action.payload as { day: DayName; task: RoutineTask };
      const list = [...(routines[day] || []).filter((t) => t.id !== task.id), task];
      const updated = await saveRoutineDay(day, list);
      if (updated) {
        setRoutines(updated);
        await syncTaskNotifications(task, day, prefsRef.current);
      }
    }
  }, [undo, dismissUndo, notes, events, routines]);

  const value = useMemo<DataContextValue>(
    () => ({
      ready,
      error,
      clearError,
      routines,
      events,
      notes,
      preferences,
      stats,
      undo,
      migrationNotes,
      addRoutineTask,
      deleteRoutineTask,
      toggleRoutineComplete,
      addEvent,
      updateEvent,
      deleteEvent,
      addNote,
      updateNote,
      deleteNote,
      togglePinNote,
      toggleArchiveNote,
      updatePreferences,
      refreshAll,
      wipeData,
      performUndo,
      dismissUndo,
    }),
    [
      ready, error, clearError, routines, events, notes, preferences, stats, undo,
      migrationNotes, addRoutineTask, deleteRoutineTask, toggleRoutineComplete,
      addEvent, updateEvent, deleteEvent, addNote, updateNote, deleteNote,
      togglePinNote, toggleArchiveNote, updatePreferences, refreshAll, wipeData,
      performUndo, dismissUndo,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
