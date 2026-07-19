import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CalendarCell } from '../../components/calendar/CalendarCell';
import { EmptyState, ErrorBanner, PrimaryButton } from '../../components/common';
import { AppTextInput } from '../../components/inputs';
import { DAY_LABELS_SHORT, YEAR_RANGE } from '../../constants';
import { useData } from '../../contexts/DataContext';
import { colors, radius, spacing, typography } from '../../theme';
import { dateKeyToLabel, hapticLight, todayDateId } from '../../utils';

const { width } = Dimensions.get('window');
const CELL = width / 7;

export default function CalendarScreen() {
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    error,
    clearError,
    preferences,
  } = useData();

  const now = useMemo(() => new Date(), []);
  const todayId = todayDateId(now);

  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inputTask, setInputTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const availableYears = useMemo(
    () => Array.from({ length: YEAR_RANGE.end - YEAR_RANGE.start + 1 }, (_, i) => YEAR_RANGE.start + i),
    [],
  );

  const sections = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
      const startDay = new Date(currentYear, monthIndex, 1).getDay();
      const monthName = new Date(currentYear, monthIndex, 1)
        .toLocaleString('default', { month: 'long' })
        .toUpperCase();

      const cells: Array<
        | { type: 'empty'; id: string }
        | { type: 'day'; day: number; id: string }
      > = [];
      for (let i = 0; i < startDay; i++) cells.push({ type: 'empty', id: `e-${monthIndex}-${i}` });
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ type: 'day', day: d, id: `${currentYear}-${monthIndex}-${d}` });
      }
      return { title: monthName, data: [cells] };
    });
  }, [currentYear]);

  const handleSave = useCallback(async () => {
    if (!selectedDate || !inputTask.trim()) return;
    await hapticLight(preferences.hapticsEnabled);
    let ok = false;
    if (editingId) {
      ok = await updateEvent(selectedDate, editingId, inputTask);
      setEditingId(null);
    } else {
      ok = await addEvent(selectedDate, inputTask);
    }
    if (ok) setInputTask('');
  }, [selectedDate, inputTask, editingId, updateEvent, addEvent, preferences.hapticsEnabled]);

  const handleDelete = useCallback((id: string) => {
    if (!selectedDate) return;
    Alert.alert('Remove Activity', 'Remove this entry from the calendar?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteEvent(selectedDate, id),
      },
    ]);
  }, [selectedDate, deleteEvent]);

  const closeModal = useCallback(() => {
    setSelectedDate(null);
    setEditingId(null);
    setInputTask('');
  }, []);

  return (
    <View style={styles.page}>
      <TouchableOpacity
        style={styles.yearTrigger}
        onPress={() => setYearPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Select year, currently ${currentYear}`}
      >
        <Text style={styles.yearText}>{currentYear}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.primary} />
      </TouchableOpacity>

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      <SectionList
        sections={sections}
        stickySectionHeadersEnabled
        keyExtractor={(_, idx) => String(idx)}
        initialNumToRender={2}
        windowSize={5}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        renderSectionHeader={({ section: { title } }) => (
          <View>
            <View style={styles.monthHeader}>
              <Text style={styles.monthHeaderText}>{title}</Text>
            </View>
            <View style={styles.dayLabelRow}>
              {DAY_LABELS_SHORT.map((d) => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>
          </View>
        )}
        renderItem={({ item: cells }) => (
          <View style={styles.grid}>
            {cells.map((cell) =>
              cell.type === 'empty' ? (
                <View key={cell.id} style={styles.cellEmpty} />
              ) : (
                <CalendarCell
                  key={cell.id}
                  dayId={cell.id}
                  dayNum={cell.day}
                  dotCount={(events[cell.id] || []).length}
                  onPress={setSelectedDate}
                  isToday={cell.id === todayId}
                />
              ),
            )}
          </View>
        )}
      />

      <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setYearPickerVisible(false)}>
          <View style={styles.yearMenu}>
            <FlatList
              data={availableYears}
              keyExtractor={(item) => String(item)}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
              initialScrollIndex={Math.max(0, currentYear - YEAR_RANGE.start)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.yearRow, currentYear === item && styles.yearRowActive]}
                  onPress={() => {
                    setCurrentYear(item);
                    setYearPickerVisible(false);
                  }}
                >
                  <Text style={[styles.yearRowText, currentYear === item && { color: colors.black }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!selectedDate} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetDate}>
              {selectedDate ? dateKeyToLabel(selectedDate) : ''}
            </Text>

            <FlatList
              data={selectedDate ? events[selectedDate] || [] : []}
              style={{ maxHeight: 200, marginBottom: 10 }}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<EmptyState icon="calendar-blank" title="No activities scheduled" />}
              renderItem={({ item }) => (
                <View style={styles.eventRow}>
                  <View style={styles.eventDot} />
                  <Text style={styles.eventText} numberOfLines={2}>{item.text}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setInputTask(item.text);
                      setEditingId(item.id);
                    }}
                    accessibilityLabel="Edit activity"
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 10 }} accessibilityLabel="Delete activity">
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            />

            <AppTextInput
              placeholder={editingId ? 'Edit activity…' : 'Add activity…'}
              value={inputTask}
              onChangeText={setInputTask}
              style={{ marginBottom: spacing.sm }}
            />
            <PrimaryButton label={editingId ? 'UPDATE' : 'ADD'} onPress={handleSave} />
            <PrimaryButton label="CLOSE" onPress={closeModal} variant="ghost" style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  yearTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  yearText: { color: colors.textHi, fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  monthHeader: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthHeaderText: { ...typography.section },
  dayLabelRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayLabel: {
    width: CELL,
    textAlign: 'center',
    color: colors.textLow,
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellEmpty: { width: CELL, height: 56 },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearMenu: {
    backgroundColor: colors.surface,
    width: '55%',
    maxHeight: '50%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearRow: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  yearRowActive: { backgroundColor: colors.primary },
  yearRowText: { color: colors.textHi, fontWeight: '800', fontSize: 15 },
  sheet: {
    backgroundColor: colors.surface,
    width: '92%',
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetDate: { color: colors.primary, fontWeight: '900', fontSize: 16, marginBottom: spacing.md },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  eventDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  eventText: { flex: 1, color: colors.textHi, fontWeight: '700', fontSize: 13 },
});
