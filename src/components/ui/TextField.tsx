import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import {
  materialElevation,
  materialTypography,
  radius,
  smokedGlass,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

type TextFieldProps = {
  label?: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean; autoCapitalize?: TextInputProps['autoCapitalize']; testID?: string;
  /** Set when the field sits on a `smokedGlass` well (see tokens.ts) instead
   *  of the screen's normal light background — flips the overline label to
   *  `smokedGlass.text` so it stays readable. The input pill itself stays
   *  opaque/light either way, for typing legibility. */
  onDark?: boolean;
};

export function TextField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, testID, onDark }: TextFieldProps) {
  const colors = useMaterialColors();
  const focus = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, focus.tertiary, onDark ?? false), [colors, focus, onDark]);
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

function createStyles(colors: MaterialColorScheme, focusColor: string, onDark: boolean) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: {
      ...materialTypography.overline,
      color: onDark ? smokedGlass.text : colors.onSurfaceVariant,
      marginBottom: spacing.xs,
      ...(onDark ? smokedGlass.textShadow : null),
    },
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
