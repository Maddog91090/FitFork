import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { radius, shadow, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

type TextFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  testID?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  testID,
}: TextFieldProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        testID={testID}
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      ...shadow.card,
    },
    inputFocused: {
      borderWidth: 2,
      borderColor: colors.accentRed,
      // Keep the box the same size when the focus ring thickens.
      paddingVertical: spacing.md - 1,
      paddingHorizontal: spacing.md - 1,
    },
  });
}
