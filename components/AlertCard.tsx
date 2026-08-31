import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthAlert } from '../types/alert';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface AlertCardProps {
  alert: HealthAlert;
  onViewMother: () => void;
  onMarkFollowedUp: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onViewMother,
  onMarkFollowedUp,
}) => {
  let badgeBg = COLORS.followupBadge;
  let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
  let badgeLabel = 'FOLLOW-UP';

  if (alert.priority === 'URGENT') {
    badgeBg = COLORS.urgentBadge;
    iconName = 'warning';
    badgeLabel = 'URGENT';
  } else if (alert.priority === 'HIGH_PRIORITY') {
    badgeBg = COLORS.priorityBadge;
    iconName = 'alert-circle';
    badgeLabel = 'HIGH PRIORITY';
  }

  return (
    <View style={[styles.card, alert.isResolved && styles.resolvedCard]}>
      <View style={styles.headerRow}>
        <View style={[styles.priorityBadge, { backgroundColor: badgeBg }]}>
          <Ionicons name={iconName} size={14} color={COLORS.textInverted} style={{ marginRight: 4 }} />
          <Text style={styles.priorityText}>{badgeLabel}</Text>
        </View>

        <Text style={styles.timestamp}>{alert.timestamp}</Text>
      </View>

      <Text style={styles.motherName}>{alert.motherName}</Text>
      <Text style={styles.gestationalText}>{alert.gestationalAgeWeeks} weeks pregnant</Text>

      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.description}>{alert.description}</Text>

      <View style={styles.actionBox}>
        <Ionicons name="medical-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
        <Text style={styles.actionText}>{alert.actionRequired}</Text>
      </View>

      {!alert.isResolved ? (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={onViewMother}
            activeOpacity={0.7}
          >
            <Text style={styles.outlineBtnText}>View Mother</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filledBtn}
            onPress={onMarkFollowedUp}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.textInverted} style={{ marginRight: 4 }} />
            <Text style={styles.filledBtnText}>Mark Followed Up</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resolvedBanner}>
          <Ionicons name="checkmark-done-circle" size={18} color={COLORS.riskLow} />
          <Text style={styles.resolvedText}>Followed up & resolved</Text>
        </View>
      )}
    </View>
  );
};

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
  resolvedCard: {
    opacity: 0.7,
    backgroundColor: COLORS.cardSecondaryBg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textInverted,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  motherName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  gestationalText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentDark,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  outlineBtn: {
    flex: 1,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  filledBtn: {
    flex: 1.3,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textInverted,
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  resolvedText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.riskLow,
    marginLeft: 6,
  },
});
