import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { ScreeningCard } from '../components/ScreeningCard';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

export const ScreenTab: React.FC = () => {
  const navigation = useAppNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Screening Hub" subtitle="Choose a screening method for a mother" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.infoBanner} onPress={() => navigation.navigate('AiPipelineInfo')}>
          <View style={styles.infoBannerLeft}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoBannerTitle}>How MaAI screening works</Text>
            <Text style={styles.infoBannerSub}>What is automated, what needs your confirmation, and the honest limits</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Text style={styles.introBannerText}>
          Every screening method feeds the same risk engine. Results always require your confirmation before they are saved to a mother&apos;s record.
        </Text>

        <ScreeningCard
          title="Vision — Pallor Screening"
          subtitle="Photograph the inner eyelid or nail bed to check for signs of anemia."
          iconName="camera"
          isCenterpiece
          onPress={() => navigation.navigate('CameraScreening', {})}
        />

        <View style={styles.cardGrid}>
          <ScreeningCard
            title="Records — Lab Report"
            subtitle="Scan or enter values from a lab slip. Extracted values need your confirmation."
            iconName="document-text"
            accentColor={COLORS.primaryDark}
            accentBg={COLORS.primaryLight}
            compact
            onPress={() => navigation.navigate('ReportScanner', {})}
          />
          <ScreeningCard
            title="Voice Check-in"
            subtitle="Ask about symptoms in Hindi or English and confirm what's detected."
            iconName="mic"
            accentColor={COLORS.voiceAccentDark}
            accentBg={COLORS.voiceAccentLight}
            compact
            onPress={() => navigation.navigate('VoiceCheckIn', {})}
          />
          <ScreeningCard
            title="Risk Assessment"
            subtitle="Manually enter obstetric history, BP, and Hb for a quick risk check."
            iconName="calculator-outline"
            accentColor={COLORS.accentDark}
            accentBg={COLORS.accentLight}
            compact
            onPress={() => navigation.navigate('RiskCheck', {})}
          />
          <ScreeningCard
            title="Danger Signs"
            subtitle="MoHFW/WHO red-flag checklist: headache, bleeding, convulsions."
            iconName="alert-circle-outline"
            accentColor={COLORS.riskHigh}
            accentBg={COLORS.riskHighLight}
            compact
            onPress={() => navigation.navigate('SymptomScreening', {})}
          />
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>IMPORTANT</Text>
          <Text style={styles.disclaimerText}>
            MaAI provides decision-support risk prioritization. It does not provide a medical diagnosis. Always confirm findings with clinical or laboratory testing.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  infoBannerLeft: { width: 24, alignItems: 'center' },
  infoBannerTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  infoBannerSub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  introBannerText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 18 },
  disclaimerBox: {
    backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  disclaimerTitle: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginBottom: 4 },
  disclaimerText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, lineHeight: 18 },
});
