import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { PressableScale } from './ui/PressableScale';
import { useThemeColors } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';
import type { ButtonDomain } from './ui/Button';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Domain color for the selected pill. Defaults to `'progress'`, matching the previous fixed `accentRed`. */
  domain?: ButtonDomain;
};

export function ChoiceGroup<T extends string>({ options, value, onChange, domain }: ChoiceGroupProps<T>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPillStyles(colors, domain), [colors, domain]);
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <PressableScale
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === option.value }}
          testID={`choice-pill-${option.value}`}
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
