import { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import { typography } from '../theme/typography';
import { motion, useReducedMotion } from '../theme/motion';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function ChoiceGroup<T extends string>({ options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map((option) => (
        <Pill
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

type PillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Pill({ label, selected, onPress }: PillProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    selectedProgress.value = reduceMotion ? target : withSpring(target, motion.spring.settle);
  }, [selected, reduceMotion, selectedProgress]);

  const handlePressIn = () => {
    scale.value = reduceMotion ? 0.97 : withSpring(0.97, motion.spring.press);
  };

  const handlePressOut = () => {
    scale.value = reduceMotion ? 1 : withSpring(1, motion.spring.press);
  };

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [colors.bgSurface, colors.accentRed]
    ),
    shadowColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [shadow.card.shadowColor, colors.accentRed]
    ),
    shadowOpacity:
      shadow.card.shadowOpacity + (0.25 - shadow.card.shadowOpacity) * selectedProgress.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedProgress.value, [0, 1], [colors.textPrimary, '#FFFFFF']),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Animated.View style={[styles.pill, animatedPillStyle]}>
        <Animated.Text style={[styles.label, animatedLabelStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    elevation: shadow.card.elevation,
    shadowOffset: shadow.card.shadowOffset,
    shadowRadius: shadow.card.shadowRadius,
  },
  label: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '600',
  },
});
