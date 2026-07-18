import { View, Text, Pressable, StyleSheet } from 'react-native';

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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: { borderWidth: 1, borderColor: '#888', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  pillSelected: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  label: { color: '#333' },
  labelSelected: { color: '#fff' },
});
