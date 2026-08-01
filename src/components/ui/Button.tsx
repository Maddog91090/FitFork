import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { motion, useReducedMotion } from '../../theme/motion';

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
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // Reanimated's SharedValue.value is an intentional mutable escape hatch (like ref.current);
    // React Compiler's static analysis doesn't recognize it and flags this as an illegal mutation.
    // eslint-disable-next-line react-hooks/immutability
    scale.value = reduceMotion ? 0.97 : withSpring(0.97, motion.spring.press);
  };

  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = reduceMotion ? 1 : withSpring(1, motion.spring.press);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
    </Animated.View>
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
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
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
