import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  clayOverlay,
  motion,
  radius,
  shadow,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary';
type ButtonDomain = 'nutrition' | 'sport' | 'progress' | 'neutral';

const DOMAIN_FILL: Record<ButtonDomain, keyof ThemeColors> = {
  nutrition: 'domainNutrition',
  sport: 'domainSport',
  progress: 'domainProgress',
  neutral: 'domainNeutral',
};

const DOMAIN_DEEP: Record<ButtonDomain, keyof ThemeColors> = {
  nutrition: 'domainNutritionDeep',
  sport: 'domainSportDeep',
  progress: 'domainProgressDeep',
  neutral: 'domainNeutralDeep',
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Which domain's clay color fills the button. Ignored for variant="secondary". */
  domain?: ButtonDomain;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  domain = 'neutral',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  const pressed = useSharedValue(0);

  const fillColor = colors[DOMAIN_FILL[domain]];
  const deepColor = colors[DOMAIN_DEEP[domain]];
  const restColor = isDisabled ? colors.bgSurface : variant === 'primary' ? fillColor : colors.bgSurface;
  const downColor = isDisabled ? colors.bgSurface : variant === 'primary' ? deepColor : colors.bgSunken;
  const shadowTint = variant === 'primary' ? deepColor : colors.textPrimary;

  // transform (scale) and backgroundColor are both driven by the same
  // `pressed` shared value, so the squish and the color darken land on the
  // exact same frame — see PressableScale.tsx for the same one-shared-value
  // pattern.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * (1 - state.pressedScale), motion.spring.snappy) }],
    backgroundColor: interpolateColor(pressed.value, [0, 1], [restColor, downColor]),
  }));

  return (
    <AnimatedPressable
      testID="button-pressable"
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPressIn={() => {
        if (!isDisabled) pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      style={[styles.base, { shadowColor: shadowTint }, isDisabled && styles.disabledShadow, animatedStyle]}
    >
      {variant === 'primary' && !isDisabled && (
        <LinearGradient
          testID="button-clay-overlay"
          pointerEvents="none"
          colors={clayOverlay.colors}
          locations={clayOverlay.locations}
          start={clayOverlay.start}
          end={clayOverlay.end}
          style={styles.overlay}
        />
      )}
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
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      minHeight: state.minTouchSize,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.raised,
    },
    disabledShadow: {
      shadowOpacity: 0.04,
      elevation: 0,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      borderRadius: radius.lg,
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
