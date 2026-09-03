import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RiskLevel } from '../types/mother';
import { PrimaryButton } from '../components/PrimaryButton';
import { motherRepository } from '../db';
import { evaluateUnifiedMaternalRisk } from '../services/risk/maternalRiskEngine';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const NewMotherScreen: React.FC<RootScreenProps<'NewMother'>> = ({ navigation }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errors, setErrors] = useState<{ name?: string; age?: string; gestationalWeeks?: string; village?: string; edd?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [gestationalWeeks, setGestationalWeeks] = useState('');
  const [edd, setEdd] = useState('');
  const [gravida, setGravida] = useState('1');
  const [para, setPara] = useState('0');
  const [previousComplications, setPreviousComplications] = useState('');

  const [hemoglobin, setHemoglobin] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [weight, setWeight] = useState('');
  const [existingConditions, setExistingConditions] = useState('');
  const [currentSymptoms, setCurrentSymptoms] = useState('');

  const handleNext = () => {
    if (step === 1) {
      const nextErrors: typeof errors = {};
      if (!name.trim()) nextErrors.name = "Mother's full name is required.";
      if (!age.trim() || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 60) nextErrors.age = 'Enter a valid age (10-60 years).';
      if (!village.trim()) nextErrors.village = 'Village or locality is required.';
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setStep(2);
    } else if (step === 2) {
      const nextErrors: typeof errors = {};
      const ga = Number(gestationalWeeks);
      if (!gestationalWeeks.trim() || isNaN(ga) || ga < 1 || ga > 42) nextErrors.gestationalWeeks = 'Enter gestational age between 1 and 42 weeks.';
      if (!edd.trim()) nextErrors.edd = 'Expected delivery date is required.';
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const hbVal = hemoglobin ? parseFloat(hemoglobin) : undefined;
      const symptoms = currentSymptoms.trim() ? currentSymptoms.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

      // Run through the same canonical risk engine used everywhere else,
      // rather than a separate ad hoc heuristic just for registration.
      const riskAssessment = evaluateUnifiedMaternalRisk({
        mother: {
          id: 'transient', name: '', phone: '', village: '', emergencyContact: '',
          age: parseInt(age, 10) || 24,
          gestationalAgeWeeks: parseInt(gestationalWeeks, 10) || 20,
          expectedDeliveryDate: edd,
          gravida: parseInt(gravida, 10) || 1,
          para: parseInt(para, 10) || 0,
          previousComplications: previousComplications.trim() || undefined,
          hemoglobin: hbVal,
          bloodPressure: bloodPressure.trim() || undefined,
          currentSymptoms: symptoms,
          riskLevel: 'LOW',
          createdAt: '', updatedAt: '',
        },
      });

      const riskLevel: RiskLevel = riskAssessment.overallRisk;

      const created = await motherRepository.create({
        name: name.trim(),
        age: parseInt(age, 10),
        phone: phone.trim() || 'Not provided',
        village: village.trim(),
        emergencyContact: emergencyContact.trim() || phone.trim() || 'Not provided',
        gestationalAgeWeeks: parseInt(gestationalWeeks, 10),
        expectedDeliveryDate: edd,
        gravida: parseInt(gravida, 10) || 1,
        para: parseInt(para, 10) || 0,
        previousComplications: previousComplications.trim() || undefined,
        bloodGroup: undefined,
        hemoglobin: hbVal,
        bloodPressure: bloodPressure.trim() || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        existingConditions: existingConditions.trim() ? [existingConditions.trim()] : undefined,
        currentSymptoms: symptoms,
        riskLevel,
        riskReason: riskAssessment.whyFlagged[0],
      });

      navigation.replace('MotherDetail', { motherId: created.id });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Cancel registration">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Mother Registration</Text>
        <Text style={styles.stepIndicator}>Step {step} of 4</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSub}>Enter personal identification details</Text>

            <Field icon="person-outline" label="Full Name *" value={name} onChangeText={(t) => { setName(t); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }} placeholder="e.g. Priya Sharma" error={errors.name} />
            <Field icon="calendar-outline" label="Age (years) *" value={age} onChangeText={(t) => { setAge(t); if (errors.age) setErrors((e) => ({ ...e, age: undefined })); }} placeholder="e.g. 24" keyboardType="numeric" error={errors.age} />
            <Field icon="call-outline" label="Phone Number" value={phone} onChangeText={setPhone} placeholder="e.g. +91 98123 45678" keyboardType="phone-pad" />
            <Field icon="location-outline" label="Village / Locality *" value={village} onChangeText={(t) => { setVillage(t); if (errors.village) setErrors((e) => ({ ...e, village: undefined })); }} placeholder="e.g. Rampur" error={errors.village} />
            <Field icon="alert-circle-outline" label="Emergency Contact" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="e.g. +91 98123 99999 (Husband)" />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Pregnancy Information</Text>
            <Text style={styles.stepSub}>Enter gestational & obstetric history</Text>

            <Field icon="fitness-outline" label="Gestational Age (Weeks) *" value={gestationalWeeks} onChangeText={(t) => { setGestationalWeeks(t); if (errors.gestationalWeeks) setErrors((e) => ({ ...e, gestationalWeeks: undefined })); }} placeholder="e.g. 28" keyboardType="numeric" error={errors.gestationalWeeks} />
            <Field icon="calendar-outline" label="Expected Delivery Date *" value={edd} onChangeText={(t) => { setEdd(t); if (errors.edd) setErrors((e) => ({ ...e, edd: undefined })); }} placeholder="YYYY-MM-DD" error={errors.edd} />

            <View style={styles.rowTwo}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Field icon="repeat-outline" label="Gravida" value={gravida} onChangeText={setGravida} placeholder="1" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field icon="checkmark-done-outline" label="Para" value={para} onChangeText={setPara} placeholder="0" keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.label}>Previous Pregnancy Complications</Text>
            <TextInput style={[styles.input, { height: 80, paddingTop: 12 }]} placeholder="e.g. Previous mild postpartum anemia or hypertension" placeholderTextColor={COLORS.textMuted} multiline value={previousComplications} onChangeText={setPreviousComplications} />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Health & Vitals</Text>
            <Text style={styles.stepSub}>Enter current known vitals & symptoms, if any</Text>

            <Field icon="water-outline" label="Hemoglobin (Hb g/dL)" value={hemoglobin} onChangeText={setHemoglobin} placeholder="Leave blank if unknown" keyboardType="decimal-pad" />
            <Field icon="heart-outline" label="Blood Pressure (mmHg)" value={bloodPressure} onChangeText={setBloodPressure} placeholder="e.g. 120/80" />
            <Field icon="scale-outline" label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="e.g. 56" keyboardType="numeric" />
            <Field icon="medkit-outline" label="Existing Medical Conditions" value={existingConditions} onChangeText={setExistingConditions} placeholder="e.g. Thyroid, Asthma, Diabetes" />
            <Field icon="pulse-outline" label="Current Symptoms Reported" value={currentSymptoms} onChangeText={setCurrentSymptoms} placeholder="Comma-separated, e.g. Dizziness, Fatigue" />
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Review Registration</Text>
            <Text style={styles.stepSub}>Verify all details before saving to this device</Text>

            <View style={styles.reviewCard}>
              <ReviewRow label="Full Name" value={name} />
              <ReviewRow label="Age" value={`${age} years`} />
              <ReviewRow label="Village" value={village} />
              <ReviewRow label="Gestational Age" value={`${gestationalWeeks} weeks`} />
              <ReviewRow label="Expected Delivery" value={edd} />
              {bloodPressure ? <ReviewRow label="Blood Pressure" value={bloodPressure} /> : null}
              {hemoglobin ? <ReviewRow label="Hemoglobin" value={`${hemoglobin} g/dL`} /> : null}
            </View>
          </View>
        )}

        <View style={styles.bottomNavRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => (s - 1) as 1 | 2 | 3)} accessibilityLabel="Go back a step">
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <PrimaryButton title="Next Step" onPress={handleNext} iconName="arrow-forward" style={{ flex: 1, marginLeft: step > 1 ? SPACING.md : 0 }} />
          ) : (
            <PrimaryButton
              title={isSaving ? 'Saving...' : 'Save Mother'}
              onPress={handleSave}
              iconName="checkmark-circle"
              variant="primary"
              loading={isSaving}
              style={{ flex: 1, marginLeft: SPACING.md }}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

interface FieldProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad';
  error?: string;
}

