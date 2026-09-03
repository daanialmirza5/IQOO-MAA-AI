import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

const SkeletonBox: React.FC<SkeletonBoxProps> = ({ width = '100%', height = 14, radius = RADIUS.sm, style }) => {
  // Lazy useState initializer instead of useRef(...).current — avoids
  // reading a ref's value synchronously during render.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: COLORS.borderLight, opacity },
        style,
      ]}
    />
  );
};

/** Placeholder for a MotherCard-shaped list row while data loads. */
export const MotherCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <SkeletonBox width={120} height={16} />
      <SkeletonBox width={70} height={20} radius={RADIUS.full} />
    </View>
    <SkeletonBox width="60%" height={12} style={{ marginTop: 8 }} />
    <SkeletonBox width="80%" height={12} style={{ marginTop: 8 }} />
  </View>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <MotherCardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
