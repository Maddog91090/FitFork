import { View, Text, StyleSheet, type ColorValue } from 'react-native';
import { fontFamily, useThemeColors } from '../../theme/tokens';

type KgIconProps = {
  color: ColorValue;
  focused: boolean;
  size?: number;
};

export function KgIcon({ color, focused, size = 22 }: KgIconProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: focused ? color : 'transparent',
        },
      ]}
    >
      {/*
        When focused the circle fills with the tab's active tint, which is
        accentOrangeDeep — dark enough that the glyph has to be white
        (textOnAccent, 5.1:1). Ink on it would be 2.6:1. This is the one place
        the "ink on orange" rule inverts, because the fill here is the deep
        orange rather than the brand orange.
      */}
      <Text style={[styles.label, { color: focused ? colors.textOnAccent : color, fontSize: size * 0.4 }]}>
        kg
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.bodyBold,
  },
});
