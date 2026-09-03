import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description,
  onRetry,
}) => {
  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-offline-outline" size={32} color={COLORS.riskHigh} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onRetry && (
        <PrimaryButton title="Try Again" onPress={onRetry} variant="outline" style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.riskHighBg,
    borderRadius: RADIUS.xl,
    marginVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.riskHighBorder,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: 4 },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  button: { marginTop: SPACING.xs },
});
