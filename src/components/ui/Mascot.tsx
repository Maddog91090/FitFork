import { Image, type ImageProps } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

export type MascotPose = 'idle' | 'running' | 'celebrating' | 'encouraging';

const MASCOT_SOURCES: Record<MascotPose, ImageProps['source']> = {
  idle: require('../../../assets/images/mascot/cheetah-idle.png'),
  running: require('../../../assets/images/mascot/cheetah-running.png'),
  celebrating: require('../../../assets/images/mascot/cheetah-celebrating.png'),
  encouraging: require('../../../assets/images/mascot/cheetah-encouraging.png'),
};

type MascotProps = {
  /** Which moment this appearance is for — see assets/images/mascot/README.md. */
  pose: MascotPose;
  /** Square side in px, used only when `style` is omitted. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The Coral Rush mascot. `style` fully replaces the default size-based
 * sizing when given, so a caller that needs responsive sizing (percentage
 * width, aspectRatio) doesn't fight a baked-in width/height.
 */
export function Mascot({ pose, size = 160, style }: MascotProps) {
  return (
    <Image
      testID="mascot-image"
      source={MASCOT_SOURCES[pose]}
      style={style ?? { width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
