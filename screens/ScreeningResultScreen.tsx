import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RiskBadge } from '../components/RiskBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { motherRepository, screeningRepository, alertRepository } from '../db';
import { evaluateUnifiedMaternalRisk } from '../services/risk/maternalRiskEngine';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

const TIMELINE_TITLES: Record<string, string> = {
  VISUAL_ANEMIA: 'Vision — Pallor Screening',
  REPORT_OCR: 'Records — Lab Report OCR',
  VOICE_CHECKIN: 'Voice Check-in',
  PREGNANCY_RISK: 'Risk Assessment',
  SYMPTOM_CHECK: 'Danger Sign Checklist',
  COMBINED: 'Combined Screening',
};

export const ScreeningResultScreen: React.FC<RootScreenProps<'ScreeningResultScreen'>> = ({ navigation, route }) => {
  const { screening, viewOnly } = route.params;
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndTriage = async () => {
    setIsSaving(true);
    try {
      const mother = await motherRepository.getById(screening.motherId);
      if (!mother) throw new Error('Mother not found');

      // Recompute through the same canonical engine so the mother's stored
      // risk level reflects this new evidence combined with her existing
      // history — not just this one screening result in isolation.
      const riskAssessment = evaluateUnifiedMaternalRisk({
        mother,
        visualScreeningRisk: screening.type === 'VISUAL_ANEMIA' ? screening.overallRisk : undefined,
        visualScreeningFinding: screening.anemiaReason,
        customHb: screening.extractedHb,
        customBp: screening.extractedBp,
        customSymptoms: screening.extractedSymptoms,
      });

      await screeningRepository.create(screening);
      await screeningRepository.createRiskAssessment({
        motherId: mother.id,
        overallRisk: riskAssessment.overallRisk,
        score: riskAssessment.score,
        reasons: riskAssessment.whyFlagged,
        evidence: riskAssessment.evidenceItems,
        engineVersion: riskAssessment.engineVersion,
      });

      if (screening.extractedHb !== undefined || screening.extractedBp) {
        await motherRepository.addVital(mother.id, {
          week: mother.gestationalAgeWeeks,
          date: new Date().toISOString().split('T')[0],
          hemoglobin: screening.extractedHb,
          bloodPressure: screening.extractedBp,
          riskLevel: riskAssessment.overallRisk,
          source: screening.type === 'REPORT_OCR' ? 'REPORT_OCR' : screening.type === 'VISUAL_ANEMIA' ? 'VISUAL_SCREENING' : 'VOICE_CHECKIN',
        });
      }
      if (screening.extractedSymptoms?.length) {
        await motherRepository.addSymptoms(mother.id, screening.extractedSymptoms, 'VOICE');
      }

      await motherRepository.updateRisk(mother.id, riskAssessment.overallRisk, riskAssessment.whyFlagged.join(' + '));
      await motherRepository.addActivityEvent(mother.id, {
        title: TIMELINE_TITLES[screening.type] || 'Screening',
        description: screening.reasons.join(' · '),
        type: screening.type === 'REPORT_OCR' ? 'REPORT_OCR' : screening.type === 'VOICE_CHECKIN' ? 'VOICE_SYMPTOM' : 'SCREENING',
        riskLevel: riskAssessment.overallRisk,
      });

      if (riskAssessment.overallRisk === 'HIGH' || riskAssessment.overallRisk === 'MEDIUM') {
        await alertRepository.create({
          motherId: mother.id,
          priority: riskAssessment.overallRisk === 'HIGH' ? 'URGENT' : 'FOLLOW_UP',
          title: riskAssessment.overallRisk === 'HIGH' ? `High Priority: ${mother.name}` : `Follow-up Due: ${mother.name}`,
          description: riskAssessment.whyFlagged.join(' + '),
          actionRequired: riskAssessment.recommendation,
          category: screening.type === 'VISUAL_ANEMIA' ? 'VISUAL_PALLOR' : 'SCREENING_FLAG',
        });
      }

      navigation.navigate('Tabs', { screen: 'AlertsTab' } as never);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => (viewOnly ? navigation.goBack() : navigation.popToTop())} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{viewOnly ? 'Saved Screening' : 'Screening Result'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.prototypeBanner}>
          <Ionicons name="information-circle" size={16} color={COLORS.primaryDark} />
          <Text style={styles.prototypeBannerText}>
            {viewOnly ? 'Viewing a previously saved record — part of this mother’s permanent history' : 'Decision support — not saved until you confirm below'}
          </Text>
        </View>

        <View style={styles.motherSummaryHeader}>
          <Text style={styles.motherName}>{screening.motherName}</Text>
          <Text style={styles.gestationalText}>{screening.gestationalAgeWeeks} Weeks Pregnant · {screening.timestamp}</Text>
        </View>

        {screening.capturedImageUri && (
          <>
            <Text style={styles.sectionTitle}>CAPTURED IMAGE</Text>
            <View style={styles.capturedImageCard}>
              <Image source={{ uri: screening.capturedImageUri }} style={styles.capturedImage} resizeMode="cover" />
              <Text style={styles.capturedImageCaption}>
                Actual photo captured for {screening.motherName} on {screening.timestamp}
              </Text>
            </View>
          </>
        )}

        <View style={[styles.overallCard, screening.overallRisk === 'HIGH' && styles.overallCardHigh, screening.overallRisk === 'MEDIUM' && styles.overallCardMedium]}>
          <Text style={styles.overallLabel}>OVERALL RISK</Text>
          <View style={styles.riskBadgeRow}>
            <RiskBadge level={screening.overallRisk} size="large" />
          </View>
          <Text style={styles.recommendationText}>{screening.recommendation}</Text>
        </View>

        <Text style={styles.sectionTitle}>WHY MAAI FLAGGED THIS</Text>
        <View style={styles.whyCard}>
          {screening.reasons.map((reason, index) => (
            <View key={index} style={styles.reasonBulletRow}>
              <Ionicons name={index === 0 ? 'alert-circle' : 'checkmark-circle'} size={18} color={index === 0 ? COLORS.riskHigh : COLORS.primary} />
              <Text style={[styles.bulletText, index === 0 && styles.bulletTextPrimary]}>{reason}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>SIGNAL BREAKDOWN</Text>
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
              <Text style={styles.breakdownLabel}>Pregnancy Risk</Text>
            </View>
            <RiskBadge level={screening.pregnancyRisk} size="small" />
          </View>
          <View style={[styles.breakdownRow, { borderBottomWidth: 0 }]}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="warning-outline" size={18} color={COLORS.riskMedium} />
              <Text style={styles.breakdownLabel}>Symptom Risk</Text>
            </View>
            <RiskBadge level={screening.symptomRisk} size="small" />
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          {viewOnly ? (
            <PrimaryButton
              title="Create Referral From This"
              onPress={() => navigation.navigate('ReferralSummary', { motherId: screening.motherId, screening })}
              iconName="document-text-outline"
              variant="secondary"
            />
          ) : (
            <>
              <PrimaryButton title={isSaving ? 'Saving...' : 'Save & Update Record'} onPress={handleSaveAndTriage} iconName="checkmark-circle-outline" variant="primary" size="large" loading={isSaving} />
              <PrimaryButton
                title="Create Referral Now"
                onPress={() => navigation.navigate('ReferralSummary', { motherId: screening.motherId, screening })}
                iconName="document-text-outline"
                variant="secondary"
                style={{ marginTop: SPACING.md }}
              />
              <TouchableOpacity style={styles.discardBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.discardBtnText}>Discard this result</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.disclaimerFooter}>
          <Text style={styles.disclaimerFooterText}>
            MaAI provides decision support for frontline workers and is not a medical diagnosis. Confirm all findings with clinical or laboratory testing.
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
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  scrollContent: { padding: SPACING.lg },
  prototypeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg, gap: 6,
  },
  prototypeBannerText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.primaryDark },
  motherSummaryHeader: { alignItems: 'center', marginBottom: SPACING.lg },
  motherName: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary },
  gestationalText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 2 },
  overallCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
    marginBottom: SPACING.xl, borderWidth: 2, borderColor: COLORS.primaryBorder, ...SHADOWS.card,
  },
  overallCardHigh: { borderColor: COLORS.riskHighBorder, backgroundColor: COLORS.riskHighBg },
  overallCardMedium: { borderColor: COLORS.riskMediumBorder, backgroundColor: COLORS.riskMediumBg },
  overallLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginBottom: SPACING.xs },
  riskBadgeRow: { marginVertical: SPACING.sm },
  recommendationText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, textAlign: 'center', marginTop: SPACING.xs, lineHeight: 20 },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.xs },
  capturedImageCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  capturedImage: { width: '100%', height: 200, borderRadius: RADIUS.md, backgroundColor: COLORS.cardSecondaryBg },
  capturedImageCaption: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  whyCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.riskHighBorder, ...SHADOWS.card },
  reasonBulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: SPACING.xs, gap: SPACING.md },
  bulletText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
  bulletTextPrimary: { color: COLORS.riskHigh },
  breakdownCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  breakdownLabel: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  buttonsContainer: { marginTop: SPACING.xs },
  discardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, marginTop: SPACING.xs, gap: 4 },
  discardBtnText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textSecondary },
  disclaimerFooter: { marginTop: SPACING.lg, padding: SPACING.md, backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.divider },
  disclaimerFooterText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center', lineHeight: 16 },
});
