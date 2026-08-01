import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/tokens';

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
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.pill, value === option.value && styles.pillSelected]}
        >
          <Text style={value === option.value ? styles.labelSelected : styles.label}>
            {option.label}
          </Text>
        </Pressable>
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
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  pillSelected: {
    backgroundColor: colors.accentRed,
    shadowColor: colors.accentRed,
    shadowOpacity: 0.25,
  },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  labelSelected: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
