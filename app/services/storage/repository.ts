import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_STATS,
  LEGACY_KEYS,
  STORAGE_KEYS,
  STORAGE_SCHEMA_VERSION,
  emptyRoutines,
} from '../../constants';
import type { AppPreferences, AppStats, EventsMap, Note, RoutinesMap } from '../../types';
import { normalizeEvents, normalizeNotes, normalizeRoutines } from '../../utils/normalize';
import { safeJsonParse } from '../../utils/date';
import { kv } from './kv';

export type MigrationResult = {
  migrated: boolean;
  fromLegacy: boolean;
  details: string[];
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await kv.get(key);
  return safeJsonParse(raw, fallback);
}

async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    const payload = JSON.stringify(value);
    return await kv.set(key, payload);
  } catch {
    return false;
  }
}

/**
 * Migrates 1.0 keys → 2.x keys and normalizes schema.
 * Safe to call repeatedly (idempotent).
 */
export async function runMigrations(): Promise<MigrationResult> {
  const details: string[] = [];
  let fromLegacy = false;

  const flag = await kv.get(STORAGE_KEYS.MIGRATION_DONE);
  const schemaRaw = await kv.get(STORAGE_KEYS.SCHEMA);
  const schema = schemaRaw ? Number(schemaRaw) : 0;

  // Legacy AsyncStorage keys (1.0)
  try {
    const [legacyRoutines, legacyEvents, legacyNotes] = await Promise.all([
      AsyncStorage.getItem(LEGACY_KEYS.ROUTINES),
      AsyncStorage.getItem(LEGACY_KEYS.EVENTS),
      AsyncStorage.getItem(LEGACY_KEYS.NOTES),
    ]);

    const currentRoutines = await kv.get(STORAGE_KEYS.ROUTINES);
    const currentEvents = await kv.get(STORAGE_KEYS.EVENTS);
    const currentNotes = await kv.get(STORAGE_KEYS.NOTES);

    if (legacyRoutines && !currentRoutines) {
      const normalized = normalizeRoutines(safeJsonParse(legacyRoutines, {}));
      await writeJson(STORAGE_KEYS.ROUTINES, normalized);
      fromLegacy = true;
      details.push('Migrated routines from @mint_routines');
    }
    if (legacyEvents && !currentEvents) {
      const normalized = normalizeEvents(safeJsonParse(legacyEvents, {}));
      await writeJson(STORAGE_KEYS.EVENTS, normalized);
      fromLegacy = true;
      details.push('Migrated events from @mint_events');
    }
    if (legacyNotes && !currentNotes) {
      const normalized = normalizeNotes(safeJsonParse(legacyNotes, []));
      await writeJson(STORAGE_KEYS.NOTES, normalized);
      fromLegacy = true;
      details.push('Migrated notes from @mint_notes');
    }
  } catch (e) {
    details.push(`Legacy migration warning: ${String(e)}`);
  }

  // Normalize existing 2.0 payloads (string events → objects, etc.)
  if (schema < STORAGE_SCHEMA_VERSION || flag !== '1') {
    const routines = normalizeRoutines(await readJson(STORAGE_KEYS.ROUTINES, {}));
    const events = normalizeEvents(await readJson(STORAGE_KEYS.EVENTS, {}));
    const notes = normalizeNotes(await readJson(STORAGE_KEYS.NOTES, []));
    await writeJson(STORAGE_KEYS.ROUTINES, routines);
    await writeJson(STORAGE_KEYS.EVENTS, events);
    await writeJson(STORAGE_KEYS.NOTES, notes);

    const prefs = {
      ...DEFAULT_PREFERENCES,
      ...(await readJson(STORAGE_KEYS.PREFERENCES, {})),
      storageVersion: STORAGE_SCHEMA_VERSION,
    };
    await writeJson(STORAGE_KEYS.PREFERENCES, prefs);

    const stats = {
      ...DEFAULT_STATS,
      ...(await readJson(STORAGE_KEYS.STATS, {})),
    };
    await writeJson(STORAGE_KEYS.STATS, stats);

    await kv.set(STORAGE_KEYS.SCHEMA, String(STORAGE_SCHEMA_VERSION));
    await kv.set(STORAGE_KEYS.MIGRATION_DONE, '1');
    details.push(`Schema upgraded to v${STORAGE_SCHEMA_VERSION}`);
  }

  return {
    migrated: details.length > 0,
    fromLegacy,
    details,
  };
}

