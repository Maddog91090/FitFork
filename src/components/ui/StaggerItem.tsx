import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../../theme/motion';

const STEP_MS = 55;
const MAX_DELAY_MS = 280;
const DURATION_MS = 260;

type StaggerItemProps = {
  index: number;
  // Gates the whole reveal, not just the delay -- pass false on refetches/updates so
  // the animation plays once on genuine first load, not every time a list re-renders.
  enabled: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function StaggerItem({ index, enabled, children, style }: StaggerItemProps) {
  const reduceMotion = useReducedMotion();
  const animate = enabled && !reduceMotion;
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    progress.value = withDelay(
      Math.min(index * STEP_MS, MAX_DELAY_MS),
      withTiming(1, { duration: DURATION_MS, easing: Easing.out(Easing.quad) })
    );
    // Intentionally fires once per mount only -- re-running on `index` churn would
    // re-stagger items whenever the list reorders, which reads as a glitch, not delight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
