import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { Note } from '../../types';
import { toRoman } from '../../utils';
import { IconButton } from '../common';

type Props = {
  item: Note;
  index: number;
  editing: boolean;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
};

export const NoteCard = memo(function NoteCard({
  item,
  index,
  editing,
  onEdit,
  onDelete,
  onPin,
  onArchive,
}: Props) {
  return (
    <View style={[styles.card, editing && styles.editing, item.pinned && styles.pinned]}>
      <View style={[styles.accent, item.archived && { backgroundColor: colors.textLow }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.roman}>{toRoman(index + 1)}</Text>
          {item.pinned ? (
            <Text style={styles.pinBadge}>PINNED</Text>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.text} numberOfLines={4}>{item.text}</Text>
        <View style={styles.actions}>
          <IconButton
            name={item.pinned ? 'pin-off' : 'pin-outline'}
            onPress={() => onPin(item.id)}
            label={item.pinned ? 'Unpin' : 'Pin'}
            color={colors.warning}
          />
          <IconButton
            name={item.archived ? 'package-up' : 'archive-outline'}
            onPress={() => onArchive(item.id)}
            label={item.archived ? 'Unarchive' : 'Archive'}
            color={colors.textMid}
          />
          <IconButton name="pencil-outline" onPress={() => onEdit(item)} label="Edit stream" />
          <IconButton
            name="trash-can-outline"
            color={colors.danger}
            onPress={() => onDelete(item.id)}
            label="Delete stream"
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editing: { borderColor: colors.warning },
  pinned: { borderColor: colors.primaryMuted },
  accent: { width: 3, backgroundColor: colors.primary },
  body: { flex: 1, padding: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  roman: { color: colors.primary, fontWeight: '900', fontSize: 12 },
  pinBadge: { color: colors.warning, fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  title: { color: colors.textHi, fontWeight: '900', flex: 1, fontSize: 14 },
  date: { color: colors.textLow, fontSize: 10, fontWeight: '700' },
  text: { color: colors.textMid, fontWeight: '600', fontSize: 13, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