export async function fetchRoutines(): Promise<RoutinesMap> {
  try {
    const data = await readJson(STORAGE_KEYS.ROUTINES, {});
    return normalizeRoutines(data);
  } catch {
    return emptyRoutines();
  }
}

export async function saveRoutines(routines: RoutinesMap): Promise<boolean> {
  return writeJson(STORAGE_KEYS.ROUTINES, normalizeRoutines(routines));
}

export async function saveRoutineDay(
  day: keyof RoutinesMap,
  tasks: RoutinesMap[keyof RoutinesMap],
): Promise<RoutinesMap | null> {
  try {
    const existing = await fetchRoutines();
    const updated = { ...existing, [day]: tasks };
    const ok = await saveRoutines(updated);
    return ok ? updated : null;
  } catch {
    return null;
  }
}

export async function fetchEvents(): Promise<EventsMap> {
  try {
    return normalizeEvents(await readJson(STORAGE_KEYS.EVENTS, {}));
  } catch {
    return {};
  }
}

export async function saveEvents(events: EventsMap): Promise<boolean> {
  return writeJson(STORAGE_KEYS.EVENTS, normalizeEvents(events));
}

export async function saveEventDay(
  dateString: string,
  eventArray: EventsMap[string],
): Promise<EventsMap | null> {
  try {
    const existing = await fetchEvents();
    const updated = { ...existing };
    if (!eventArray.length) delete updated[dateString];
    else updated[dateString] = eventArray;
    const ok = await saveEvents(updated);
    return ok ? updated : null;
  } catch {
    return null;
  }
}

export async function fetchNotes(): Promise<Note[]> {
  try {
    return normalizeNotes(await readJson(STORAGE_KEYS.NOTES, []));
  } catch {
    return [];
  }
}

export async function persistNotes(notes: Note[]): Promise<boolean> {
  return writeJson(STORAGE_KEYS.NOTES, normalizeNotes(notes));
}

export async function fetchPreferences(): Promise<AppPreferences> {
  try {
    return { ...DEFAULT_PREFERENCES, ...(await readJson(STORAGE_KEYS.PREFERENCES, {})) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(prefs: AppPreferences): Promise<boolean> {
  return writeJson(STORAGE_KEYS.PREFERENCES, prefs);
}

export async function fetchStats(): Promise<AppStats> {
  try {
    return { ...DEFAULT_STATS, ...(await readJson(STORAGE_KEYS.STATS, {})) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export async function saveStats(stats: AppStats): Promise<boolean> {
  return writeJson(STORAGE_KEYS.STATS, stats);
}

export async function clearAllAppData(): Promise<boolean> {
  try {
    await Promise.all([
      kv.remove(STORAGE_KEYS.ROUTINES),
      kv.remove(STORAGE_KEYS.EVENTS),
      kv.remove(STORAGE_KEYS.NOTES),
      kv.remove(STORAGE_KEYS.STATS),
      // keep preferences & migration flags
    ]);
    await writeJson(STORAGE_KEYS.ROUTINES, emptyRoutines());
    await writeJson(STORAGE_KEYS.EVENTS, {});
    await writeJson(STORAGE_KEYS.NOTES, []);
    await writeJson(STORAGE_KEYS.STATS, DEFAULT_STATS);
    return true;
  } catch {
    return false;
  }
}
