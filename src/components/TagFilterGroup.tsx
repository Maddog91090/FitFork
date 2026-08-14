import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ChoiceOption } from './ChoiceGroup';
import { useMaterialTertiary, withRippleAlpha } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';
import type { ButtonDomain } from './ui/Button';

type TagFilterGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  /** Domain color for selected pills. Defaults to `'progress'` via `useMaterialTertiary`. */
  domain?: ButtonDomain;
};

export function TagFilterGroup<T extends string>({ options, value, onChange, domain }: TagFilterGroupProps<T>) {
  const tertiary = useMaterialTertiary(domain);
  const styles = useMemo(() => createPillStyles(tertiary), [tertiary]);

  const toggle = (optionValue: T) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
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
