import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import type { RoutineTask } from '../../types';
import { IconButton } from '../common';

type Props = {
  item: RoutineTask;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

function areEqual(prev: Props, next: Props) {
  return (
    prev.item.id === next.item.id &&
    prev.item.task === next.item.task &&
    prev.item.time === next.item.time &&
    prev.item.completed === next.item.completed
  );
}

export const RoutineItem = memo(function RoutineItem({ item, onDelete, onToggle }: Props) {
  return (
    <View style={[styles.card, item.completed && styles.cardDone]}>
      <View style={[styles.bar, item.completed && { backgroundColor: colors.textLow }]} />
      <TouchableOpacity
        style={styles.check}
        onPress={() => onToggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!item.completed }}
        accessibilityLabel={`Mark ${item.task} ${item.completed ? 'incomplete' : 'complete'}`}
      >
        <MaterialCommunityIcons
          name={item.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={22}
          color={item.completed ? colors.primary : colors.textLow}
        />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.title, item.completed && styles.titleDone]} numberOfLines={2}>
          {item.task}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <IconButton
        name="trash-can-outline"
        color={colors.danger}
        onPress={() => onDelete(item.id)}
        label={`Delete ${item.task}`}
      />
    </View>
  );
}, areEqual);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDone: { opacity: 0.7 },
  bar: { width: 3, alignSelf: 'stretch', backgroundColor: colors.primary },
  check: { paddingLeft: spacing.md, paddingVertical: spacing.md },
  content: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  title: { color: colors.textHi, fontWeight: '800', fontSize: 15 },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMid },
  time: { color: colors.primary, fontWeight: '700', fontSize: 12, marginTop: 3 },
});
