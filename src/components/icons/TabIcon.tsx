import { MaterialIcons } from '@expo/vector-icons';
import { useMaterialColors } from '../../theme/tokens';

export type TabIconName = 'home' | 'journal' | 'plan' | 'recipes' | 'workout' | 'grocery' | 'weight';

const TAB_ICON_NAMES: Record<TabIconName, React.ComponentProps<typeof MaterialIcons>['name']> = {
  home: 'home',
  journal: 'local-fire-department',
  plan: 'event',
  recipes: 'restaurant-menu',
  workout: 'fitness-center',
  grocery: 'shopping-cart',
  weight: 'monitor-weight',
};

type TabIconProps = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

/**
 * A Material tab bar icon. Tints itself from `focused` directly (rather than
 * relying on the parent `Tabs`'s `tabBarActiveTintColor`/`tabBarInactiveTintColor`
 * cascading down) so this component alone determines its own color — no
 * change to `src/app/(tabs)/_layout.tsx` is needed for this to render correctly.
 */
export function TabIcon({ name, focused, size = 24 }: TabIconProps) {
  const colors = useMaterialColors();
  return (
    <MaterialIcons
      testID="tab-icon-image"
      name={TAB_ICON_NAMES[name]}
      size={size}
      color={focused ? colors.primary : colors.onSurfaceVariant}
    />
  );
}
