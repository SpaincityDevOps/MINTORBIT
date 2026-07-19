import type { CalendarEvent, DayName, Note, RoutineTask, RoutinesMap } from '../types';
import { DAYS, emptyRoutines } from '../constants';
import { createId, nowIso, sanitizeText } from './date';

export function normalizeRoutineTask(raw: unknown): RoutineTask | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const task = sanitizeText(String(r.task ?? ''), 200);
  const time = String(r.time ?? '00:00');
  if (!task) return null;
  const id = String(r.id ?? createId());
  return {
    id,
    task,
    time: /^\d{1,2}:\d{2}/.test(time) ? time.slice(0, 5) : '00:00',
    completed: Boolean(r.completed),
    completedAt: (r.completedAt as string) ?? null,
    notificationId: (r.notificationId as string) ?? null,
    createdAt: String(r.createdAt ?? nowIso()),
    updatedAt: String(r.updatedAt ?? nowIso()),
  };
}

export function normalizeRoutines(raw: unknown): RoutinesMap {
  const base = emptyRoutines();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;
  for (const day of DAYS) {
    const list = Array.isArray(obj[day]) ? obj[day] : [];
    base[day] = list
      .map(normalizeRoutineTask)
      .filter((t): t is RoutineTask => t !== null);
  }
  return base;
}

export function normalizeEvent(raw: unknown): CalendarEvent | null {
  if (typeof raw === 'string') {
    const text = sanitizeText(raw, 500);
    if (!text) return null;
    const ts = nowIso();
    return { id: createId(), text, createdAt: ts, updatedAt: ts };
  }
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const text = sanitizeText(String(e.text ?? e.title ?? ''), 500);
  if (!text) return null;
  return {
    id: String(e.id ?? createId()),
    text,
    createdAt: String(e.createdAt ?? nowIso()),
    updatedAt: String(e.updatedAt ?? nowIso()),
  };
}

export function normalizeEvents(raw: unknown): Record<string, CalendarEvent[]> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, CalendarEvent[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const events = value.map(normalizeEvent).filter((e): e is CalendarEvent => e !== null);
    if (events.length) out[key] = events;
  }
  return out;
}

export function normalizeNote(raw: unknown): Note | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as Record<string, unknown>;
  const title = sanitizeText(String(n.title ?? ''), 120).toUpperCase();
  const text = sanitizeText(String(n.text ?? n.content ?? ''), 5000);
  if (!title || !text) return null;
  return {
    id: String(n.id ?? createId()),
    title,
    text,
    date: String(n.date ?? ''),
    pinned: Boolean(n.pinned),
    archived: Boolean(n.archived),
    createdAt: String(n.createdAt ?? nowIso()),
    updatedAt: String(n.updatedAt ?? nowIso()),
  };
}

export function normalizeNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeNote).filter((n): n is Note => n !== null);
}

export function isDayName(value: string): value is DayName {
  return (DAYS as string[]).includes(value);
}
