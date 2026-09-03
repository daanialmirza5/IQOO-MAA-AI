import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText,
  onActionPress,
}) => {
  const handlePress = onActionPress;

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
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  actionText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
  },
});
