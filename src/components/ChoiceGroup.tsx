import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useMaterialTertiary, withRippleAlpha } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';
import type { ButtonDomain } from './ui/Button';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Domain color for the selected pill. Defaults to `'progress'` via `useMaterialTertiary`. */
  domain?: ButtonDomain;
};

export function ChoiceGroup<T extends string>({ options, value, onChange, domain }: ChoiceGroupProps<T>) {
  const tertiary = useMaterialTertiary(domain);
  const styles = useMemo(() => createPillStyles(tertiary), [tertiary]);
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            testID={`choice-pill-${option.value}`}
            android_ripple={{ color: selected ? withRippleAlpha(tertiary.onTertiary) : withRippleAlpha(tertiary.tertiary) }}
            style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pressed]}
          >
            <Text style={selected ? styles.labelSelected : styles.label}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
