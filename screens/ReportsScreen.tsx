import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RiskBadge } from '../components/RiskBadge';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { screeningRepository, careRepository } from '../db';
import { ScreeningResult } from '../types/screening';
import { RiskLevel } from '../types/mother';
import { formatDisplayDate } from '../utils/formatDate';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

type ReportEntry =
  | { kind: 'SCREENING'; id: string; motherId: string; motherName: string; date: string; risk: RiskLevel; label: string; screening: ScreeningResult }
  | { kind: 'REFERRAL'; id: string; motherId: string; motherName: string; date: string; risk: RiskLevel; label: string };

const SCREENING_TYPE_LABELS: Record<string, string> = {
  VISUAL_ANEMIA: 'Vision — Pallor Screening',
  REPORT_OCR: 'Lab Report OCR',
  VOICE_CHECKIN: 'Voice Check-in',
  PREGNANCY_RISK: 'Risk Assessment',
  SYMPTOM_CHECK: 'Danger Sign Checklist',
  COMBINED: 'Combined Screening',
};

type RiskFilter = 'ALL' | RiskLevel;
type TypeFilter = 'ALL' | 'SCREENING' | 'REFERRAL';

export const ReportsScreen: React.FC<RootScreenProps<'Reports'>> = ({ navigation }) => {
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [screenings, referrals] = await Promise.all([
        screeningRepository.listAll(),
        careRepository.listAllReferrals(),
      ]);
      const screeningEntries: ReportEntry[] = screenings.map((s) => ({
        kind: 'SCREENING',
        id: s.id,
        motherId: s.motherId,
        motherName: s.motherName,
        date: s.timestamp,
        risk: s.overallRisk,
        label: SCREENING_TYPE_LABELS[s.type] || s.type,
        screening: s,
      }));
      const referralEntries: ReportEntry[] = referrals.map((r) => ({
        kind: 'REFERRAL',
        id: r.id,
        motherId: r.motherId,
        motherName: r.motherName,
        date: r.createdAt,
        risk: r.riskLevel,
        label: 'Clinical Referral',
      }));
      const merged = [...screeningEntries, ...referralEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
      setEntries(merged);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (riskFilter !== 'ALL' && e.risk !== riskFilter) return false;
        if (typeFilter !== 'ALL' && e.kind !== typeFilter) return false;
        return true;
      }),
    [entries, riskFilter, typeFilter]
  );

  const handleOpen = (entry: ReportEntry) => {
    if (entry.kind === 'SCREENING') {
      navigation.navigate('ScreeningResultScreen', { screening: entry.screening, viewOnly: true });
    } else {
      navigation.navigate('ReferralSummary', { motherId: entry.motherId });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & History</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.xs }}>
          {(['ALL', 'SCREENING', 'REFERRAL'] as TypeFilter[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.filterChip, typeFilter === t && styles.filterChipActive]} onPress={() => setTypeFilter(t)}>
              <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t === 'ALL' ? 'All Types' : t === 'SCREENING' ? 'Screenings' : 'Referrals'}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as RiskFilter[]).map((r) => (
            <TouchableOpacity key={r} style={[styles.filterChip, riskFilter === r && styles.filterChipActive]} onPress={() => setRiskFilter(r)}>
              <Text style={[styles.filterChipText, riskFilter === r && styles.filterChipTextActive]}>{r === 'ALL' ? 'All Risk' : r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingState message="Loading reports..." />
      ) : filtered.length === 0 ? (
        <EmptyState iconName="document-text-outline" title="No reports found" description="Screenings and referrals across your caseload will appear here." />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filtered.map((entry) => (
            <TouchableOpacity key={`${entry.kind}-${entry.id}`} style={styles.entryCard} activeOpacity={0.8} onPress={() => handleOpen(entry)}>
              {entry.kind === 'SCREENING' && entry.screening.capturedImageUri ? (
                <Image source={{ uri: entry.screening.capturedImageUri }} style={styles.entryThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.entryThumb, styles.entryThumbPlaceholder]}>
                  <Ionicons name={entry.kind === 'REFERRAL' ? 'share-outline' : 'document-text-outline'} size={20} color={COLORS.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.entryLabel}>{entry.label}</Text>
                <Text style={styles.entryMother}>{entry.motherName}</Text>
                <Text style={styles.entryDate}>{formatDisplayDate(entry.date)}</Text>
              </View>
              <RiskBadge level={entry.risk} size="small" />
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  filterRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.cardSecondaryBg, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.textInverted },
  filterDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },
  scrollContent: { padding: SPACING.lg },
  entryCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
  entryThumb: { width: 52, height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.cardSecondaryBg },
  entryThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  entryLabel: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  entryMother: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 1 },
  entryDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
});
