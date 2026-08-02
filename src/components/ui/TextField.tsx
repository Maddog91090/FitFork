import { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, type TextInputProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { radius, shadow, spacing, type ThemeColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { motion, useReducedMotion } from '../../theme/motion';
import { useColors } from '../../theme/useColors';

const isAndroid = Platform.OS === 'android';

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
  const reduceMotion = useReducedMotion();
  const focusProgress = useSharedValue(0);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleFocus = () => {
    focusProgress.value = reduceMotion ? 1 : withSpring(1, motion.spring.settle);
  };

  const handleBlur = () => {
    focusProgress.value = reduceMotion ? 0 : withSpring(0, motion.spring.settle);
  };

  // M3 filled field: a permanent bottom indicator line (outline -> accent on focus).
  // iOS: the established pattern -- a full border that's invisible at rest, colored on focus.
  const animatedWrapperStyle = useAnimatedStyle(() =>
    isAndroid
      ? { borderBottomColor: interpolateColor(focusProgress.value, [0, 1], [colors.outline, colors.accentRed]) }
      : { borderColor: interpolateColor(focusProgress.value, [0, 1], ['transparent', colors.accentRed]) }
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, animatedWrapperStyle]}>
        <TextInput
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
        />
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      letterSpacing: typography.label.letterSpacing,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    inputWrapper: isAndroid
      ? {
          borderTopLeftRadius: radius.sm,
          borderTopRightRadius: radius.sm,
          borderBottomWidth: 2,
          backgroundColor: colors.surfaceVariant,
        }
      : {
          borderRadius: radius.sm,
          borderWidth: 2,
          backgroundColor: colors.bgSurface,
          ...shadow.card,
        },
    input: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      letterSpacing: typography.body.letterSpacing,
      color: colors.textPrimary,
      // react-native-web only: suppress the browser's default focus outline, which otherwise
      // stacks on top of the animated red border above and reads as a stray black ring.
      outlineWidth: 0,
    },
  });