const Field: React.FC<FieldProps> = ({ icon, label, value, onChangeText, placeholder, keyboardType = 'default', error }) => (
  <View>
    <View style={styles.labelRow}>
      <Ionicons name={icon} size={14} color={COLORS.textMuted} />
      <Text style={styles.labelInRow}>{label}</Text>
    </View>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={label}
    />
    {error && <Text style={styles.fieldErrorText}>{error}</Text>}
  </View>
);

const ReviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text style={styles.reviewValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, backgroundColor: COLORS.cardBg },
  closeBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  stepIndicator: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.primaryDark, backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm },
  progressTrack: { height: 4, backgroundColor: COLORS.divider, width: '100%' },
  progressBar: { height: '100%', backgroundColor: COLORS.primary },
  scrollContent: { padding: SPACING.lg },
  stepTitle: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary, marginTop: SPACING.sm },
  stepSub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, marginBottom: 6 },
  labelInRow: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginBottom: 6, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50, fontSize: 16, color: COLORS.textPrimary },
  inputError: { borderColor: COLORS.riskHigh, borderWidth: 1.5 },
  fieldErrorText: { fontSize: 12, fontWeight: '600', color: COLORS.riskHigh, marginTop: 4 },
  rowTwo: { flexDirection: 'row' },
  reviewCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  reviewLabel: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
  reviewValue: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  bottomNavRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, height: 52, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.primary },
  backBtnText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary, marginLeft: 4 },
});
