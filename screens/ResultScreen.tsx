import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreeningResult } from '../types/screening';
import { RiskBadge } from '../components/RiskBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface ResultScreenProps {
  visible: boolean;
  screening: ScreeningResult | null;
  onClose: () => void;
  onSaveScreening: (screening: ScreeningResult) => void;
  onCreateReferral: (screening: ScreeningResult) => void;
  onRetake: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  visible,
  screening,
  onClose,
  onSaveScreening,
  onCreateReferral,
  onRetake,
}) => {
  if (!screening) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Screening Result</Text>
          <TouchableOpacity
            style={styles.shareIconBtn}
            onPress={() => onCreateReferral(screening)}
          >
            <Ionicons name="share-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Prototype disclaimer banner */}
          <View style={styles.prototypeBanner}>
            <Ionicons name="sparkles" size={16} color={COLORS.primaryDark} />
            <Text style={styles.prototypeBannerText}>
              AI-assisted screening prototype — Field Decision Support
            </Text>
          </View>

          {/* Mother Summary Header */}
          <View style={styles.motherSummaryHeader}>
            <Text style={styles.motherName}>{screening.motherName}</Text>
            <Text style={styles.gestationalText}>
              {screening.gestationalAgeWeeks} Weeks Pregnant • {screening.timestamp}
            </Text>
          </View>

          {/* OVERALL RISK CARD */}
          <View
            style={[
              styles.overallCard,
              screening.overallRisk === 'HIGH' && styles.overallCardHigh,
              screening.overallRisk === 'MEDIUM' && styles.overallCardMedium,
            ]}
          >
            <Text style={styles.overallLabel}>OVERALL MATERNAL RISK</Text>
            <View style={styles.riskBadgeRow}>
              <RiskBadge level={screening.overallRisk} size="large" />
            </View>
            <Text style={styles.recommendationText}>{screening.recommendation}</Text>
          </View>

          {/* PHASE 4: WHY MAAI FLAGGED THIS CASE */}
          <Text style={styles.sectionTitle}>WHY MAAI FLAGGED THIS CASE</Text>
          <View style={styles.whyCard}>
            {screening.reasons.map((reason, index) => (
              <View key={index} style={styles.reasonBulletRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.riskHigh} />
                <Text style={styles.bulletText}>{reason}</Text>
              </View>
            ))}
          </View>

          {/* Screening Category Breakdown */}
          <Text style={styles.sectionTitle}>Screening Signal Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
                <Text style={styles.breakdownLabel}>Visual Anemia Risk</Text>
              </View>
              <RiskBadge level={screening.anemiaRisk} size="small" />
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="pulse-outline" size={18} color={COLORS.accent} />
                <Text style={styles.breakdownLabel}>Pregnancy Risk Engine</Text>
              </View>
              <RiskBadge level={screening.pregnancyRisk} size="small" />
            </View>

            <View style={[styles.breakdownRow, { borderBottomWidth: 0 }]}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="warning-outline" size={18} color={COLORS.riskMedium} />
                <Text style={styles.breakdownLabel}>Danger Symptoms Risk</Text>
              </View>
              <RiskBadge level={screening.symptomRisk} size="small" />
            </View>
          </View>

          {/* RECOMMENDED ACTION */}
          <Text style={styles.sectionTitle}>RECOMMENDED ACTION</Text>
          <View style={styles.nextStepBox}>
            <Ionicons name="medical" size={24} color={COLORS.primary} />
            <View style={{ marginLeft: SPACING.md, flex: 1 }}>
              <Text style={styles.nextStepTitle}>Clinical Referral & Evaluation</Text>
              <Text style={styles.nextStepSub}>
                Confirm visual screening findings with laboratory Hb testing and physician examination at Primary Health Center.
              </Text>
            </View>
          </View>

          {/* Actions Button Group */}
          <View style={styles.buttonsContainer}>
            <PrimaryButton
              title="Create Referral Summary"
              onPress={() => onCreateReferral(screening)}
              iconName="document-text-outline"
              variant="primary"
              size="large"
            />

            <PrimaryButton
              title="Save Record & Add to Alerts"
              onPress={() => onSaveScreening(screening)}
              iconName="checkmark-circle-outline"
              variant="secondary"
              style={{ marginTop: SPACING.md }}
            />

            <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.retakeBtnText}>Retake Camera Screening</Text>
            </TouchableOpacity>
          </View>

          {/* Medical Notice */}
          <View style={styles.disclaimerFooter}>
            <Text style={styles.disclaimerFooterText}>
              MaAI provides decision support for frontline workers and is not a medical diagnosis. Confirm all findings with clinical laboratory testing.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  shareIconBtn: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  prototypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  prototypeBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 6,
  },
  motherSummaryHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  motherName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  gestationalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  overallCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    ...SHADOWS.card,
  },
  overallCardHigh: {
    borderColor: COLORS.riskHighBorder,
    backgroundColor: COLORS.riskHighBg,
  },
  overallCardMedium: {
    borderColor: COLORS.riskMediumBorder,
    backgroundColor: COLORS.riskMediumBg,
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  riskBadgeRow: {
    marginVertical: SPACING.sm,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  whyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.riskHighBorder,
    ...SHADOWS.card,
  },
  reasonBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: SPACING.xs,
  },
  bulletText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    flex: 1,
    marginLeft: SPACING.md,
    lineHeight: 20,
  },
  breakdownCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  nextStepBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  nextStepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  nextStepSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  buttonsContainer: {
    marginTop: SPACING.xs,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  disclaimerFooter: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.cardSecondaryBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  disclaimerFooterText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
