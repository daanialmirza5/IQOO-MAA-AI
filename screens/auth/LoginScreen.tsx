import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../auth/useAuth';
import { AuthError } from '../../auth/AuthService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, COMPONENT_TOKENS } from '../../constants/theme';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [workerId, setWorkerId] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(workerId.trim(), pin);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centerWrap}>
        <View style={styles.brandIcon}>
          <Ionicons name="medical" size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your worklist</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Worker ID</Text>
          <View style={styles.inputRow}>
            <Ionicons name="card-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={workerId}
              onChangeText={setWorkerId}
              placeholder="e.g. ASHA-1024"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              accessibilityLabel="Worker ID"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PIN</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter your PIN"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              accessibilityLabel="PIN"
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={16} color={COLORS.riskHigh} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (!workerId || !pin || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleLogin}
          disabled={!workerId || !pin || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {isSubmitting ? <ActivityIndicator color={COLORS.textInverted} /> : <Text style={styles.submitBtnText}>Sign In</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerWrap: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  brandIcon: {
    width: 56, height: 56, borderRadius: RADIUS.xl, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, alignSelf: 'center',
  },
  title: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary, textAlign: 'center' },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: SPACING.xl },
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
});
