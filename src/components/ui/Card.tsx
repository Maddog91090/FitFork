import { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { radius, spacing, shadow, type ThemeColors } from '../../theme/tokens';
import { useColors } from '../../theme/useColors';
import { GlassSurface } from './GlassSurface';

type CardVariant = 'solid' | 'glass';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
};

export function Card({ children, style, variant = 'solid' }: CardProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (variant === 'glass') {
    return <GlassSurface style={[styles.shape, style]}>{children}</GlassSurface>;
  }
  return <View style={[styles.shape, styles.solid, style]}>{children}</View>;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    shape: {
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    solid: {
      backgroundColor: colors.bgSurface,
      ...shadow.card,
    },
  });
