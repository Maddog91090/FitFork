import { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { PressableScale } from './PressableScale';
import { state, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

/** A "go back" link for a pushed screen that has no other way back — same visual pattern as workout-session.tsx's "Quitter". */
export function BackLink() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <PressableScale
      onPress={() => router.back()}
      accessibilityRole="button"
      hitSlop={state.hitSlop}
      style={styles.touchable}
    >
      <Text style={styles.label}>‹ Retour</Text>
    </PressableScale>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    touchable: { minHeight: state.minTouchSize, justifyContent: 'center', alignSelf: 'flex-start' },
    label: { ...typography.caption, color: colors.textSecondary },
  });
}
