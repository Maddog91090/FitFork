import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion } from '../../theme/tokens';
import { useReducedMotion } from '../../lib/useReducedMotion';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * The claymorphic "chips and cells" press pattern — scale only (no opacity
 * dip), sprung with `motion.spring.snappy` on both press and release. Use
 * for chips, cells, and list rows. Buttons animate their own scale alongside
 * a color spring — never give a button this.
 */
export function PressableScale({ children, style, onPressIn, onPressOut, ...pressableProps }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...pressableProps}
        style={style}
        onPressIn={(e) => {
          scale.value = reducedMotion ? 1 : withSpring(0.96, motion.spring.snappy);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = reducedMotion ? 1 : withSpring(1, motion.spring.snappy);
          onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
