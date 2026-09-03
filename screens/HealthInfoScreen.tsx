import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchReference } from '../services/reference/medicalReference';
import { RootScreenProps } from '../navigation/types';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

/**
 * General maternal-health education, deliberately built as a simple
 * search-and-read reference list rather than a chat interface — there is no
 * live LLM behind this, and a chat-shaped UI would misrepresent a static
 * lookup as a conversational AI. See services/reference/medicalReference.ts.
 */
export const HealthInfoScreen: React.FC<RootScreenProps<'HealthInfo'>> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const results = searchReference(query);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics — e.g. Hb, blood pressure, ANC visits"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.disclaimerBanner}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryDark} />
        <Text style={styles.disclaimerText}>
          General education only — not a diagnosis or personal medical advice. Always confirm with a qualified healthcare provider.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {results.length === 0 ? (
          <Text style={styles.noResults}>No topics matched your search.</Text>
        ) : (
          results.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                activeOpacity={0.8}
                onPress={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryQuestion}>{entry.question}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
                </View>
                {isExpanded && (
                  <>
                    <Text style={styles.entryAnswer}>{entry.answer}</Text>
                    <Text style={styles.entrySource}>Source: {entry.source}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.cardBg, marginHorizontal: SPACING.lg, marginTop: SPACING.md, paddingHorizontal: SPACING.md, height: 44, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  disclaimerBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, marginHorizontal: SPACING.lg, marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primaryBorder },
  disclaimerText: { ...TYPOGRAPHY.caption, color: COLORS.primaryDark, flex: 1, lineHeight: 17 },
  scrollContent: { padding: SPACING.lg },
  noResults: { ...TYPOGRAPHY.body, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
  entryCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
  entryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  entryQuestion: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flex: 1 },
  entryAnswer: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: SPACING.sm, lineHeight: 20 },
  entrySource: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: SPACING.sm, fontStyle: 'italic' },
});
