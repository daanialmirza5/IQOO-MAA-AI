import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Mother } from '../types/mother';

import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { ListSkeleton } from '../components/SkeletonLoader';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

import { useMothers } from '../hooks/useMothers';
import { useAlerts } from '../hooks/useAlerts';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAppNavigation } from '../navigation/useAppNavigation';

import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

/** A mother needs attention if she's HIGH risk, MEDIUM with a declining trend, or follow-up is due. */
function needsAttention(mother: Mother): boolean {
  return mother.riskLevel === 'HIGH' || (mother.riskLevel === 'MEDIUM' && mother.hbTrend === 'DECLINING') || !!mother.needsFollowUp;
}

function priorityScore(mother: Mother): number {
  let score = mother.riskLevel === 'HIGH' ? 100 : mother.riskLevel === 'MEDIUM' ? 50 : 0;
  if (mother.hbTrend === 'DECLINING') score += 20;
  if (mother.bpTrend === 'HIGH' || mother.bpTrend === 'ELEVATING') score += 15;
  if (mother.needsFollowUp) score += 5;
  return score;
}

function reasonLine(mother: Mother): string | null {
  const readings = mother.readings || [];
  if (readings.length >= 2 && mother.hbTrend === 'DECLINING') {
    const sorted = [...readings].sort((a, b) => a.week - b.week);
    const first = sorted.find((r) => r.hemoglobin != null);
    const last = [...sorted].reverse().find((r) => r.hemoglobin != null);
    if (first && last && first !== last) {
      return `Hb ↓ ${first.hemoglobin} → ${last.hemoglobin} g/dL`;
    }
  }
  if (mother.bpTrend === 'HIGH' && mother.bloodPressure) return `BP elevated at ${mother.bloodPressure} mmHg`;
  if (mother.currentSymptoms && mother.currentSymptoms.length > 0) return `Reported: ${mother.currentSymptoms.join(', ')}`;
  if (mother.riskReason) return mother.riskReason;
  return null;
}

