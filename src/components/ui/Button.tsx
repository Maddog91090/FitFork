import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import {
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialDomain,
  type MaterialTertiary,
} from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary';
export type ButtonDomain = MaterialDomain;

type ButtonProps = {
  title: string;
  onPress: () => void;
  /** `'primary'` = Filled (fills with the domain's `tertiary`). `'secondary'` = Outlined (transparent, `outline` border). */
  variant?: ButtonVariant;
  /** Which domain's tertiary color fills the button. Ignored for variant="secondary" except for its border/label tint. */
  domain?: ButtonDomain;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  domain = 'progress',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const colors = useMaterialColors();
  const tertiary = useMaterialTertiary(domain);
  const styles = useMemo(() => createStyles(colors, tertiary, variant), [colors, tertiary, variant]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID="button-pressable"
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      android_ripple={{
        color: variant === 'primary' ? tertiary.onTertiary + '1F' : tertiary.tertiary + '1F',
      }}
      style={[styles.base, isDisabled && styles.disabledBase]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? tertiary.onTertiary : colors.onSurface} />
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{title}</Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: MaterialColorScheme, tertiary: MaterialTertiary, variant: ButtonVariant) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      minHeight: state.minTouchSize,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: variant === 'primary' ? tertiary.tertiary : 'transparent',
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: variant === 'secondary' ? colors.outline : 'transparent',
    },
    disabledBase: {
      backgroundColor: variant === 'primary' ? colors.surfaceVariant : 'transparent',
      borderColor: variant === 'secondary' ? colors.outlineVariant : 'transparent',
    },
    label: {
      ...materialTypography.labelLarge,
      color: variant === 'primary' ? tertiary.onTertiary : colors.onSurface,
    },
    labelDisabled: {
      color: colors.onSurfaceVariant,
    },
  });
}
