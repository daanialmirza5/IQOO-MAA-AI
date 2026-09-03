import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { RiskLevel } from '../types/mother';
import { MotherCard } from '../components/MotherCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/SkeletonLoader';
import { ErrorState } from '../components/ErrorState';
import { useMothers } from '../hooks/useMothers';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

type SortOption = 'RISK' | 'RECENT' | 'ANC_DUE' | 'DETERIORATING';

const SORT_LABELS: Record<SortOption, string> = {
  RISK: 'Highest Risk',
  RECENT: 'Recently Updated',
  ANC_DUE: 'ANC Due',
  DETERIORATING: 'Recently Deteriorating',
};

const RISK_RANK: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export const MothersScreen: React.FC = () => {
  const { mothers, isLoading, error, refresh } = useMothers();
  const navigation = useAppNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('RISK');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredMothers = useMemo(() => {
    let result = mothers.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q || m.name.toLowerCase().includes(q) || m.village.toLowerCase().includes(q) || m.phone.includes(searchQuery) || m.id.toLowerCase().includes(q);
      const matchesFilter = selectedFilter === 'ALL' || m.riskLevel === selectedFilter;
      return matchesSearch && matchesFilter;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'RISK':
          return RISK_RANK[a.riskLevel] - RISK_RANK[b.riskLevel];
        case 'RECENT':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'ANC_DUE':
          return (b.needsFollowUp ? 1 : 0) - (a.needsFollowUp ? 1 : 0);
        case 'DETERIORATING':
          return (b.hbTrend === 'DECLINING' ? 1 : 0) - (a.hbTrend === 'DECLINING' ? 1 : 0);
        default:
          return 0;
      }
    });

    return result;
  }, [mothers, searchQuery, selectedFilter, sortBy]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Registered Mothers"
        subtitle={`${mothers.length} in your caseload`}
        rightActionIcon="person-add"
        onRightAction={() => navigation.navigate('NewMother')}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, village, ID, phone..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search mothers"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.activeFilterPill]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${filter === 'ALL' ? 'all mothers' : filter + ' risk'}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                  {filter === 'ALL' ? `All (${mothers.length})` : `${filter} RISK`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sortRow}>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu((s) => !s)} accessibilityRole="button" accessibilityLabel="Change sort order">
            <Ionicons name="swap-vertical-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.sortBtnText}>Sort: {SORT_LABELS[sortBy]}</Text>
            <Ionicons name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {showSortMenu && (
          <View style={styles.sortMenu}>
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.sortMenuItem}
                onPress={() => { setSortBy(opt); setShowSortMenu(false); }}
              >
                <Text style={[styles.sortMenuText, sortBy === opt && { color: COLORS.primary, fontWeight: '700' }]}>{SORT_LABELS[opt]}</Text>
                {sortBy === opt && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {error ? (
        <ErrorState description={error} onRetry={refresh} />
      ) : isLoading ? (
        <View style={styles.listContent}>
          <ListSkeleton count={5} />
        </View>
      ) : (
        <FlatList
          data={filteredMothers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MotherCard
              mother={item}
              onPress={() => navigation.navigate('MotherDetail', { motherId: item.id })}
              onScreenPress={() => navigation.navigate('CameraScreening', { motherId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Mothers Found"
              description={searchQuery ? `No mother matches "${searchQuery}".` : 'No mothers registered under this filter.'}
              iconName="people-outline"
              buttonTitle="+ Add New Mother"
              onButtonPress={() => navigation.navigate('NewMother')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, height: 48, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: SPACING.xs + 2 },
  filterPill: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
  },
  activeFilterPill: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary },
  activeFilterText: { color: COLORS.textInverted },
  sortRow: { marginTop: SPACING.sm },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  sortBtnText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  sortMenu: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    marginTop: SPACING.xs, overflow: 'hidden', ...SHADOWS.card,
  },
  sortMenuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  sortMenuText: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  listContent: { padding: SPACING.lg, paddingBottom: 60 },
});
