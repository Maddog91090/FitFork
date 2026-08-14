import { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  materialTypography,
  state,
  useMaterialColors,
  withRippleAlpha,
  type MaterialColorScheme,
} from '../../theme/tokens';

/** A "go back" link for a pushed screen that has no other way back — same visual pattern as workout-session.tsx's "Quitter". */
export function BackLink() {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      hitSlop={state.hitSlop}
      android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant) }}
      style={({ pressed }) => [styles.touchable, pressed && styles.pressed]}
    >
      <Text style={styles.label}>‹ Retour</Text>
    </Pressable>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    touchable: { minHeight: state.minTouchSize, justifyContent: 'center', alignSelf: 'flex-start' },
    pressed: { opacity: 0.85 },
    label: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant },
  });
}
