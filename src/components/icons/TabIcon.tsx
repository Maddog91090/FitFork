import { Image, type ImageProps } from 'expo-image';
import { state } from '../../theme/tokens';

export type TabIconName = 'home' | 'plan' | 'recipes' | 'workout' | 'grocery' | 'weight';

const TAB_ICON_SOURCES: Record<TabIconName, ImageProps['source']> = {
  home: require('../../../assets/images/icons/tab-home.png'),
  plan: require('../../../assets/images/icons/tab-plan.png'),
  recipes: require('../../../assets/images/icons/tab-recipes.png'),
  workout: require('../../../assets/images/icons/tab-workout.png'),
  grocery: require('../../../assets/images/icons/tab-grocery.png'),
  weight: require('../../../assets/images/icons/tab-weight.png'),
};

type TabIconProps = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

/**
 * A claymorphic tab bar icon. These are static images, not tintable vector
 * icons, so the active/inactive distinction is opacity rather than the
 * `tabBarActiveTintColor`/`tabBarInactiveTintColor` mechanism Ionicons used.
 */
export function TabIcon({ name, focused, size = 24 }: TabIconProps) {
  return (
    <Image
      testID="tab-icon-image"
      source={TAB_ICON_SOURCES[name]}
      style={{ width: size, height: size, opacity: focused ? 1 : state.disabledOpacity }}
      contentFit="contain"
    />
  );
}
