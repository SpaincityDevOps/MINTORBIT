import React, { useState, useEffect, useMemo, memo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Dimensions, SectionList, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// 🚀 Optimized Cell with Current Date Highlight logic
const CalendarCell = memo(({ dayId, dayNum, events, onPress, isToday }) => {
  const dayEvents = events[dayId] || [];
  return (
    <TouchableOpacity 
      style={[styles.cell, isToday && styles.todayHighlight]} 
      onPress={() => onPress(dayId)}
    >
      <Text style={[styles.dateNum, isToday && styles.todayText]}>{dayNum}</Text>
      <View style={styles.eventPreview}>
        {dayEvents.slice(0, 3).map((_, idx) => (
          <View key={idx} style={[styles.eventDot, isToday && {backgroundColor: '#FFF'}]} />
        ))}
      </View>
    </TouchableOpacity>
  );
});

export default function CalendarPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputTask, setInputTask] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  // 📅 Calculate Today's String for highlighting
  const todayId = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem('@mint_events');
      if (saved) setEvents(JSON.parse(saved));
    };
    load();
  }, []);

  // 🔽 Activated Dropdown Range: 1990 to 2090
  const availableYears = useMemo(() => {
    return Array.from({ length: 101 }, (_, i) => 1990 + i);
  }, []);

  const sections = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const date = new Date(currentYear, monthIndex, 1);
      const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
      const startDay = new Date(currentYear, monthIndex, 1).getDay();
      
      const days = [];
      for (let i = 0; i < startDay; i++) days.push({ type: 'empty', id: `empty-${monthIndex}-${i}` });
      for (let i = 1; i <= daysInMonth; i++) days.push({ type: 'day', day: i, id: `${currentYear}-${monthIndex}-${i}` });
      
      return {
        title: date.toLocaleString('default', { month: 'long' }).toUpperCase(),
        data: [days],
      };
    });
  }, [currentYear]);

  const saveEvent = async () => {
    if (!inputTask) return;
    let updatedTasks = [...(events[selectedDate] || [])];
    if (editingIndex !== null) {
      updatedTasks[editingIndex] = inputTask;
      setEditingIndex(null);
    } else {
      updatedTasks.push(inputTask);
    }
    const updatedEvents = { ...events, [selectedDate]: updatedTasks };
    setEvents(updatedEvents);
    setInputTask('');
    await AsyncStorage.setItem('@mint_events', JSON.stringify(updatedEvents));
  };

  const deleteEvent = (index) => {
    Alert.alert("Delete Activity", "Are you sure?", [
      { text: "Cancel" },
      { text: "Delete", onPress: async () => {
          let updatedTasks = [...events[selectedDate]];
          updatedTasks.splice(index, 1);
          const updatedEvents = { ...events, [selectedDate]: updatedTasks };
          setEvents(updatedEvents);
          await AsyncStorage.setItem('@mint_events', JSON.stringify(updatedEvents));
        }, style: 'destructive' 
      }
    ]);
  };

  return (
    <View style={styles.page}>
      {/* 🔽 Functional Year Toggle */}
      <TouchableOpacity 
        style={styles.dropdownTrigger} 
        onPress={() => setYearPickerVisible(true)}
      >
        <Text style={styles.dropdownText}>{currentYear} VELOCITY ▼</Text>
      </TouchableOpacity>

      <SectionList
        sections={sections}
        stickySectionHeadersEnabled={true}
        renderSectionHeader={({ section: { title } }) => (
          <View>
            <View style={styles.monthHeader}><Text style={styles.monthHeaderText}>{title}</Text></View>
            <View style={styles.dayLabelRow}>
              {DAY_LABELS.map(d => <Text key={d} style={styles.dayLabelText}>{d}</Text>)}
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.grid}>
            {item.map(day => (
              day.type === 'empty' ? <View key={day.id} style={styles.cellEmpty} /> :
              <CalendarCell 
                key={day.id} 
                dayId={day.id} 
                dayNum={day.day} 
                events={events} 
                onPress={setSelectedDate}
                isToday={day.id === todayId} 
              />
            ))}
          </View>
        )}
      />

      {/* 🔽 Functional Year Dropdown Modal */}
      <Modal visible={yearPickerVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setYearPickerVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <FlatList 
              data={availableYears}
              keyExtractor={item => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.yearOption, currentYear === item && styles.activeYearOption]}
                  onPress={() => {
                    setCurrentYear(item);
                    setYearPickerVisible(false);
                  }}
                >
                  <Text style={[styles.yearOptionText, currentYear === item && {color: '#000'}]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Event Modal logic remains intact */}
      <Modal visible={!!selectedDate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.eventModal}>
            <Text style={styles.modalDateTitle}>{selectedDate}</Text>
            <FlatList
              data={events[selectedDate] || []}
              style={{ maxHeight: 200 }}
              renderItem={({item, index}) => (
                <View style={styles.eventRow}>
                  <Text style={styles.eventText}>• {item}</Text>
                  <View style={styles.actionIcons}>
                    <TouchableOpacity onPress={() => { setInputTask(item); setEditingIndex(index); }}>
                      <MaterialCommunityIcons name="pencil" size={18} color="#00A86B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEvent(index)}>
                      <MaterialCommunityIcons name="trash-can" size={18} color="red" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
            <TextInput 
              style={styles.input} 
              placeholder={editingIndex !== null ? "Edit activity..." : "New activity..."}
              value={inputTask} 
              onChangeText={setInputTask} 
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveEvent}>
              <Text style={styles.btnText}>{editingIndex !== null ? "UPDATE" : "ENGAGE"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelectedDate(null); setEditingIndex(null); setInputTask(''); }}>
              <Text style={styles.closeText}>BACK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0A0A0A' },
  dropdownTrigger: { backgroundColor: '#00A86B', padding: 15, alignItems: 'center', borderBottomWidth: 3 },
  dropdownText: { fontWeight: '900', color: '#000', fontSize: 18 },
  
  // Year Picker Styles
  dropdownMenu: { backgroundColor: '#F5F7FA', width: '60%', maxHeight: '50%', borderWidth: 4, borderColor: '#000' },
  yearOption: { padding: 15, borderBottomWidth: 1, borderColor: '#CCC' },
  activeYearOption: { backgroundColor: '#00A86B' },
  yearOptionText: { fontWeight: '900', textAlign: 'center' },

  monthHeader: { backgroundColor: '#111', padding: 10, borderBottomWidth: 1, borderBottomColor: '#00A86B' },
  monthHeaderText: { color: '#00A86B', fontWeight: '900', fontSize: 16 },
  dayLabelRow: { flexDirection: 'row', backgroundColor: '#222', paddingVertical: 5 },
  dayLabelText: { width: width / 7, textAlign: 'center', color: '#666', fontWeight: '900', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: width / 7, height: 70, backgroundColor: '#F5F7FA', borderWidth: 0.5, borderColor: '#000', padding: 2 },
  
  // 🚩 Current Date Highlights
  todayHighlight: { backgroundColor: '#FF3B30', borderColor: '#FFF', borderWidth: 2 },
  todayText: { color: '#FFF' },

  cellEmpty: { width: width / 7, height: 70 },
  dateNum: { fontWeight: '900', fontSize: 14 },
  eventPreview: { flexDirection: 'row', marginTop: 5, flexWrap: 'wrap' },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#00A86B', margin: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  eventModal: { backgroundColor: '#FFF', width: '90%', padding: 20, borderWidth: 4 },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#EEE' },
  eventText: { fontWeight: '700', flex: 1 },
  actionIcons: { flexDirection: 'row' },
  input: { borderWidth: 2, padding: 12, marginVertical: 10, fontWeight: '700' },
  saveBtn: { backgroundColor: '#00A86B', padding: 15, alignItems: 'center' },
  btnText: { fontWeight: '900' },
  closeText: { color: 'red', textAlign: 'center', marginTop: 15, fontWeight: '900' }
});