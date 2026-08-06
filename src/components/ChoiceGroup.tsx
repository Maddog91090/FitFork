import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { PressableScale } from './ui/PressableScale';
import { useThemeColors } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function ChoiceGroup<T extends string>({ options, value, onChange }: ChoiceGroupProps<T>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPillStyles(colors), [colors]);
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
