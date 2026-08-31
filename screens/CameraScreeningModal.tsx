import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Mother } from '../types/mother';
import { ScreeningResult } from '../types/screening';
import { runVisualAnemiaScreening } from '../services/screening/anemiaScreening';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface CameraScreeningModalProps {
  visible: boolean;
  mothers: Mother[];
  preSelectedMother?: Mother | null;
  onClose: () => void;
  onScreeningComplete: (result: ScreeningResult) => void;
}

export const CameraScreeningModal: React.FC<CameraScreeningModalProps> = ({
  visible,
  mothers,
  preSelectedMother,
  onClose,
  onScreeningComplete,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedMother, setSelectedMother] = useState<Mother | null>(
    preSelectedMother || mothers[0] || null
  );
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // Step 1: Position, Step 2: Capture, Step 3: Analyze, Step 4: Result
  const [targetType, setTargetType] = useState<'eyelid' | 'nailbed'>('eyelid');

  useEffect(() => {
    if (preSelectedMother) {
      setSelectedMother(preSelectedMother);
    } else if (mothers.length > 0 && !selectedMother) {
      setSelectedMother(mothers[0]);
    }
  }, [preSelectedMother, mothers]);

  const handleCapture = async () => {
    if (!selectedMother) return;

    setCurrentStep(3); // STEP 3 — Analyze

    try {
      const res = await runVisualAnemiaScreening({
        motherId: selectedMother.id,
        knownHemoglobin: selectedMother.hemoglobin,
        hasPallorSymptoms: selectedMother.currentSymptoms?.includes('Dizziness'),
        gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
        targetType,
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
        type: 'VISUAL_ANEMIA',
        overallRisk: res.riskLevel,
        anemiaRisk: res.riskLevel,
        anemiaReason: res.finding,
        pregnancyRisk: selectedMother.riskLevel,
        symptomRisk: 'LOW',
        reasons: [
          res.finding,
          ...res.reasons,
          ...(selectedMother.previousComplications ? [`History: ${selectedMother.previousComplications}`] : []),
        ],
        recommendation: res.recommendation,
        isPrototypeEngine: true,
      };

      setCurrentStep(4); // STEP 4 — Result
      onScreeningComplete(screeningObj);
      setCurrentStep(1); // Reset for next launch
    } catch (e) {
      console.error('Screening failed:', e);
      setCurrentStep(1);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textInverted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Visual Anemia Screening</Text>
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => setTargetType(targetType === 'eyelid' ? 'nailbed' : 'eyelid')}
          >
            <Text style={styles.modeToggleText}>
              Target: {targetType === 'eyelid' ? 'Inner Eyelid' : 'Nail Bed'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* STEP PROGRESS INDICATOR */}
        <View style={styles.stepProgressRow}>
          <View style={[styles.stepPill, currentStep >= 1 && styles.stepPillActive]}>
            <Text style={styles.stepPillText}>1. Position</Text>
          </View>
          <View style={[styles.stepPill, currentStep >= 2 && styles.stepPillActive]}>
            <Text style={styles.stepPillText}>2. Capture</Text>
          </View>
          <View style={[styles.stepPill, currentStep >= 3 && styles.stepPillActive]}>
            <Text style={styles.stepPillText}>3. Analyze</Text>
          </View>
          <View style={[styles.stepPill, currentStep >= 4 && styles.stepPillActive]}>
            <Text style={styles.stepPillText}>4. Result</Text>
          </View>
        </View>

        {/* Selected Mother Bar */}
        <View style={styles.motherSelectorRow}>
          <Text style={styles.selectorLabel}>Screening Mother:</Text>
          <Text style={styles.selectedMotherName}>
            {selectedMother ? `${selectedMother.name} (${selectedMother.gestationalAgeWeeks}w)` : 'Select Mother'}
          </Text>
        </View>

        {/* Camera Viewport Area */}
        <View style={styles.cameraContainer}>
          {permission && permission.granted ? (
            <CameraView style={StyleSheet.absoluteFillObject} facing="back">
              {/* High Contrast Rectangular Framing Guide */}
              <View style={styles.overlayContainer}>
                <View style={styles.guideBox}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  <Text style={styles.guideBoxLabel}>
                    ALIGN {targetType === 'eyelid' ? 'INNER EYELID' : 'NAIL BED'} INSIDE BOX
                  </Text>
                </View>
              </View>
            </CameraView>
          ) : (
            /* Fallback Simulator View for web/emulator */
            <View style={styles.fallbackPreview}>
              <Ionicons name="camera-outline" size={56} color={COLORS.primaryLight} />
              <Text style={styles.fallbackTitle}>Visual Screening Camera</Text>
              <Text style={styles.fallbackSub}>
                Position palpebral conjunctiva inner eyelid inside rectangular guide frame.
              </Text>
              {!permission?.granted && (
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                  <Text style={styles.permBtnText}>Grant Camera Permission</Text>
                </TouchableOpacity>
              )}
              <View style={styles.simulatedGuide}>
                <Text style={styles.simulatedGuideText}>CONJUNCTIVA TARGET REGION</Text>
              </View>
            </View>
          )}

          {/* STEP 3 ANALYZING OVERLAY */}
          {currentStep === 3 && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primaryLight} />
              <Text style={styles.analyzingTitle}>Analyzing Visual Indicators...</Text>
              <Text style={styles.analyzingSub}>
                Extracting conjunctival RGB color space metrics & vascular opacity score.
              </Text>
            </View>
          )}
        </View>

        {/* Guidance Instructions & Capture Action */}
        <View style={styles.instructionsContainer}>
          <View style={styles.guidanceRow}>
            <View style={styles.guidanceItem}>
              <Ionicons name="sunny-outline" size={16} color={COLORS.accent} />
              <Text style={styles.guidanceText}>Natural / Bright Lighting</Text>
            </View>
            <View style={styles.guidanceItem}>
              <Ionicons name="hand-left-outline" size={16} color={COLORS.primaryLight} />
              <Text style={styles.guidanceText}>Hold Steady (15-20cm)</Text>
            </View>
          </View>

          <PrimaryButton
            title={currentStep === 3 ? 'Analyzing...' : 'Capture & Analyze Pallor'}
            onPress={handleCapture}
            iconName="camera"
            variant="accent"
            size="large"
            loading={currentStep === 3}
            style={styles.captureBtn}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#1F2937',
  },
  iconBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textInverted,
  },
  modeToggle: {
    backgroundColor: '#374151',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  stepProgressRow: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: 4,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: RADIUS.sm,
  },
  stepPillActive: {
    backgroundColor: COLORS.primary,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textInverted,
  },
  motherSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 6,
  },
  selectedMotherName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentLight,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  overlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  guideBox: {
    width: 260,
    height: 170,
    borderWidth: 2,
    borderColor: '#34D399',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  guideBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#34D399',
  },
  topLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  fallbackPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textInverted,
    marginTop: SPACING.md,
  },
  fallbackSub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  permBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  permBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textInverted,
  },
  simulatedGuide: {
    marginTop: SPACING.lg,
    width: 240,
    height: 130,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedGuideText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 1,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  analyzingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textInverted,
    marginTop: SPACING.lg,
  },
  analyzingSub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  instructionsContainer: {
    backgroundColor: '#1F2937',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  guidanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  guidanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidanceText: {
    fontSize: 12,
    color: '#D1D5DB',
    marginLeft: 6,
    fontWeight: '600',
  },
  captureBtn: {
    marginTop: 0,
  },
});
