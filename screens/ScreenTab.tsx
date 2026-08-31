import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreeningCard } from '../components/ScreeningCard';
import { COLORS, SPACING } from '../constants/theme';

interface ScreenTabProps {
  onOpenVisualAnemia: () => void;
  onOpenPregnancyRisk: () => void;
  onOpenSymptomScreening: () => void;
}

export const ScreenTab: React.FC<ScreenTabProps> = ({
  onOpenVisualAnemia,
  onOpenPregnancyRisk,
  onOpenSymptomScreening,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <AppHeader
        title="Maternal Screening"
        subtitle="Quick, non-invasive risk screening"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introBannerText}>
          Select a non-invasive screening tool below to record findings and calculate decision-support risk metrics.
        </Text>

        {/* Centerpiece: Visual Anemia Screening */}
        <ScreeningCard
          title="Visual Anemia Screening"
          subtitle="Position inner eyelid (palpebral conjunctiva) or nail bed inside the guide overlay to evaluate visual pallor pattern."
          badgeText="CAMERA AI PROTOTYPE"
          iconName="camera"
          isCenterpiece={true}
          onPress={onOpenVisualAnemia}
        />

        {/* Option B: Pregnancy Risk Check */}
        <ScreeningCard
          title="Pregnancy Risk Check"
          subtitle="Rule-based calculation combining gestational age, obstetric history, blood pressure, and clinical indicators."
          badgeText="RULE ENGINE"
          iconName="calculator-outline"
          isCenterpiece={false}
          onPress={onOpenPregnancyRisk}
        />

        {/* Option C: Symptom Screening */}
        <ScreeningCard
          title="Symptom Screening Checklist"
          subtitle="Visual high-contrast checklist for red-flag maternal danger signs like severe headache, swelling, or reduced movement."
          badgeText="DANGER SIGNS"
          iconName="list-outline"
          isCenterpiece={false}
          onPress={onOpenSymptomScreening}
        />

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>IMPORTANT MEDICAL NOTICE</Text>
          <Text style={styles.disclaimerText}>
            MaAI provides decision-support risk screening for frontline health workers. It does NOT provide a final clinical diagnosis. Always confirm findings with laboratory Hb testing and physician evaluation.
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
  scrollContent: {
    padding: SPACING.lg,
  },
  introBannerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
    fontWeight: '500',
  },
  disclaimerBox: {
    backgroundColor: COLORS.cardSecondaryBg,
    borderRadius: SPACING.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
