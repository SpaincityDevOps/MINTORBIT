import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  hero: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.textHi,
  } as TextStyle,
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: colors.textHi,
  } as TextStyle,
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
  } as TextStyle,
  section: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.primary,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textHi,
  } as TextStyle,
  bodyMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMid,
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textMid,
  } as TextStyle,
  micro: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textLow,
  } as TextStyle,
  button: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  } as TextStyle,
} as const;
