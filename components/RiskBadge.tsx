import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../types/mother';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'medium',
  showLabel = true,
}) => {
  let bgColor = COLORS.riskLowBg;
  let textColor = COLORS.riskLow;
  let borderColor = COLORS.riskLowBorder;
  let displayText = 'LOW RISK';

  if (level === 'HIGH') {
    bgColor = COLORS.riskHighBg;
    textColor = COLORS.riskHigh;
    borderColor = COLORS.riskHighBorder;
    displayText = 'HIGH RISK';
  } else if (level === 'MEDIUM') {
    bgColor = COLORS.riskMediumBg;
    textColor = COLORS.riskMedium;
    borderColor = COLORS.riskMediumBorder;
    displayText = 'MEDIUM RISK';
  }

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
        isSmall && styles.smallContainer,
        isLarge && styles.largeContainer,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: textColor }]} />
      {showLabel && (
        <Text
          style={[
            styles.text,
            { color: textColor },
            isSmall && styles.smallText,
            isLarge && styles.largeText,
          ]}
        >
          {displayText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  smallContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  largeContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  smallText: {
    fontSize: 10,
  },
  largeText: {
    fontSize: 14,
  },
});
