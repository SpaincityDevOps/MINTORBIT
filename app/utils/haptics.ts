import { Platform } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch {
  Haptics = null;
}

export async function hapticLight(enabled = true): Promise<void> {
  if (!enabled || !Haptics || Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
}

export async function hapticSuccess(enabled = true): Promise<void> {
  if (!enabled || !Haptics || Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}

export async function hapticWarning(enabled = true): Promise<void> {
  if (!enabled || !Haptics || Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // ignore
  }
}
