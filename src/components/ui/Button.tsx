import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { radius, shadow, spacing, state, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false }: ButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !isDisabled && (variant === 'primary' ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textOnAccent : colors.textPrimary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' ? styles.labelPrimary : styles.labelSecondary,
            isDisabled && styles.labelDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.md,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      minHeight: state.minTouchSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: colors.accentRed,
      ...shadow.button,
    },
    // Pressed states darken rather than fade: the shadow stays put, so the
    // button reads as pushed in instead of half-disabled.
    primaryPressed: {
      backgroundColor: colors.accentRedDeep,
    },
    secondary: {
      backgroundColor: colors.bgSurface,
      ...shadow.card,
    },
    secondaryPressed: {
      backgroundColor: colors.bgSunken,
    },
    disabled: {
      backgroundColor: colors.bgSurface,
      shadowOpacity: 0.04,
      elevation: 0,
    },
    label: {
      ...typography.label,
    },
    labelPrimary: {
      color: colors.textOnAccent,
    },
    labelSecondary: {
      color: colors.textPrimary,
    },
    labelDisabled: {
      color: colors.textSecondary,
    },
  });
}
