import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../auth/useAuth';
import { AuthError } from '../../auth/AuthService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, COMPONENT_TOKENS } from '../../constants/theme';

export const OnboardingScreen: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedArea, setAssignedArea] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length > 1 && workerId.trim().length > 2 && phone.trim().length >= 8 && assignedArea.trim().length > 1 && pin.length >= 4 && pin === confirmPin;

  const handleCreateAccount = async () => {
    setError(null);
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), workerId: workerId.trim(), phone: phone.trim(), assignedArea: assignedArea.trim(), pin });
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="medical" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.brandTitle}>MaAI</Text>
            <Text style={styles.brandSubtitle}>Maternal Risk Intelligence for Frontline Health Workers</Text>
          </View>

          <Text style={styles.formTitle}>Set up your worker profile</Text>
          <Text style={styles.formSubtitle}>
            This creates a profile on this device. Your PIN protects mother health records stored here.
          </Text>

          <FormField label="Full Name" icon="person-outline" value={name} onChangeText={setName} placeholder="e.g. Sunita Devi" accessibilityLabel="Full name" />
          <FormField label="Worker ID" icon="card-outline" value={workerId} onChangeText={setWorkerId} placeholder="e.g. ASHA-1024" autoCapitalize="characters" accessibilityLabel="Worker ID" />
          <FormField label="Phone Number" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" accessibilityLabel="Phone number" />
          <FormField label="Assigned Area" icon="location-outline" value={assignedArea} onChangeText={setAssignedArea} placeholder="e.g. Sector 4, Rampur" accessibilityLabel="Assigned area" />
          <FormField label="Create PIN" icon="lock-closed-outline" value={pin} onChangeText={setPin} placeholder="At least 4 digits" keyboardType="number-pad" secureTextEntry maxLength={8} accessibilityLabel="Create PIN" />
          <FormField label="Confirm PIN" icon="lock-closed-outline" value={confirmPin} onChangeText={setConfirmPin} placeholder="Re-enter PIN" keyboardType="number-pad" secureTextEntry maxLength={8} accessibilityLabel="Confirm PIN" />

          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={16} color={COLORS.riskHigh} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitBtnDisabled]}
            onPress={handleCreateAccount}
            disabled={!isValid || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Create profile and continue"
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.textInverted} />
            ) : (
              <Text style={styles.submitBtnText}>Create Profile & Continue</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Your PIN is stored as a secure hash on this device — never in plain text. No data leaves this device.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface FormFieldProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'characters' | 'sentences';
  maxLength?: number;
  accessibilityLabel: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry, autoCapitalize, maxLength, accessibilityLabel }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'words'}
        maxLength={maxLength}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  brandRow: { alignItems: 'center', marginBottom: SPACING.xl },
  brandIcon: {
    width: 56, height: 56, borderRadius: RADIUS.xl, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  brandTitle: { ...TYPOGRAPHY.display, color: COLORS.textPrimary },
  brandSubtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  formTitle: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary, marginTop: SPACING.lg },
  formSubtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg, lineHeight: 20 },
  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md,
    height: COMPONENT_TOKENS.inputHeight,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.riskHighBg,
    borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md, gap: 6,
  },
  errorText: { ...TYPOGRAPHY.caption, color: COLORS.riskHigh, flex: 1 },
  submitBtn: {
    height: COMPONENT_TOKENS.buttonHeight, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm,
  },
  submitBtnDisabled: { backgroundColor: COLORS.disabled },
  submitBtnText: { ...TYPOGRAPHY.bodyStrong, fontSize: 16, color: COLORS.textInverted },
  privacyNote: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 16 },
});