export const HomeScreen: React.FC = () => {
  const { mothers, isLoading, error, refresh: refreshMothers } = useMothers();
  const { alerts, refresh: refreshAlerts } = useAlerts();
  const { profile, refresh: refreshProfile } = useUserProfile();
  const navigation = useAppNavigation();

  useFocusEffect(
    React.useCallback(() => {
      refreshMothers();
      refreshAlerts();
      refreshProfile();
    }, [refreshMothers, refreshAlerts, refreshProfile])
  );

  const { highRiskCount, followUpCount, ancDueCount, stableCount, attentionList } = useMemo(() => {
    const high = mothers.filter((m) => m.riskLevel === 'HIGH').length;
    const followUp = mothers.filter((m) => m.riskLevel === 'MEDIUM' && m.needsFollowUp).length;
    const ancDue = mothers.filter((m) => m.needsFollowUp && m.riskLevel === 'LOW').length;
    const stable = mothers.length - high - followUp - ancDue;
    const attention = mothers
      .filter(needsAttention)
      .sort((a, b) => priorityScore(b) - priorityScore(a))
      .slice(0, 5);
    return { highRiskCount: high, followUpCount: followUp, ancDueCount: ancDue, stableCount: Math.max(0, stable), attentionList: attention };
  }, [mothers]);

  const activeAlertsCount = alerts.filter((a) => !a.isResolved).length;

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState description={error} onRetry={refreshMothers} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{profile ? `Hello, ${profile.name.split(' ')[0]}` : 'Hello'}</Text>
          <Text style={styles.greetingSub}>{profile?.assignedArea || 'Loading...'}</Text>
        </View>
        <TouchableOpacity
          style={styles.alertIconBox}
          onPress={() => navigation.navigate('Tabs', { screen: 'AlertsTab' } as never)}
          accessibilityRole="button"
          accessibilityLabel={`${activeAlertsCount} active alerts`}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          {activeAlertsCount > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{activeAlertsCount > 9 ? '9+' : activeAlertsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refreshMothers(); refreshAlerts(); }} />}
      >
        {/* Priority summary strip */}
        <View style={styles.statsRow}>
          <StatCard label="High Priority" value={highRiskCount} iconName="alert-circle" variant="alert" />
          <StatCard label="Follow-up" value={followUpCount} iconName="time" variant="warning" />
          <StatCard label="ANC Due" value={ancDueCount} iconName="calendar-outline" accentColor={COLORS.info} />
          <StatCard label="Stable" value={stableCount} iconName="checkmark-circle" variant="success" />
        </View>

        {/* Quick actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('NewMother')} accessibilityRole="button" accessibilityLabel="Register a new mother">
            <View style={styles.quickActionIcon}>
              <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Register Mother</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Tabs', { screen: 'ScreenTab' } as never)} accessibilityRole="button" accessibilityLabel="Open screening tools">
            <View style={styles.quickActionIcon}>
              <Ionicons name="scan-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Start Screening</Text>
          </TouchableOpacity>
        </View>

        {/* Needs Your Attention */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Needs Your Attention</Text>
          {mothers.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'MothersTab' } as never)}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ListSkeleton count={2} />
        ) : attentionList.length === 0 ? (
          <EmptyState
            title="Nothing urgent right now"
            description="No mothers currently need immediate attention. Great work staying on top of your caseload."
            iconName="checkmark-done-circle-outline"
          />
        ) : (
          attentionList.map((mother) => {
            const reason = reasonLine(mother);
            return (
              <View key={mother.id} style={styles.attentionCard}>
                <TouchableOpacity onPress={() => navigation.navigate('MotherDetail', { motherId: mother.id })} activeOpacity={0.7}>
                  <View style={styles.attentionTopRow}>
                    <RiskBadge level={mother.riskLevel} size="small" />
                    {mother.hbTrend === 'DECLINING' && (
                      <View style={styles.trendPill}>
                        <Ionicons name="trending-down" size={12} color={COLORS.riskHigh} />
                        <Text style={styles.trendPillText}>Deteriorating</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.attentionName}>{mother.name}</Text>
                  <Text style={styles.attentionMeta}>{mother.gestationalAgeWeeks} weeks pregnant · {mother.village}</Text>
                  {reason && (
                    <View style={styles.reasonRow}>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(mother.phone)} accessibilityRole="button" accessibilityLabel={`Call ${mother.name}`}>
                    <Ionicons name="call-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MotherDetail', { motherId: mother.id })} accessibilityRole="button" accessibilityLabel={`View ${mother.name} profile`}>
                    <Ionicons name="person-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Visit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => navigation.navigate('ReferralSummary', { motherId: mother.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`Refer ${mother.name} to PHC`}
                  >
                    <Ionicons name="share-outline" size={15} color={COLORS.textInverted} />
                    <Text style={[styles.actionBtnText, { color: COLORS.textInverted }]}>Refer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.trustFooter}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.trustFooterText}>
            MaAI provides decision support, not a medical diagnosis. Confirm all findings with clinical or laboratory testing.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary },
  greetingSub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 2 },
  alertIconBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.cardSecondaryBg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  alertBadge: {
    position: 'absolute', top: 4, right: 4, backgroundColor: COLORS.riskHigh, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  alertBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.textInverted },
  scrollContent: { padding: SPACING.lg },
  statsRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md },
  quickActionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm,
    ...SHADOWS.small,
  },
  quickActionIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flexShrink: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionHeading: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  sectionLink: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
  attentionCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  attentionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  trendPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.riskHighBg,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  trendPillText: { ...TYPOGRAPHY.overline, color: COLORS.riskHigh },
  attentionName: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  attentionMeta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: SPACING.sm },
  reasonText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, flex: 1, lineHeight: 16 },
  actionRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    height: 40, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardSecondaryBg,
  },
  actionBtnPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.primary },
  trustFooter: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.md, gap: SPACING.sm,
  },
  trustFooterText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, flex: 1, lineHeight: 16 },
});
