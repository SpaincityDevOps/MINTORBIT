import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';

type State = { hasError: boolean; errorMsg: string };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, errorMsg: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Production: could forward to crash analytics
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons name="alert-octagon" size={48} color={colors.danger} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>{this.state.errorMsg}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, errorMsg: '' })}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: { color: colors.danger, fontSize: 22, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  body: { color: colors.textMid, textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 4,
  },
  btnText: { color: colors.black, fontWeight: '900', letterSpacing: 1 },
});
