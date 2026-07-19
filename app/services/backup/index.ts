import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { BackupPayload } from '../../types';
import {
  fetchEvents,
  fetchNotes,
  fetchPreferences,
  fetchRoutines,
  fetchStats,
  persistNotes,
  saveEvents,
  savePreferences,
  saveRoutines,
  saveStats,
} from '../storage';
import { DEFAULT_PREFERENCES, DEFAULT_STATS, STORAGE_SCHEMA_VERSION, emptyRoutines } from '../../constants';
import { normalizeEvents, normalizeNotes, normalizeRoutines } from '../../utils/normalize';
import { nowIso, safeJsonParse } from '../../utils/date';

export async function buildBackupPayload(): Promise<BackupPayload> {
  const [routines, events, notes, preferences, stats] = await Promise.all([
    fetchRoutines(),
    fetchEvents(),
    fetchNotes(),
    fetchPreferences(),
    fetchStats(),
  ]);
  return {
    version: STORAGE_SCHEMA_VERSION,
    exportedAt: nowIso(),
    routines,
    events,
    notes,
    preferences,
    stats,
  };
}

export async function exportBackupToFile(): Promise<{ ok: boolean; uri?: string; error?: string }> {
  try {
    const payload = await buildBackupPayload();
    const fileName = `MintOrbit-backup-${Date.now()}.json`;
    const base = FileSystem.cacheDirectory;
    if (!base) return { ok: false, error: 'Cache directory unavailable.' };
    const uri = `${base}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export MintOrbit Backup',
        UTI: 'public.json',
      });
    }
    return { ok: true, uri };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function importBackupFromJson(
  raw: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const parsed = safeJsonParse<Partial<BackupPayload> | null>(raw, null);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Invalid backup file.' };
    }

    const routines = normalizeRoutines(parsed.routines ?? emptyRoutines());
    const events = normalizeEvents(parsed.events ?? {});
    const notes = normalizeNotes(parsed.notes ?? []);
    const preferences = { ...DEFAULT_PREFERENCES, ...(parsed.preferences || {}) };
    const stats = { ...DEFAULT_STATS, ...(parsed.stats || {}) };

    const results = await Promise.all([
      saveRoutines(routines),
      saveEvents(events),
      persistNotes(notes),
      savePreferences(preferences),
      saveStats(stats),
    ]);

    if (results.some((r) => !r)) {
      return { ok: false, error: 'Partial restore failure.' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function importBackupFromUri(
  uri: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const raw = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return importBackupFromJson(raw);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
