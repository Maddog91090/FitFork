import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { shadow, type ThemeColors } from '../../theme/tokens';
import { useColors } from '../../theme/useColors';

type GlassSurfaceProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
};

function useReduceTransparency(): boolean {
  // isReduceTransparencyEnabled/'reduceTransparencyChanged' are iOS-only in React Native --
  // calling them on Android or web throws. Real glass is iOS-only too (isGlassEffectAPIAvailable
  // already gates it out elsewhere), so there's nothing to check on other platforms.
  // Conservative default on iOS: treat "unknown" (the async check hasn't resolved yet) the same
  // as "reduced", so a device with the setting on never briefly flashes real glass before settling.
  const [reduced, setReduced] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduced
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

export function GlassSurface({ children, style, tintColor }: GlassSurfaceProps) {
  const reduceTransparency = useReduceTransparency();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!isGlassEffectAPIAvailable() || reduceTransparency) {
    return <View style={[styles.fallback, style]}>{children}</View>;
  }

  return (
    <GlassView style={style} tintColor={tintColor} glassEffectStyle="regular">
      {children}
    </GlassView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fallback: {
      backgroundColor: colors.bgSurface,
      ...shadow.card,
    },
  });
