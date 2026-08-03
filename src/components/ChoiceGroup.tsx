import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './ui/PressableScale';
import { colors, radius, shadow, spacing, state, typography } from '../theme/tokens';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function ChoiceGroup<T extends string>({ options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <PressableScale
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === option.value }}
          style={[styles.pill, value === option.value && styles.pillSelected]}
        >
          <Text style={value === option.value ? styles.labelSelected : styles.label}>
            {option.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    minHeight: state.minTouchSize,
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  pillSelected: {
    backgroundColor: colors.accentRed,
    shadowColor: colors.accentRed,
    shadowOpacity: 0.25,
  },
  label: { ...typography.subheading, color: colors.textPrimary },
  labelSelected: { ...typography.subheading, color: colors.textOnAccent },
});
