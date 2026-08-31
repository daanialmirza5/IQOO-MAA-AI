import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  iconName: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'alert' | 'success' | 'warning';
  accentColor?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  iconName,
  variant = 'default',
  accentColor,
  onPress,
}) => {
  let iconBg = COLORS.primaryLight;
  let iconColor = accentColor || COLORS.primary;

  if (!accentColor) {
    if (variant === 'alert') {
      iconBg = COLORS.riskHighBg;
      iconColor = COLORS.riskHigh;
    } else if (variant === 'warning') {
      iconBg = COLORS.riskMediumBg;
      iconColor = COLORS.riskMedium;
    } else if (variant === 'success') {
      iconBg = COLORS.riskLowBg;
      iconColor = COLORS.riskLow;
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={styles.card}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
