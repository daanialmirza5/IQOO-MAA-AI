import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother } from '../types/mother';
import { ScreeningResult } from '../types/screening';
import { RiskBadge } from '../components/RiskBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface ReferralSummaryModalProps {
  visible: boolean;
  mother: Mother | null;
  screening?: ScreeningResult | null;
  onClose: () => void;
}

export const ReferralSummaryModal: React.FC<ReferralSummaryModalProps> = ({
  visible,
  mother,
  screening,
  onClose,
}) => {
  if (!mother) return null;

  const riskLevel = screening ? screening.overallRisk : mother.riskLevel;
  const findings = screening
    ? screening.reasons
    : [
        mother.riskReason || 'Screening risk flagged during field visit.',
        mother.previousComplications ? `History: ${mother.previousComplications}` : 'No prior history recorded',
      ];
  const recommendation = screening
    ? screening.recommendation
    : 'Clinical evaluation & confirmatory laboratory Hb testing recommended at PHC center.';

  const timestamp = screening
    ? screening.timestamp
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const handleShare = async () => {
    const summaryText = `
*MaAI Maternal Screening Clinical Referral Summary*
==========================================
*Mother:* ${mother.name} (${mother.age} yrs)
*Gestational Age:* ${mother.gestationalAgeWeeks} Weeks
*Village/Area:* ${mother.village}
*Emergency Contact:* ${mother.emergencyContact}
------------------------------------------
*OVERALL RISK LEVEL:* ${riskLevel} RISK

*Key Findings:*
${findings.map((f) => `• ${f}`).join('\n')}

*Recommendation:*
${recommendation}

*Date/Time:* ${timestamp}
*Assigned ASHA Worker:* Sunita Devi (ID: ASHA-1024)
==========================================
*Notice:* Non-diagnostic field decision-support screening report.
    `.trim();

    try {
      const result = await Share.share({
        message: summaryText,
        title: `MaAI Referral Summary - ${mother.name}`,
      });
      if (result.action === Share.sharedAction) {
        Alert.alert('Export Successful', 'Referral summary shared successfully.');
      }
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Summary</Text>
          <TouchableOpacity style={styles.shareIconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Document Sheet Container */}
          <View style={styles.documentSheet}>
            {/* Header branding */}
            <View style={styles.docHeader}>
              <View style={styles.docLogoBox}>
                <Ionicons name="medical" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.docTitle}>MaAI</Text>
                <Text style={styles.docSub}>Maternal Screening Referral Summary</Text>
              </View>
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>OFFICIAL REFERRAL</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Mother Details */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MOTHER NAME</Text>
              <Text style={styles.fieldValueBold}>{mother.name}</Text>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>AGE</Text>
                <Text style={styles.fieldValue}>{mother.age} years</Text>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>GESTATIONAL AGE</Text>
                <Text style={styles.fieldValueHighlight}>{mother.gestationalAgeWeeks} Weeks</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>VILLAGE / LOCALITY</Text>
              <Text style={styles.fieldValue}>{mother.village}</Text>
            </View>

            <View style={styles.divider} />

            {/* Overall Risk */}
            <View style={styles.riskRow}>
              <Text style={styles.riskRowLabel}>ASSESSED RISK STATUS:</Text>
              <RiskBadge level={riskLevel} size="large" />
            </View>

            <View style={styles.divider} />

            {/* Findings */}
            <Text style={styles.fieldLabel}>KEY CLINICAL FINDINGS</Text>
            <View style={styles.findingsBox}>
              {findings.map((f, i) => (
                <View key={i} style={styles.findingItem}>
                  <Text style={styles.bulletSymbol}>•</Text>
                  <Text style={styles.findingText}>{f}</Text>
                </View>
              ))}
            </View>

            {/* Recommendation */}
            <Text style={styles.fieldLabel}>RECOMMENDED ACTION</Text>
            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>

            <View style={styles.divider} />

            {/* Footer Metadata */}
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Assigned Health Worker</Text>
                <Text style={styles.metaValue}>Sunita Devi (ID: ASHA-1024)</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>{timestamp}</Text>
              </View>
            </View>
          </View>

          {/* Share Action Button */}
          <PrimaryButton
            title="Share / Export Referral Summary"
            onPress={handleShare}
            iconName="share-social"
            variant="primary"
            size="large"
            style={{ marginTop: SPACING.xl }}
          />

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
  documentSheet: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.modal,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  docSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  officialBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  officialText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  fieldGroup: {
    marginVertical: SPACING.xs,
  },
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  fieldValueBold: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  fieldValueHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  riskRowLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  findingsBox: {
    backgroundColor: COLORS.cardSecondaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  bulletSymbol: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 6,
    fontWeight: '800',
  },
  findingText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  recommendationBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  recommendationText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  metaValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
});
