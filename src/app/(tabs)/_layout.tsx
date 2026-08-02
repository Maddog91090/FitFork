import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { WIDE_BREAKPOINT } from '../../components/ui/Screen';
import { useColors } from '../../theme/useColors';

export default function TabsLayout() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentRed,
        tabBarInactiveTintColor: colors.textSecondary,
        // Without this the platform default (iOS system blue) shows through as the
        // selected-item pill background, clashing with the "One Accent Rule" (vital red only).
        tabBarActiveBackgroundColor: colors.accentRedTint,
        // Tablet/expanded-width gets a nav rail on the left instead of a stretched phone
        // bottom bar; Android gets the real Material 3 tab bar treatment (ripple, pill
        // indicator) instead of the iOS-shaped default.
        tabBarPosition: isWide ? 'left' : 'bottom',
        tabBarVariant: Platform.OS === 'android' ? 'material' : 'uikit',
        tabBarStyle: isWide
          ? { borderTopColor: 'transparent', borderRightColor: colors.divider }
          : { borderTopColor: colors.divider },
        tabBarBackground: () => <GlassSurface style={StyleSheet.absoluteFill} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Muscu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="weight-log"
        options={{
          title: 'Poids',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'scale' : 'scale-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
