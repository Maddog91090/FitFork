import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolateColor } from 'react-native-reanimated';
import {
  clayOverlay,
  radius,
  shadow,
  spacing,
  state,
  typography,
  motion,
  useThemeColors,
  type ThemeColors,
} from '../../theme/tokens';
import { useReducedMotion } from '../../lib/useReducedMotion';

export type ClayButtonDomain = 'nutrition' | 'sport' | 'progress' | 'neutral';
type ClayButtonVariant = 'primary' | 'secondary';

type ClayButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ClayButtonVariant;
  /** Which domain color fills the button. Ignored for variant="secondary" (always a neutral surface fill). */
  domain?: ClayButtonDomain;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * The claymorphic button: scale and fill-color animate together off a single
 * sprung shared value (`motion.spring.snappy`), so the squish and the color
 * darken read from the same continuously-animating value every frame. Primary
 * gets the `clayOverlay` puffy sheen; secondary doesn't.
 */
export function ClayButton({ title, onPress, variant = 'primary', domain = 'progress', disabled = false, loading = false }: ClayButtonProps) {
  const colors = useThemeColors();
  const pressed = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const base = variant === 'primary' ? domainFill(colors, domain) : colors.bgSurface;
  const deep = variant === 'primary' ? domainDeepFill(colors, domain) : colors.bgSunken;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
    backgroundColor: interpolateColor(pressed.value, [0, 1], [base, deep]),
  }));

  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);

  return (
    <Animated.View
      style={[
        styles.base,
        variant === 'primary' ? { shadowColor: domainDeepFill(colors, domain) } : { shadowColor: colors.textPrimary },
        shadow.subtle,
        animatedStyle,
        isDisabled && styles.disabled,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = reducedMotion ? 1 : withSpring(1, motion.spring.snappy);
        }}
        onPressOut={() => {
          pressed.value = reducedMotion ? 0 : withSpring(0, motion.spring.snappy);
        }}
        style={styles.pressable}
      >
        {variant === 'primary' && !isDisabled && (
          <LinearGradient
            colors={clayOverlay.colors}
            locations={clayOverlay.locations}
            start={clayOverlay.start}
            end={clayOverlay.end}
            style={[StyleSheet.absoluteFill, styles.sheen]}
          />
        )}
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.textOnAccent : colors.textPrimary} />
        ) : (
          <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function domainFill(colors: ThemeColors, domain: ClayButtonDomain): string {
  return { nutrition: colors.domainNutrition, sport: colors.domainSport, progress: colors.domainProgress, neutral: colors.domainNeutral }[domain];
}

function domainDeepFill(colors: ThemeColors, domain: ClayButtonDomain): string {
  return { nutrition: colors.domainNutritionDeep, sport: colors.domainSportDeep, progress: colors.domainProgressDeep, neutral: colors.domainNeutralDeep }[domain];
}

function createStyles(colors: ThemeColors, variant: ClayButtonVariant) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.lg,
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: colors.border,
    },
    pressable: {
      minHeight: state.minTouchSize,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: radius.lg,
    },
    sheen: {
      borderRadius: radius.lg,
    },
    disabled: {
      opacity: state.disabledOpacity,
    },
    label: {
      ...typography.label,
      color: variant === 'primary' ? colors.textOnAccent : colors.textPrimary,
    },
    labelDisabled: {
      color: colors.textSecondary,
    },
  });
}
