import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText,
  onAction,
  onActionPress,
}) => {
  const handlePress = onAction || onActionPress;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionText && handlePress && (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
