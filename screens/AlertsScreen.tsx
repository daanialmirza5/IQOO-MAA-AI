import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { HealthAlert } from '../types/alert';
import { Mother } from '../types/mother';
import { AlertCard } from '../components/AlertCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface AlertsScreenProps {
  alerts: HealthAlert[];
  mothers: Mother[];
  onSelectMother: (mother: Mother) => void;
  onResolveAlert: (alertId: string) => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  alerts,
  mothers,
  onSelectMother,
  onResolveAlert,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'URGENT' | 'HIGH_PRIORITY' | 'FOLLOW_UP'>('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedFilter === 'ALL') return true;
    return alert.priority === selectedFilter;
  });

  const handleViewMother = (motherId: string) => {
    const mother = mothers.find((m) => m.id === motherId);
    if (mother) {
      onSelectMother(mother);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <AppHeader
        title="Field Alerts"
        subtitle={`${alerts.filter((a) => !a.isResolved).length} active action items needing follow-up`}
      />

      <View style={styles.filterBar}>
        {(
          [
            { id: 'ALL', label: 'All Alerts' },
            { id: 'URGENT', label: '🔴 Urgent' },
            { id: 'HIGH_PRIORITY', label: '🟠 Priority' },
            { id: 'FOLLOW_UP', label: '🟡 Follow-Up' },
          ] as const
        ).map((item) => {
          const isActive = selectedFilter === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.filterPill, isActive && styles.activeFilterPill]}
              onPress={() => setSelectedFilter(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onViewMother={() => handleViewMother(item.motherId)}
            onMarkFollowedUp={() => onResolveAlert(item.id)}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
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
