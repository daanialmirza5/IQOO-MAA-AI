import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TimelineEvent } from '../types/mother';
import { Visit, Referral } from '../types/domain';
import { ScreeningResult } from '../types/screening';
import { RiskBadge } from '../components/RiskBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { PregnancyJourneyTimeline } from '../components/PregnancyJourneyTimeline';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useMother } from '../hooks/useMothers';
import { formatDisplayDate } from '../utils/formatDate';
import { screeningRepository, careRepository, motherRepository } from '../db';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

const SOURCE_LABELS: Record<string, string> = {
  REPORT_OCR: 'Lab report (OCR)',
  CLINICAL_VISIT: 'Clinical visit',
  VISUAL_SCREENING: 'Camera screening',
  VOICE_CHECKIN: 'Voice check-in',
  REGISTRATION: 'Registration',
};

const SCREENING_TYPE_LABELS: Record<string, string> = {
  VISUAL_ANEMIA: 'Vision — Pallor Screening',
  REPORT_OCR: 'Lab Report OCR',
  VOICE_CHECKIN: 'Voice Check-in',
  PREGNANCY_RISK: 'Risk Assessment',
  SYMPTOM_CHECK: 'Danger Sign Checklist',
  COMBINED: 'Combined Screening',
};

const VISIT_TYPE_LABELS: Record<Visit['visitType'], string> = {
  ANC: 'ANC Visit',
  HOME_VISIT: 'Home Visit',
  FOLLOW_UP: 'Follow-up',
  OTHER: 'Other',
};

const getTimelineIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'REGISTRATION': return 'person-add-outline';
    case 'ANC_VISIT': return 'medical-outline';
    case 'SCREENING': return 'camera-outline';
    case 'REPORT_OCR': return 'document-text-outline';
    case 'VOICE_SYMPTOM': return 'mic-outline';
    case 'FOLLOW_UP_MISSED': return 'time-outline';
    case 'RISK_CHANGED': return 'alert-circle-outline';
    case 'REFERRAL_CREATED': return 'share-outline';
    default: return 'ellipse-outline';
  }
};

