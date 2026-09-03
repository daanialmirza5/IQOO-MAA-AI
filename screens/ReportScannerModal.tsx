import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ScreeningResult } from '../types/screening';
import { analyzeReportDocument, buildManualEntryContext, isOcrAvailableOnThisPlatform, ExtractedRecordResult } from '../services/ocr/recordOcrService';
import { isValueInRange } from '../services/ocr/fieldExtraction';
import { PrimaryButton } from '../components/PrimaryButton';
import { MotherPickerField } from '../components/MotherPickerField';
import { useMothers } from '../hooks/useMothers';
import { useSelectedMother } from '../hooks/useSelectedMother';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

type Stage = 'capture' | 'processing' | 'review';

export const ReportScannerModal: React.FC<RootScreenProps<'ReportScanner'>> = ({ navigation, route }) => {
  const { mothers } = useMothers();
  const { selectedMother, selectMother } = useSelectedMother(mothers, route.params?.motherId);
  const [stage, setStage] = useState<Stage>('capture');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<ExtractedRecordResult | null>(null);

  const [hbInput, setHbInput] = useState('');
  const [bpInput, setBpInput] = useState('');
  const [gaInput, setGaInput] = useState('');
  const [albuminInput, setAlbuminInput] = useState('');

  const goToManualReview = () => {
    if (!selectedMother) return;
    const ctx = buildManualEntryContext(selectedMother);
    setOcrResult({
      reportName: ctx.reportLabel,
      extractionMethod: 'MANUAL_ENTRY',
      fields: {},
      fieldsFound: [],
      outOfRangeWarnings: [],
      previousHb: ctx.previousHb,
      hbTrend: 'STABLE',
      explanation: 'On-device OCR is only available on web in this build. Enter the values from the report below — the photo is attached as supporting evidence.',
    });
    setStage('review');
  };

  const processPhoto = async (uri: string) => {
    setPhotoUri(uri);
    if (!selectedMother) return;

    if (!isOcrAvailableOnThisPlatform) {
      goToManualReview();
      return;
    }

    setStage('processing');
    try {
      const result = await analyzeReportDocument(selectedMother, uri, `Report photographed ${new Date().toLocaleDateString()}`);
      setOcrResult(result);
      setHbInput(result.fields.hemoglobin != null ? String(result.fields.hemoglobin) : '');
      setBpInput(result.fields.bloodPressure ?? '');
      setGaInput(result.fields.gestationalAgeWeeks != null ? String(result.fields.gestationalAgeWeeks) : String(selectedMother.gestationalAgeWeeks));
      setAlbuminInput(result.fields.albumin ?? '');
      setStage('review');
    } catch (e) {
      console.error('OCR failed:', e);
      goToManualReview();
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!result.canceled && result.assets[0]) await processPhoto(result.assets[0].uri);
  };

  const handleWebFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhoto(URL.createObjectURL(file));
  };

  const handleSkipPhoto = () => {
    if (!selectedMother) return;
    goToManualReview();
  };

  const hbValue = hbInput ? parseFloat(hbInput) : undefined;
  const hbOutOfRange = hbValue !== undefined && !isValueInRange('hemoglobin', hbValue);
  const gaValue = gaInput ? parseInt(gaInput, 10) : undefined;
  const gaOutOfRange = gaValue !== undefined && !isValueInRange('gestationalAgeWeeks', gaValue);

  const handleConfirmAndContinue = () => {
    if (!selectedMother || !ocrResult) return;

    const hbTrend = hbValue !== undefined && ocrResult.previousHb !== undefined
      ? hbValue - ocrResult.previousHb <= -0.5 ? 'DECLINING' : hbValue - ocrResult.previousHb >= 0.5 ? 'IMPROVING' : 'STABLE'
      : 'STABLE';

    const reasons: string[] = [];
    if (hbValue !== undefined) reasons.push(`Confirmed Hemoglobin: ${hbValue} g/dL${ocrResult.previousHb ? ` (previous: ${ocrResult.previousHb} g/dL)` : ''}`);
    if (bpInput) reasons.push(`Confirmed Blood Pressure: ${bpInput} mmHg`);
    if (hbTrend === 'DECLINING') reasons.push('Hemoglobin trajectory is declining compared to the previous reading.');
    if (reasons.length === 0) reasons.push('Report reviewed — no lab values recorded.');

    const overallRisk = hbValue !== undefined && hbValue < 10.0 ? 'HIGH' : hbTrend === 'DECLINING' ? 'MEDIUM' : 'LOW';

    const screening: ScreeningResult = {
      id: `scr-${Date.now()}`,
      motherId: selectedMother.id,
      motherName: selectedMother.name,
      gestationalAgeWeeks: gaValue || selectedMother.gestationalAgeWeeks,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      type: 'REPORT_OCR',
      overallRisk,
      anemiaRisk: overallRisk,
      anemiaReason: reasons[0],
      pregnancyRisk: selectedMother.riskLevel,
      symptomRisk: 'LOW',
      reasons,
      recommendation: hbTrend === 'DECLINING'
        ? 'Priority follow-up recommended: accompany mother to PHC for repeat lab confirmation and dietary IFA review.'
        : 'Continue standard prenatal care and daily iron-folic acid supplementation.',
      capturedImageUri: photoUri ?? undefined,
      isPrototypeEngine: true,
      extractedHb: hbValue,
      extractedBp: bpInput || undefined,
      previousHb: ocrResult.previousHb,
      hbTrend,
    };

    navigation.replace('ScreeningResultScreen', { screening });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Report</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: SPACING.md }} keyboardShouldPersistTaps="handled">
        <MotherPickerField mothers={mothers} selectedMother={selectedMother} onSelect={selectMother} />

        {stage === 'capture' && (
          <>
            {!isOcrAvailableOnThisPlatform && (
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoBannerText}>On-device OCR runs on web in this build. Here, attach a photo (optional) and enter values manually — they are always reviewed before saving anyway.</Text>
              </View>
            )}

            <View style={styles.captureCard}>
              <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.captureCardTitle}>Photograph or upload the lab report</Text>
            </View>

            {Platform.OS === 'web' ? (
              <label style={{ cursor: 'pointer' as const }}>
                <input type="file" accept="image/*,.pdf" onChange={handleWebFileUpload} style={{ display: 'none' }} />
                <View style={styles.primaryUploadBtn}>
                  <Ionicons name="cloud-upload-outline" size={18} color={COLORS.textInverted} />
                  <Text style={styles.primaryUploadBtnText}>Upload Report Photo</Text>
                </View>
              </label>
            ) : (
              <TouchableOpacity style={styles.primaryUploadBtn} onPress={handlePickFromGallery} disabled={!selectedMother}>
                <Ionicons name="camera-outline" size={18} color={COLORS.textInverted} />
                <Text style={styles.primaryUploadBtnText}>Take or Choose Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipPhoto} disabled={!selectedMother}>
              <Text style={styles.skipBtnText}>Skip photo, enter values manually</Text>
            </TouchableOpacity>
          </>
        )}

        {stage === 'processing' && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.processingText}>Reading report with on-device OCR…</Text>
          </View>
        )}

        {stage === 'review' && ocrResult && (
          <>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.reviewThumb} />}

            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoBannerText}>{ocrResult.explanation}</Text>
            </View>

            {ocrResult.outOfRangeWarnings.map((warning, i) => (
              <View key={i} style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={16} color={COLORS.riskMedium} />
                <Text style={styles.warningBannerText}>{warning}</Text>
              </View>
            ))}

            <Text style={styles.reviewSectionTitle}>Confirm Values</Text>

            <FieldRow label="Hemoglobin (g/dL)" value={hbInput} onChangeText={setHbInput} keyboardType="decimal-pad" wasExtracted={ocrResult.fieldsFound.includes('hemoglobin')} outOfRange={hbOutOfRange} />
            <FieldRow label="Blood Pressure (mmHg)" value={bpInput} onChangeText={setBpInput} placeholder="e.g. 120/80" wasExtracted={ocrResult.fieldsFound.includes('bloodPressure')} />
            <FieldRow label="Gestational Age (weeks)" value={gaInput} onChangeText={setGaInput} keyboardType="numeric" wasExtracted={ocrResult.fieldsFound.includes('gestationalAgeWeeks')} outOfRange={gaOutOfRange} />
            <FieldRow label="Urine Albumin" value={albuminInput} onChangeText={setAlbuminInput} placeholder="e.g. Nil, Trace, 1+" wasExtracted={ocrResult.fieldsFound.includes('albumin')} />

            <PrimaryButton title="Confirm & Continue" onPress={handleConfirmAndContinue} iconName="checkmark-circle-outline" variant="primary" size="large" style={{ marginTop: SPACING.lg }} />
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  placeholder?: string;
  wasExtracted: boolean;
  outOfRange?: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, value, onChangeText, keyboardType = 'default', placeholder, wasExtracted, outOfRange }) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldRowHeader}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {wasExtracted && (
        <View style={styles.extractedTag}>
          <Ionicons name="scan-outline" size={10} color={COLORS.primaryDark} />
          <Text style={styles.extractedTagText}>Detected</Text>
        </View>
      )}
    </View>
    <TextInput
      style={[styles.fieldInput, outOfRange && styles.fieldInputWarning]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={placeholder || 'Not detected — tap to enter'}
      placeholderTextColor={COLORS.textMuted}
      accessibilityLabel={label}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  iconBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  body: { flex: 1 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.primaryBorder },
  infoBannerText: { ...TYPOGRAPHY.caption, color: COLORS.primaryDark, flex: 1, lineHeight: 17 },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.riskMediumBg, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.riskMediumBorder },
  warningBannerText: { ...TYPOGRAPHY.caption, color: COLORS.riskMedium, flex: 1, lineHeight: 17 },
  captureCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', padding: SPACING.xxl, marginBottom: SPACING.md },
  captureCardTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
  primaryUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, height: 52, borderRadius: RADIUS.lg, gap: SPACING.xs, ...SHADOWS.small },
  primaryUploadBtnText: { ...TYPOGRAPHY.bodyStrong, fontSize: 16, color: COLORS.textInverted },
  skipBtn: { alignItems: 'center', paddingVertical: SPACING.md },
  skipBtnText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textSecondary },
  processingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: SPACING.lg, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md },
  processingText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
  reviewThumb: { width: '100%', height: 160, borderRadius: RADIUS.md, marginBottom: SPACING.md, backgroundColor: COLORS.cardSecondaryBg },
  reviewSectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  fieldRow: { marginBottom: SPACING.md },
  fieldRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  fieldLabel: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  extractedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  extractedTagText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark },
  fieldInput: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 48, fontSize: 15, color: COLORS.textPrimary },
  fieldInputWarning: { borderColor: COLORS.riskMedium, borderWidth: 1.5 },
});
