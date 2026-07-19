import React, { useCallback, useRef, useState } from 'react';
import { Modal, StatusBar, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/layout/AppHeader';
import { LoadingView, UndoSnack } from '../components/common';
import { useData } from '../contexts/DataContext';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import RoutineScreen from '../screens/Routine/RoutineScreen';
import NotebookScreen from '../screens/Notebook/NotebookScreen';
import AgendaScreen from '../screens/Agenda/AgendaScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import { colors } from '../theme';
import { enableLayoutAnimations } from '../theme/animations';

enableLayoutAnimations();

const TABS = [
  { key: 'agenda', label: 'Today', icon: 'view-dashboard-outline' as const },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-month-outline' as const },
  { key: 'routine', label: 'Routine', icon: 'clock-outline' as const },
  { key: 'streams', label: 'Streams', icon: 'notebook-outline' as const },
];

export default function RootNavigator() {
  const insets = useSafeAreaInsets();
  const { ready, undo, performUndo, dismissUndo } = useData();
  const [activePage, setActivePage] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  const navigateTo = useCallback((idx: number) => {
    pagerRef.current?.setPage(idx);
    setActivePage(idx);
  }, []);

  if (!ready) {
    return <LoadingView label="Booting DayStream…" />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={false} />

      <AppHeader
        tabs={TABS}
        activeIndex={activePage}
        onTabPress={navigateTo}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
        offscreenPageLimit={1}
      >
        <View key="agenda" style={styles.page}><AgendaScreen /></View>
        <View key="calendar" style={styles.page}><CalendarScreen /></View>
        <View key="routine" style={styles.page}><RoutineScreen /></View>
        <View key="streams" style={styles.page}><NotebookScreen /></View>
      </PagerView>

      {undo ? (
        <UndoSnack label={undo.label} onUndo={performUndo} onDismiss={dismissUndo} />
      ) : null}

      <Modal
        visible={settingsOpen}
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
        presentationStyle="fullScreen"
      >
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
          <SettingsScreen onClose={() => setSettingsOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pager: { flex: 1 },
  page: { flex: 1 },
});
