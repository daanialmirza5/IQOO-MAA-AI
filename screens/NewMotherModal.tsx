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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother, RiskLevel } from '../types/mother';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface NewMotherModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveMother: (mother: Mother) => void;
}

export const NewMotherModal: React.FC<NewMotherModalProps> = ({
  visible,
  onClose,
  onSaveMother,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('Demo Village');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [gestationalWeeks, setGestationalWeeks] = useState('');
  const [edd, setEdd] = useState('2026-12-15');
  const [gravida, setGravida] = useState('1');
  const [para, setPara] = useState('0');
  const [previousComplications, setPreviousComplications] = useState('');

  const [hemoglobin, setHemoglobin] = useState('');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [weight, setWeight] = useState('');
  const [existingConditions, setExistingConditions] = useState('');
  const [currentSymptoms, setCurrentSymptoms] = useState('');

  const resetForm = () => {
    setStep(1);
    setName('');
    setAge('');
    setPhone('');
    setVillage('Demo Village');
    setEmergencyContact('');
    setGestationalWeeks('');
    setPreviousComplications('');
    setHemoglobin('');
    setBloodPressure('120/80');
    setWeight('');
    setExistingConditions('');
    setCurrentSymptoms('');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Required Field', 'Please enter the mother\'s full name.');
        return;
      }
      if (!age.trim() || isNaN(Number(age))) {
        Alert.alert('Invalid Age', 'Please enter a valid age in years.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!gestationalWeeks.trim() || isNaN(Number(gestationalWeeks))) {
        Alert.alert('Required Field', 'Please enter gestational age in weeks.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSave = () => {
    let riskLevel: RiskLevel = 'LOW';
    let riskReason = 'Initial registration completed.';

    const hbVal = hemoglobin ? parseFloat(hemoglobin) : undefined;
    if (hbVal && hbVal < 10.0) {
      riskLevel = 'HIGH';
      riskReason = 'Possible anemia risk — low Hb recorded on registration.';
    } else if (previousComplications.trim().length > 0) {
      riskLevel = 'MEDIUM';
      riskReason = 'Previous pregnancy complication noted.';
    }

    const newMother: Mother = {
      id: `moth-${Date.now()}`,
      name: name.trim(),
      age: parseInt(age, 10) || 24,
      phone: phone.trim() || '+91 98765 00000',
      village: village.trim() || 'Demo Village',
      emergencyContact: emergencyContact.trim() || '+91 98765 99999',
      gestationalAgeWeeks: parseInt(gestationalWeeks, 10) || 20,
      expectedDeliveryDate: edd || '2026-12-15',
      gravida: parseInt(gravida, 10) || 1,
      para: parseInt(para, 10) || 0,
      previousComplications: previousComplications.trim() || undefined,
      bloodGroup: 'B+',
      hemoglobin: hbVal,
      bloodPressure: bloodPressure.trim() || '120/80',
      weight: weight ? parseFloat(weight) : undefined,
      existingConditions: existingConditions.trim() ? [existingConditions.trim()] : [],
      currentSymptoms: currentSymptoms.trim() ? [currentSymptoms.trim()] : [],
      riskLevel,
      riskReason,
      lastScreeningDate: new Date().toISOString().split('T')[0],
      dueToday: false,
      needsFollowUp: riskLevel !== 'LOW',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveMother(newMother);
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Navigation */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              resetForm();
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Mother Registration</Text>
          <Text style={styles.stepIndicator}>Step {step} of 4</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Step 1: Basic Information</Text>
              <Text style={styles.stepSub}>Enter personal identification details</Text>

              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Priya Sharma"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Age (years) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 24"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98123 45678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.label}>Village / Locality</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Demo Village"
                value={village}
                onChangeText={setVillage}
              />

              <Text style={styles.label}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98123 99999 (Husband)"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Step 2: Pregnancy Information</Text>
              <Text style={styles.stepSub}>Enter gestational & obstetric history</Text>

              <Text style={styles.label}>Gestational Age (Weeks) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 28"
                keyboardType="numeric"
                value={gestationalWeeks}
                onChangeText={setGestationalWeeks}
              />

              <Text style={styles.label}>Expected Delivery Date (EDD)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={edd}
                onChangeText={setEdd}
              />

              <View style={styles.rowTwo}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Text style={styles.label}>Gravida (Pregnancies)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    keyboardType="numeric"
                    value={gravida}
                    onChangeText={setGravida}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Para (Deliveries)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={para}
                    onChangeText={setPara}
                  />
                </View>
              </View>

              <Text style={styles.label}>Previous Pregnancy Complications</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="e.g. Previous mild postpartum anemia or hypertension"
                multiline
                value={previousComplications}
                onChangeText={setPreviousComplications}
              />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Step 3: Health & Vitals</Text>
              <Text style={styles.stepSub}>Enter current known vitals & symptoms</Text>

              <Text style={styles.label}>Hemoglobin (Hb in g/dL) if known</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9.5 (Leave blank if unknown)"
                keyboardType="decimal-pad"
                value={hemoglobin}
                onChangeText={setHemoglobin}
              />

              <Text style={styles.label}>Blood Pressure (mmHg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 120/80"
                value={bloodPressure}
                onChangeText={setBloodPressure}
              />

              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 56"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />

              <Text style={styles.label}>Existing Medical Conditions</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Thyroid, Asthma, Diabetes"
                value={existingConditions}
                onChangeText={setExistingConditions}
              />

              <Text style={styles.label}>Current Symptoms Reported</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dizziness, Fatigue, Swelling"
                value={currentSymptoms}
                onChangeText={setCurrentSymptoms}
              />
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.stepTitle}>Step 4: Review Registration</Text>
              <Text style={styles.stepSub}>Verify all details before saving to local device</Text>

              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Full Name:</Text>
                  <Text style={styles.reviewValue}>{name}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Age:</Text>
                  <Text style={styles.reviewValue}>{age} years</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Village:</Text>
                  <Text style={styles.reviewValue}>{village}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Gestational Age:</Text>
                  <Text style={styles.reviewValue}>{gestationalWeeks} weeks</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Expected Delivery:</Text>
                  <Text style={styles.reviewValue}>{edd}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Blood Pressure:</Text>
                  <Text style={styles.reviewValue}>{bloodPressure}</Text>
                </View>
                {hemoglobin ? (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Hemoglobin:</Text>
                    <Text style={styles.reviewValue}>{hemoglobin} g/dL</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Bottom Button Row */}
          <View style={styles.bottomNavRow}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep((s) => (s - 1) as any)}
              >
                <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}

            {step < 4 ? (
              <PrimaryButton
                title="Next Step"
                onPress={handleNext}
                iconName="arrow-forward"
                style={{ flex: 1, marginLeft: step > 1 ? SPACING.md : 0 }}
              />
            ) : (
              <PrimaryButton
                title="Save Mother"
                onPress={handleSave}
                iconName="checkmark-circle"
                variant="primary"
                style={{ flex: 1, marginLeft: SPACING.md }}
              />
            )}
          </View>

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
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.divider,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  stepSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
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
  rowTwo: {
    flexDirection: 'row',
  },
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  reviewLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  reviewValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
});
