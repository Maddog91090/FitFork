import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { GlassSurface } from './GlassSurface';

type CardVariant = 'solid' | 'glass';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
};

export function Card({ children, style, variant = 'solid' }: CardProps) {
  if (variant === 'glass') {
    return <GlassSurface style={[styles.shape, style]}>{children}</GlassSurface>;
  }
  return <View style={[styles.shape, styles.solid, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  shape: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  solid: {
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
});
