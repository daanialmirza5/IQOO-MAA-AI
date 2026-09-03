import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreeningResult } from '../types/screening';
import { analyzeVoiceTranscript, buildResultFromManualSelection, VoiceAnalysisResult } from '../services/voice/voiceCheckInService';
import { QUICK_SELECT_SYMPTOMS } from '../services/voice/symptomExtraction';
import { PrimaryButton } from '../components/PrimaryButton';
import { MotherPickerField } from '../components/MotherPickerField';
import { useMothers } from '../hooks/useMothers';
import { useSelectedMother } from '../hooks/useSelectedMother';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

const isSpeechRecognitionAvailable = Platform.OS === 'web' && typeof window !== 'undefined' && !!((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

export const VoiceCheckInModal: React.FC<RootScreenProps<'VoiceCheckIn'>> = ({ navigation, route }) => {
  const { mothers } = useMothers();
  const { selectedMother, selectMother } = useSelectedMother(mothers, route.params?.motherId);
  const [selectedLanguage, setSelectedLanguage] = useState<'Hindi' | 'English'>('Hindi');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualSymptoms, setManualSymptoms] = useState<string[]>([]);
  const [manualNotes, setManualNotes] = useState('');
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const startRecording = () => {
    setResult(null);
    setLiveTranscript('');
    setIsRecording(true);

    const SpeechRecognitionCtor = (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsRecording(false);
      return;
    }

    try {
      const rec = new SpeechRecognitionCtor();
      rec.lang = selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-IN';
      rec.continuous = false;
      rec.interimResults = true;

      let finalTranscript = '';
      rec.onresult = (event: any) => {
        const current = Array.from(event.results).map((res: any) => res[0].transcript).join('');
        finalTranscript = current;
        setLiveTranscript(current);
      };
      rec.onend = () => {
        setIsRecording(false);
        if (finalTranscript.trim().length > 0) {
          setResult(analyzeVoiceTranscript(finalTranscript, selectedLanguage));
        }
      };
      rec.onerror = () => setIsRecording(false);

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn('Speech recognition failed to start:', e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
  };

  const toggleManualSymptom = (symptom: string) => {
    setManualSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
  };

  const handleBuildFromManual = () => {
    const dangerSet = new Set(QUICK_SELECT_SYMPTOMS.filter((s) => s.isDangerSign).map((s) => s.symptom));
    const dangerSigns = manualSymptoms.filter((s) => dangerSet.has(s));
    setResult(buildResultFromManualSelection(manualSymptoms, dangerSigns, manualNotes, selectedLanguage));
  };

  const removeSymptomFromResult = (symptom: string) => {
    if (!result) return;
    setResult({
      ...result,
      extractedSymptoms: result.extractedSymptoms.filter((s) => s !== symptom),
      dangerSigns: result.dangerSigns.filter((s) => s !== symptom),
    });
  };

  const handleConfirm = () => {
    if (!selectedMother || !result) return;

    const riskLevel = result.riskContribution;
    const screening: ScreeningResult = {
      id: `scr-${Date.now()}`,
      motherId: selectedMother.id,
      motherName: selectedMother.name,
      gestationalAgeWeeks: selectedMother.gestationalAgeWeeks,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      type: 'VOICE_CHECKIN',
      overallRisk: riskLevel,
      anemiaRisk: result.extractedSymptoms.includes('Fatigue') ? 'MEDIUM' : 'LOW',
      pregnancyRisk: riskLevel,
      symptomRisk: riskLevel,
      symptomsChecked: result.extractedSymptoms,
      reasons: [
        `Check-in (${result.detectedLanguage}): "${result.transcript}"`,
        `Reported symptoms: ${result.extractedSymptoms.join(', ') || 'None'}`,
        result.clinicalNote,
      ],
      recommendation: result.dangerSigns.length > 0
        ? 'Danger sign reported. Immediate medical evaluation needed.'
        : 'Added reported symptoms to the longitudinal record. Corroborate at the next ANC contact.',
      isPrototypeEngine: true,
      voiceTranscript: result.transcript,
      extractedSymptoms: result.extractedSymptoms,
      detectedLanguage: result.detectedLanguage,
    };

    navigation.replace('ScreeningResultScreen', { screening });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Check-in</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: SPACING.md }} keyboardShouldPersistTaps="handled">
        <MotherPickerField mothers={mothers} selectedMother={selectedMother} onSelect={selectMother} />

        <View style={styles.langRow}>
          <Text style={styles.langLabel}>Language:</Text>
          <View style={styles.langPills}>
            {(['Hindi', 'English'] as const).map((lang) => (
              <TouchableOpacity key={lang} style={[styles.langPill, selectedLanguage === lang && styles.langPillActive]} onPress={() => setSelectedLanguage(lang)}>
                <Text style={[styles.langPillText, selectedLanguage === lang && styles.langPillTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isSpeechRecognitionAvailable ? (
          <View style={styles.micCard}>
            <Text style={styles.promptText}>
              {selectedLanguage === 'Hindi' ? '"आप आज कैसा महसूस कर रही हैं?"' : '"How are you feeling today?"'}
            </Text>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!selectedMother}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color={COLORS.textInverted} />
            </TouchableOpacity>
            <Text style={styles.micStatusText}>{isRecording ? 'Listening…' : 'Tap to speak'}</Text>

            {(liveTranscript.length > 0 || isRecording) && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>Recognized speech</Text>
                <Text style={styles.transcriptText}>{liveTranscript || 'Listening…'}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.manualCard}>
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoBannerText}>Voice-to-text is not available in this build on this device. Select reported symptoms below, or type notes.</Text>
            </View>

            <Text style={styles.manualSectionTitle}>Select reported symptoms</Text>
            <View style={styles.chipRow}>
              {QUICK_SELECT_SYMPTOMS.map(({ symptom, isDangerSign }) => {
                const isSelected = manualSymptoms.includes(symptom);
                return (
                  <TouchableOpacity
                    key={symptom}
                    style={[styles.chip, isSelected && (isDangerSign ? styles.chipDangerActive : styles.chipActive)]}
                    onPress={() => toggleManualSymptom(symptom)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{symptom}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.manualSectionTitle}>Additional notes</Text>
            <TextInput style={styles.notesInput} multiline value={manualNotes} onChangeText={setManualNotes} placeholder="Anything else the mother reported..." placeholderTextColor={COLORS.textMuted} />

            <PrimaryButton title="Review Symptoms" onPress={handleBuildFromManual} iconName="checkmark-circle-outline" variant="primary" disabled={!selectedMother || (manualSymptoms.length === 0 && !manualNotes.trim())} style={{ marginTop: SPACING.md }} />
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.resultTitle}>Confirm Detected Symptoms</Text>
            </View>

            {result.extractedSymptoms.length === 0 ? (
              <Text style={styles.noSymptomsText}>No symptoms detected. You can still save this check-in.</Text>
            ) : (
              <View style={styles.symptomsRow}>
                {result.extractedSymptoms.map((symptom) => (
                  <TouchableOpacity key={symptom} style={[styles.symptomTag, result.dangerSigns.includes(symptom) && styles.symptomTagDanger]} onPress={() => removeSymptomFromResult(symptom)}>
                    <Text style={[styles.symptomTagText, result.dangerSigns.includes(symptom) && styles.symptomTagTextDanger]}>{symptom}</Text>
                    <Ionicons name="close" size={12} color={result.dangerSigns.includes(symptom) ? COLORS.riskHigh : COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.helperText}>Tap a symptom to remove it if it is not correct.</Text>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Recommended action</Text>
              <Text style={styles.noteBody}>{result.clinicalNote}</Text>
            </View>

            <PrimaryButton title="Save Check-in" onPress={handleConfirm} iconName="save" variant="primary" size="large" style={{ marginTop: SPACING.md }} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  body: { flex: 1 },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  langLabel: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textSecondary },
  langPills: { flexDirection: 'row', gap: 6 },
  langPill: { backgroundColor: COLORS.cardBg, paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  langPillActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  langPillText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary },
  langPillTextActive: { color: COLORS.primaryDark },
  micCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, ...SHADOWS.card },
  promptText: { ...TYPOGRAPHY.body, fontStyle: 'italic', color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
  micButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glowPrimary },
  micButtonActive: { backgroundColor: COLORS.riskHigh },
  micStatusText: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginTop: SPACING.md },
  transcriptBox: { backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, width: '100%' },
  transcriptLabel: { ...TYPOGRAPHY.label, color: COLORS.primary, marginBottom: 4 },
  transcriptText: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  manualCard: { marginBottom: SPACING.md },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.primaryBorder },
  infoBannerText: { ...TYPOGRAPHY.caption, color: COLORS.primaryDark, flex: 1, lineHeight: 17 },
  manualSectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipDangerActive: { backgroundColor: COLORS.riskHighBg, borderColor: COLORS.riskHigh },
  chipText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.textPrimary },
  notesInput: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, height: 80, fontSize: 14, color: COLORS.textPrimary, textAlignVertical: 'top' },
  resultCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primaryBorder, marginBottom: SPACING.xl, ...SHADOWS.card },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  resultTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  noSymptomsText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  symptomsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  symptomTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primaryBorder },
  symptomTagDanger: { backgroundColor: COLORS.riskHighBg, borderColor: COLORS.riskHigh },
  symptomTagText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.primaryDark },
  symptomTagTextDanger: { color: COLORS.riskHigh },
  helperText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: SPACING.sm },
  noteBox: { backgroundColor: COLORS.cardSecondaryBg, borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.xs },
  noteTitle: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginBottom: 2 },
  noteBody: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, lineHeight: 18 },
});
