import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother } from '../types/mother';
import { ScreeningResult } from '../types/screening';
import { calculatePregnancyRisk } from '../services/risk/pregnancyRiskEngine';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface RiskCheckModalProps {
  visible: boolean;
  mothers: Mother[];
  preSelectedMother?: Mother | null;
  onClose: () => void;
  onScreeningComplete: (result: ScreeningResult) => void;
}

export const RiskCheckModal: React.FC<RiskCheckModalProps> = ({
  visible,
  mothers,
  preSelectedMother,
  onClose,
  onScreeningComplete,
}) => {
  const [selectedMother, setSelectedMother] = useState<Mother | null>(
    preSelectedMother || mothers[0] || null
  );

  const [bpInput, setBpInput] = useState(selectedMother?.bloodPressure || '130/85');
  const [hbInput, setHbInput] = useState(selectedMother?.hemoglobin ? String(selectedMother.hemoglobin) : '10.2');
  const [complicationsInput, setComplicationsInput] = useState(selectedMother?.previousComplications || 'Previous mild postpartum anemia');
  const [missedVisits, setMissedVisits] = useState('1');

  const handleCalculate = () => {
    if (!selectedMother) return;

    const riskRes = calculatePregnancyRisk({
      age: selectedMother.age,
      gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
      gravida: selectedMother.gravida,
      para: selectedMother.para,
      previousComplications: complicationsInput,
      bloodPressure: bpInput,
      hemoglobin: hbInput ? parseFloat(hbInput) : undefined,
      missedVisitsCount: parseInt(missedVisits, 10) || 0,
      symptoms: selectedMother.currentSymptoms,
    });

    const screeningObj: ScreeningResult = {
      id: `scr-${Date.now()}`,
      motherId: selectedMother.id,
      motherName: selectedMother.name,
      gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      type: 'PREGNANCY_RISK',
      overallRisk: riskRes.overallRisk,
      anemiaRisk: hbInput && parseFloat(hbInput) < 11.0 ? 'MEDIUM' : 'LOW',
      pregnancyRisk: riskRes.overallRisk,
      pregnancyRiskReasons: riskRes.reasons,
      symptomRisk: 'LOW',
      reasons: riskRes.reasons,
      recommendation: riskRes.recommendedAction,
      isPrototypeEngine: false,
    };

    onScreeningComplete(screeningObj);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pregnancy Risk Assessment</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Mother Details</Text>

          {/* Mother selector display */}
          <View style={styles.motherBox}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
            <View style={{ marginLeft: SPACING.md }}>
              <Text style={styles.motherName}>
                {selectedMother ? selectedMother.name : 'Select Mother'}
              </Text>
              <Text style={styles.motherSub}>
                {selectedMother ? `${selectedMother.age} yrs • ${selectedMother.gestationalAgeWeeks} weeks pregnant` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Blood Pressure (mmHg)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 138/90"
            value={bpInput}
            onChangeText={setBpInput}
          />

          <Text style={styles.label}>Known Hemoglobin (Hb g/dL)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9.8"
            keyboardType="decimal-pad"
            value={hbInput}
            onChangeText={setHbInput}
          />

          <Text style={styles.label}>Previous Pregnancy Complications</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. History of pre-eclampsia or anemia"
            value={complicationsInput}
            onChangeText={setComplicationsInput}
          />

          <Text style={styles.label}>Missed Scheduled ANC Visits</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={missedVisits}
            onChangeText={setMissedVisits}
          />

          <PrimaryButton
            title="Calculate Pregnancy Risk"
            onPress={handleCalculate}
            iconName="calculator"
            variant="primary"
            size="large"
            style={{ marginTop: SPACING.xl }}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  motherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  motherName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  motherSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 50,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
