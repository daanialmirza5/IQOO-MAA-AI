import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AshaWorkerProfile } from '../types/user';
import { Mother } from '../types/mother';
import { HealthAlert } from '../types/alert';

import { StatCard } from '../components/StatCard';
import { MotherCard } from '../components/MotherCard';
import { SectionHeader } from '../components/SectionHeader';
import { PrimaryButton } from '../components/PrimaryButton';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface HomeScreenProps {
  user: AshaWorkerProfile;
  mothers: Mother[];
  alerts: HealthAlert[];
  onOpenNewMother: () => void;
  onOpenScreeningTab: () => void;
  onSelectMother: (mother: Mother) => void;
  onOpenAlertsTab: () => void;
  onStartDemoFlow: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  mothers,
  alerts,
  onOpenNewMother,
  onOpenScreeningTab,
  onSelectMother,
  onOpenAlertsTab,
  onStartDemoFlow,
}) => {
  const highRiskMothers = mothers.filter((m) => m.riskLevel === 'HIGH' || m.dueToday);
  const activeAlertsCount = alerts.filter((a) => !a.isResolved).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Branding & Greeting Header */}
      <View style={styles.headerBar}>
        <View>
          <View style={styles.appNameRow}>
            <Text style={styles.appTitle}>MaAI</Text>
            <View style={styles.prototypePill}>
              <Text style={styles.prototypePillText}>AI PROTOTYPE</Text>
            </View>
          </View>
          <Text style={styles.greetingSub}>
            Good morning, {user.name} ({user.assignedArea})
          </Text>
        </View>

        <TouchableOpacity style={styles.alertIconBox} onPress={onOpenAlertsTab}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.primaryDark} />
          {activeAlertsCount > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{activeAlertsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PHASE 9: ONE-TAP DEMO HERO CARD */}
        <View style={styles.demoHeroCard}>
          <View style={styles.demoHeroHeader}>
            <View style={styles.sparkleCircle}>
              <Ionicons name="sparkles" size={22} color={COLORS.textInverted} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.demoHeroTitle}>START DEMO SCREENING</Text>
              <Text style={styles.demoHeroSub}>
                1-Tap Hackathon Flow: Scan & evaluate Priya Sharma (28 Weeks)
              </Text>
            </View>
          </View>

          <PrimaryButton
            title="Launch Demo Screening Flow"
            onPress={onStartDemoFlow}
            iconName="camera"
            variant="accent"
            size="large"
            style={styles.demoHeroBtn}
          />
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenNewMother}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="person-add" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionCardTitle}>New Mother</Text>
            <Text style={styles.actionCardSub}>Register profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenScreeningTab}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="scan-outline" size={22} color={COLORS.accentDark} />
            </View>
            <Text style={styles.actionCardTitle}>Screening Hub</Text>
            <Text style={styles.actionCardSub}>Camera & Risk check</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Metrics Grid */}
        <SectionHeader title="Field Activity Summary" />
        <View style={styles.statsRow}>
          <StatCard
            label="Total Mothers"
            value={user.totalMothersAssigned || 24}
            iconName="people-outline"
            accentColor={COLORS.primary}
          />
          <StatCard
            label="Follow-ups Due"
            value={user.followUpsDue || 5}
            iconName="calendar-outline"
            accentColor={COLORS.riskMedium}
          />
          <StatCard
            label="High Priority"
            value={user.highRiskCount || 3}
            iconName="alert-circle-outline"
            accentColor={COLORS.riskHigh}
          />
        </View>

        {/* TODAY'S PRIORITY CASES */}
        <SectionHeader
          title="TODAY'S PRIORITY CASES"
          actionText="View All Mothers"
          onActionPress={onOpenScreeningTab}
        />

        {highRiskMothers.slice(0, 3).map((mother) => (
          <MotherCard
            key={mother.id}
            mother={mother}
            onPress={() => onSelectMother(mother)}
          />
        ))}

        {/* Trust & Safety Disclaimer Footer */}
        <View style={styles.trustFooter}>
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.trustFooterText}>
            MaAI provides decision support for frontline health workers, not a medical diagnosis. Confirm all high-risk findings with laboratory testing.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  prototypePill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  prototypePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alertIconBox: {
    position: 'relative',
    padding: SPACING.xs,
  },
  alertBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.riskHigh,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  alertBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textInverted,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  demoHeroCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  demoHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sparkleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textInverted,
    letterSpacing: 0.5,
  },
  demoHeroSub: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 2,
    lineHeight: 16,
  },
  demoHeroBtn: {
    marginTop: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actionCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  trustFooterText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 16,
  },
});
