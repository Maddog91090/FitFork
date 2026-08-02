import { View, StyleSheet, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';

const WIDE_BREAKPOINT = 700;
const WIDE_CONTENT_MAX_WIDTH = 600;

type ScreenProps = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, edges = ['top', 'bottom'], style }: ScreenProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      <View style={[styles.content, isWide && styles.contentWide]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
