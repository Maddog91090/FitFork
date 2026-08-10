import { Image, type ImageProps } from 'expo-image';

export type MacroIconName = 'protein' | 'fat' | 'carbs';

const MACRO_ICON_SOURCES: Record<MacroIconName, ImageProps['source']> = {
  protein: require('../../../assets/images/icons/macro-protein.png'),
  fat: require('../../../assets/images/icons/macro-fat.png'),
  carbs: require('../../../assets/images/icons/macro-carbs.png'),
};

type MacroIconProps = {
  name: MacroIconName;
  /** Square side in px. Small — this sits inline next to a macro number, not as a standalone icon. */
  size?: number;
};

export function MacroIcon({ name, size = 20 }: MacroIconProps) {
  return (
    <Image
      testID="macro-icon-image"
      source={MACRO_ICON_SOURCES[name]}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
