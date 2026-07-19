import type { AppStats, DayName, RoutineTask, RoutinesMap } from '../types';
import { DAYS } from '../constants';
import { daysBetween, localDateString } from './date';

export function getTodayName(date = new Date()): DayName {
  return DAYS[date.getDay()];
}

export function sortTasksByTime(tasks: RoutineTask[]): RoutineTask[] {
  return [...tasks].sort((a, b) => a.time.localeCompare(b.time));
}

export function getUpcomingTasks(
  routines: RoutinesMap,
  withinMinutes = 60,
  now = new Date(),
): Array<RoutineTask & { day: DayName; minutesUntil: number }> {
  const day = getTodayName(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return sortTasksByTime(routines[day] || [])
    .map((task) => {
      const [h, m] = task.time.split(':').map(Number);
      const taskMinutes = h * 60 + m;
      const minutesUntil = taskMinutes - currentMinutes;
      return { ...task, day, minutesUntil };
    })
    .filter((t) => t.minutesUntil >= 0 && t.minutesUntil <= withinMinutes && !t.completed);
}

export function getCurrentOrNextTask(
  routines: RoutinesMap,
  now = new Date(),
): (RoutineTask & { day: DayName; minutesUntil: number }) | null {
  const upcoming = getUpcomingTasks(routines, 24 * 60, now);
  return upcoming[0] ?? null;
}

export function getTodayAgenda(routines: RoutinesMap, now = new Date()) {
  const day = getTodayName(now);
  return {
    day,
    tasks: sortTasksByTime(routines[day] || []),
  };
}

export function applyCompletionToStats(
  stats: AppStats,
  completed: boolean,
  now = new Date(),
): AppStats {
  if (!completed) return stats;
  const today = localDateString(now);
  let currentStreak = stats.currentStreak;
  if (stats.lastCompletionDate === today) {
    // already counted today for streak continuity
  } else if (
    stats.lastCompletionDate &&
    daysBetween(stats.lastCompletionDate, today) === 1
  ) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }
  return {
    ...stats,
    routinesCompletedTotal: stats.routinesCompletedTotal + 1,
    currentStreak,
    longestStreak: Math.max(stats.longestStreak, currentStreak),
    lastCompletionDate: today,
  };
}

export function computeInsights(
  routines: RoutinesMap,
  notesCount: number,
  eventsCount: number,
  stats: AppStats,
) {
  const allTasks = DAYS.flatMap((d) => routines[d] || []);
  const completedToday = (routines[getTodayName()] || []).filter((t) => t.completed).length;
  const totalToday = (routines[getTodayName()] || []).length;
  return {
    totalTasks: allTasks.length,
    completedToday,
    totalToday,
    completionRate: totalToday ? Math.round((completedToday / totalToday) * 100) : 0,
    notesCount,
    eventsCount,
    streak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    routinesCompletedTotal: stats.routinesCompletedTotal,
  };
}
