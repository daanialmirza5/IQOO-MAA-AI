import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface StepInfo {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  whatItDoes: string;
  whatItIsNot: string;
}

const STEPS: StepInfo[] = [
  {
    icon: 'camera-outline',
    title: 'Vision — Pallor Screening',
    whatItDoes: 'Captures a real photo of the inner eyelid or nail bed. For the eyelid, real face/eye landmark detection (Google MediaPipe, running on-device in the browser) locates the eye and automatically crops to it before analysis, rather than just trusting the guide box. The photo is then checked for blur and lighting quality, and color-based biomarkers (an Erythema Index and related measures) are computed from the actual captured pixels.',
    whatItIsNot: 'This is a screening heuristic, not a trained or clinically validated diagnostic model — and the eye detection confirms *where* the eye is, it does not diagnose anything. Neither has been benchmarked against laboratory hemoglobin testing at scale. Eye detection currently runs on web only; on mobile in this build the guide box is the alignment aid instead.',
  },
  {
    icon: 'document-text-outline',
    title: 'Records — Lab Report',
    whatItDoes: 'On web, a photographed or uploaded report is read using real on-device OCR (Tesseract.js) running entirely in your browser. Every extracted value is shown to you for confirmation or correction before it is saved.',
    whatItIsNot: 'On this build, mobile (Android/iOS) does not run on-device OCR — real OCR requires a native module not included in this build. On mobile you attach the report photo as evidence and enter values manually instead of relying on an unreliable extraction.',
  },
  {
    icon: 'mic-outline',
    title: 'Voice Check-in',
    whatItDoes: "On web, your browser's built-in speech recognition transcribes what you say in Hindi or English. A transparent keyword dictionary then suggests symptoms, which you confirm or edit before anything is saved.",
    whatItIsNot: 'This is not a medical NLP model — it is straightforward, auditable keyword matching. On mobile, speech-to-text is not available in this build, so you pick symptoms from a quick-select list or type notes instead.',
  },
  {
    icon: 'calculator-outline',
    title: 'Risk Engine',
    whatItDoes: 'A transparent, deterministic rule engine combines clinical vitals, screening findings, reported symptoms, and trends over time into one risk level, with the specific reasons always shown. A reported danger sign (like severe headache or bleeding) always forces a HIGH result, regardless of the numeric score.',
    whatItIsNot: 'This is explicitly decision support, not a diagnosis. Every result should be confirmed with clinical or laboratory assessment.',
  },
];

export const AiPipelineModal: React.FC<RootScreenProps<'AiPipelineInfo'>> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How MaAI Screening Works</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: SPACING.md }}>
        <View style={styles.heroCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
          <Text style={styles.heroTitle}>Decision support, not diagnosis</Text>
          <Text style={styles.heroDesc}>
            MaAI helps frontline workers notice deterioration earlier by combining a camera screen, lab report values,
            reported symptoms, and trends over time. Every result is explainable, and nothing is saved to a mother record
            without your confirmation. This page explains exactly what is real and what each module&apos;s honest
            limitations are.
          </Text>
        </View>

        {STEPS.map((step) => (
          <View key={step.title} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIconBox}>
                <Ionicons name={step.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.stepLabel}>WHAT IT DOES</Text>
            <Text style={styles.stepText}>{step.whatItDoes}</Text>
            <Text style={[styles.stepLabel, { marginTop: SPACING.sm }]}>HONEST LIMITATIONS</Text>
            <Text style={styles.stepText}>{step.whatItIsNot}</Text>
          </View>
        ))}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            MaAI is built offline-first and stores all data locally on this device. No data is sent to any external
            server by this build. Always confirm high-risk findings with clinical or laboratory testing.
          </Text>
        </View>

        <PrimaryButton title="Close" onPress={() => navigation.goBack()} iconName="checkmark" variant="secondary" size="large" style={{ marginVertical: SPACING.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  iconBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  body: { flex: 1 },
  heroCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  heroTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, marginTop: SPACING.sm, marginBottom: 4 },
  heroDesc: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 20 },
  stepCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  stepIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, flex: 1 },
  stepLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted },
  stepText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 19, marginTop: 4 },
  disclaimerCard: {
    backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  disclaimerText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, lineHeight: 18 },
});