export const MotherDetailScreen: React.FC<RootScreenProps<'MotherDetail'>> = ({ navigation, route }) => {
  const { motherId } = route.params;
  const { mother, isLoading, error, refresh } = useMother(motherId);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoggingVisit, setIsLoggingVisit] = useState(false);

  const loadCareRecords = useCallback(async () => {
    const [s, v, r] = await Promise.all([
      screeningRepository.listForMother(motherId),
      careRepository.listVisits(motherId),
      careRepository.listReferrals(motherId),
    ]);
    setScreenings(s);
    setVisits(v);
    setReferrals(r);
  }, [motherId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadCareRecords();
    }, [refresh, loadCareRecords])
  );

  const handleLogVisit = async (visitType: Visit['visitType']) => {
    setIsLoggingVisit(true);
    try {
      await careRepository.addVisit({ motherId, visitType });
      await motherRepository.addActivityEvent(motherId, {
        title: `${VISIT_TYPE_LABELS[visitType]} Logged`,
        description: `${VISIT_TYPE_LABELS[visitType]} recorded for this mother.`,
        type: 'ANC_VISIT',
      });
      await Promise.all([refresh(), loadCareRecords()]);
    } finally {
      setIsLoggingVisit(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading mother profile..." />;
  if (error || !mother) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorState description={error || 'Mother record not found.'} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const timelineEvents: TimelineEvent[] = mother.timeline || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mother Profile</Text>
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => navigation.navigate('ReferralSummary', { motherId: mother.id })} accessibilityLabel="Generate referral">
          <Ionicons name="share-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{mother.name.charAt(0)}</Text>
          </View>
          <Text style={styles.motherName}>{mother.name}</Text>
          <Text style={styles.motherSubText}>{mother.age} years old · {mother.village}</Text>

          <View style={styles.riskBadgeContainer}>
            <RiskBadge level={mother.riskLevel} size="large" />
          </View>

          {mother.riskReason && (
            <View style={styles.riskReasonBox}>
              <Ionicons name="information-circle" size={16} color={COLORS.primaryDark} />
              <Text style={styles.riskReasonText}>{mother.riskReason}</Text>
            </View>
          )}
        </View>

        <Text style={styles.actionSectionTitle}>Screen This Mother</Text>
        <View style={styles.multiActionRow}>
          <TouchableOpacity style={styles.miniActionBtn} onPress={() => navigation.navigate('CameraScreening', { motherId: mother.id })} activeOpacity={0.8}>
            <View style={[styles.miniActionIconCircle, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="camera" size={18} color={COLORS.accentDark} />
            </View>
            <Text style={styles.miniActionTitle}>Vision</Text>
            <Text style={styles.miniActionSub}>Pallor Check</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniActionBtn} onPress={() => navigation.navigate('ReportScanner', { motherId: mother.id })} activeOpacity={0.8}>
            <View style={[styles.miniActionIconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="document-text" size={18} color={COLORS.primaryDark} />
            </View>
            <Text style={styles.miniActionTitle}>Records</Text>
            <Text style={styles.miniActionSub}>Lab Slip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniActionBtn} onPress={() => navigation.navigate('VoiceCheckIn', { motherId: mother.id })} activeOpacity={0.8}>
            <View style={[styles.miniActionIconCircle, { backgroundColor: COLORS.voiceAccentLight }]}>
              <Ionicons name="mic" size={18} color={COLORS.voiceAccentDark} />
            </View>
            <Text style={styles.miniActionTitle}>Voice</Text>
            <Text style={styles.miniActionSub}>Check-in</Text>
          </TouchableOpacity>
        </View>

        <PregnancyJourneyTimeline mother={mother} />

        <View style={{ marginBottom: SPACING.md, flexDirection: 'row', gap: SPACING.sm }}>
          <PrimaryButton title="Referral" onPress={() => navigation.navigate('ReferralSummary', { motherId: mother.id })} iconName="share" variant="primary" style={{ flex: 1 }} />
          <PrimaryButton title="Full Report" onPress={() => navigation.navigate('MotherReport', { motherId: mother.id })} iconName="document-text" variant="secondary" style={{ flex: 1 }} />
        </View>

        <Text style={styles.sectionTitle}>Gestational & Obstetric History</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>GESTATIONAL AGE</Text>
            <Text style={styles.infoValueHighlight}>{mother.gestationalAgeWeeks} Weeks</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>EXPECTED DELIVERY</Text>
            <Text style={styles.infoValue}>{mother.expectedDeliveryDate || 'Not set'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>OBSTETRIC HISTORY</Text>
            <Text style={styles.infoValue}>Gravida {mother.gravida} · Para {mother.para}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>BLOOD GROUP</Text>
            <Text style={styles.infoValue}>{mother.bloodGroup || 'Not Tested'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Vitals & Screening Metrics</Text>
        <View style={styles.vitalsCard}>
          <View style={styles.vitalRow}>
            <View style={styles.vitalLeft}>
              <Ionicons name="water-outline" size={18} color={COLORS.accent} />
              <Text style={styles.vitalLabel}>Hemoglobin (Hb)</Text>
            </View>
            <Text style={[styles.vitalValue, mother.hemoglobin && mother.hemoglobin < 10.0 ? { color: COLORS.riskHigh } : null]}>
              {mother.hemoglobin ? `${mother.hemoglobin} g/dL` : 'Not recorded'}
            </Text>
          </View>
          <View style={styles.vitalRow}>
            <View style={styles.vitalLeft}>
              <Ionicons name="heart-outline" size={18} color={COLORS.primary} />
              <Text style={styles.vitalLabel}>Blood Pressure</Text>
            </View>
            <Text style={styles.vitalValue}>{mother.bloodPressure || 'Not recorded'}</Text>
          </View>
          <View style={[styles.vitalRow, { borderBottomWidth: 0 }]}>
            <View style={styles.vitalLeft}>
              <Ionicons name="scale-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.vitalLabel}>Weight</Text>
            </View>
            <Text style={styles.vitalValue}>{mother.weight ? `${mother.weight} kg` : 'N/A'}</Text>
          </View>
        </View>

        {mother.readings && mother.readings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Vitals History</Text>
            <Text style={styles.sectionSubtitle}>Every recorded value with its source — nothing here is inferred</Text>
            <View style={styles.timelineCard}>
              {[...mother.readings].reverse().slice(0, 6).map((r) => (
                <View key={r.id} style={styles.readingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.readingValues}>
                      {r.hemoglobin != null ? `Hb ${r.hemoglobin} g/dL` : ''}
                      {r.hemoglobin != null && r.bloodPressure ? '  ·  ' : ''}
                      {r.bloodPressure ? `BP ${r.bloodPressure}` : ''}
                      {!r.hemoglobin && !r.bloodPressure ? 'No lab values recorded' : ''}
                    </Text>
                    <Text style={styles.readingMeta}>
                      Week {r.week} · {formatDisplayDate(r.date)} · Source: {SOURCE_LABELS[r.source] || r.source}
                    </Text>
                  </View>
                  <RiskBadge level={r.riskLevel} size="small" />
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Screening History</Text>
        </View>
        {screenings.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyTimelineText}>No screenings captured for this mother yet.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
            {screenings.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.screeningThumbCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ScreeningResultScreen', { screening: s, viewOnly: true })}
              >
                {s.capturedImageUri ? (
                  <Image source={{ uri: s.capturedImageUri }} style={styles.screeningThumbImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.screeningThumbImg, styles.screeningThumbPlaceholder]}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.textMuted} />
                  </View>
                )}
                <View style={styles.screeningThumbFooter}>
                  <RiskBadge level={s.overallRisk} size="small" />
                </View>
                <Text style={styles.screeningThumbType} numberOfLines={1}>{SCREENING_TYPE_LABELS[s.type] || s.type}</Text>
                <Text style={styles.screeningThumbDate} numberOfLines={1}>{formatDisplayDate(s.timestamp)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Visits & Referrals</Text>
        </View>
        <View style={styles.multiActionRow}>
          <TouchableOpacity style={styles.logVisitBtn} disabled={isLoggingVisit} onPress={() => handleLogVisit('ANC')}>
            <Ionicons name="medical-outline" size={14} color={COLORS.primary} />
            <Text style={styles.logVisitBtnText}>Log ANC Visit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logVisitBtn} disabled={isLoggingVisit} onPress={() => handleLogVisit('HOME_VISIT')}>
            <Ionicons name="home-outline" size={14} color={COLORS.primary} />
            <Text style={styles.logVisitBtnText}>Log Home Visit</Text>
          </TouchableOpacity>
        </View>
        {visits.length === 0 && referrals.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyTimelineText}>No visits or referrals recorded yet.</Text>
          </View>
        ) : (
          <View style={styles.timelineCard}>
            {referrals.map((r) => (
              <View key={r.id} style={styles.readingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.readingValues}>Referral generated · {r.riskLevel} risk</Text>
                  <Text style={styles.readingMeta}>{formatDisplayDate(r.createdAt)} · {r.recommendation}</Text>
                </View>
              </View>
            ))}
            {visits.map((v) => (
              <View key={v.id} style={styles.readingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.readingValues}>{VISIT_TYPE_LABELS[v.visitType]}</Text>
                  <Text style={styles.readingMeta}>{formatDisplayDate(v.createdAt)}{v.notes ? ` · ${v.notes}` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Activity Log</Text>
        <Text style={styles.sectionSubtitle}>Every registration, visit, and screening event recorded for this mother</Text>
        {timelineEvents.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyTimelineText}>No activity recorded yet.</Text>
          </View>
        ) : (
          <View style={styles.timelineCard}>
            {timelineEvents.map((item, index) => {
              const isLast = index === timelineEvents.length - 1;
              return (
                <View key={item.id || index} style={styles.timelineItem}>
                  <View style={styles.timelineLeftColumn}>
                    <View style={styles.timelineIconBubble}>
                      <Ionicons name={getTimelineIcon(item.type)} size={16} color={COLORS.primary} />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeaderRow}>
                      <Text style={styles.timelineDate}>{formatDisplayDate(item.date)}</Text>
                      {item.riskLevel && <RiskBadge level={item.riskLevel} size="small" />}
                    </View>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineDesc}>{item.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>Field Contact Information</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${mother.phone.replace(/\s/g, '')}`)}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <Text style={styles.contactText}>{mother.phone}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactRow, { marginTop: SPACING.sm }]} onPress={() => Linking.openURL(`tel:${mother.emergencyContact.replace(/[^\d+]/g, '')}`)}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.contactText}>Emergency: {mother.emergencyContact}</Text>
          </TouchableOpacity>
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
  actionIconBtn: { padding: SPACING.xs },
  scrollContent: { padding: SPACING.lg },
  heroCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, alignItems: 'center',
    justifyContent: 'center', marginBottom: SPACING.sm, borderWidth: 2, borderColor: COLORS.primaryBorder,
  },
  avatarText: { fontSize: 26, fontWeight: '900', color: COLORS.primaryDark },
  motherName: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary },
  motherSubText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 2 },
  riskBadgeContainer: { marginTop: SPACING.md },
  riskReasonBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginTop: SPACING.md, gap: 6,
  },
  riskReasonText: { ...TYPOGRAPHY.caption, color: COLORS.primaryDark, flex: 1 },
  actionSectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: SPACING.xs },
  multiActionRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md },
  miniActionBtn: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
  miniActionIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  miniActionTitle: { ...TYPOGRAPHY.caption, fontWeight: '800', color: COLORS.textPrimary },
  miniActionSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.xs },
  sectionSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: -SPACING.xs, marginBottom: SPACING.sm },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  infoCard: { width: '48%', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  infoLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted },
  infoValue: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginTop: 4 },
  infoValueHighlight: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginTop: 2 },
  vitalsCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  vitalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  vitalLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  vitalLabel: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  vitalValue: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  emptyTimeline: { backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg },
  emptyTimelineText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  timelineCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  timelineItem: { flexDirection: 'row', marginBottom: SPACING.md },
  timelineLeftColumn: { alignItems: 'center', marginRight: SPACING.md, width: 28 },
  timelineIconBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
  timelineContent: { flex: 1, backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, padding: SPACING.md },
  timelineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  timelineDate: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  timelineTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  timelineDesc: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  contactCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  contactText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  readingValues: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  readingMeta: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 2 },
  screeningThumbCard: { width: 130, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm, padding: SPACING.xs, position: 'relative', ...SHADOWS.small },
  screeningThumbImg: { width: '100%', height: 90, borderRadius: RADIUS.md, backgroundColor: COLORS.cardSecondaryBg },
  screeningThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  screeningThumbFooter: { position: 'absolute', top: 6, right: 6 },
  screeningThumbType: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textPrimary, marginTop: 6, paddingHorizontal: 4 },
  screeningThumbDate: { fontSize: 10, color: COLORS.textMuted, paddingHorizontal: 4, marginBottom: 4 },
  logVisitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primaryBorder },
  logVisitBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.primaryDark },
});
