import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, minTouch, radius, spacing, typography } from '../../theme';

export const LoadingView = memo(function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
});

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name={icon} size={44} color={colors.textLow} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
});

export const ErrorBanner = memo(function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss error">
          <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

export const PrimaryButton = memo(function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'warning';
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'warning'
          ? colors.warningMuted
          : 'transparent';
  const color =
    variant === 'primary'
      ? colors.black
      : variant === 'danger'
        ? colors.white
        : variant === 'warning'
          ? colors.warning
          : colors.textMid;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: variant === 'ghost' ? colors.border : bg },
        disabled && { opacity: 0.45 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
});

export const IconButton = memo(function IconButton({
  name,
  color = colors.primary,
  onPress,
  label,
  size = 20,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color?: string;
  onPress: () => void;
  label: string;
  size?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.iconBtn}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
    >
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
});

export const UndoSnack = memo(function UndoSnack({
  label,
  onUndo,
  onDismiss,
}: {
  label: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.undo}>
      <Text style={styles.undoText}>{label}</Text>
      <TouchableOpacity onPress={onUndo} accessibilityRole="button" accessibilityLabel="Undo">
        <Text style={styles.undoAction}>UNDO</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss">
        <MaterialCommunityIcons name="close" size={16} color={colors.textMid} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingLabel: { ...typography.caption, color: colors.textMid },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.body, color: colors.textLow, textAlign: 'center' },
  emptySub: { ...typography.caption, color: colors.textLow, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dangerMuted,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '700', flex: 1 },
  btn: {
    minHeight: minTouch,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  btnText: { ...typography.button },
  iconBtn: {
    minWidth: minTouch,
    minHeight: minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undo: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 50,
  },
  undoText: { flex: 1, color: colors.textHi, fontWeight: '700', fontSize: 13 },
  undoAction: { color: colors.primary, fontWeight: '900', letterSpacing: 1, fontSize: 12 },
});
