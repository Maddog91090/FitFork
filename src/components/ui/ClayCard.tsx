import { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clayOverlay, radius, shadow, spacing, useThemeColors, type ThemeColors } from '../../theme/tokens';

type ClayCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * The claymorphic card: warm two-layer shadow plus a diagonal `clayOverlay`
 * sheen faking a puffy inner highlight (React Native has no inset shadow).
 * The sheen gets its own `borderRadius` matching the card — a view clips its
 * own gradient fill to its own radius, so this view deliberately keeps
 * `overflow: visible` to avoid clipping its own drop shadow too.
 */
export function ClayCard({ children, style }: ClayCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, style, shadow.card]}>
      <LinearGradient
        colors={clayOverlay.colors}
        locations={clayOverlay.locations}
        start={clayOverlay.start}
        end={clayOverlay.end}
        style={[StyleSheet.absoluteFill, styles.sheen]}
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
      padding: spacing.md,
    },
    sheen: {
      borderRadius: radius.lg,
    },
  });
}
