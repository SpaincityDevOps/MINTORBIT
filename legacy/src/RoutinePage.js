import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function RoutinePage() {
  const [activeDay, setActiveDay] = useState('Sunday');
  const [routines, setRoutines] = useState(DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {}));
  const [tempTask, setTempTask] = useState('');
  
  // 🖼️ Refactor to use Clock Picker as requested
  const [tempTime, setTempTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 🔄 Add Persistence
  useEffect(() => {
    const loadRoutines = async () => {
      const saved = await AsyncStorage.getItem('@mint_routines');
      if (saved) setRoutines(JSON.parse(saved));
    };
    loadRoutines();
  }, []);

  const addTask = async () => {
    if (!tempTask) return;
    const formattedTime = tempTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
    const newDayTasks = [...routines[activeDay], { id: Date.now(), task: tempTask, time: formattedTime }];
    const updatedRoutines = { ...routines, [activeDay]: newDayTasks };
    setRoutines(updatedRoutines);
    setTempTask(''); 
    // 🔄 Save to Storage
    await AsyncStorage.setItem('@mint_routines', JSON.stringify(updatedRoutines));
  };

  const deleteTask = async (id) => {
    const filtered = routines[activeDay].filter(t => t.id !== id);
    const updatedRoutines = { ...routines, [activeDay]: filtered };
    setRoutines(updatedRoutines);
    // 🔄 Save to Storage
    await AsyncStorage.setItem('@mint_routines', JSON.stringify(updatedRoutines));
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setTempTime(selectedDate);
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.label}>ROUTINE GRID</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
        {DAYS.map(day => (
          <TouchableOpacity key={day} onPress={() => setActiveDay(day)} style={[styles.dayTab, activeDay === day && styles.activeTab]}>
            <Text style={[styles.dayTabText, activeDay === day && {color: '#000'}]}>{day.substring(0,3)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput style={[styles.input, {flex: 2}]} placeholder="Activity" value={tempTask} onChangeText={setTempTask} />
        
        {/* 🖼️ Time Display acts as trigger for Clock */}
        <TouchableOpacity style={[styles.input, {flex: 1, justifyContent: 'center'}]} onPress={() => setShowTimePicker(true)}>
          <Text style={{color: '#666', fontWeight: '700', fontSize: 12}}>
            {tempTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        </TouchableOpacity>
        
        {/* 🖼️ Clock Picker (Android default logic) */}
        {showTimePicker && (
          <DateTimePicker 
            mode="time" 
            display="spinner" 
            is24Hour={true} 
            value={tempTime} 
            onChange={onTimeChange} 
          />
        )}
        <TouchableOpacity style={styles.addBtn} onPress={addTask}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
      </View>

      <FlatList
        data={routines[activeDay]}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.taskCard}>
            <View style={{flex: 1}}>
              <Text style={styles.taskTitle}>{item.task}</Text>
              <Text style={styles.taskTime}>{item.time}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <MaterialCommunityIcons name="delete-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, backgroundColor: '#0A0A0A' },
  label: { color: '#00A86B', fontWeight: '900', fontSize: 24, marginBottom: 15 },
  dayPicker: { flexDirection: 'row', marginBottom: 15, maxHeight: 50 },
  dayTab: { padding: 10, borderWidth: 2, borderColor: '#00A86B', marginRight: 8, height: 40 },
  activeTab: { backgroundColor: '#00A86B' },
  dayTabText: { color: '#00A86B', fontWeight: '900' },
  inputArea: { flexDirection: 'row', marginBottom: 20 },
  input: { backgroundColor: '#FFF', borderWidth: 2, padding: 10, marginRight: 5, fontWeight: '700' },
  addBtn: { backgroundColor: '#00A86B', padding: 10, borderWidth: 2, justifyContent: 'center' },
  addBtnText: { fontWeight: '900', fontSize: 20 },
  taskCard: { flexDirection: 'row', backgroundColor: '#F5F7FA', padding: 15, borderWidth: 2, borderColor: '#000', marginBottom: 10, alignItems: 'center' },
  taskTitle: { fontWeight: '900', color: '#2C3E50', fontSize: 16 },
  taskTime: { color: '#00A86B', fontWeight: '700' }
});