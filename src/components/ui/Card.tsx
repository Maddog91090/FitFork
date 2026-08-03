import { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { radius, shadow, spacing, useThemeColors, type ThemeColors } from '../../theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow.card,
    },
  });
}
