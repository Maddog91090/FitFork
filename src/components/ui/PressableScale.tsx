import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { state, motion } from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * A Pressable that springs down on touch instead of snapping. This is the
 * "chips and cells" press pattern from the design system — a spring rather
 * than a static scale, so a tap feels physical and claymorphic-squishy.
 * Buttons have their own press animation (color + scale together, see
 * Button.tsx); do not use this for them.
 *
 * The scale rests at 1 and drops to state.pressedScale under the finger; the
 * snappy spring gives the release a visible bounce.
 */
export function PressableScale({ style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(1 - pressed.value * (1 - state.pressedScale), motion.spring.snappy) },
    ],
  }));

  return (
    <AnimatedPressable
      {...props}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        pressed.value = 1;
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = 0;
        onPressOut?.(e);
      }}
    >
      {props.children}
    </AnimatedPressable>
  );
}
