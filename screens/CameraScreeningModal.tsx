import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ScreeningResult } from '../types/screening';
import { runVisualAnemiaScreening } from '../services/screening/anemiaScreening';
import { getImagePixels } from '../services/imaging/getImagePixels';
import { assessImageQuality, computeAverageColor } from '../services/imaging/imageQuality';
import { detectEyeRegion } from '../services/imaging/eyeDetection';
import { ImageQualityAssessment } from '../services/imaging/types';
import { EyeRegionBox } from '../services/imaging/eyeDetection.types';
import { PrimaryButton } from '../components/PrimaryButton';
import { MotherPickerField } from '../components/MotherPickerField';
import { useMothers } from '../hooks/useMothers';
import { useSelectedMother } from '../hooks/useSelectedMother';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

type Stage = 'setup' | 'detecting' | 'analyzing' | 'quality-failed';

export const CameraScreeningModal: React.FC<RootScreenProps<'CameraScreening'>> = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const { mothers } = useMothers();
  const { selectedMother, selectMother } = useSelectedMother(mothers, route.params?.motherId);
  const [targetType, setTargetType] = useState<'eyelid' | 'nailbed'>('eyelid');
  const [stage, setStage] = useState<Stage>('setup');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScreening = async (uri: string) => {
    if (!selectedMother) return;
    setCapturedUri(uri);

    try {
      // Real eye-landmark detection (web only, see eyeDetection.web.ts) to
      // auto-crop to the actual detected eye region instead of trusting the
      // user aligned it perfectly within the guide box. Honestly no-ops
      // (isAvailable: false) on native and for nail-bed targets.
      let eyeDetectionNote: string | null = null;
      let cropRegion: EyeRegionBox | undefined;

      if (targetType === 'eyelid') {
        setStage('detecting');
        const detection = await detectEyeRegion(uri);
        if (detection.isAvailable && detection.found && detection.region) {
          cropRegion = detection.region;
          eyeDetectionNote = 'Eye region automatically detected and cropped for analysis.';
        } else if (detection.isAvailable && !detection.found) {
          setQualityIssues(['No eye was detected in this photo. Please retake with your eye clearly centered in the frame.']);
          setStage('quality-failed');
          return;
        }
        // detection.isAvailable === false (native): fall through and use the full frame, honestly unflagged.
      }

      setStage('analyzing');
      const pixelBuffer = await getImagePixels(uri, cropRegion);
      const quality: ImageQualityAssessment = assessImageQuality(pixelBuffer);

      if (!quality.isAcceptable) {
        setQualityIssues(quality.issues);
        setStage('quality-failed');
        return;
      }

      const roiColor = computeAverageColor(pixelBuffer);
      const res = await runVisualAnemiaScreening({
        motherId: selectedMother.id,
        knownHemoglobin: selectedMother.hemoglobin,
        hasPallorSymptoms: selectedMother.currentSymptoms?.includes('Fatigue') || selectedMother.currentSymptoms?.includes('Dizziness'),
        gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
        targetType,
        rawImagePixels: roiColor,
        imageQuality: quality,
      });

      const screening: ScreeningResult = {
        id: `scr-${Date.now()}`,
        motherId: selectedMother.id,
        motherName: selectedMother.name,
        gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
        type: 'VISUAL_ANEMIA',
        overallRisk: res.riskLevel,
        anemiaRisk: res.riskLevel,
        anemiaReason: `${res.finding} (EI: ${res.biomarkers.erythemaIndex})`,
        pregnancyRisk: selectedMother.riskLevel,
        symptomRisk: selectedMother.currentSymptoms && selectedMother.currentSymptoms.length > 0 ? 'MEDIUM' : 'LOW',
        reasons: eyeDetectionNote ? [res.finding, eyeDetectionNote, ...res.reasons] : [res.finding, ...res.reasons],
        recommendation: res.recommendation,
        capturedImageUri: uri,
        isPrototypeEngine: true,
      };

      navigation.replace('ScreeningResultScreen', { screening });
    } catch (e) {
      console.error('Screening failed:', e);
      setQualityIssues(['Something went wrong processing this photo. Please try again.']);
      setStage('quality-failed');
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) await runScreening(photo.uri);
    } catch (e) {
      console.error('Capture failed:', e);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: Platform.OS !== 'web',
    });
    if (!result.canceled && result.assets[0]) {
      await runScreening(result.assets[0].uri);
    }
  };

  const handleWebFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      runScreening(objectUrl);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setQualityIssues([]);
    setStage('setup');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vision Screening</Text>
        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => setTargetType(targetType === 'eyelid' ? 'nailbed' : 'eyelid')}
          accessibilityLabel={`Switch to ${targetType === 'eyelid' ? 'nail bed' : 'eyelid'} screening`}
        >
          <Text style={styles.modeToggleText}>{targetType === 'eyelid' ? 'Eyelid' : 'Nail Bed'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.motherSelectorWrap}>
        <MotherPickerField mothers={mothers} selectedMother={selectedMother} onSelect={selectMother} />
      </View>

      <View style={styles.instructionCard}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.instructionText}>
          {targetType === 'eyelid'
            ? 'Gently pull down the lower eyelid. Position the inner surface within the frame in good, even light.'
            : 'Place the nail bed flat within the frame in good, even light, without a flash reflection.'}
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        {stage === 'detecting' ? (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.analyzingText}>Detecting eye region…</Text>
          </View>
        ) : stage === 'analyzing' ? (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.analyzingText}>Checking image quality and analyzing…</Text>
          </View>
        ) : stage === 'quality-failed' ? (
          <View style={styles.qualityFailedBox}>
            {capturedUri && <Image source={{ uri: capturedUri }} style={styles.previewThumb} />}
            <Ionicons name="alert-circle-outline" size={28} color={COLORS.riskHigh} />
            <Text style={styles.qualityFailedTitle}>Image quality is insufficient</Text>
            {qualityIssues.map((issue, i) => (
              <Text key={i} style={styles.qualityFailedIssue}>• {issue}</Text>
            ))}
            <PrimaryButton title="Retake Photo" onPress={handleRetake} iconName="camera-outline" variant="primary" style={{ marginTop: SPACING.md, width: '100%' }} />
          </View>
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
            <View style={styles.overlayContainer}>
              <View style={styles.guideBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.guideLabel}>Align {targetType === 'eyelid' ? 'inner eyelid' : 'nail bed'} within the frame</Text>
            </View>
          </CameraView>
        ) : (
          <View style={styles.noPermissionBox}>
            <Ionicons name="camera-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.noPermissionText}>Camera access is needed to capture a real photo for screening.</Text>
            <PrimaryButton title="Grant Camera Access" onPress={requestPermission} iconName="camera" size="normal" style={{ marginTop: SPACING.md }} />
          </View>
        )}
      </View>

      {stage === 'setup' && (
        <View style={styles.controlsArea}>
          <PrimaryButton
            title={`Capture ${targetType === 'eyelid' ? 'Eyelid' : 'Nail Bed'} Photo`}
            onPress={handleCapture}
            iconName="camera"
            variant="primary"
            size="large"
            disabled={!permission?.granted || !selectedMother}
            style={{ width: '100%', marginBottom: SPACING.sm }}
          />

          {Platform.OS === 'web' ? (
            <label style={{ cursor: 'pointer' as const }}>
              <input type="file" accept="image/*" onChange={handleWebFileUpload} style={{ display: 'none' }} />
              <View style={styles.uploadBtn}>
                <Ionicons name="image-outline" size={16} color={COLORS.primary} />
                <Text style={styles.uploadBtnText}>Upload a Photo Instead</Text>
              </View>
            </label>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFromGallery} disabled={!selectedMother}>
              <Ionicons name="image-outline" size={16} color={COLORS.primary} />
              <Text style={styles.uploadBtnText}>Choose From Gallery Instead</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  iconBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  modeToggle: { backgroundColor: COLORS.cardSecondaryBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  modeToggleText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textPrimary },
  motherSelectorWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  instructionCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primaryBorder,
  },
  instructionText: { ...TYPOGRAPHY.caption, color: COLORS.primaryDark, flex: 1, lineHeight: 17 },
  cameraContainer: { flex: 1, margin: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#111827', position: 'relative' },
  overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  guideBox: { width: 220, height: 160, borderRadius: RADIUS.md, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#FFFFFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  guideLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: SPACING.md, textAlign: 'center', paddingHorizontal: SPACING.lg },
  analyzingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg },
  analyzingText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginTop: SPACING.md },
  qualityFailedBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, padding: SPACING.xl },
  previewThumb: { width: 120, height: 90, borderRadius: RADIUS.md, marginBottom: SPACING.md, opacity: 0.6 },
  qualityFailedTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginTop: SPACING.sm, textAlign: 'center' },
  qualityFailedIssue: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  noPermissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, padding: SPACING.xl },
  noPermissionText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  controlsArea: { padding: SPACING.md, backgroundColor: COLORS.cardBg, borderTopWidth: 1, borderTopColor: COLORS.border },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardSecondaryBg, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  uploadBtnText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
});
