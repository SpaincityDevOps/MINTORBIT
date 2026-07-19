import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DAYS, NOTIFICATION_CHANNEL, ONGOING_CHANNEL } from '../../constants';
import type { DayName, RoutineTask, RoutinesMap } from '../../types';
import { getCurrentOrNextTask, getUpcomingTasks } from '../../utils/agenda';

const DAY_MAP: Record<DayName, number> = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

const ONGOING_ID = 'mintorbit_ongoing_status';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL.id, {
      name: NOTIFICATION_CHANNEL.name,
      description: NOTIFICATION_CHANNEL.description,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 100, 250],
      lightColor: '#00E676',
      bypassDnd: false,
    });
    await Notifications.setNotificationChannelAsync(ONGOING_CHANNEL.id, {
      name: ONGOING_CHANNEL.name,
      description: ONGOING_CHANNEL.description,
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch {
    // channels optional on older devices
  }
}

export async function getNotificationPermissionStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}> {
  try {
    const result = await Notifications.getPermissionsAsync();
    return {
      granted: result.granted || result.status === 'granted',
      canAskAgain: result.canAskAgain !== false,
      status: result.status,
    };
  } catch {
    return { granted: false, canAskAgain: false, status: 'undetermined' };
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await ensureNotificationChannels();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.status === 'granted') return true;
    const asked = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return asked.granted || asked.status === 'granted';
  } catch {
    return false;
  }
}

function parseTime(timeString: string): { hour: number; minute: number } | null {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return { hour: hours, minute: minutes };
}

export async function scheduleRoutineNotification(
  taskId: string,
  taskName: string,
  timeString: string,
  activeDay: DayName,
  options?: { soundEnabled?: boolean },
): Promise<string | null> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    await cancelRoutineNotification(taskId);
    await cancelOneHourReminder(taskId);

    const parsed = parseTime(timeString);
    const weekday = DAY_MAP[activeDay];
    if (!parsed || !weekday) return null;

    const identifier = `routine_${taskId}`;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'MintOrbit — DayStream',
        body: taskName,
        sound: options?.soundEnabled ? true : false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#00E676',
        data: { taskId, type: 'routine' },
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL.id } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: parsed.hour,
        minute: parsed.minute,
      },
    });

    return identifier;
  } catch {
    return null;
  }
}

export async function scheduleOneHourReminder(
  taskId: string,
  taskName: string,
  timeString: string,
  activeDay: DayName,
): Promise<string | null> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const parsed = parseTime(timeString);
    const weekday = DAY_MAP[activeDay];
    if (!parsed || !weekday) return null;

    let hour = parsed.hour - 1;
    let minute = parsed.minute;
    let day = weekday;
    if (hour < 0) {
      hour = 23;
      day = day === 1 ? 7 : day - 1;
    }

    const identifier = `routine_pre_${taskId}`;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Upcoming in ~1 hour',
        body: taskName,
        sound: false,
        data: { taskId, type: 'one_hour' },
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL.id } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day,
        hour,
        minute,
      },
    });
    return identifier;
  } catch {
    return null;
  }
}

export async function cancelRoutineNotification(taskId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`routine_${taskId}`);
  } catch {
    // ignore missing
  }
}

export async function cancelOneHourReminder(taskId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`routine_pre_${taskId}`);
  } catch {
    // ignore
  }
}

export async function cancelAllRoutineNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export async function rescheduleAllRoutines(
  routines: RoutinesMap,
  options: { enabled: boolean; oneHour: boolean; soundEnabled: boolean },
): Promise<void> {
  await cancelAllRoutineNotifications();
  if (!options.enabled) return;

  for (const day of DAYS) {
    for (const task of routines[day] || []) {
      await scheduleRoutineNotification(task.id, task.task, task.time, day, {
        soundEnabled: options.soundEnabled,
      });
      if (options.oneHour) {
        await scheduleOneHourReminder(task.id, task.task, task.time, day);
      }
    }
  }
}

export async function updateOngoingStatusNotification(
  routines: RoutinesMap,
  enabled: boolean,
): Promise<void> {
  try {
    if (!enabled) {
      await Notifications.dismissNotificationAsync(ONGOING_ID).catch(() => undefined);
      return;
    }

    const next = getCurrentOrNextTask(routines);
    const soon = getUpcomingTasks(routines, 60);

    if (!next && soon.length === 0) {
      await Notifications.dismissNotificationAsync(ONGOING_ID).catch(() => undefined);
      return;
    }

    const body = next
      ? `${next.task} at ${next.time}${next.minutesUntil <= 60 ? ` · in ${next.minutesUntil}m` : ''}`
      : 'No upcoming tasks today';

    await Notifications.scheduleNotificationAsync({
      identifier: ONGOING_ID,
      content: {
        title: 'DayStream Status',
        body,
        sticky: Platform.OS === 'android',
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        data: { type: 'ongoing' },
        ...(Platform.OS === 'android' ? { channelId: ONGOING_CHANNEL.id } : {}),
      },
      trigger: null,
    });
  } catch {
    // ongoing is best-effort
  }
}

export async function syncTaskNotifications(
  task: RoutineTask,
  day: DayName,
  prefs: { notificationsEnabled: boolean; oneHourReminder: boolean; soundEnabled: boolean },
): Promise<void> {
  if (!prefs.notificationsEnabled) {
    await cancelRoutineNotification(task.id);
    await cancelOneHourReminder(task.id);
    return;
  }
  await scheduleRoutineNotification(task.id, task.task, task.time, day, {
    soundEnabled: prefs.soundEnabled,
  });
  if (prefs.oneHourReminder) {
    await scheduleOneHourReminder(task.id, task.task, task.time, day);
  } else {
    await cancelOneHourReminder(task.id);
  }
}
