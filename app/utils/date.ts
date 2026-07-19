export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function toRoman(n: number): string {
  // Inline short table to avoid circular imports with constants
  const ROMAN = [
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
    'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
  ];
  return ROMAN[n - 1] ?? String(n);
}

export function formatDateId(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`;
}

export function todayDateId(date = new Date()): string {
  return formatDateId(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDisplayDate(date = new Date()): string {
  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime24(date: Date): string {
  return date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function parseTimeToDate(time: string, base = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(base);
  d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
  return d;
}

export function isDaytime(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 6 && hour < 19;
}

export function dateKeyToLabel(dateId: string): string {
  const [y, m, d] = dateId.split('-').map(Number);
  if ([y, m, d].some((v) => isNaN(v))) return dateId;
  return new Date(y, m, d).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function sanitizeText(input: string, max = 2000): string {
  return input.replace(/\0/g, '').trim().slice(0, max);
}

export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  const ms = db.setHours(0, 0, 0, 0) - da.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}
