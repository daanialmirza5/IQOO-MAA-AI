import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface ScreeningCardProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isCenterpiece?: boolean;
  onPress: () => void;
}

export const ScreeningCard: React.FC<ScreeningCardProps> = ({
  title,
  subtitle,
  badgeText,
  iconName,
  isCenterpiece = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isCenterpiece && styles.centerpieceCard,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            isCenterpiece ? styles.centerpieceIconBox : styles.regularIconBox,
          ]}
        >
          <Ionicons
            name={iconName}
            size={isCenterpiece ? 28 : 22}
            color={isCenterpiece ? COLORS.primary : COLORS.accent}
          />
        </View>

        {badgeText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, isCenterpiece && styles.centerpieceTitle]}>
        {title}
      </Text>

      <Text style={[styles.subtitle, isCenterpiece && styles.centerpieceSubtitle]}>
        {subtitle}
      </Text>

      <View style={styles.ctaRow}>
        <Text style={[styles.ctaText, isCenterpiece && styles.centerpieceCtaText]}>
          {isCenterpiece ? 'Open Camera Screening' : 'Start Screening'}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={isCenterpiece ? COLORS.primaryDark : COLORS.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  centerpieceCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
    borderWidth: 2,
    padding: SPACING.xl + 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularIconBox: {
    backgroundColor: COLORS.accentLight,
  },
  centerpieceIconBox: {
    backgroundColor: COLORS.cardBg,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  badge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textInverted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  centerpieceTitle: {
    fontSize: 22,
    color: COLORS.primaryDark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  centerpieceSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  centerpieceCtaText: {
    color: COLORS.primaryDark,
    fontSize: 16,
  },
});
