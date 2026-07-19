import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState, ErrorBanner, PrimaryButton } from '../../components/common';
import { AppTextInput } from '../../components/inputs';
import { NoteCard } from '../../components/notebook/NoteCard';
import { useData } from '../../contexts/DataContext';
import { colors, radius, spacing, typography } from '../../theme';
import type { Note } from '../../types';
import { hapticLight, hapticSuccess } from '../../utils';

const { height } = Dimensions.get('window');

export default function NotebookScreen() {
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    toggleArchiveNote,
    preferences,
    updatePreferences,
    error,
    clearError,
  } = useData();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = notes.filter((n) => (preferences.showArchived ? true : !n.archived));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (preferences.sortNotes) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'pinned':
        sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
        break;
      default:
        sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [notes, preferences.showArchived, preferences.sortNotes, query]);

  const handleSave = useCallback(async () => {
    let ok = false;
    if (editingId) {
      ok = await updateNote(editingId, title, content);
      if (ok) setEditingId(null);
    } else {
      ok = await addNote(title, content);
    }
    if (ok) {
      setTitle('');
      setContent('');
      Keyboard.dismiss();
      await hapticSuccess(preferences.hapticsEnabled);
    }
  }, [editingId, title, content, updateNote, addNote, preferences.hapticsEnabled]);

  const startEdit = useCallback((note: Note) => {
    setTitle(note.title);
    setContent(note.text);
    setEditingId(note.id);
  }, []);

  const onDelete = useCallback((id: string) => {
    Alert.alert('Delete Stream', 'Permanently erase this log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await hapticLight(preferences.hapticsEnabled);
          await deleteNote(id);
        },
      },
    ]);
  }, [deleteNote, preferences.hapticsEnabled]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setContent('');
    Keyboard.dismiss();
  }, []);

  const cycleSort = useCallback(() => {
    const order = ['newest', 'oldest', 'title', 'pinned'] as const;
    const idx = order.indexOf(preferences.sortNotes);
    updatePreferences({ sortNotes: order[(idx + 1) % order.length] });
  }, [preferences.sortNotes, updatePreferences]);

  const isEditing = !!editingId;

  return (
    <View style={styles.page}>
      <View style={styles.inputPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{isEditing ? 'EDITING STREAM' : 'STREAMS'}</Text>
          {isEditing ? (
            <TouchableOpacity onPress={cancelEdit} accessibilityLabel="Cancel edit">
              <MaterialCommunityIcons name="close" size={18} color={colors.textMid} />
            </TouchableOpacity>
          ) : null}
        </View>

        <AppTextInput
          style={styles.titleInput}
          placeholder="Stream title…"
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
        />
        <AppTextInput
          style={styles.contentInput}
          placeholder="Log activity details…"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

        <PrimaryButton
          label={isEditing ? 'UPDATE' : 'SAVE VELOCITY'}
          onPress={handleSave}
          variant={isEditing ? 'warning' : 'primary'}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <View style={styles.toolbar}>
        <AppTextInput
          style={styles.search}
          placeholder="Search streams…"
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.toolBtn} onPress={cycleSort} accessibilityLabel="Change sort">
          <MaterialCommunityIcons name="sort" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => updatePreferences({ showArchived: !preferences.showArchived })}
          accessibilityLabel="Toggle archived"
        >
          <MaterialCommunityIcons
            name={preferences.showArchived ? 'archive' : 'archive-outline'}
            size={18}
            color={preferences.showArchived ? colors.warning : colors.textMid}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState icon="notebook-outline" title="No streams logged yet" subtitle="Capture velocity notes above" />
        }
        renderItem={({ item, index }) => (
          <NoteCard
            item={item}
            index={index}
            editing={editingId === item.id}
            onEdit={startEdit}
            onDelete={onDelete}
            onPin={togglePinNote}
            onArchive={toggleArchiveNote}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  inputPanel: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: height * 0.28,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  panelTitle: { ...typography.section },
  titleInput: { marginBottom: spacing.sm },
  contentInput: { flex: 1, minHeight: 80 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  search: { flex: 1, minHeight: 40, paddingVertical: 8 },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 14, paddingBottom: 50 },
});
