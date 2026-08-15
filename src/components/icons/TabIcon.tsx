import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useThemeColors, type ThemeColors } from '../../theme/tokens';

export type TabIconName = 'home' | 'plan' | 'recipes' | 'workout' | 'grocery' | 'weight';

/** Each tab reads its icon in the domain color of the area it opens onto. */
const TAB_DOMAIN: Record<TabIconName, keyof ThemeColors> = {
  home: 'domainNeutral',
  plan: 'domainNutrition',
  recipes: 'domainNutrition',
  workout: 'domainSport',
  grocery: 'domainNutrition',
  weight: 'domainProgress',
};

type IconProps = { color: string; size: number; testID: string };

/** Solid house silhouette — no door cutout, so it stays legible and bold at tab-bar size. */
function HomeIcon({ color, size, testID }: IconProps) {
  return (
    <Svg testID={testID} color={color} width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 3.3c.35 0 .68.13.93.36l6.87 6.24c.52.47.56 1.27.1 1.8-.46.52-1.26.57-1.8.1l-.1-.08V18.5c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-6.28l-.1.08c-.54.47-1.34.42-1.8-.1-.46-.53-.42-1.33.1-1.8L11.07 3.66c.25-.23.58-.36.93-.36Z"
      />
    </Svg>
  );
}

/** Rounded card with two binder tabs — reads as a planner/calendar. */
function PlanIcon({ color, size, testID }: IconProps) {
  return (
    <Svg testID={testID} color={color} width={size} height={size} viewBox="0 0 24 24">
      <Rect x={7.3} y={2.3} width={2.4} height={5.2} rx={1.2} fill={color} />
      <Rect x={14.3} y={2.3} width={2.4} height={5.2} rx={1.2} fill={color} />
      <Rect x={3.5} y={5} width={17} height={15.5} rx={3.2} fill={color} />
    </Svg>
  );
}

/** A lidded pot with side handles — cooking/recipes. */
function RecipesIcon({ color, size, testID }: IconProps) {
  return (
    <Svg testID={testID} color={color} width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={6.1} r={1.3} fill={color} />
      <Rect x={6} y={7.6} width={12} height={2} rx={1} fill={color} />
      <Rect x={2} y={10.9} width={3.3} height={2.4} rx={1.2} fill={color} />
      <Rect x={18.7} y={10.9} width={3.3} height={2.4} rx={1.2} fill={color} />
      <Path
        fill={color}
        d="M5.3 10.4h13.4l-1.2 8.2c-.15 1-1 1.7-2 1.7h-7c-1 0-1.85-.7-2-1.7l-1.2-8.2Z"
      />
    </Svg>
  );
}

/** Classic dumbbell: bar plus a large and a small plate on each side. */
function WorkoutIcon({ color, size, testID }: IconProps) {
  return (
    <Svg testID={testID} color={color} width={size} height={size} viewBox="0 0 24 24">
      <Rect x={8.5} y={10.8} width={7} height={2.4} rx={1.2} fill={color} />
      <Rect x={6.3} y={9} width={2.2} height={6} rx={1.1} fill={color} />
      <Rect x={15.5} y={9} width={2.2} height={6} rx={1.1} fill={color} />
      <Rect x={2.5} y={7} width={3.6} height={10} rx={1.8} fill={color} />
      <Rect x={17.9} y={7} width={3.6} height={10} rx={1.8} fill={color} />
    </Svg>
  );
}

/** Shopping bag: filled trapezoid body with a thin stroked handle loop. */
function GroceryIcon({ color, size, testID }: IconProps) {
  return (
    <Svg testID={testID} color={color} width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M8.3 8.5V6.8c0-2.1 1.6-3.8 3.7-3.8s3.7 1.7 3.7 3.8v1.7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        fill={color}
        d="M5.5 8.5h13l-.9 11c-.1.9-.9 1.5-1.8 1.5H8.2c-.9 0-1.7-.6-1.8-1.5l-.9-11Z"
      />
    </Svg>
  );
}

/** Bathroom scale: base plus dial — currently unused (no "weight" tab is registered), kept for completeness. */
function WeightIcon({ color, size, testID }: IconProps) {
  return (
    <Svg testID={testID} color={color} width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={9.8} r={5.3} fill={color} />
      <Rect x={3} y={12} width={18} height={8.5} rx={3} fill={color} />
    </Svg>
  );
}

const ICONS: Record<TabIconName, (props: IconProps) => React.JSX.Element> = {
  home: HomeIcon,
  plan: PlanIcon,
  recipes: RecipesIcon,
  workout: WorkoutIcon,
  grocery: GroceryIcon,
  weight: WeightIcon,
};

type TabIconProps = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

/**
 * A solid, domain-colored tab bar icon. Unlike the shared `Button`/`Card`
 * accent rule, each tab keeps its own fixed domain color (`TAB_DOMAIN`)
 * regardless of which screen is currently open, so the tab bar reads as a
 * stable map of the app's areas; only the active/inactive contrast changes.
 */
export function TabIcon({ name, focused, size = 24 }: TabIconProps) {
  const colors = useThemeColors();
  const Icon = ICONS[name];
  const color = focused ? colors[TAB_DOMAIN[name]] : colors.textSecondary;
  return <Icon color={color} size={size} testID="tab-icon-image" />;
}
