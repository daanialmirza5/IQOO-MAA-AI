import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AlertCard } from '../components/AlertCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/SkeletonLoader';
import { ErrorState } from '../components/ErrorState';
import { useAlerts } from '../hooks/useAlerts';
import { useMothers } from '../hooks/useMothers';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const AlertsScreen: React.FC = () => {
  const { alerts, isLoading, error, refresh, resolve, snooze } = useAlerts();
  const { mothers, refresh: refreshMothers } = useMothers();
  const navigation = useAppNavigation();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'URGENT' | 'HIGH_PRIORITY' | 'FOLLOW_UP'>('ALL');

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredAlerts = alerts.filter((alert) => selectedFilter === 'ALL' || alert.priority === selectedFilter);

  const handleViewMother = (motherId: string) => {
    const mother = mothers.find((m) => m.id === motherId);
    if (mother) navigation.navigate('MotherDetail', { motherId: mother.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Alert Center"
        subtitle={`${alerts.filter((a) => !a.isResolved).length} active items needing follow-up`}
      />

      <View style={styles.filterBar}>
        {(
          [
            { id: 'ALL', label: 'All Alerts' },
            { id: 'URGENT', label: 'Urgent' },
            { id: 'HIGH_PRIORITY', label: 'Priority' },
            { id: 'FOLLOW_UP', label: 'Follow-Up' },
          ] as const
        ).map((item) => {
          const isActive = selectedFilter === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.filterPill, isActive && styles.activeFilterPill]}
              onPress={() => setSelectedFilter(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterText, isActive && styles.activeFilterText]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <ErrorState description={error} onRetry={refresh} />
      ) : isLoading ? (
        <View style={styles.listContent}>
          <ListSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onViewMother={() => handleViewMother(item.motherId)}
              onMarkFollowedUp={async () => { await resolve(item.id); await refreshMothers(); }}
              onSnooze={() => snooze(item.id, 24)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="All Clear!"
              description="No active alerts matching the selected category."
              iconName="checkmark-done-circle-outline"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterBar: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.xs },
  filterPill: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
  },
  activeFilterPill: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary },
  activeFilterText: { color: COLORS.textInverted },
  listContent: { padding: SPACING.lg, paddingBottom: 60 },
});
