import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../auth/useAuth';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { userRepository, motherRepository } from '../db';
import { seedDemoData } from '../db/seed';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const ProfileScreen: React.FC = () => {
  const { profile, refresh } = useUserProfile();
  const { logout } = useAuth();
  const navigation = useAppNavigation();
  const [isResetDialogVisible, setIsResetDialogVisible] = useState(false);
  const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleUpdateLanguage = async () => {
    if (!profile) return;
    const next = profile.language === 'English' ? 'Hindi' : 'English';
    await userRepository.updateProfile({ language: next });
    refresh();
  };

  const handleToggleNotifications = async (val: boolean) => {
    await userRepository.updateProfile({ notificationsEnabled: val });
    refresh();
  };

  const confirmResetDemoData = async () => {
    setIsResetDialogVisible(false);
    await motherRepository.deleteAll();
    await seedDemoData();
    refresh();
  };

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Worker Profile" subtitle="Your identification & settings" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userRole}>Frontline Healthcare Worker (ASHA)</Text>

          <View style={styles.idBadgeRow}>
            <View style={styles.idBadge}>
              <Ionicons name="card-outline" size={14} color={COLORS.primaryDark} />
              <Text style={styles.idBadgeText}>{profile.workerId}</Text>
            </View>
            <View style={styles.idBadge}>
              <Ionicons name="location-outline" size={14} color={COLORS.primaryDark} />
              <Text style={styles.idBadgeText}>{profile.assignedArea}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Field Statistics</Text>
        <View style={styles.statsRow}>
          <StatCard label="Assigned Mothers" value={profile.totalMothersAssigned} iconName="people-outline" />
          <StatCard label="Follow-ups Due" value={profile.followUpsDue} iconName="time-outline" variant="warning" />
          <StatCard label="High Risk" value={profile.highRiskCount} iconName="alert-circle-outline" variant="alert" />
        </View>

        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>App Language</Text>
            </View>
            <TouchableOpacity style={styles.langSelector} onPress={handleUpdateLanguage} accessibilityRole="button">
              <Text style={styles.langText}>{profile.language}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Critical High-Risk Alerts</Text>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              accessibilityLabel="Toggle critical high-risk alert notifications"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-offline-outline" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.settingLabel}>Offline Storage</Text>
                <Text style={styles.settingSub}>All data saved locally on this device</Text>
              </View>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Reports')} accessibilityRole="button">
            <View style={styles.settingLeft}>
              <Ionicons name="folder-open-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Reports & History</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('AiPipelineInfo')} accessibilityRole="button">
            <View style={styles.settingLeft}>
              <Ionicons name="git-network-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>How MaAI Works</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('HealthInfo')} accessibilityRole="button">
            <View style={styles.settingLeft}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Health Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.resetContainer}>
          <PrimaryButton title="Reset Demo Dataset" onPress={() => setIsResetDialogVisible(true)} iconName="refresh-circle-outline" variant="outline" />
        </View>

        <View style={styles.logoutContainer}>
          <PrimaryButton title="Sign Out" onPress={() => setIsLogoutDialogVisible(true)} iconName="log-out-outline" variant="danger" />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <ConfirmDialog
        visible={isResetDialogVisible}
        title="Reset Demo Data"
        message="This clears all mother records on this device and restores the original 5 sample mothers used for demonstration. This cannot be undone."
        cancelText="Cancel"
        confirmText="Reset"
        destructive
        onCancel={() => setIsResetDialogVisible(false)}
        onConfirm={confirmResetDemoData}
      />

      <ConfirmDialog
        visible={isLogoutDialogVisible}
        title="Sign Out"
        message="You will need your PIN to sign back in."
        cancelText="Cancel"
        confirmText="Sign Out"
        destructive
        onCancel={() => setIsLogoutDialogVisible(false)}
        onConfirm={() => {
          setIsLogoutDialogVisible(false);
          logout();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg },
  heroCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryLight, alignItems: 'center',
    justifyContent: 'center', marginBottom: SPACING.md, borderWidth: 2, borderColor: COLORS.primaryBorder,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: COLORS.primaryDark },
  userName: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary },
  userRole: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 2 },
  idBadgeRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  idBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md,
    paddingVertical: 6, borderRadius: RADIUS.full, gap: 4,
  },
  idBadgeText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.primaryDark },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.xs },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  settingsCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.md },
  settingLabel: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  settingSub: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 2 },
  langSelector: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
  activePill: { backgroundColor: COLORS.riskLowBg, paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: RADIUS.full },
  activePillText: { fontSize: 10, fontWeight: '800', color: COLORS.riskLow },
  resetContainer: { marginTop: SPACING.xs, marginBottom: SPACING.md },
  logoutContainer: { marginTop: SPACING.xs },
});
