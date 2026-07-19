import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../../theme';

type Props = {
  dayId: string;
  dayNum: number;
  dotCount: number;
  onPress: (dayId: string) => void;
  isToday: boolean;
};

function areEqual(p: Props, n: Props) {
  return (
    p.dayId === n.dayId &&
    p.dotCount === n.dotCount &&
    p.isToday === n.isToday &&
    p.dayNum === n.dayNum
  );
}

export const CalendarCell = memo(function CalendarCell({
  dayId,
  dayNum,
  dotCount,
  onPress,
  isToday,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.cell, isToday && styles.cellToday]}
      onPress={() => onPress(dayId)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Day ${dayNum}${dotCount ? `, ${dotCount} activities` : ''}`}
    >
      <Text style={[styles.num, isToday && styles.numToday]}>{dayNum}</Text>
      {dotCount > 0 ? (
        <View style={styles.dotRow}>
          {Array.from({ length: Math.min(dotCount, 3) }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, isToday && { backgroundColor: colors.white }]}
            />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}, areEqual);

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    maxWidth: '14.28%',
    minWidth: '14.28%',
    height: 56,
    alignItems: 'center',
    paddingTop: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cellToday: { backgroundColor: colors.primary },
  num: { color: colors.textHi, fontWeight: '800', fontSize: 13 },
  numToday: { color: colors.black },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
});
