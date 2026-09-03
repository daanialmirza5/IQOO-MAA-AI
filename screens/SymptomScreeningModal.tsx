import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreeningResult } from '../types/screening';
import { PrimaryButton } from '../components/PrimaryButton';
import { MotherPickerField } from '../components/MotherPickerField';
import { useMothers } from '../hooks/useMothers';
import { useSelectedMother } from '../hooks/useSelectedMother';
import { DANGER_SIGNS } from '../services/risk/maternalRiskEngine';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

const CHECKLIST_SYMPTOMS: { id: string; title: string; isDangerSign: boolean }[] = [
  { id: 'headache', title: 'Severe headache', isDangerSign: true },
  { id: 'vision', title: 'Blurred vision', isDangerSign: true },
  { id: 'swelling', title: 'Excessive swelling', isDangerSign: true },
  { id: 'weakness', title: 'Severe weakness / fainting', isDangerSign: false },
  { id: 'breathlessness', title: 'Breathlessness on mild exertion', isDangerSign: false },
  { id: 'bleeding', title: 'Vaginal bleeding', isDangerSign: true },
  { id: 'fever', title: 'High fever', isDangerSign: true },
  { id: 'fetal', title: 'Reduced fetal movement', isDangerSign: true },
  { id: 'convulsions', title: 'Convulsions', isDangerSign: true },
  { id: 'abdominal', title: 'Severe abdominal pain', isDangerSign: true },
];

export const SymptomScreeningModal: React.FC<RootScreenProps<'SymptomScreening'>> = ({ navigation, route }) => {
  const { mothers } = useMothers();
  const { selectedMother, selectMother } = useSelectedMother(mothers, route.params?.motherId);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const toggleSymptom = (title: string) => {
    setSelectedSymptoms((prev) => (prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]));
  };

  const hasDangerSign = selectedSymptoms.some((s) => (DANGER_SIGNS as readonly string[]).includes(s));

  const handleEvaluate = () => {
    if (!selectedMother) return;
    const overallRisk = hasDangerSign ? 'HIGH' : selectedSymptoms.length > 0 ? 'MEDIUM' : 'LOW';

    const screening: ScreeningResult = {
      id: `scr-${Date.now()}`,
      motherId: selectedMother.id,
      motherName: selectedMother.name,
      gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      type: 'SYMPTOM_CHECK',
      overallRisk,
      anemiaRisk: 'LOW',
      pregnancyRisk: overallRisk,
      symptomRisk: overallRisk,
      symptomsChecked: selectedSymptoms,
      reasons: selectedSymptoms.length > 0 ? selectedSymptoms.map((s) => `Reported symptom: ${s}`) : ['No danger symptoms selected'],
      recommendation: hasDangerSign
        ? 'Danger sign reported. Immediate clinical evaluation recommended at the nearest healthcare facility.'
        : 'Routine symptom monitoring during the next scheduled visit.',
      isPrototypeEngine: false,
      extractedSymptoms: selectedSymptoms,
    };

    navigation.replace('ScreeningResultScreen', { screening });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danger Sign Checklist</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotherPickerField mothers={mothers} selectedMother={selectedMother} onSelect={selectMother} />

        <Text style={styles.sectionSubtitle}>Tap any symptom currently reported by the mother:</Text>

        {hasDangerSign && (
          <View style={styles.urgentAlertBox} accessibilityLiveRegion="polite">
            <Ionicons name="warning" size={22} color={COLORS.riskHigh} />
            <View style={{ marginLeft: SPACING.md, flex: 1 }}>
              <Text style={styles.urgentAlertTitle}>Urgent attention required</Text>
              <Text style={styles.urgentAlertSub}>A maternal danger sign was selected. Immediate clinical referral is recommended.</Text>
            </View>
          </View>
        )}

        <View style={styles.checklist}>
          {CHECKLIST_SYMPTOMS.map((item) => {
            const isChecked = selectedSymptoms.includes(item.title);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.checkCard, isChecked && styles.checkCardActive, isChecked && item.isDangerSign && styles.checkCardUrgent]}
                onPress={() => toggleSymptom(item.title)}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
                accessibilityLabel={item.title}
              >
                <View style={styles.checkLeft}>
                  <Ionicons name={isChecked ? 'checkbox' : 'square-outline'} size={22} color={isChecked ? (item.isDangerSign ? COLORS.riskHigh : COLORS.primary) : COLORS.textMuted} />
                  <Text style={[styles.checkTitle, isChecked && styles.checkTitleActive]}>{item.title}</Text>
                </View>
                {item.isDangerSign && (
                  <View style={styles.dangerTag}>
                    <Text style={styles.dangerTagText}>RED FLAG</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          title="Complete Checklist"
          onPress={handleEvaluate}
          iconName="checkmark-circle"
          variant={hasDangerSign ? 'danger' : 'primary'}
          size="large"
          disabled={!selectedMother}
          style={{ marginTop: SPACING.xl }}
        />

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
  sectionSubtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.md },
  urgentAlertBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.riskHighBg, borderColor: COLORS.riskHighBorder,
    borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg,
  },
  urgentAlertTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.riskHigh },
  urgentAlertSub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  checklist: { gap: SPACING.sm },
  checkCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, minHeight: 56, ...SHADOWS.small,
  },
  checkCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  checkCardUrgent: { borderColor: COLORS.riskHighBorder, backgroundColor: COLORS.riskHighBg },
  checkLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.md },
  checkTitle: { ...TYPOGRAPHY.bodyStrong, fontSize: 15, color: COLORS.textPrimary },
  checkTitleActive: { fontWeight: '800' },
  dangerTag: { backgroundColor: COLORS.riskHighBg, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.riskHighBorder },
  dangerTagText: { fontSize: 9, fontWeight: '800', color: COLORS.riskHigh },
});
