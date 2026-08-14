import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { PressableScale } from './ui/PressableScale';
import type { ChoiceOption } from './ChoiceGroup';
import { useThemeColors } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';
import type { ButtonDomain } from './ui/Button';

type TagFilterGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  /** Domain color for selected pills. Defaults to `'progress'`. */
  domain?: ButtonDomain;
};

export function TagFilterGroup<T extends string>({ options, value, onChange, domain }: TagFilterGroupProps<T>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPillStyles(colors, domain), [colors, domain]);

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
          <PressableScale
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={selected ? styles.labelSelected : styles.label}>{option.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
