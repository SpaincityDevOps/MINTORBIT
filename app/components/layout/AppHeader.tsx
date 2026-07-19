import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { APP_NAME, APP_TAGLINE } from '../../constants';
import { colors, spacing, typography } from '../../theme';
import { isDaytime } from '../../utils';

type Tab = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

type Props = {
  tabs: Tab[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  onSettingsPress: () => void;
};

export const AppHeader = memo(function AppHeader({
  tabs,
  activeIndex,
  onTabPress,
  onSettingsPress,
}: Props) {
  const day = isDaytime();

  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName} accessibilityRole="header">{APP_NAME}</Text>
          <Text style={styles.appSub}>{APP_TAGLINE}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.dayBadge, { backgroundColor: day ? colors.warningMuted : colors.primaryMuted }]}>
            <Text style={[styles.dayBadgeText, { color: day ? colors.warning : colors.primary }]}>
              {day ? '☀ DAY' : '◉ NIGHT'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={onSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.textMid} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar} accessibilityRole="tablist">
        {tabs.map((tab, idx) => {
          const active = activeIndex === idx;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(idx)}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={20}
                color={active ? colors.primary : colors.textLow}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {active ? <View style={styles.tabIndicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  appName: { ...typography.hero },
  appSub: { ...typography.subtitle, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dayBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 56,
    position: 'relative',
  },
  tabLabel: {
    color: colors.textLow,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  tabLabelActive: { color: colors.primary },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
