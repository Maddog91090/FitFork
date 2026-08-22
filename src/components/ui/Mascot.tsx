import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { state } from '../../theme/tokens';

type MascotProps = {
  size?: number;
  /** Optional tap handler. The mascot always reacts to its own tap regardless of whether this is set. */
  onPress?: () => void;
  /**
   * Bump this to a new number (e.g. a counter) to trigger the celebration
   * reaction programmatically, without the user tapping the mascot directly —
   * e.g. when a workout or streak milestone completes.
   */
  celebrateTrigger?: number;
};

const IDLE_HALF_CYCLE_MS = 1300;

/**
 * Dualo, the app's mascot: a continuous idle float/sway, plus a bigger
 * one-shot "celebrate" bounce layered on top — either from a direct tap or
 * from `celebrateTrigger` changing. The two layers are separate shared
 * values summed in the style so they never fight each other; see
 * `creating-reanimated-animations` skill notes on combining animations.
 */
export function Mascot({ size = 96, onPress, celebrateTrigger }: MascotProps) {
  const reducedMotion = useReducedMotion();

  const idleY = useSharedValue(0);
  const idleRotate = useSharedValue(0);
  const reactY = useSharedValue(0);
  const reactScale = useSharedValue(1);
  const reactRotate = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      idleY.value = 0;
      idleRotate.value = 0;
      return;
    }
    idleY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: IDLE_HALF_CYCLE_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: IDLE_HALF_CYCLE_MS, easing: Easing.inOut(Easing.sin) })
      ),
      0,
      false
    );
    idleRotate.value = withRepeat(
      withSequence(
        withTiming(2, { duration: IDLE_HALF_CYCLE_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: IDLE_HALF_CYCLE_MS, easing: Easing.inOut(Easing.sin) })
      ),
      0,
      false
    );
  }, [reducedMotion, idleY, idleRotate]);

  const celebrate = () => {
    if (reducedMotion) return;
    reactY.value = withSequence(
      withTiming(-22, { duration: 260, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 5, stiffness: 220 })
    );
    reactScale.value = withSequence(
      withTiming(1.14, { duration: 260 }),
      withSpring(1, { damping: 5, stiffness: 220 })
    );
    reactRotate.value = withSequence(
      withTiming(-10, { duration: 130 }),
      withTiming(9, { duration: 130 }),
      withSpring(0, { damping: 6, stiffness: 200 })
    );
  };

  useEffect(() => {
    if (celebrateTrigger === undefined) return;
    celebrate();
    // celebrate() is a stable local closure over shared values; only re-fire on the trigger itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrateTrigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: idleY.value + reactY.value },
      { rotate: `${idleRotate.value + reactRotate.value}deg` },
      { scale: reactScale.value },
    ],
  }));

  const image = (
    <Animated.Image
      testID="mascot-image"
      source={require('../../../assets/images/mascot-dualo.png')}
      style={[{ width: size, height: size }, animatedStyle]}
      resizeMode="contain"
      accessible={false}
      importantForAccessibility="no"
    />
  );

  if (!onPress) {
    return image;
  }

  return (
    <Pressable
      testID="mascot-pressable"
      onPress={() => {
        celebrate();
        onPress();
      }}
      hitSlop={state.hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Dualo"
    >
      {image}
    </Pressable>
  );
}
