import { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { materialElevation, radius, spacing, useMaterialColors, type MaterialColorScheme } from '../../theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...materialElevation,
    },
  });
}
