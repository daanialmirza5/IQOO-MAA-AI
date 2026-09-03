import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level crash guard. All mother health data lives in SQLite, not in
 * memory, so a render crash never loses saved data — this just gives the
 * worker a way to recover without the app going to a blank white screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning-outline" size={32} color={COLORS.riskHigh} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.description}>
            MaAI hit an unexpected error. Your saved mother records are safe — they live in local storage, not in this
            screen. Tap below to try again.
          </Text>
          <PrimaryButton title="Try Again" onPress={this.handleReset} iconName="refresh-outline" variant="primary" style={{ marginTop: SPACING.lg }} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.riskHighBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary, textAlign: 'center' },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
});
