import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState, ErrorBanner } from '../../components/common';
import { AppTextInput } from '../../components/inputs';
import { RoutineItem } from '../../components/routine/RoutineItem';
import { DAYS } from '../../constants';
import { useData } from '../../contexts/DataContext';
import { colors, minTouch, radius, spacing } from '../../theme';
import type { DayName } from '../../types';
import { formatTime24, getTodayName, hapticLight, hapticSuccess, sortTasksByTime } from '../../utils';

export default function RoutineScreen() {
  const {
    routines,
    addRoutineTask,
    deleteRoutineTask,
    toggleRoutineComplete,
    error,
    clearError,
    preferences,
  } = useData();

  const [activeDay, setActiveDay] = useState<DayName>(
    preferences.defaultDayView === 'today' ? getTodayName() : 'Sunday',
  );
  const [tempTask, setTempTask] = useState('');
  const [tempTime, setTempTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const tasks = useMemo(
    () => sortTasksByTime(routines[activeDay] || []),
    [routines, activeDay],
  );

  const addTask = useCallback(async () => {
    const time = formatTime24(tempTime);
    const ok = await addRoutineTask(activeDay, tempTask, time);
    if (ok) {
      setTempTask('');
      await hapticSuccess(preferences.hapticsEnabled);
    }
  }, [tempTask, tempTime, activeDay, addRoutineTask, preferences.hapticsEnabled]);

  const onDelete = useCallback(async (id: string) => {
    await hapticLight(preferences.hapticsEnabled);
    await deleteRoutineTask(activeDay, id);
  }, [activeDay, deleteRoutineTask, preferences.hapticsEnabled]);

  const onToggle = useCallback(async (id: string) => {
    await hapticLight(preferences.hapticsEnabled);
    await toggleRoutineComplete(activeDay, id);
  }, [activeDay, toggleRoutineComplete, preferences.hapticsEnabled]);

  const onTimeChange = useCallback((_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setTempTime(selected);
  }, []);

  return (
    <View style={styles.page}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayScrollContent}
      >
        {DAYS.map((day) => {
          const active = activeDay === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setActiveDay(day)}
              style={[styles.dayChip, active && styles.dayChipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                {day.substring(0, 3).toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      <View style={styles.inputRow}>
        <AppTextInput
          style={styles.taskInput}
          placeholder="New activity…"
          value={tempTask}
          onChangeText={setTempTask}
          returnKeyType="done"
          onSubmitEditing={addTask}
        />
        <TouchableOpacity style={styles.timePill} onPress={() => setShowPicker(true)} accessibilityLabel="Pick time">
          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary} />
          <Text style={styles.timePillText}>{formatTime24(tempTime)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={addTask} accessibilityLabel="Add activity">
          <MaterialCommunityIcons name="plus" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      {showPicker ? (
        <DateTimePicker
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          is24Hour
          value={tempTime}
          onChange={onTimeChange}
          themeVariant="dark"
        />
      ) : null}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon="clock-plus-outline"
            title={`No activities for ${activeDay}`}
            subtitle="Add a timed task to get weekly reminders"
          />
        }
        renderItem={({ item }) => (
          <RoutineItem item={item} onDelete={onDelete} onToggle={onToggle} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  dayScroll: { maxHeight: 60, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  dayChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { color: colors.textMid, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  dayChipTextActive: { color: colors.black },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taskInput: { flex: 1, backgroundColor: colors.surface },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: minTouch,
    minWidth: 80,
    justifyContent: 'center',
  },
  timePillText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    width: minTouch,
    height: minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: spacing.lg, paddingBottom: 40 },
});
