import React, { memo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, minTouch, radius, spacing } from '../../theme';

export const AppTextInput = memo(function AppTextInput({
  style,
  ...props
}: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textLow}
      style={[styles.input, style]}
      {...props}
    />
  );
});

export const LabeledField = memo(function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.textHi,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: '600',
    fontSize: 14,
    minHeight: minTouch,
  },
  field: { gap: spacing.xs, marginBottom: spacing.sm },
  label: {
    color: colors.textMid,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
