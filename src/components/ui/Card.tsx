import { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clayOverlay, radius, shadow, spacing, useThemeColors, type ThemeColors } from '../../theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        testID="card-clay-overlay"
        pointerEvents="none"
        colors={clayOverlay.colors}
        locations={clayOverlay.locations}
        start={clayOverlay.start}
        end={clayOverlay.end}
        style={styles.overlay}
      />
      {children}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      padding: spacing.md,
      ...shadow.card,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      // A view clips its own background/gradient fill to its own radius —
      // this needs no `overflow: 'hidden'` on `card`, which would otherwise
      // also clip `card`'s own drop shadow (see clayOverlay's doc comment
      // in tokens.ts).
      borderRadius: radius.lg,
    },
  });
}
