import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { motion } from '../../theme/tokens';
import { useReducedMotion } from '../../lib/useReducedMotion';

export type MascotForm = 'nutrition' | 'sport';

const SPORT_SOURCE = require('../../../assets/images/mascot/mascot-sport-idle.png');
const NUTRITION_LOTTIE_SOURCE = require('../../../assets/images/mascot/mascot-nutrition-idle.json');
const SWIRL_SOURCE = require('../../../assets/images/mascot/transform-swirl.json');

type TransformingMascotProps = {
  /** Which form should be showing. Changing this plays the tornado-spin transformation. */
  form: MascotForm;
  size?: number;
};

/**
 * The two-form FitPro creature: a calm broccoli for nutrition screens, a
 * flexing sporty broccoli for training screens. Changing `form` spins the
 * character up like a tornado (with a Lottie swirl effect layered behind
 * it), swaps the artwork at the peak of the spin — hidden by the motion —
 * then spins back down to a stop. Reduce Motion skips the spin entirely and
 * cross-fades instead.
 */
export function TransformingMascot({ form, size = 96 }: TransformingMascotProps) {
  const [displayedForm, setDisplayedForm] = useState(form);
  const reducedMotion = useReducedMotion();
  const isFirstRender = useRef(true);

  const breathe = useSharedValue(1);
  const rotation = useSharedValue(0);
  const spinScale = useSharedValue(1);
  const swirlOpacity = useSharedValue(0);
  const swirlRef = useRef<LottieView>(null);

  useEffect(() => {
    if (reducedMotion) return;
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [reducedMotion, breathe]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (form === displayedForm) return;

    if (reducedMotion) {
      setDisplayedForm(form);
      return;
    }

    swirlRef.current?.play();
    swirlOpacity.value = withTiming(1, { duration: motion.duration.fast });

    // Both legs land on a multiple of 360 in total so the character rests
    // upright, not mid-turn: 1.5 turns accelerating in (swap happens here,
    // hidden by the motion blur of a fast spin), then another 1.5 turns
    // decelerating back out — 3 full turns altogether.
    const spinUp = rotation.value + 540;
    const spinDown = rotation.value + 1080;

    spinScale.value = withSequence(
      withTiming(0.82, { duration: 420, easing: Easing.in(Easing.cubic) }),
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    rotation.value = withSequence(
      withTiming(spinUp, { duration: 420, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setDisplayedForm)(form);
      }),
      withTiming(spinDown, { duration: 420, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) swirlOpacity.value = withTiming(0, { duration: motion.duration.fast });
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const characterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: breathe.value * spinScale.value }],
  }));
  const swirlStyle = useAnimatedStyle(() => ({ opacity: swirlOpacity.value }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.swirl, swirlStyle, styles.noPointerEvents]}>
        <LottieView ref={swirlRef} source={SWIRL_SOURCE} loop style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={characterStyle}>
        {displayedForm === 'nutrition' ? (
          <LottieView source={NUTRITION_LOTTIE_SOURCE} autoPlay loop style={{ width: size, height: size }} />
        ) : (
          <Image
            testID="mascot-sport-image"
            source={SPORT_SOURCE}
            style={{ width: size, height: size }}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  swirl: { transform: [{ scale: 1.7 }] },
  noPointerEvents: { pointerEvents: 'none' },
});
