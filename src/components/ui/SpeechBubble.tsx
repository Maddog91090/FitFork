import { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReducedMotion } from '../../lib/useReducedMotion';
import {
  materialTypography,
  radius,
  spacing,
  useMaterialTertiary,
  type MaterialDomain,
  type MaterialTertiary,
} from '../../theme/tokens';

type SpeechBubbleProps = {
  message: string;
  domain?: MaterialDomain;
};

/**
 * A small chat-bubble for Dualo's own lines — the one place in the app
 * allowed a warmer, exclamation-marked register; functional copy elsewhere
 * stays sober. Pair with `<Mascot>` right below it so the tail reads as
 * pointing at him.
 */
export function SpeechBubble({ message, domain }: SpeechBubbleProps) {
  const tertiary = useMaterialTertiary(domain);
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(tertiary), [tertiary]);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(280).springify().damping(14)}
      style={styles.bubble}
    >
      <Text style={styles.text}>{message}</Text>
      <View style={styles.tail} />
    </Animated.View>
  );
}

function createStyles(tertiary: MaterialTertiary) {
  return StyleSheet.create({
    bubble: {
      backgroundColor: tertiary.tertiaryContainer,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      maxWidth: 280,
      alignSelf: 'center',
    },
    text: {
      ...materialTypography.bodyMedium,
      color: tertiary.onTertiaryContainer,
      textAlign: 'center',
    },
    tail: {
      position: 'absolute',
      bottom: -8,
      left: '50%',
      marginLeft: -8,
      width: 16,
      height: 16,
      backgroundColor: tertiary.tertiaryContainer,
      transform: [{ rotate: '45deg' }],
      borderRadius: 3,
    },
  });
}
