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

export type MascotPose = 'idle' | 'celebrating';

const MASCOT_SOURCES: Record<MascotPose, ImageProps['source']> = {
  idle: require('../../../assets/images/mascot/mascot-idle.png'),
  celebrating: require('../../../assets/images/mascot/mascot-celebrating.png'),
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
 * overshooting spring instead. `style` fully replaces the default
 * size-based sizing when given, so a caller that needs responsive sizing
 * (percentage width, aspectRatio) doesn't fight a baked-in width/height.
 */
export function Mascot({ pose, size = 160, style }: MascotProps) {
  const scale = useSharedValue(pose === 'celebrating' ? 0.5 : 1);

  useEffect(() => {
    if (pose === 'idle') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      scale.value = withSpring(1, motion.spring.celebrate);
    }
  }, [pose, scale]);

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
