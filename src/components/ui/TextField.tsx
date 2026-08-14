import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import {
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

type TextFieldProps = {
  label?: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean; autoCapitalize?: TextInputProps['autoCapitalize']; testID?: string;
};

export function TextField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, testID }: TextFieldProps) {
  const colors = useMaterialColors();
  const focus = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, focus.tertiary), [colors, focus]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        testID={testID}
        style={[styles.input, focused && styles.inputFocused]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, focusColor: string) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
    input: {
      ...materialTypography.bodyLarge, backgroundColor: colors.surface, borderRadius: radius.sm,
      paddingVertical: spacing.md, paddingHorizontal: spacing.md,
      borderWidth: 1, borderColor: colors.outlineVariant, color: colors.onSurface, ...materialElevation,
    },
    inputFocused: {
      borderWidth: 2, borderColor: focusColor,
      paddingVertical: spacing.md - 1, paddingHorizontal: spacing.md - 1,
    },
  });
}
