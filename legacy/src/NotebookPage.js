import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, Keyboard, Dimensions, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
const roman = require('roman-numerals');

const { height } = Dimensions.get('window');

export default function NotebookPage() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null); // Track which note is being edited

  useEffect(() => {
    const loadNotes = async () => {
      const saved = await AsyncStorage.getItem('@mint_notes');
      if (saved) setNotes(JSON.parse(saved));
    };
    loadNotes();
  }, []);

  const handleSave = async () => {
    if (!title || !content) return;

    let updatedNotes;
    if (editingId) {
      // UPDATE logic
      updatedNotes = notes.map(note => 
        note.id === editingId 
          ? { ...note, title: title.toUpperCase(), text: content } 
          : note
      );
      setEditingId(null);
    } else {
      // CREATE logic
      const today = new Date().toLocaleDateString('en-KE', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      });
      const newNote = { 
        id: Date.now(), 
        title: title.toUpperCase(), 
        text: content, 
        date: today 
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    setTitle('');
    setContent('');
    Keyboard.dismiss();
    await AsyncStorage.setItem('@mint_notes', JSON.stringify(updatedNotes));
  };

  const startEdit = (note) => {
    setTitle(note.title);
    setContent(note.text);
    setEditingId(note.id);
  };

  const deleteNote = (id) => {
    Alert.alert("Delete Stream", "This will permanently erase this log. Proceed?", [
      { text: "Cancel" },
      { text: "Delete", onPress: async () => {
          const filtered = notes.filter(n => n.id !== id);
          setNotes(filtered);
          await AsyncStorage.setItem('@mint_notes', JSON.stringify(filtered));
        }, style: 'destructive' 
      }
    ]);
  };

  return (
    <View style={styles.page}>
      {/* FIXED TOP SECTION (1/3 VH) */}
      <View style={styles.fixedInputArea}>
        <Text style={styles.headerText}>
          {editingId ? "EDITING STREAM" : "STREAMS"}
        </Text>
        <TextInput 
          style={styles.titleInput} 
          placeholder="STREAM TITLE..." 
          value={title} 
          onChangeText={setTitle} 
        />
        <TextInput 
          style={styles.contentInput} 
          placeholder="Log activity details..." 
          value={content} 
          onChangeText={setContent}
          multiline
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.addBtn, editingId && { backgroundColor: '#FFD700' }]} 
            onPress={handleSave}
          >
            <Text style={styles.addBtnText}>
              {editingId ? "UPDATE VELOCITY" : "SAVE VELOCITY"}
            </Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => { setEditingId(null); setTitle(''); setContent(''); }}
            >
              <Text style={styles.addBtnText}>CANCEL</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SCROLLABLE BOTTOM SECTION */}
      <FlatList
        data={notes}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={styles.noteItem}>
            <View style={styles.noteHeader}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <Text style={styles.roman}>{roman.toRoman(index + 1)}.</Text>
                <Text style={styles.noteTitle}>{item.title}</Text>
              </View>
              <Text style={styles.noteDate}>{item.date}</Text>
            </View>
            <Text style={styles.noteBody}>{item.text}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => startEdit(item)}>
                <MaterialCommunityIcons name="pencil" size={20} color="#00A86B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteNote(item.id)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0A0A0A' },
  fixedInputArea: { 
    height: height * 0.33, 
    padding: 15, 
    backgroundColor: '#111', 
    borderBottomWidth: 3, 
    borderBottomColor: '#00A86B',
    zIndex: 10 
  },
  headerText: { color: '#00A86B', fontWeight: '900', fontSize: 18, marginBottom: 5 },
  titleInput: { backgroundColor: '#FFF', padding: 8, fontWeight: '900', marginBottom: 5, borderWidth: 2 },
  contentInput: { backgroundColor: '#FFF', padding: 8, fontWeight: '700', flex: 1, textAlignVertical: 'top', borderWidth: 2 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  addBtn: { backgroundColor: '#00A86B', padding: 12, marginTop: 5, flex: 2, alignItems: 'center', borderWidth: 2 },
  cancelBtn: { backgroundColor: '#666', padding: 12, marginTop: 5, flex: 1, alignItems: 'center', borderWidth: 2 },
  addBtnText: { fontWeight: '900', color: '#000' },
  
  listContent: { padding: 15, paddingBottom: 50 },
  noteItem: { backgroundColor: '#F5F7FA', padding: 15, marginBottom: 15, borderWidth: 3, borderColor: '#000' },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 5, marginBottom: 8 },
  roman: { color: '#00A86B', fontWeight: '900' },
  noteTitle: { fontWeight: '900', flex: 1, marginLeft: 10 },
  noteDate: { fontSize: 10, color: '#666', fontWeight: '800' },
  noteBody: { fontWeight: '600', color: '#333', marginBottom: 10 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 10 }
});