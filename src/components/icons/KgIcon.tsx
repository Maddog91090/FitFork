import { View, Text, StyleSheet } from 'react-native';

type KgIconProps = {
  color: string;
  focused: boolean;
  size?: number;
};

export function KgIcon({ color, focused, size = 22 }: KgIconProps) {
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
      <Text style={[styles.label, { color: focused ? '#FFFFFF' : color, fontSize: size * 0.4 }]}>kg</Text>
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
    fontWeight: '700',
  },
});
