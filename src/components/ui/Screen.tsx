import { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { type ThemeColors } from '../../theme/tokens';
import { useColors } from '../../theme/useColors';

export const WIDE_BREAKPOINT = 700;
const WIDE_CONTENT_MAX_WIDTH = 600;

type ScreenProps = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, edges = ['top', 'bottom'], style }: ScreenProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      <View style={[styles.content, isWide && styles.contentWide]}>{children}</View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bgBase,
    },
    content: {
      flex: 1,
      width: '100%',
    },
    contentWide: {
      maxWidth: WIDE_CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
  });
