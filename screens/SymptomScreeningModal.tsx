import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother } from '../types/mother';
import { ScreeningResult } from '../types/screening';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface SymptomScreeningModalProps {
  visible: boolean;
  mothers: Mother[];
  preSelectedMother?: Mother | null;
  onClose: () => void;
  onScreeningComplete: (result: ScreeningResult) => void;
}

const DANGER_SYMPTOMS = [
  { id: 'headache', title: 'Severe headache', isUrgent: true },
  { id: 'vision', title: 'Blurred vision or spots', isUrgent: true },
  { id: 'swelling', title: 'Excessive swelling (face/hands)', isUrgent: true },
  { id: 'weakness', title: 'Severe weakness / fainting', isUrgent: false },
  { id: 'breathlessness', title: 'Breathlessness on mild exertion', isUrgent: false },
  { id: 'bleeding', title: 'Vaginal bleeding / fluid leakage', isUrgent: true },
  { id: 'fever', title: 'High fever with chills', isUrgent: true },
  { id: 'fetal', title: 'Reduced or absent fetal movement', isUrgent: true },
];

export const SymptomScreeningModal: React.FC<SymptomScreeningModalProps> = ({
  visible,
  mothers,
  preSelectedMother,
  onClose,
  onScreeningComplete,
}) => {
  const [selectedMother] = useState<Mother | null>(
    preSelectedMother || mothers[0] || null
  );

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const toggleSymptom = (title: string) => {
    if (selectedSymptoms.includes(title)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== title));
    } else {
      setSelectedSymptoms([...selectedSymptoms, title]);
    }
  };

  const hasUrgentSymptom = selectedSymptoms.some((s) =>
    DANGER_SYMPTOMS.find((d) => d.title === s)?.isUrgent
  );

  const handleEvaluate = () => {
    if (!selectedMother) return;

    const overallRisk = hasUrgentSymptom ? 'HIGH' : selectedSymptoms.length > 0 ? 'MEDIUM' : 'LOW';

    const screeningObj: ScreeningResult = {
      id: `scr-${Date.now()}`,
      motherId: selectedMother.id,
      motherName: selectedMother.name,
      gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      type: 'SYMPTOM_CHECK',
      overallRisk,
      anemiaRisk: 'LOW',
      pregnancyRisk: overallRisk,
      symptomRisk: overallRisk,
      symptomsChecked: selectedSymptoms,
      reasons:
        selectedSymptoms.length > 0
          ? selectedSymptoms.map((s) => `Reported symptom: ${s}`)
          : ['No acute danger symptoms selected'],
      recommendation: hasUrgentSymptom
        ? 'URGENT ATTENTION: Immediate clinical evaluation recommended at nearest healthcare facility.'
        : 'Routine symptom monitoring during weekly ASHA visit.',
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
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Screening Checklist</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionSubtitle}>
            Tap to check any active symptoms reported by mother:
          </Text>

          {/* Urgent Warning Box if danger sign checked */}
          {hasUrgentSymptom && (
            <View style={styles.urgentAlertBox}>
              <Ionicons name="warning" size={24} color={COLORS.riskHigh} />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.urgentAlertTitle}>URGENT ATTENTION REQUIRED</Text>
                <Text style={styles.urgentAlertSub}>
                  Critical maternal danger sign selected. Immediate clinical referral required.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.checklist}>
            {DANGER_SYMPTOMS.map((item) => {
              const isChecked = selectedSymptoms.includes(item.title);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.checkCard,
                    isChecked && styles.checkCardActive,
                    isChecked && item.isUrgent && styles.checkCardUrgent,
                  ]}
                  onPress={() => toggleSymptom(item.title)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkLeft}>
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={
                        isChecked
                          ? item.isUrgent
                            ? COLORS.riskHigh
                            : COLORS.primary
                          : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.checkTitle,
                        isChecked && styles.checkTitleActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>

                  {item.isUrgent && (
                    <View style={styles.urgentTag}>
                      <Text style={styles.urgentTagText}>RED FLAG</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <PrimaryButton
            title="Complete Symptom Checklist"
            onPress={handleEvaluate}
            iconName="checkmark-circle"
            variant={hasUrgentSymptom ? 'danger' : 'primary'}
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
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  urgentAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.riskHighBg,
    borderColor: COLORS.riskHighBorder,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  urgentAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.riskHigh,
  },
  urgentAlertSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checklist: {
    gap: SPACING.sm,
  },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  checkCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  checkCardUrgent: {
    borderColor: COLORS.riskHighBorder,
    backgroundColor: COLORS.riskHighBg,
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  checkTitleActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  urgentTag: {
    backgroundColor: COLORS.riskHighBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.riskHighBorder,
  },
  urgentTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.riskHigh,
  },
});
