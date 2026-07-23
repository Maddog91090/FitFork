import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
});
