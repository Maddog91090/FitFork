import { useEffect } from 'react';
import { Image, type ImageProps } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import type { ImageStyle, StyleProp } from 'react-native';
import { motion } from '../../theme/tokens';
import { useReducedMotion } from '../../lib/useReducedMotion';

export type MascotPose = 'idle' | 'celebrating' | 'encouraging';

const MASCOT_SOURCES: Record<MascotPose, ImageProps['source']> = {
  idle: require('../../../assets/images/mascot/mascot-idle.png'),
  celebrating: require('../../../assets/images/mascot/mascot-celebrating.png'),
  encouraging: require('../../../assets/images/mascot/mascot-encouraging.png'),
};

type MascotProps = {
  /** Which moment this appearance is for — see assets/images/mascot/README.md. */
  pose: MascotPose;
  /** Square side in px, used only when `style` is omitted. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The FitPro mascot. `idle` breathes continuously (a slow scale pulse) so it
 * reads as alive even when nothing is happening — the design spec's
 * "présence continue" requirement. `celebrating` bounces in once with an
 * overshooting spring instead. `encouraging` (reassurance after a setback)
 * shares `idle`'s calm breathing rather than bouncing — a triumphant
 * entrance would read as discordant on a setback moment. `style` fully
 * replaces the default size-based sizing when given, so a caller that needs
 * responsive sizing (percentage width, aspectRatio) doesn't fight a
 * baked-in width/height.
 */
export function Mascot({ pose, size = 160, style }: MascotProps) {
  const scale = useSharedValue(pose === 'celebrating' ? 0.5 : 1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      // The breathing loop is a nonessential, indefinitely-looping
      // animation, and the celebration bounce is a spring overshoot —
      // both are exactly what Reduce Motion asks apps to stop. Settle on
      // the resting pose with no animation at all rather than a reduced
      // version of either.
      scale.value = 1;
      return;
    }
    if (pose === 'celebrating') {
      // Reset to the pre-bounce starting point before springing back to 1.
      // Without this, a long-lived Mascot that switches from `idle` (where
      // scale is already ~1, oscillating from the breathing loop) to
      // `celebrating` would spring from ~1 to 1 — a no-op with no visible
      // bounce. Setting `.value` twice synchronously is a standard
      // Reanimated idiom: the first assignment commits immediately, and the
      // `withSpring` animation then starts from that committed value.
      scale.value = 0.5;
      scale.value = withSpring(1, motion.spring.celebrate);
    } else {
      // `idle` and `encouraging` both breathe calmly — a triumphant bounce
      // would feel discordant on `encouraging`'s reassure-after-a-setback
      // moment.
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [pose, scale, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Image
        testID="mascot-image"
        source={MASCOT_SOURCES[pose]}
        style={style ?? { width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}
