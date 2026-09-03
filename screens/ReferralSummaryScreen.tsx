import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RiskBadge } from '../components/RiskBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useMother } from '../hooks/useMothers';
import { useUserProfile } from '../hooks/useUserProfile';
import { careRepository } from '../db';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const ReferralSummaryScreen: React.FC<RootScreenProps<'ReferralSummary'>> = ({ navigation, route }) => {
  const { motherId, screening } = route.params;
  const { mother, isLoading, error } = useMother(motherId);
  const { profile } = useUserProfile();
  const [isSaved, setIsSaved] = useState(false);
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null);
  const showInfo = (title: string, message: string) => setInfoDialog({ title, message });

  if (isLoading) return <LoadingState message="Loading referral details..." />;
  if (error || !mother) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorState description={error || 'Mother record not found.'} onRetry={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const riskLevel = screening ? screening.overallRisk : mother.riskLevel;
  const findings = screening
    ? screening.reasons
    : [mother.riskReason || 'Screening risk flagged during field visit.', mother.previousComplications ? `History: ${mother.previousComplications}` : 'No prior history recorded'];
  const recommendation = screening ? screening.recommendation : 'Clinical evaluation & confirmatory laboratory testing recommended at PHC center.';
  const timestamp = screening ? screening.timestamp : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const workerLine = profile ? `${profile.name} (ID: ${profile.workerId})` : 'ASHA Worker';

  const buildFullSummaryText = () =>
    `
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
*Assigned ASHA Worker:* ${workerLine}
==========================================
*Notice:* Non-diagnostic field decision-support screening report.
    `.trim();

  const buildShortSummaryText = () =>
    `MaAI Referral: ${mother.name} (${mother.age}y, ${mother.gestationalAgeWeeks}w) — ${riskLevel} RISK. ${findings[0] || ''} Action: ${recommendation} — ${workerLine}, ${timestamp}`;

  const recordReferral = async () => {
    if (isSaved) return;
    await careRepository.createReferral({
      motherId: mother.id,
      screeningId: undefined,
      riskLevel,
      findings,
      recommendation,
      createdBy: profile?.workerId,
    });
    setIsSaved(true);
  };

  const handleShare = async () => {
    await recordReferral();
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        const nav = navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void>; clipboard?: { writeText: (t: string) => Promise<void> } };
        if (nav.share) {
          await nav.share({ title: `MaAI Referral Summary - ${mother.name}`, text: buildFullSummaryText() });
          return;
        } else if (nav.clipboard) {
          await nav.clipboard.writeText(buildFullSummaryText());
          showInfo('Copied', 'Referral summary copied to clipboard.');
          return;
        }
      }
      const result = await Share.share({ message: buildFullSummaryText(), title: `MaAI Referral Summary - ${mother.name}` });
      if (result && result.action === Share.sharedAction) {
        showInfo('Export Successful', 'Referral summary shared successfully.');
      }
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const handleWhatsAppShare = async () => {
    await recordReferral();
    const url = `whatsapp://send?text=${encodeURIComponent(buildFullSummaryText())}`;
    try {
      if (Platform.OS === 'web') {
        window.open(`https://wa.me/?text=${encodeURIComponent(buildFullSummaryText())}`, '_blank');
        return;
      }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showInfo('WhatsApp Not Available', 'WhatsApp is not installed on this device. Use "More Options" to share instead.');
      }
    } catch (e) {
      console.error('WhatsApp share error:', e);
      showInfo('Unable to Open WhatsApp', 'Please use "More Options" to share instead.');
    }
  };

  const handleSmsShare = async () => {
    await recordReferral();
    const phoneDigits = mother.emergencyContact.replace(/[^\d+]/g, '');
    const body = encodeURIComponent(buildShortSummaryText());
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${phoneDigits}${separator}body=${body}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(url);
      } else {
        showInfo('SMS Not Available', 'SMS is not supported on this device. Use "More Options" to share instead.');
      }
    } catch (e) {
      console.error('SMS share error:', e);
      showInfo('Unable to Open Messages', 'Please use "More Options" to share instead.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Summary</Text>
        <TouchableOpacity style={styles.shareIconBtn} onPress={handleShare} accessibilityLabel="More share options">
          <Ionicons name="share-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.documentSheet}>
          <View style={styles.docHeader}>
            <View style={styles.docLogoBox}>
              <Ionicons name="medical" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.docTitle}>MaAI</Text>
              <Text style={styles.docSub}>Maternal Screening Referral Summary</Text>
            </View>
            <View style={styles.officialBadge}>
              <Text style={styles.officialText}>REFERRAL</Text>
            </View>
          </View>

          <View style={styles.divider} />

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

          <View style={styles.riskRow}>
            <Text style={styles.riskRowLabel}>ASSESSED RISK STATUS:</Text>
            <RiskBadge level={riskLevel} size="large" />
          </View>

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>KEY CLINICAL FINDINGS</Text>
          <View style={styles.findingsBox}>
            {findings.map((f, i) => (
              <View key={i} style={styles.findingItem}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.findingText}>{f}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.fieldLabel}>RECOMMENDED ACTION</Text>
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Assigned Health Worker</Text>
              <Text style={styles.metaValue}>{workerLine}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>Date & Time</Text>
              <Text style={styles.metaValue}>{timestamp}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.quickShareLabel}>Send Directly To PHC / Family</Text>
        <View style={styles.quickShareRow}>
          <TouchableOpacity style={[styles.quickShareBtn, styles.whatsappBtn]} onPress={handleWhatsAppShare} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.whatsappBtnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickShareBtn, styles.smsBtn]} onPress={handleSmsShare} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} />
            <Text style={styles.smsBtnText}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${mother.phone.replace(/\s/g, '')}`)} activeOpacity={0.85} accessibilityLabel={`Call ${mother.name}`}>
            <Ionicons name="call-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <PrimaryButton title="More Options / Export" onPress={handleShare} iconName="share-social" variant="secondary" size="normal" style={{ marginTop: SPACING.sm }} />

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog
        visible={!!infoDialog}
        title={infoDialog?.title ?? ''}
        message={infoDialog?.message ?? ''}
        confirmText="OK"
        onConfirm={() => setInfoDialog(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  quickShareLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted, textTransform: 'uppercase', marginTop: SPACING.xl, marginBottom: SPACING.xs },
  quickShareRow: { flexDirection: 'row', gap: SPACING.sm },
  quickShareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: RADIUS.lg, gap: SPACING.xs, borderWidth: 1 },
  whatsappBtn: { backgroundColor: '#25D366', borderColor: '#25D366', ...SHADOWS.small },
  whatsappBtnText: { ...TYPOGRAPHY.bodyStrong, color: '#FFFFFF' },
  smsBtn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryBorder },
  smsBtnText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
  callBtn: { width: 52, height: 52, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardSecondaryBg, borderWidth: 1, borderColor: COLORS.border },
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  shareIconBtn: { padding: SPACING.xs },
  scrollContent: { padding: SPACING.lg },
  documentSheet: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  docHeader: { flexDirection: 'row', alignItems: 'center' },
  docLogoBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  docTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  docSub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  officialBadge: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm },
  officialText: { fontSize: 10, fontWeight: '800', color: COLORS.textInverted, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  fieldGroup: { flex: 1, marginBottom: SPACING.md },
  fieldLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginBottom: 4 },
  fieldValue: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  fieldValueBold: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  fieldValueHighlight: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  twoColumnRow: { flexDirection: 'row', gap: SPACING.lg },
  riskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  riskRowLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted },
  findingsBox: { marginTop: SPACING.xs, marginBottom: SPACING.md },
  findingItem: { flexDirection: 'row', marginBottom: 4 },
  bulletSymbol: { color: COLORS.textSecondary, marginRight: 6 },
  findingText: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, flex: 1, lineHeight: 19 },
  recommendationBox: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.xs },
  recommendationText: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, lineHeight: 19 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted },
  metaValue: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginTop: 2 },
});
