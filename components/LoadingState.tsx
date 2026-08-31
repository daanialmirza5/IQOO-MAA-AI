import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading MaAI data...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  text: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
