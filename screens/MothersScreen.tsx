import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mother, RiskLevel } from '../types/mother';
import { MotherCard } from '../components/MotherCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface MothersScreenProps {
  mothers: Mother[];
  onSelectMother: (mother: Mother) => void;
  onOpenNewMother: () => void;
  onOpenScreening: (mother?: Mother) => void;
}

export const MothersScreen: React.FC<MothersScreenProps> = ({
  mothers,
  onSelectMother,
  onOpenNewMother,
  onOpenScreening,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | RiskLevel>('ALL');

  const filteredMothers = mothers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    const matchesFilter =
      selectedFilter === 'ALL' || m.riskLevel === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Registered Mothers"
        subtitle={`${mothers.length} total active pregnant women`}
        rightActionIcon="person-add"
        onRightAction={onOpenNewMother}
      />

      <View style={styles.searchContainer}>
        {/* Search input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search mother name, village..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  isActive && styles.activeFilterPill,
                  filter === 'HIGH' && isActive && { backgroundColor: COLORS.riskHigh },
                  filter === 'MEDIUM' && isActive && { backgroundColor: COLORS.riskMedium },
                  filter === 'LOW' && isActive && { backgroundColor: COLORS.riskLow },
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.activeFilterText,
                  ]}
                >
                  {filter === 'ALL' ? 'All (24)' : `${filter} RISK`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredMothers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MotherCard
            mother={item}
            onPress={() => onSelectMother(item)}
            onScreenPress={() => onOpenScreening(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No Mothers Found"
            description={
              searchQuery
                ? `No pregnant mother matches "${searchQuery}".`
                : 'No mothers registered under this filter category.'
            }
            iconName="people-outline"
            buttonTitle="+ Add New Mother"
            onButtonPress={onOpenNewMother}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: COLORS.textInverted,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
});
