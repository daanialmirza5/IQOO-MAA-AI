import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreeningResult } from '../types/screening';
import { evaluateUnifiedMaternalRisk } from '../services/risk/maternalRiskEngine';
import { PrimaryButton } from '../components/PrimaryButton';
import { MotherPickerField } from '../components/MotherPickerField';
import { useMothers } from '../hooks/useMothers';
import { useSelectedMother } from '../hooks/useSelectedMother';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const RiskCheckModal: React.FC<RootScreenProps<'RiskCheck'>> = ({ navigation, route }) => {
  const { mothers } = useMothers();
  const { selectedMother, selectMother } = useSelectedMother(mothers, route.params?.motherId);

  const [bpInput, setBpInput] = useState('');
  const [hbInput, setHbInput] = useState('');
  const [complicationsInput, setComplicationsInput] = useState('');
  const [missedVisits, setMissedVisits] = useState('0');
  const [prefilledForMotherId, setPrefilledForMotherId] = useState<string | null>(null);

  // Prefill the editable form fields once when the selected mother changes
  // (not on every list refresh) — this is a deliberate "reset local state
  // when a logical input changes" effect, not a derivable-value sync.
  if (selectedMother && selectedMother.id !== prefilledForMotherId) {
    setPrefilledForMotherId(selectedMother.id);
    setBpInput(selectedMother.bloodPressure || '');
    setHbInput(selectedMother.hemoglobin ? String(selectedMother.hemoglobin) : '');
    setComplicationsInput(selectedMother.previousComplications || '');
  }

  const handleCalculate = () => {
    if (!selectedMother) return;

    const riskRes = evaluateUnifiedMaternalRisk({
      mother: selectedMother,
      customBp: bpInput || undefined,
      customHb: hbInput ? parseFloat(hbInput) : undefined,
      customSymptoms: complicationsInput
        ? [...(selectedMother.currentSymptoms || [])]
        : selectedMother.currentSymptoms,
      missedVisitsCount: parseInt(missedVisits, 10) || 0,
    });

    const screening: ScreeningResult = {
      id: `scr-${Date.now()}`,
      motherId: selectedMother.id,
      motherName: selectedMother.name,
      gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      type: 'PREGNANCY_RISK',
      overallRisk: riskRes.overallRisk,
      anemiaRisk: hbInput && parseFloat(hbInput) < 11.0 ? 'MEDIUM' : 'LOW',
      pregnancyRisk: riskRes.overallRisk,
      pregnancyRiskReasons: riskRes.whyFlagged,
      symptomRisk: 'LOW',
      reasons: riskRes.whyFlagged,
      recommendation: riskRes.recommendation,
      isPrototypeEngine: false,
      extractedHb: hbInput ? parseFloat(hbInput) : undefined,
      extractedBp: bpInput || undefined,
    };

    navigation.replace('ScreeningResultScreen', { screening });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Assessment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Mother</Text>
        <MotherPickerField mothers={mothers} selectedMother={selectedMother} onSelect={selectMother} />

        <View style={styles.labelRow}>
          <Ionicons name="heart-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.label}>Blood Pressure (mmHg)</Text>
        </View>
        <TextInput style={styles.input} placeholder="e.g. 138/90" placeholderTextColor={COLORS.textMuted} value={bpInput} onChangeText={setBpInput} accessibilityLabel="Blood pressure" />

        <View style={styles.labelRow}>
          <Ionicons name="water-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.label}>Known Hemoglobin (Hb g/dL)</Text>
        </View>
        <TextInput style={styles.input} placeholder="e.g. 9.8" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" value={hbInput} onChangeText={setHbInput} accessibilityLabel="Hemoglobin" />

        <View style={styles.labelRow}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.label}>Previous Pregnancy Complications</Text>
        </View>
        <TextInput style={styles.input} placeholder="e.g. History of pre-eclampsia or anemia" placeholderTextColor={COLORS.textMuted} value={complicationsInput} onChangeText={setComplicationsInput} accessibilityLabel="Previous complications" />

        <View style={styles.labelRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.label}>Missed Scheduled ANC Visits</Text>
        </View>
        <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={missedVisits} onChangeText={setMissedVisits} accessibilityLabel="Missed ANC visits" />

        <PrimaryButton
          title="Calculate Risk"
          onPress={handleCalculate}
          iconName="calculator"
          variant="primary"
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
  sectionTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, marginBottom: SPACING.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, marginBottom: 6 },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 50, fontSize: 16, color: COLORS.textPrimary,
  },
});
