import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother, LongitudinalReading, RiskLevel } from '../types/mother';
import { formatDisplayDate } from '../utils/formatDate';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface PregnancyJourneyTimelineProps {
  mother: Mother;
  onSelectReading?: (reading: LongitudinalReading) => void;
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'HIGH': return COLORS.riskHigh;
    case 'MEDIUM': return COLORS.riskMedium;
    default: return COLORS.riskLow;
  }
}

export const PregnancyJourneyTimeline: React.FC<PregnancyJourneyTimelineProps> = ({ mother, onSelectReading }) => {
  const readings: LongitudinalReading[] = mother.readings || [];
  const currentWeek = mother.gestationalAgeWeeks || 0;
  const nextMilestoneWeek = currentWeek < 32 ? 32 : currentWeek < 36 ? 36 : 40;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.sectionTitle}>Pregnancy Journey</Text>
          <View style={styles.trajectoryTag}>
            <Text style={styles.trajectoryTagText}>TRAJECTORY</Text>
          </View>
        </View>
        <Text style={styles.tagline}>Risk does not start at red — tracking change across visits, not just the latest reading</Text>
      </View>

      {readings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="analytics-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No readings recorded yet. A trajectory will build as vitals are added from ANC visits or screenings.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollTrack}>
            {readings.map((reading, index) => {
              const prev = index > 0 ? readings[index - 1] : null;
              const hbDiff = prev && prev.hemoglobin && reading.hemoglobin ? reading.hemoglobin - prev.hemoglobin : 0;
              const isDeclining = hbDiff <= -0.4;
              const isLast = index === readings.length - 1;

              return (
                <React.Fragment key={reading.id || index}>
                  <TouchableOpacity
                    style={[styles.milestoneCard, isLast && styles.milestoneCardActive, { borderTopColor: getRiskColor(reading.riskLevel) }]}
                    activeOpacity={0.8}
                    onPress={() => onSelectReading && onSelectReading(reading)}
                    accessibilityLabel={`Week ${reading.week}, ${reading.riskLevel} risk`}
                  >
                    <View style={styles.weekHeader}>
                      <View style={[styles.statusDot, { backgroundColor: getRiskColor(reading.riskLevel) }]} />
                      <Text style={styles.weekTitle}>Week {reading.week}</Text>
                    </View>
                    <Text style={styles.readingDate}>{formatDisplayDate(reading.date)}</Text>

                    <View style={styles.vitalsBox}>
                      <View>
                        <Text style={styles.vitalMiniLabel}>Hb Level</Text>
                        <View style={styles.vitalValueRow}>
                          <Text style={[styles.vitalNum, reading.hemoglobin && reading.hemoglobin < 10.0 ? { color: COLORS.riskHigh } : null]}>
                            {reading.hemoglobin ? `${reading.hemoglobin}` : '--'}
                          </Text>
                          <Text style={styles.vitalUnit}>g/dL</Text>
                          {isDeclining && (
                            <View style={styles.trendArrowBox}>
                              <Ionicons name="arrow-down" size={12} color={COLORS.riskHigh} />
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.vitalMiniLabel}>Blood Pressure</Text>
                        <Text style={styles.bpValue}>{reading.bloodPressure || '--/--'}</Text>
                      </View>
                    </View>

                    <View style={[styles.riskPill, { backgroundColor: reading.riskLevel === 'HIGH' ? COLORS.riskHighLight : reading.riskLevel === 'MEDIUM' ? COLORS.riskMediumLight : COLORS.riskLowLight }]}>
                      <Text style={[styles.riskPillText, { color: getRiskColor(reading.riskLevel) }]}>{reading.riskLevel}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.connectorContainer}>
                    <View style={[styles.connectorLine, isDeclining ? { borderColor: COLORS.riskMedium, borderStyle: 'dashed' } : null]} />
                    {isDeclining && (
                      <View style={styles.trendDeltaBadge}>
                        <Text style={styles.trendDeltaText}>{hbDiff.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </React.Fragment>
              );
            })}

            <View style={[styles.milestoneCard, styles.milestoneUpcoming]}>
              <View style={styles.weekHeader}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.border }]} />
                <Text style={[styles.weekTitle, { color: COLORS.textMuted }]}>Week {nextMilestoneWeek}</Text>
              </View>
              <Text style={styles.readingDate}>Scheduled Next</Text>
              <View style={[styles.vitalsBox, { justifyContent: 'center', alignItems: 'center', minHeight: 64 }]}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} />
                <Text style={styles.upcomingPrompt}>ANC Due Check</Text>
              </View>
              <View style={[styles.riskPill, { backgroundColor: COLORS.borderLight }]}>
                <Text style={[styles.riskPillText, { color: COLORS.textMuted }]}>UPCOMING</Text>
              </View>
            </View>
          </ScrollView>

          {mother.hbTrend === 'DECLINING' && (
            <View style={styles.insightBanner}>
              <Ionicons name="trending-down" size={18} color={COLORS.riskMedium} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.insightTitle}>Declining trajectory detected</Text>
                <Text style={styles.insightBody}>
                  Hemoglobin has dropped across the last readings shown above. Follow-up is recommended before this reaches a critical threshold.
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  headerRow: { marginBottom: SPACING.md },
  titleWithBadge: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  trajectoryTag: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm, marginLeft: SPACING.xs, borderWidth: 1, borderColor: COLORS.primaryBorder },
  trajectoryTagText: { ...TYPOGRAPHY.overline, color: COLORS.primaryDark },
  tagline: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 3, lineHeight: 16 },
  emptyBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, padding: SPACING.md },
  emptyText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, flex: 1, lineHeight: 16 },
  scrollTrack: { paddingVertical: SPACING.xs, alignItems: 'center' },
  milestoneCard: { width: 140, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderTopWidth: 3, ...SHADOWS.small },
  milestoneCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  milestoneUpcoming: { borderTopWidth: 1, borderStyle: 'dashed', backgroundColor: COLORS.surfaceSunken },
  weekHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  weekTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  readingDate: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, marginBottom: 6 },
  vitalsBox: { backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.sm, padding: 6, marginBottom: 8 },
  vitalMiniLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  vitalValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  vitalNum: { fontSize: 15, fontWeight: '900', color: COLORS.textPrimary },
  vitalUnit: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginLeft: 2 },
  trendArrowBox: { backgroundColor: COLORS.riskHighLight, borderRadius: 8, padding: 2, marginLeft: 4 },
  bpValue: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  upcomingPrompt: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },
  riskPill: { borderRadius: RADIUS.sm, paddingVertical: 3, alignItems: 'center', justifyContent: 'center' },
  riskPillText: { fontSize: 10, fontWeight: '800' },
  connectorContainer: { width: 32, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  connectorLine: { width: 32, height: 2, backgroundColor: COLORS.border },
  trendDeltaBadge: { position: 'absolute', top: -12, backgroundColor: COLORS.riskMediumLight, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: COLORS.riskMedium },
  trendDeltaText: { fontSize: 9, fontWeight: '800', color: COLORS.riskMedium },
  insightBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.riskMediumBg, borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.riskMediumBorder },
  insightTitle: { ...TYPOGRAPHY.label, color: COLORS.riskMedium },
  insightBody: { ...TYPOGRAPHY.caption, color: COLORS.textPrimary, marginTop: 2, lineHeight: 16 },
});
