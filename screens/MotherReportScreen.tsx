import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useMother } from '../hooks/useMothers';
import { useUserProfile } from '../hooks/useUserProfile';
import { screeningRepository, careRepository } from '../db';
import { buildMotherReport, formatMotherReportAsText, MotherReport } from '../services/reports/motherReportGenerator';
import { ScreeningResult } from '../types/screening';
import { Visit, Referral } from '../types/domain';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const MotherReportScreen: React.FC<RootScreenProps<'MotherReport'>> = ({ navigation, route }) => {
  const { motherId } = route.params;
  const { mother, isLoading, error } = useMother(motherId);
  const { profile } = useUserProfile();
  const [report, setReport] = useState<MotherReport | null>(null);
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!mother) return;
    const [screenings, visits, referrals] = await Promise.all([
      screeningRepository.listForMother(motherId) as Promise<ScreeningResult[]>,
      careRepository.listVisits(motherId) as Promise<Visit[]>,
      careRepository.listReferrals(motherId) as Promise<Referral[]>,
    ]);
    setReport(buildMotherReport(mother, screenings, visits, referrals, profile?.name || 'ASHA Worker'));
  }, [mother, motherId, profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (isLoading || !report) return <LoadingState message="Compiling full health record..." />;
  if (error || !mother) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorState description={error || 'Mother record not found.'} onRetry={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    const text = formatMotherReportAsText(report);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        const nav = navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void>; clipboard?: { writeText: (t: string) => Promise<void> } };
        if (nav.share) {
          await nav.share({ title: `MaAI Health Summary - ${mother.name}`, text });
          return;
        } else if (nav.clipboard) {
          await nav.clipboard.writeText(text);
          setInfoDialog({ title: 'Copied', message: 'Full health summary copied to clipboard.' });
          return;
        }
      }
      await Share.share({ message: text, title: `MaAI Health Summary - ${mother.name}` });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Full Health Summary</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={handleShare} accessibilityLabel="Share report">
          <Ionicons name="share-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>{report.motherName}</Text>
          <Text style={styles.docSub}>Generated {report.generatedAt} by {report.generatedBy}</Text>
        </View>

        {report.sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.lines.map((line, i) => (
              <View key={i} style={styles.lineRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.lineText}>{line}</Text>
              </View>
            ))}
          </View>
        ))}

        <PrimaryButton title="Share Full Summary" onPress={handleShare} iconName="share-social" variant="primary" style={{ marginTop: SPACING.sm }} />

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
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  scrollContent: { padding: SPACING.lg },
  docHeader: { marginBottom: SPACING.lg },
  docTitle: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary },
  docSub: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 2 },
  sectionCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.primary, textTransform: 'uppercase', marginBottom: SPACING.sm },
  lineRow: { flexDirection: 'row', marginBottom: 4 },
  bullet: { color: COLORS.textMuted, marginRight: 6 },
  lineText: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, flex: 1, lineHeight: 19 },
});
