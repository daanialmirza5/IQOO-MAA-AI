import React from 'react';
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
import { Mother, TimelineEvent } from '../types/mother';
import { RiskBadge } from '../components/RiskBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface MotherDetailModalProps {
  visible: boolean;
  mother: Mother | null;
  onClose: () => void;
  onStartScreening: (mother: Mother) => void;
  onCreateReferral: (mother: Mother) => void;
}

export const MotherDetailModal: React.FC<MotherDetailModalProps> = ({
  visible,
  mother,
  onClose,
  onStartScreening,
  onCreateReferral,
}) => {
  if (!mother) return null;

  const timelineEvents: TimelineEvent[] = mother.timeline || [
    {
      id: 'default-1',
      date: mother.createdAt || '2026-05-10',
      title: 'Initial Registration',
      description: `Registered at ${mother.village} by ASHA worker. Initial risk evaluated as ${mother.riskLevel}.`,
      type: 'REGISTRATION',
      riskLevel: mother.riskLevel,
    },
  ];

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION':
        return 'person-add-outline';
      case 'ANC_VISIT':
        return 'medical-outline';
      case 'SCREENING':
        return 'camera-outline';
      case 'FOLLOW_UP_MISSED':
        return 'time-outline';
      case 'RISK_CHANGED':
        return 'alert-circle-outline';
      case 'REFERRAL_CREATED':
        return 'document-text-outline';
      default:
        return 'ellipse-outline';
    }
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
          <Text style={styles.headerTitle}>Mother Profile</Text>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => onCreateReferral(mother)}
          >
            <Ionicons name="share-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Profile Card */}
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{mother.name.charAt(0)}</Text>
            </View>

            <Text style={styles.motherName}>{mother.name}</Text>
            <Text style={styles.motherSubText}>
              {mother.age} years old • {mother.village}
            </Text>

            <View style={styles.riskBadgeContainer}>
              <RiskBadge level={mother.riskLevel} size="large" />
            </View>

            {mother.riskReason && (
              <View style={styles.riskReasonBox}>
                <Ionicons name="information-circle" size={16} color={COLORS.primaryDark} />
                <Text style={styles.riskReasonText}>{mother.riskReason}</Text>
              </View>
            )}
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionRow}>
            <PrimaryButton
              title="Start Screening"
              onPress={() => onStartScreening(mother)}
              iconName="camera"
              variant="accent"
              style={{ flex: 1, marginRight: SPACING.xs }}
            />
            <PrimaryButton
              title="Referral"
              onPress={() => onCreateReferral(mother)}
              iconName="document-text"
              variant="primary"
              style={{ flex: 1, marginLeft: SPACING.xs }}
            />
          </View>

          {/* Gestational & Obstetric Info */}
          <Text style={styles.sectionTitle}>Gestational & Obstetric History</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>GESTATIONAL AGE</Text>
              <Text style={styles.infoValueHighlight}>{mother.gestationalAgeWeeks} Weeks</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>EXPECTED DELIVERY</Text>
              <Text style={styles.infoValue}>{mother.expectedDeliveryDate}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>OBSTETRIC HISTORY</Text>
              <Text style={styles.infoValue}>
                Gravida {mother.gravida} • Para {mother.para}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>BLOOD GROUP</Text>
              <Text style={styles.infoValue}>{mother.bloodGroup || 'Not Tested'}</Text>
            </View>
          </View>

          {/* Vitals & Clinical Metrics */}
          <Text style={styles.sectionTitle}>Vitals & Screening Metrics</Text>
          <View style={styles.vitalsCard}>
            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Ionicons name="water-outline" size={18} color={COLORS.accent} />
                <Text style={styles.vitalLabel}>Hemoglobin (Hb)</Text>
              </View>
              <Text
                style={[
                  styles.vitalValue,
                  mother.hemoglobin && mother.hemoglobin < 10.0 ? { color: COLORS.riskHigh } : null,
                ]}
              >
                {mother.hemoglobin ? `${mother.hemoglobin} g/dL` : 'Not recorded'}
              </Text>
            </View>

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Ionicons name="heart-outline" size={18} color={COLORS.primary} />
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
              </View>
              <Text style={styles.vitalValue}>{mother.bloodPressure || '120/80'}</Text>
            </View>

            <View style={[styles.vitalRow, { borderBottomWidth: 0 }]}>
              <View style={styles.vitalLeft}>
                <Ionicons name="scale-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.vitalLabel}>Weight</Text>
              </View>
              <Text style={styles.vitalValue}>{mother.weight ? `${mother.weight} kg` : 'N/A'}</Text>
            </View>
          </View>

          {/* PHASE 5: RISK TIMELINE */}
          <Text style={styles.sectionTitle}>Mother Risk Timeline</Text>
          <View style={styles.timelineCard}>
            {timelineEvents.map((item, index) => {
              const isLast = index === timelineEvents.length - 1;
              return (
                <View key={item.id || index} style={styles.timelineItem}>
                  {/* Timeline Left Icon Bar */}
                  <View style={styles.timelineLeftColumn}>
                    <View style={styles.timelineIconBubble}>
                      <Ionicons
                        name={getTimelineIcon(item.type) as any}
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  {/* Timeline Event Content */}
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeaderRow}>
                      <Text style={styles.timelineDate}>{item.date}</Text>
                      {item.riskLevel && <RiskBadge level={item.riskLevel} size="small" />}
                    </View>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineDesc}>{item.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Contact Details */}
          <Text style={styles.sectionTitle}>Field Contact Information</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              <Text style={styles.contactText}>{mother.phone}</Text>
            </View>
            <View style={[styles.contactRow, { marginTop: SPACING.sm }]}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.accent} />
              <Text style={styles.contactText}>Emergency: {mother.emergencyContact}</Text>
            </View>
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
  actionIconBtn: {
    padding: SPACING.xs,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  motherName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  motherSubText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  riskBadgeContainer: {
    marginTop: SPACING.md,
  },
  riskReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.md,
  },
  riskReasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginLeft: 6,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  vitalsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  vitalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  timelineCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 28,
  },
  timelineIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: COLORS.cardSecondaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  timelineDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  contactCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
});
