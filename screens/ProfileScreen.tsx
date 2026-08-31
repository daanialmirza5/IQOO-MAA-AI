import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AshaWorkerProfile } from '../types/user';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface ProfileScreenProps {
  user: AshaWorkerProfile;
  onUpdateUser: (profile: Partial<AshaWorkerProfile>) => void;
  onResetData: () => void;
  onLoadHighRiskDemo: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onUpdateUser,
  onResetData,
  onLoadHighRiskDemo,
}) => {
  const handleReset = () => {
    Alert.alert(
      'Reset Demo Data',
      'Are you sure you want to restore the initial seed dataset (24 mothers, active alerts & screenings)?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset Data', style: 'destructive', onPress: onResetData },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="ASHA Worker Profile" subtitle="Field worker identification & settings" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Worker Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>Frontline Healthcare Worker (ASHA)</Text>

          <View style={styles.idBadgeRow}>
            <View style={styles.idBadge}>
              <Ionicons name="card-outline" size={14} color={COLORS.primaryDark} />
              <Text style={styles.idBadgeText}>Worker ID: {user.workerId}</Text>
            </View>

            <View style={styles.idBadge}>
              <Ionicons name="location-outline" size={14} color={COLORS.primaryDark} />
              <Text style={styles.idBadgeText}>{user.assignedArea}</Text>
            </View>
          </View>
        </View>

        {/* PHASE 8: DEMO MODE BOX */}
        <Text style={styles.sectionTitle}>HACKATHON DEMO MODE</Text>
        <View style={styles.demoModeCard}>
          <View style={styles.demoModeHeader}>
            <Ionicons name="flask-outline" size={22} color={COLORS.accent} />
            <View style={{ marginLeft: SPACING.md, flex: 1 }}>
              <Text style={styles.demoModeTitle}>Quick Demo Load</Text>
              <Text style={styles.demoModeSub}>
                Pre-populate realistic high-risk maternal case (Priya Sharma, 28w, Hb 9.5 g/dL) for 60-second judge presentation.
              </Text>
            </View>
          </View>

          <PrimaryButton
            title="Load High-Risk Demo Case"
            onPress={onLoadHighRiskDemo}
            iconName="play-circle-outline"
            variant="accent"
            size="large"
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Quick Field Stats */}
        <Text style={styles.sectionTitle}>Field Statistics</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalMothersAssigned}</Text>
            <Text style={styles.statLabel}>Registered Mothers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.riskMedium }]}>{user.followUpsDue}</Text>
            <Text style={styles.statLabel}>Follow-ups Due</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.riskHigh }]}>{user.highRiskCount}</Text>
            <Text style={styles.statLabel}>High Risk Cases</Text>
          </View>
        </View>

        {/* Application Settings */}
        <Text style={styles.sectionTitle}>App Preferences & Field Settings</Text>
        <View style={styles.settingsCard}>
          {/* Language Selection */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>App Language</Text>
            </View>
            <TouchableOpacity
              style={styles.langSelector}
              onPress={() => {
                const nextLang = user.language === 'English' ? 'Hindi' : 'English';
                onUpdateUser({ language: nextLang });
              }}
            >
              <Text style={styles.langText}>{user.language}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Notifications Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Critical High-Risk Alerts</Text>
            </View>
            <Switch
              value={user.notificationsEnabled}
              onValueChange={(val) => onUpdateUser({ notificationsEnabled: val })}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          {/* Offline Mode Status */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-offline-outline" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.settingLabel}>Offline Storage Mode</Text>
                <Text style={styles.settingSub}>All data saved locally via AsyncStorage</Text>
              </View>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* Reset Action */}
        <View style={styles.resetContainer}>
          <PrimaryButton
            title="Reset Demo Dataset"
            onPress={handleReset}
            iconName="refresh-circle-outline"
            variant="outline"
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  heroCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  idBadgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  demoModeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    ...SHADOWS.card,
  },
  demoModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoModeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  demoModeSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.card,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.divider,
  },
  settingsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  settingSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: SPACING.md,
    marginTop: 2,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 4,
  },
  activePill: {
    backgroundColor: COLORS.riskLowBg,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.riskLow,
  },
  resetContainer: {
    marginTop: SPACING.md,
  },
});
