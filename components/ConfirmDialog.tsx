import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  /** Omit to render a single-button informational alert instead of a confirm/cancel dialog. */
  cancelText?: string;
  confirmText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * A real, cross-platform confirm/alert dialog. `Alert.alert()` from
 * react-native is a documented no-op on web (react-native-web ships
 * `static alert() {}`), which silently broke every confirmation flow
 * (Sign Out, Reset Demo Data) on web — this component works identically on
 * web, iOS, and Android since it is just a themed `Modal`.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  cancelText,
  confirmText = 'OK',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel ?? onConfirm}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            {cancelText && onCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} accessibilityRole="button">
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive, !cancelText && { flex: 1 }]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={[styles.confirmBtnText, destructive && styles.confirmBtnTextDestructive]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.modal,
  },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  cancelBtn: {
    flex: 1, height: 46, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardSecondaryBg,
  },
  cancelBtnText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textSecondary },
  confirmBtn: {
    flex: 1, height: 46, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  confirmBtnDestructive: { backgroundColor: COLORS.riskHigh },
  confirmBtnText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textInverted },
  confirmBtnTextDestructive: { color: COLORS.textInverted },
});
