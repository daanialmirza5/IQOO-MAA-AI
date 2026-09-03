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
  /** Denser tile for a 2-column grid layout — smaller icon, clamped subtitle. */
  compact?: boolean;
  accentColor?: string;
  accentBg?: string;
  onPress: () => void;
}

export const ScreeningCard: React.FC<ScreeningCardProps> = ({
  title,
  subtitle,
  badgeText,
  iconName,
  isCenterpiece = false,
  compact = false,
  accentColor,
  accentBg,
  onPress,
}) => {
  const iconColor = isCenterpiece ? COLORS.primary : accentColor || COLORS.accent;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        compact && styles.compactCard,
        isCenterpiece && styles.centerpieceCard,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            isCenterpiece ? styles.centerpieceIconBox : styles.regularIconBox,
            compact && styles.compactIconBox,
            !isCenterpiece && accentBg ? { backgroundColor: accentBg } : null,
          ]}
        >
          <Ionicons name={iconName} size={isCenterpiece ? 28 : compact ? 18 : 22} color={iconColor} />
        </View>

        {badgeText && !compact && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.title, isCenterpiece && styles.centerpieceTitle, compact && styles.compactTitle]}
        numberOfLines={compact ? 2 : undefined}
      >
        {title}
      </Text>

      <Text
        style={[styles.subtitle, isCenterpiece && styles.centerpieceSubtitle, compact && styles.compactSubtitle]}
        numberOfLines={compact ? 2 : undefined}
      >
        {subtitle}
      </Text>

      <View style={[styles.ctaRow, compact && styles.compactCtaRow]}>
        <Text style={[styles.ctaText, isCenterpiece && styles.centerpieceCtaText, compact && styles.compactCtaText]}>
          {isCenterpiece ? 'Open Camera Screening' : compact ? 'Start' : 'Start Screening'}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={compact ? 14 : 18}
          color={isCenterpiece ? COLORS.primaryDark : iconColor}
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
  compactCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: SPACING.md,
    marginBottom: 0,
    borderRadius: RADIUS.lg,
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
  compactIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  compactTitle: {
    fontSize: 13,
    marginBottom: 3,
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
  compactSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: SPACING.sm,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  compactCtaRow: {
    paddingTop: SPACING.xs,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  compactCtaText: {
    fontSize: 12,
  },
  centerpieceCtaText: {
    color: COLORS.primaryDark,
    fontSize: 16,
  },
});
