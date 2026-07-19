import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/common';
import { APP_NAME, APP_TAGLINE, APP_VERSION, PACKAGE_NAME } from '../../constants';
import { useData } from '../../contexts/DataContext';
import { exportBackupToFile, importBackupFromUri } from '../../services/backup';
import { openSystemAppSettings, requestNotificationPermissions } from '../../services/permissions';
import { colors, radius, spacing, typography } from '../../theme';
import { hapticSuccess } from '../../utils';

function SettingRow({
  label,
  subtitle,
  value,
  onValueChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryMuted }}
        thumbColor={value ? colors.primary : colors.textMid}
      />
    </View>
  );
}

export default function SettingsScreen({ onClose }: { onClose?: () => void }) {
  const { preferences, updatePreferences, wipeData, refreshAll, migrationNotes, stats } = useData();
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(
    (key: keyof typeof preferences) => (value: boolean) => {
      updatePreferences({ [key]: value } as Partial<typeof preferences>);
    },
    [updatePreferences],
  );

  const onExport = useCallback(async () => {
    setBusy(true);
    const result = await exportBackupToFile();
    setBusy(false);
    if (result.ok) {
      await hapticSuccess(preferences.hapticsEnabled);
      Alert.alert('Exported', 'Backup shared successfully.');
    } else {
      Alert.alert('Export failed', result.error || 'Unknown error');
    }
  }, [preferences.hapticsEnabled]);

  const onImport = useCallback(async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (pick.canceled || !pick.assets?.[0]?.uri) return;
      setBusy(true);
      const result = await importBackupFromUri(pick.assets[0].uri);
      setBusy(false);
      if (result.ok) {
        await refreshAll();
        await hapticSuccess(preferences.hapticsEnabled);
        Alert.alert('Restored', 'Backup imported successfully.');
      } else {
        Alert.alert('Import failed', result.error || 'Unknown error');
      }
    } catch (e) {
      setBusy(false);
      Alert.alert('Import failed', String(e));
    }
  }, [refreshAll, preferences.hapticsEnabled]);

  const onWipe = useCallback(() => {
    Alert.alert('Clear all data?', 'Routines, events, and streams will be erased. Preferences are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: async () => {
          const ok = await wipeData();
          Alert.alert(ok ? 'Cleared' : 'Failed', ok ? 'Local data wiped.' : 'Could not clear data.');
        },
      },
    ]);
  }, [wipeData]);

  const onRequestNotifs = useCallback(async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      await updatePreferences({ notificationsEnabled: true });
      Alert.alert('Notifications enabled');
    } else {
      Alert.alert('Permission denied', 'Open system settings to enable notifications.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openSystemAppSettings() },
      ]);
    }
  }, [updatePreferences]);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.sub}>{APP_NAME} · {APP_VERSION}</Text>
        </View>
        {onClose ? (
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close settings">
            <MaterialCommunityIcons name="close" size={22} color={colors.textMid} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>NOTIFICATIONS</Text>
        <SettingRow
          label="Routine reminders"
          subtitle="Weekly exact-time alerts"
          value={preferences.notificationsEnabled}
          onValueChange={toggle('notificationsEnabled')}
        />
        <SettingRow
          label="1-hour heads-up"
          subtitle="Pre-reminder before each task"
          value={preferences.oneHourReminder}
          onValueChange={toggle('oneHourReminder')}
        />
        <SettingRow
          label="Ongoing status"
          subtitle="Low-priority DayStream status"
          value={preferences.ongoingStatusEnabled}
          onValueChange={toggle('ongoingStatusEnabled')}
        />
        <SettingRow
          label="Notification sound"
          value={preferences.soundEnabled}
          onValueChange={toggle('soundEnabled')}
        />
        <PrimaryButton label="Request notification permission" onPress={onRequestNotifs} variant="ghost" style={{ marginTop: spacing.sm }} />
        <PrimaryButton label="Open system settings" onPress={() => openSystemAppSettings()} variant="ghost" style={{ marginTop: spacing.sm }} />

        <Text style={styles.section}>EXPERIENCE</Text>
        <SettingRow
          label="Haptic feedback"
          value={preferences.hapticsEnabled}
          onValueChange={toggle('hapticsEnabled')}
        />
        <SettingRow
          label="Show archived streams"
          value={preferences.showArchived}
          onValueChange={toggle('showArchived')}
        />

        <Text style={styles.section}>BACKUP & DATA</Text>
        <PrimaryButton label={busy ? 'Working…' : 'Export backup'} onPress={onExport} disabled={busy} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton label="Import backup" onPress={onImport} disabled={busy} variant="ghost" style={{ marginBottom: spacing.sm }} />
        <PrimaryButton label="Clear all data" onPress={onWipe} variant="danger" />

        <Text style={styles.section}>ABOUT</Text>
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>{APP_NAME}</Text>
          <Text style={styles.aboutSub}>{APP_TAGLINE}</Text>
          <Text style={styles.aboutMeta}>{PACKAGE_NAME}</Text>
          <Text style={styles.aboutMeta}>Completions: {stats.routinesCompletedTotal} · Streak: {stats.currentStreak}</Text>
          {migrationNotes.length > 0 ? (
            <Text style={styles.aboutMeta}>Migration: {migrationNotes.join(' · ')}</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.title },
  sub: { ...typography.caption, marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: 60 },
  section: { ...typography.section, marginTop: spacing.xl, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    minHeight: 56,
  },
  rowLabel: { color: colors.textHi, fontWeight: '800', fontSize: 14 },
  rowSub: { color: colors.textMid, fontSize: 11, marginTop: 2, fontWeight: '600' },
  about: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 4,
  },
  aboutTitle: { color: colors.textHi, fontWeight: '900', fontSize: 18 },
  aboutSub: { color: colors.primary, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  aboutMeta: { color: colors.textMid, fontSize: 12, marginTop: 4 },
});
