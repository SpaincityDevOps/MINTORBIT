import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PagerView from 'react-native-pager-view';
import CalendarPage from './src/CalendarPage';
import RoutinePage from './src/RoutinePage';
import NotebookPage from './src/NotebookPage';
const COLORS = { midnight: '#2C3E50', golden: '#FFD700', brutalBlack: '#000000', darkBg: '#0A0A0A' };

export default function App() {
  const getHeaderStyle = () => {
    const hour = new Date().getHours();
    return { backgroundColor: (hour >= 6 && hour < 18) ? COLORS.golden : COLORS.midnight };
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, getHeaderStyle()]}>
        <Text style={styles.title}>MintOrbit</Text>
        <Text style={styles.subtitle}>DayStream Velocity</Text>
      </View>
      <PagerView style={styles.pagerView} initialPage={0}>
        <View key="1"><CalendarPage /></View>
        <View key="2"><RoutinePage /></View>
        <View key="3"><NotebookPage /></View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  header: { padding: 25, borderBottomWidth: 3, borderBottomColor: COLORS.brutalBlack },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.brutalBlack },
  subtitle: { fontSize: 12, fontWeight: '900', color: COLORS.brutalBlack, textTransform: 'uppercase' },
  pagerView: { flex: 1 },
});