import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'accent';
  iconName?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'normal' | 'large';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  iconName,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'normal',
}) => {
  let bgColor = COLORS.primary;
  let textColor = COLORS.textInverted;
  let borderColor = 'transparent';

  if (variant === 'secondary') {
    bgColor = COLORS.primaryLight;
    textColor = COLORS.primary;
  } else if (variant === 'accent') {
    bgColor = COLORS.accent;
    textColor = COLORS.textInverted;
  } else if (variant === 'outline') {
    bgColor = 'transparent';
    textColor = COLORS.primary;
    borderColor = COLORS.primary;
  } else if (variant === 'danger') {
    bgColor = COLORS.riskHigh;
    textColor = COLORS.textInverted;
  }

  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: disabled ? COLORS.disabled : bgColor, borderColor },
        isLarge && styles.largeButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {iconName && (
            <Ionicons
              name={iconName}
              size={isLarge ? 22 : 18}
              color={textColor}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: textColor },
              isLarge && styles.largeText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    minWidth: 120,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  largeButton: {
    height: 58,
    paddingHorizontal: SPACING.xxl,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  largeText: {
    fontSize: 18,
  },
});
