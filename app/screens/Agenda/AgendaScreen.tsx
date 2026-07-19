import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/common';
import { useData } from '../../contexts/DataContext';
import { colors, radius, spacing, typography } from '../../theme';
import {
  computeInsights,
  getTodayAgenda,
  getUpcomingTasks,
  todayDateId,
} from '../../utils';

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AgendaScreen() {
  const { routines, events, notes, stats } = useData();

  const agenda = useMemo(() => getTodayAgenda(routines), [routines]);
  const upcoming = useMemo(() => getUpcomingTasks(routines, 180), [routines]);
  const todayEvents = events[todayDateId()] || [];
  const insights = useMemo(
    () =>
      computeInsights(
        routines,
        notes.filter((n) => !n.archived).length,
        Object.values(events).reduce((n, arr) => n + arr.length, 0),
        stats,
      ),
    [routines, notes, events, stats],
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>TODAY · {agenda.day.toUpperCase()}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Done today" value={`${insights.completedToday}/${insights.totalToday}`} accent={colors.primary} />
        <StatCard label="Streak" value={insights.streak} accent={colors.warning} />
        <StatCard label="Rate" value={`${insights.completionRate}%`} />
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Streams" value={insights.notesCount} />
        <StatCard label="Events" value={insights.eventsCount} />
        <StatCard label="Best streak" value={insights.longestStreak} />
      </View>

      <Text style={styles.section}>UPCOMING (3h)</Text>
      {upcoming.length === 0 ? (
        <EmptyState icon="bell-outline" title="Nothing upcoming soon" />
      ) : (
        upcoming.map((t) => (
          <View key={t.id} style={styles.row}>
            <View style={styles.dot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.task}</Text>
              <Text style={styles.rowMeta}>in {t.minutesUntil}m · {t.time}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.section}>TODAY'S ROUTINE</Text>
      {agenda.tasks.length === 0 ? (
        <EmptyState icon="calendar-check" title="No routine tasks today" />
      ) : (
        agenda.tasks.map((t) => (
          <View key={t.id} style={styles.row}>
            <View style={[styles.dot, t.completed && { backgroundColor: colors.textLow }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, t.completed && styles.done]}>{t.task}</Text>
              <Text style={styles.rowMeta}>{t.time}{t.completed ? ' · completed' : ''}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.section}>CALENDAR TODAY</Text>
      {todayEvents.length === 0 ? (
        <EmptyState icon="calendar-blank" title="No calendar activities today" />
      ) : (
        todayEvents.map((e) => (
          <View key={e.id} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.rowTitle}>{e.text}</Text>
          </View>
        ))
      )}

      <Text style={styles.footerHint}>
        Lifetime completions: {stats.routinesCompletedTotal}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 60 },
  heading: { ...typography.section, marginBottom: spacing.md },
  section: { ...typography.section, marginTop: spacing.xl, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { color: colors.textHi, fontWeight: '900', fontSize: 20 },
  statLabel: { color: colors.textMid, fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  rowTitle: { color: colors.textHi, fontWeight: '800', fontSize: 14 },
  rowMeta: { color: colors.primary, fontWeight: '700', fontSize: 12, marginTop: 2 },
  done: { textDecorationLine: 'line-through', color: colors.textMid },
  footerHint: { ...typography.caption, textAlign: 'center', marginTop: spacing.xxl, color: colors.textLow },
});
