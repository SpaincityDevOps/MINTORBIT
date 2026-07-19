import { Linking, Platform } from 'react-native';
import {
  getNotificationPermissionStatus,
  requestNotificationPermissions,
  ensureNotificationChannels,
} from '../notifications';

export async function bootstrapPermissions(): Promise<{
  notificationsGranted: boolean;
}> {
  await ensureNotificationChannels();
  const status = await getNotificationPermissionStatus();
  let notificationsGranted = status.granted;
  if (!notificationsGranted && status.canAskAgain) {
    notificationsGranted = await requestNotificationPermissions();
  }
  return { notificationsGranted };
}

export async function openSystemAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    if (Platform.OS === 'android') {
      await Linking.openURL('app-settings:').catch(() => undefined);
    }
  }
}

export { getNotificationPermissionStatus, requestNotificationPermissions };
