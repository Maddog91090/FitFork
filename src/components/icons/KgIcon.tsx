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
      <Text style={[styles.label, { color: focused ? colors.textOnWarm : color, fontSize: size * 0.4 }]}>
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
