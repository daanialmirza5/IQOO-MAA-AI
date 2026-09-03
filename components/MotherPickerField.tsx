import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother } from '../types/mother';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

interface MotherPickerFieldProps {
  mothers: Mother[];
  selectedMother: Mother | null;
  onSelect: (mother: Mother) => void;
}

/** Tappable field showing the currently selected mother, opening a searchable picker sheet. */
export const MotherPickerField: React.FC<MotherPickerFieldProps> = ({ mothers, selectedMother, onSelect }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = mothers.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.village.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <TouchableOpacity style={styles.box} onPress={() => setIsPickerOpen(true)} accessibilityRole="button" accessibilityLabel="Select mother">
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color={COLORS.primaryDark} />
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <Text style={styles.name}>{selectedMother ? selectedMother.name : 'Select a mother'}</Text>
          {selectedMother && (
            <Text style={styles.sub}>
              {selectedMother.age} yrs · {selectedMother.gestationalAgeWeeks} weeks pregnant · {selectedMother.village}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal visible={isPickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsPickerOpen(false)}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Mother</Text>
            <TouchableOpacity onPress={() => setIsPickerOpen(false)} accessibilityLabel="Close picker">
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or village..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  setIsPickerOpen(false);
                  setQuery('');
                }}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>{item.gestationalAgeWeeks} weeks · {item.village}</Text>
                </View>
                {selectedMother?.id === item.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ padding: SPACING.lg }}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, ...SHADOWS.small,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark },
  name: { ...TYPOGRAPHY.bodyStrong, fontSize: 15, color: COLORS.textPrimary },
  sub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  sheetContainer: { flex: 1, backgroundColor: COLORS.background },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, margin: SPACING.lg, marginBottom: 0,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 46,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 15 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  rowName: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  rowSub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
});
