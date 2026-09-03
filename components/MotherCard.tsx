import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother } from '../types/mother';
import { RiskBadge } from './RiskBadge';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface MotherCardProps {
  mother: Mother;
  onPress: () => void;
  onScreenPress?: () => void;
}

const MotherCardComponent: React.FC<MotherCardProps> = ({
  mother,
  onPress,
  onScreenPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${mother.name}, ${mother.riskLevel} risk, ${mother.gestationalAgeWeeks} weeks pregnant`}
    >
      <View style={styles.topRow}>
        <View style={styles.nameSection}>
          <Text style={styles.name}>{mother.name}</Text>
          <Text style={styles.subtext}>
            {mother.age} yrs • {mother.gestationalAgeWeeks} weeks pregnant
          </Text>
        </View>
        <RiskBadge level={mother.riskLevel} size="small" />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>{mother.village}</Text>
        </View>
        {mother.lastScreeningDate && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.detailText}>Last: {mother.lastScreeningDate}</Text>
          </View>
        )}
      </View>

      {mother.riskReason && (
        <View style={styles.reasonBanner}>
          <Ionicons name="information-circle-outline" size={15} color={COLORS.accentDark} />
          <Text style={styles.reasonText} numberOfLines={1}>
            {mother.riskReason}
          </Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.viewBtnText}>View Profile</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>

        {onScreenPress && (
          <TouchableOpacity
            style={styles.screenBtn}
            onPress={onScreenPress}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={14} color={COLORS.textInverted} style={{ marginRight: 4 }} />
            <Text style={styles.screenBtnText}>Screen Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const MotherCard = React.memo(MotherCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  nameSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  reasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.accentDark,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  viewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 2,
  },
  screenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
  },
  screenBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textInverted,
  },
});
