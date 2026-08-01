import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.textPrimary} />
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

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accentRed,
    ...shadow.button,
  },
  secondary: {
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  disabled: {
    backgroundColor: colors.bgSurface,
    shadowOpacity: 0.04,
    elevation: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
});
