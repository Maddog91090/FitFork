# Claymorphic Phase 2: Screen Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the claymorphic design system (shipped foundation-only in
Phase 1) visible on 5 real screens — mascot placements, domain-color wiring
on `Button`/`ChoiceGroup`, a 9-icon claymorphic set, and replacing the app's
icon/splash/Android-adaptive-icon assets with the mascot.

**Architecture:** Phase 1 already built everything this plan *consumes*:
`Button`'s `domain` prop, the four `domainNutrition`/`domainSport`/
`domainProgress`/`domainNeutral` color families, and the `Mascot` component
(`idle`/`celebrating` poses). This plan does no new token or motion work —
it's wiring. Two small shared-component extensions unlock the screen tasks:
`EmptyState` and `ChoiceGroup` currently have no way to pick a domain color,
so their one primary-accent path is parameterized (both default to
`'progress'`, matching today's behavior exactly, so every call site this
plan doesn't touch — onboarding's 5 `ChoiceGroup` uses, for instance — is
visually unchanged). Icons are static claymorphic PNGs, not tintable vector
icons, so the tab bar's `tabBarActiveTintColor`/`tabBarInactiveTintColor`
mechanism is replaced by an opacity-based active/inactive treatment in a new
`TabIcon` component, mirroring `Mascot`'s own `Record<Pose, ImageSource>`
pattern.

**Tech Stack:** Expo SDK 57 / React Native, TypeScript, `expo-image`,
`react-native-reanimated`, Jest + `jest-expo` + `@testing-library/react-native`.
Image generation via the `mcp__claude_ai_Higgsfield__generate_image` /
`generate_image_batch` / `jobs_wait` / `remove_background` tools (the
`media-use` skill has no working provider in this environment — this is the
same substitution Phase 1 already used successfully for the mascot's own
poses).

## Global Constraints

- Zero hex codes, zero raw `fontSize`/`fontWeight` in any screen or component
  diff — everything comes from `src/theme/tokens.ts`. This plan introduces
  no new token values; every color referenced already exists.
- Every tappable element stays at minimum `state.minTouchSize` (44pt) with a
  visible pressed state and `accessibilityRole`.
- No new text/background color pairing is introduced by this plan — the
  domain tokens' AA contrast was already verified in Phase 1
  (`src/__tests__/tokens.test.ts`). Nothing here needs new contrast tests.
- `npx tsc --noEmit` and `npx jest` must be clean before any task is
  considered done. This repo has pre-existing `tsc` errors unrelated to any
  of this plan's work (missing jest global types in every
  `src/__tests__/*` file, unrelated Deno errors in a supabase function) —
  judge cleanliness as "introduces no new error category in a non-test
  file," not literally zero.
- The app stays **light-only**. French, tutoiement, throughout — functional
  copy stays sober (no exclamation marks, no hype); the mascot/celebration
  moments are the one place energy is allowed, per Phase 1's own rule.
- No EAS build is triggered by this plan, automatically or otherwise.
- When a Reanimated or other native-module API is used that a hand-written
  mock (`__mocks__/react-native-reanimated.js`, `__mocks__/expo-linear-
  gradient.js`) doesn't cover, extend the mock rather than trying to load
  the library's real implementation under Jest.

---

### Task 1: `EmptyState` gains a `domain` prop

**Files:**
- Modify: `src/components/ui/Button.tsx` (export `ButtonDomain`)
- Modify: `src/components/ui/EmptyState.tsx`
- Test: Modify `src/__tests__/EmptyState.test.tsx`

**Interfaces:**
- Produces: `ButtonDomain` (now exported from `Button.tsx`); `EmptyState`
  gains `domain?: ButtonDomain` (default `'progress'`, matching current
  behavior — `EmptyState`'s internal `Button` already defaults to
  `'progress'` today), forwarded to its internal `Button`. Consumed by
  Task 7 (Plan) and Task 8 (Recettes).

- [ ] **Step 1: Export `ButtonDomain` from `Button.tsx`**

In `src/components/ui/Button.tsx`, change:

```ts
type ButtonVariant = 'primary' | 'secondary';
type ButtonDomain = 'nutrition' | 'sport' | 'progress' | 'neutral';
```

to:

```ts
type ButtonVariant = 'primary' | 'secondary';
export type ButtonDomain = 'nutrition' | 'sport' | 'progress' | 'neutral';
```

- [ ] **Step 2: Write the failing test**

Append to `src/__tests__/EmptyState.test.tsx`:

```tsx
  it('forwards its domain to the action button', async () => {
    const onAction = jest.fn();
    const { getByTestId } = await render(
      <EmptyState
        title="Aucun plan pour l'instant"
        message="Génère ton premier plan."
        actionLabel="Générer un plan"
        onAction={onAction}
        domain="nutrition"
      />
    );
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightColors.domainNutrition);
  });
```

Add the two new imports this test needs at the top of the file:

```tsx
import { StyleSheet } from 'react-native';
import { lightColors } from '../theme/tokens';
```

(`src/__tests__/EmptyState.test.tsx` currently imports `React`,
`{ render, fireEvent }`, `{ Text }` from `'react-native'`, and `{ EmptyState }`
— add the two lines above alongside those, don't replace them.)

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx jest EmptyState.test.tsx`
Expected: FAIL — `EmptyState` has no `domain` prop yet, so the button still
renders with the default `'progress'` fill, not `domainNutrition`.

- [ ] **Step 4: Add the `domain` prop**

In `src/components/ui/EmptyState.tsx`, add the import and prop:

```tsx
import { Button, type ButtonDomain } from './Button';
```

```tsx
type EmptyStateProps = {
  /** Brand illustration for this slot. Generated on bgSurface, so it sits on the card seamlessly. */
  illustration?: ImageProps['source'];
  /** Fallback for empty states that have no illustration of their own yet. */
  icon?: React.ReactNode;
  title: string;
  message: string;
  /** Omit both when the screen already offers the action elsewhere. */
  actionLabel?: string;
  onAction?: () => void;
  /** Domain color for the action button. Defaults to `'progress'`, matching `Button`'s own default. */
  domain?: ButtonDomain;
};

export function EmptyState({
  illustration,
  icon,
  title,
  message,
  actionLabel,
  onAction,
  domain,
}: EmptyStateProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasAction = Boolean(actionLabel && onAction);
  return (
    <Card style={styles.card}>
      {illustration ? (
        <Image source={illustration} style={styles.illustration} contentFit="contain" />
      ) : (
        icon && <View style={styles.icon}>{icon}</View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.message, hasAction && styles.messageSpaced]}>{message}</Text>
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} domain={domain} />}
    </Card>
  );
}
```

(Only the type import line, the `domain` prop in `EmptyStateProps`, the
`domain` destructure, and the `domain={domain}` on the `<Button>` call
change — everything else in the file is unchanged.)

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest EmptyState.test.tsx`
Expected: PASS — both the existing test and the new one.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean (per the pre-existing-error caveat in Global Constraints).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/EmptyState.tsx src/__tests__/EmptyState.test.tsx
git commit -m "feat: EmptyState forwards a domain color to its action button"
```

---

### Task 2: `ChoiceGroup` gains a `domain` prop

**Files:**
- Modify: `src/components/choicePillStyles.ts`
- Modify: `src/components/ChoiceGroup.tsx`
- Test: Create `src/__tests__/ChoiceGroup.test.tsx`

**Interfaces:**
- Consumes: `ButtonDomain` from Task 1.
- Produces: `ChoiceGroup` gains `domain?: ButtonDomain` (default
  `'progress'`, matching `colors.accentRed`'s current value exactly — every
  existing call site, including onboarding's 5, is visually unchanged).
  Consumed by Task 7 (Plan), Task 8 (Recettes), Task 9 (Muscu).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/ChoiceGroup.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { lightColors } from '../theme/tokens';
import { ChoiceGroup } from '../components/ChoiceGroup';

const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('ChoiceGroup', () => {
  it('renders every option and calls onChange with the pressed value', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(<ChoiceGroup options={OPTIONS} value="a" onChange={onChange} />);
    fireEvent.press(getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('defaults the selected pill to the progress domain color', async () => {
    const { getByText } = await render(<ChoiceGroup options={OPTIONS} value="a" onChange={() => {}} />);
    // The pill is the PressableScale two levels up from its label Text.
    const pill = getByText('A').parent?.parent;
    const style = StyleSheet.flatten(pill?.props.style);
    expect(style.backgroundColor).toBe(lightColors.domainProgress);
  });

  it('uses the given domain color for the selected pill', async () => {
    const { getByText } = await render(
      <ChoiceGroup options={OPTIONS} value="a" onChange={() => {}} domain="sport" />
    );
    const pill = getByText('A').parent?.parent;
    const style = StyleSheet.flatten(pill?.props.style);
    expect(style.backgroundColor).toBe(lightColors.domainSport);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest ChoiceGroup.test.tsx`
Expected: The first test (render + onChange) PASSes already — `ChoiceGroup`
already does that. The third test FAILs for real: passing `domain="sport"`
has no effect yet, the pill stays `accentRed`/`domainProgress`-colored, not
`domainSport`. (The second test may pass by coincidence today, since
`accentRed` already equals `domainProgress` — that's expected and fine.)

- [ ] **Step 3: Parameterize `createPillStyles` by domain**

Replace `src/components/choicePillStyles.ts`:

```ts
import { StyleSheet } from 'react-native';
import { radius, shadow, spacing, state, typography, type ThemeColors } from '../theme/tokens';
import type { ButtonDomain } from './ui/Button';

const DOMAIN_FILL: Record<ButtonDomain, keyof ThemeColors> = {
  nutrition: 'domainNutrition',
  sport: 'domainSport',
  progress: 'domainProgress',
  neutral: 'domainNeutral',
};

export function createPillStyles(colors: ThemeColors, domain: ButtonDomain = 'progress') {
  const accent = colors[DOMAIN_FILL[domain]];
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    pill: {
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md + 2,
      minHeight: state.minTouchSize,
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      ...shadow.card,
    },
    pillSelected: {
      backgroundColor: accent,
      shadowColor: accent,
      shadowOpacity: 0.25,
    },
    label: { ...typography.subheading, color: colors.textPrimary },
    labelSelected: { ...typography.subheading, color: colors.textOnAccent },
  });
}
```

- [ ] **Step 4: Thread `domain` through `ChoiceGroup`**

Replace `src/components/ChoiceGroup.tsx`:

```tsx
import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { PressableScale } from './ui/PressableScale';
import { useThemeColors } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';
import type { ButtonDomain } from './ui/Button';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Domain color for the selected pill. Defaults to `'progress'`, matching the previous fixed `accentRed`. */
  domain?: ButtonDomain;
};

export function ChoiceGroup<T extends string>({ options, value, onChange, domain }: ChoiceGroupProps<T>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPillStyles(colors, domain), [colors, domain]);
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <PressableScale
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === option.value }}
          style={[styles.pill, value === option.value && styles.pillSelected]}
        >
          <Text style={value === option.value ? styles.labelSelected : styles.label}>
            {option.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest ChoiceGroup.test.tsx`
Expected: PASS, all 3.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean. In particular, confirm `recipes-screen.test.tsx` and
any onboarding test that renders a `ChoiceGroup` still passes unchanged —
they don't pass `domain`, so they get the same `'progress'` default as
before.

- [ ] **Step 7: Commit**

```bash
git add src/components/choicePillStyles.ts src/components/ChoiceGroup.tsx src/__tests__/ChoiceGroup.test.tsx
git commit -m "feat: ChoiceGroup's selected pill takes a domain color"
```

---

### Task 3: 6 claymorphic tab bar icons

**Files:**
- Create: `assets/images/icons/tab-home.png`, `tab-plan.png`, `tab-recipes.png`, `tab-workout.png`, `tab-grocery.png`, `tab-weight.png`
- Create: `src/components/icons/TabIcon.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`
- Test: Create `src/__tests__/TabIcon.test.tsx`

**Interfaces:**
- Produces: `TabIcon` component and `TabIconName` type (`'home' | 'plan' |
  'recipes' | 'workout' | 'grocery' | 'weight'`). Consumed only by
  `(tabs)/_layout.tsx` in this task — no later task depends on it.

This task removes the app's last two consumers of `Ionicons` and `KgIcon`
(`@expo/vector-icons/Ionicons`, `src/components/icons/KgIcon.tsx`) — do not
delete either dependency/file, they may still be used elsewhere; a quick
`grep -rn "Ionicons\|KgIcon" src/` after this task's Step 6 confirms whether
they're now fully unused (informational only, not a required cleanup for
this task).

- [ ] **Step 1: Generate the 6 icons**

Use `mcp__claude_ai_Higgsfield__generate_image_batch` with `model:
"recraft_v4_1"`, `model_type: "standard"`, `aspect_ratio: "1:1"`,
`resolution: "1k"` for each (this is the same model Phase 1 used for concept
art). Shared style block, prepended to every prompt:

> Claymorphic app icon illustration: a single simple bold icon glyph,
> puffy rounded 3D clay-like shape with soft gradient shading and a subtle
> highlight, no hard outlines, no text, no logos, centered on a plain white
> background, square canvas, at least 1024x1024px, simple and legible at
> small sizes like a mobile app tab bar icon.

Pose/subject-specific additions, one request per icon, submitted together
in one `generate_image_batch` call (6 items, well under the 12-item limit):

- `tab-home.png`: "A simple puffy clay house shape with a triangular roof
  and a small door, warm sand/brown color (#7A5C34)."
- `tab-plan.png`: "A simple puffy clay calendar/planner shape — a rounded
  square with a small ring-binding detail at the top and a few short
  horizontal lines suggesting rows, warm amber-orange color (#B25900)."
- `tab-recipes.png`: "A simple puffy clay fork-and-plate shape — a rounded
  plate with a fork resting on it, warm amber-orange color (#B25900)."
- `tab-workout.png`: "A simple puffy clay dumbbell shape, deep forest green
  color (#187A57)."
- `tab-grocery.png`: "A simple puffy clay shopping basket shape with a
  handle, warm amber-orange color (#B25900)."
- `tab-weight.png`: "A simple puffy clay bathroom scale shape — a rounded
  square base with a small round dial on top, warm brown color (#7A5C34)."

Poll with `mcp__claude_ai_Higgsfield__jobs_wait` (`timeout_seconds: 15`,
repeat while any job is `in_progress`) until all 6 are `completed`.

- [ ] **Step 2: Make each icon transparent**

For each of the 6 completed jobs, call
`mcp__claude_ai_Higgsfield__remove_background` with `media_id: <the
generation's job_id>, media_type: "image"` — the icons are generated on a
plain white background per the prompt, and the tab bar needs them
transparent so they sit on `colors.bgSurface` with no seam (same reasoning
as the mascot's own poses in Phase 1).

- [ ] **Step 3: Download and verify**

Download each `remove_background` result's `result_url` with `curl -sL -o
<path> "<url>"` directly to `assets/images/icons/<name>.png` (create the
`assets/images/icons/` directory). Verify with `file assets/images/icons/*.png`
that all 6 report `PNG image data` at 1024×1024 or larger, and that none are
near-zero file size. Open each in an image viewer and manually confirm the
background is transparent and the glyph reads clearly at a glance — there
is no automated check for this, same as the mascot's own asset verification
in Phase 1.

- [ ] **Step 4: Write the failing test**

Create `src/__tests__/TabIcon.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { TabIcon, type TabIconName } from '../components/icons/TabIcon';

const NAMES: TabIconName[] = ['home', 'plan', 'recipes', 'workout', 'grocery', 'weight'];

describe('TabIcon', () => {
  it.each(NAMES)('renders an image for %s', async (name) => {
    const { getByTestId } = await render(<TabIcon name={name} focused={false} />);
    expect(getByTestId('tab-icon-image')).toBeTruthy();
  });

  it('is fully opaque when focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused />);
    expect(getByTestId('tab-icon-image').props.style.opacity).toBe(1);
  });

  it('is dimmed when not focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused={false} />);
    expect(getByTestId('tab-icon-image').props.style.opacity).toBeLessThan(1);
  });
});
```

- [ ] **Step 5: Run it to confirm it fails**

Run: `npx jest TabIcon.test.tsx`
Expected: FAIL with "Cannot find module '../components/icons/TabIcon'".

- [ ] **Step 6: Implement `TabIcon` and wire it into the tab bar**

Create `src/components/icons/TabIcon.tsx`:

```tsx
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
```

Replace `src/app/(tabs)/_layout.tsx` in full:

```tsx
import { Tabs } from 'expo-router';
import { TabIcon } from '../../components/icons/TabIcon';
import { typography, useThemeColors } from '../../theme/tokens';

export default function TabsLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgSurface, borderTopColor: colors.border },
        tabBarLabelStyle: { ...typography.caption, fontSize: 11 },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon name="plan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recettes',
          tabBarIcon: ({ focused }) => <TabIcon name="recipes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Muscu',
          tabBarIcon: ({ focused }) => <TabIcon name="workout" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Courses',
          tabBarIcon: ({ focused }) => <TabIcon name="grocery" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="weight-log"
        options={{
          title: 'Poids',
          tabBarIcon: ({ focused }) => <TabIcon name="weight" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
```

(`tabBarActiveTintColor`/`tabBarInactiveTintColor` still control the tab
*label* text color, which `Tabs` renders separately from `tabBarIcon` — kept
here, now pointed at `textPrimary`/`textSecondary` instead of the removed
`colors.accentRed`, since the icon itself no longer uses tint at all.)

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npx jest TabIcon.test.tsx`
Expected: PASS, all 8 (6 `it.each` + 2).

- [ ] **Step 8: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add assets/images/icons/tab-*.png src/components/icons/TabIcon.tsx "src/app/(tabs)/_layout.tsx" src/__tests__/TabIcon.test.tsx
git commit -m "feat: claymorphic tab bar icons"
```

---

### Task 4: 3 claymorphic macro icons

**Files:**
- Create: `assets/images/icons/macro-protein.png`, `macro-fat.png`, `macro-carbs.png`
- Create: `src/components/icons/MacroIcon.tsx`
- Test: Create `src/__tests__/MacroIcon.test.tsx`

**Interfaces:**
- Produces: `MacroIcon` component and `MacroIconName` type (`'protein' |
  'fat' | 'carbs'`). Consumed by Task 6 (Accueil) only — Recettes' recipe
  cards show only a calorie count, not a macro breakdown, so there is no
  second consumer in this phase (see the spec's correction note).

- [ ] **Step 1: Generate the 3 icons**

Use `mcp__claude_ai_Higgsfield__generate_image_batch`, same model/settings
as Task 3. Shared style block:

> Claymorphic app icon illustration: a single simple bold icon glyph,
> puffy rounded 3D clay-like shape with soft gradient shading and a subtle
> highlight, no hard outlines, no text, no logos, centered on a plain white
> background, square canvas, at least 1024x1024px, simple and legible at
> small sizes.

- `macro-protein.png`: "A simple puffy clay drumstick/chicken-leg shape,
  terracotta-orange color (#C2410C)." (matches `colors.macroProtein`)
- `macro-fat.png`: "A simple puffy clay avocado-half shape, deep indigo-blue
  color (#4338CA)." (matches `colors.macroFat` — the color is deliberately
  not avocado-green; it must read as the existing indigo macro-fat hue, not
  a naturalistic avocado color, so the icon and the existing colored macro
  number stay visually paired)
- `macro-carbs.png`: "A simple puffy clay wheat-grain/bread-loaf shape,
  deep teal color (#0F766E)." (matches `colors.macroCarbs`)

Poll with `jobs_wait` until all 3 complete.

- [ ] **Step 2: Make each icon transparent**

Same as Task 3 Step 2: `remove_background` on each `job_id`.

- [ ] **Step 3: Download and verify**

Download to `assets/images/icons/macro-*.png`. Verify format/size/visual
quality the same way as Task 3 Step 3.

- [ ] **Step 4: Write the failing test**

Create `src/__tests__/MacroIcon.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { MacroIcon, type MacroIconName } from '../components/icons/MacroIcon';

const NAMES: MacroIconName[] = ['protein', 'fat', 'carbs'];

describe('MacroIcon', () => {
  it.each(NAMES)('renders an image for %s', async (name) => {
    const { getByTestId } = await render(<MacroIcon name={name} />);
    expect(getByTestId('macro-icon-image')).toBeTruthy();
  });

  it('defaults to a 20px square', async () => {
    const { getByTestId } = await render(<MacroIcon name="protein" />);
    expect(getByTestId('macro-icon-image').props.style).toEqual({ width: 20, height: 20 });
  });

  it('accepts a custom size', async () => {
    const { getByTestId } = await render(<MacroIcon name="protein" size={32} />);
    expect(getByTestId('macro-icon-image').props.style).toEqual({ width: 32, height: 32 });
  });
});
```

- [ ] **Step 5: Run it to confirm it fails**

Run: `npx jest MacroIcon.test.tsx`
Expected: FAIL with "Cannot find module '../components/icons/MacroIcon'".

- [ ] **Step 6: Implement `MacroIcon`**

Create `src/components/icons/MacroIcon.tsx`:

```tsx
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
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npx jest MacroIcon.test.tsx`
Expected: PASS, all 5.

- [ ] **Step 8: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add assets/images/icons/macro-*.png src/components/icons/MacroIcon.tsx src/__tests__/MacroIcon.test.tsx
git commit -m "feat: claymorphic macro icons"
```

---

### Task 5: App identity — mascot as icon, splash, and Android adaptive icon

**Files:**
- Modify (overwrite, same filenames — `app.json` already points at these,
  no `app.json` change needed): `assets/images/icon.png`,
  `assets/images/splash-icon.png`, `assets/images/android-icon-foreground.png`,
  `assets/images/android-icon-background.png`,
  `assets/images/android-icon-monochrome.png`

**Interfaces:** None — this task produces static assets only, consumed by
Expo's build tooling via the existing `app.json` references. No component
or test changes.

This task does not depend on, and is not depended on by, any other task in
this plan — it can run at any point.

- [ ] **Step 1: Generate a close-up "portrait" render of the mascot**

Reuse the exact validated base prompt from
`assets/images/mascot/README.md` (the same prompt Phase 1 generated
`mascot-idle.png`/`mascot-celebrating.png` from, with only the
pose/framing clause changed — this is what keeps the icon unmistakably the
same character rather than a design drift):

> A cute stylized cartoon broccoli character mascot with simple cartoon
> arms and legs, **close-up head-and-shoulders portrait, facing forward,
> centered, cropped tight so the head and face fill most of the frame**,
> for a fitness and nutrition app, in a modern 3D Pixar-style animation
> look. Simplified, rounded, cartoon-illustrated broccoli shape (soft
> rounded floret bumps, not photorealistic texture), deep green color on
> top with a paler green stem below, smooth clean 3D cartoon shading, soft
> studio lighting from the upper left. Large expressive Pixar-style eyes:
> big round glossy eyes with bright catchlight reflections, expressive
> eyebrows, and a warm cheerful smile. Plain background, one single
> centered character, no text, no logos, no props.

Use `mcp__claude_ai_Higgsfield__generate_image`, `model: "recraft_v4_1"`,
`model_type: "standard"`, `aspect_ratio: "1:1"`, `resolution: "2k"` (higher
resolution than the icon tasks above — this single image gets reused at
several different final sizes, so start from the largest reasonable
source). Poll with `jobs_wait` until complete.

- [ ] **Step 2: Make it transparent**

Call `remove_background` on the job's `media_id`/`job_id`,
`media_type: "image"`.

- [ ] **Step 3: Download the source portrait**

Download to a working file, e.g. `assets/images/mascot/mascot-portrait-source.png`
(1024×1024 or larger, transparent). Verify with `file` that it's a real PNG,
and open it to manually confirm: the face is clearly visible and well
centered, the crop doesn't cut off the eyes or the top of the head, and the
background is genuinely transparent (not solid white) — same manual check
as every other asset in this plan and in Phase 1.

- [ ] **Step 4: Produce `icon.png` (opaque, iOS)**

`icon.png` must be **opaque** (no alpha) since iOS composites its own
mask/rounding and a transparent icon shows through to whatever the OS
background is. Generate a second variant from the same base prompt, this
time explicitly on a solid background instead of "plain background" +
`remove_background`:

> [same prompt as Step 1] ... Plain solid warm cream background color
> #FFFBF5, no text, no logos, no props.

`model: "recraft_v4_1"`, `model_type: "standard"`, `aspect_ratio: "1:1"`,
`resolution: "2k"`. Download directly (no `remove_background` this time —
opacity is exactly what's wanted here) to `assets/images/icon.png`,
overwriting the existing file. Verify with `file` that it reports `PNG
image data` (no alpha channel mentioned) at 1024×1024 or larger — if the
model still produced an alpha channel, flatten it onto `#FFFBF5` rather than
leaving it transparent (a fully-opaque PNG with an unused all-255 alpha
channel is fine; a PNG with genuine transparency is not, since it would
show whatever the OS renders behind the icon).

- [ ] **Step 5: Produce `splash-icon.png` (transparent, sits on `#FFFBF5`)**

Copy the transparent portrait from Step 3 to
`assets/images/splash-icon.png`, overwriting the existing file. No new
generation needed — `splash.backgroundColor` in `app.json` is already
`#FFFBF5`, and the transparent portrait already sits cleanly on any of the
app's surface colors (confirmed pattern from the mascot's own poses in
Phase 1).

- [ ] **Step 6: Produce the 3 Android adaptive icon layers**

- `android-icon-foreground.png`: copy the transparent portrait from Step 3,
  but first confirm the subject sits within Android's adaptive-icon safe
  zone — the center ~66% of the canvas, since launchers crop this layer to
  varying shapes (circle, squircle, rounded square). If the Step 1 portrait
  fills close to the full frame (a tight head-and-shoulders crop usually
  does), regenerate Step 1 with an added clause — "extra margin around the
  head, character occupies roughly the center 60% of the frame, generous
  empty space around it" — until the face and both ear-level floret edges
  sit comfortably inside a centered circle at 66% of the canvas width.
  Overwrite `assets/images/android-icon-foreground.png`.
- `android-icon-background.png`: a plain solid `#FFFBF5` fill, no subject —
  generate via `generate_image` with a trivial prompt ("a plain solid flat
  color background, no texture, no gradient, no objects, color #FFFBF5,
  square canvas 1024x1024") or, more reliably, skip generation entirely and
  construct it directly: create a 1024×1024 solid-color PNG. If no image
  tool in this environment can create a flat-color PNG directly, generate
  it via the same Higgsfield call and verify the result is genuinely flat
  (sample a few pixels — should all be the same color, not a gradient or
  textured render some models default to). Overwrite
  `assets/images/android-icon-background.png`.
- `android-icon-monochrome.png`: a single-color silhouette version, used by
  Android 13+ themed icons (the OS recolors it to match the user's system
  theme, so the exact color chosen doesn't matter — white is the
  conventional choice since it previews clearly). Generate from the same
  base prompt with an added clause: "rendered as a single flat white
  silhouette shape only, no shading, no gradient, no color, pure white
  silhouette on a fully transparent background." Run through
  `remove_background` the same as the other transparent assets. Overwrite
  `assets/images/android-icon-monochrome.png`.

- [ ] **Step 7: Verify all 5 final files**

```bash
file assets/images/icon.png assets/images/splash-icon.png assets/images/android-icon-foreground.png assets/images/android-icon-background.png assets/images/android-icon-monochrome.png
```

Expected: all report `PNG image data`, 1024×1024 or larger, non-zero size;
`icon.png` and `android-icon-background.png` should NOT report an alpha
channel (or if they do, should be fully opaque — verify by eye, not just by
`file`'s output, which doesn't distinguish "has an unused alpha channel"
from "has real transparency"); the other three should. Open all 5 in an
image viewer for a final manual check — this is app-identity, the single
most visible asset in the whole app, worth a careful look before moving on.

- [ ] **Step 8: Clean up the working file and commit**

```bash
rm -f assets/images/mascot/mascot-portrait-source.png
git add assets/images/icon.png assets/images/splash-icon.png assets/images/android-icon-foreground.png assets/images/android-icon-background.png assets/images/android-icon-monochrome.png
git commit -m "feat: replace app icon, splash, and Android adaptive icon with the mascot"
```

---

### Task 6: Migrate Accueil (`(tabs)/home.tsx`)

**Files:**
- Modify: `src/app/(tabs)/home.tsx`
- Test: Modify `src/__tests__/home.test.tsx`

**Interfaces:**
- Consumes: `Mascot` (Phase 1), `MacroIcon` (Task 4).
- Produces: nothing consumed by a later task.

**Rule applied throughout this task** (stated once here, not re-derived per
usage): every `colors.accentRed`/`accentRedDeep`/`accentRedSoft` reference
in a migrated screen is replaced by the equivalent `colors.domain<Screen's
Default>*` token. Accueil's default domain is `nutrition`.

- [ ] **Step 1: Read the current test file to know what must keep passing**

Read `src/__tests__/home.test.tsx` in full before editing — it has existing
coverage (auth gating, profile loading, notifications toggle, etc.) that
must not regress. This step has no code change of its own.

- [ ] **Step 2: Write the failing test for the mascot placement**

Add this test to `src/__tests__/home.test.tsx` (match the file's existing
mocking setup for `session`/profile data — read Step 1's output to place
this correctly among the existing `describe`/`it` blocks and reuse its
existing mock helpers rather than duplicating setup):

```tsx
  it('shows the idle mascot in the header', async () => {
    const { getByTestId } = await render(<HomeScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx jest home.test.tsx`
Expected: FAIL — no element with `testID="mascot-image"` exists yet.

- [ ] **Step 4: Add the mascot to the header**

In `src/app/(tabs)/home.tsx`, add the import:

```tsx
import { Mascot } from '../../components/ui/Mascot';
import { MacroIcon } from '../../components/icons/MacroIcon';
```

Replace the header block:

```tsx
      <Text style={styles.greeting}>Bonjour</Text>
      <Text style={styles.name}>{session.user.email}</Text>
```

with:

```tsx
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.name}>{session.user.email}</Text>
        </View>
        <Mascot pose="idle" size={64} />
      </View>
```

Add the `headerRow` style (in `createStyles`, alongside the existing
`greeting`/`name` entries):

```ts
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
```

- [ ] **Step 5: Add `domain="nutrition"` to the "Générer" button**

Replace:

```tsx
          <Button title="Générer" onPress={() => router.push('/generate-plan')} />
```

with:

```tsx
          <Button title="Générer" onPress={() => router.push('/generate-plan')} domain="nutrition" />
```

(`"Voir mon plan"` and `"Se déconnecter"` are both `variant="secondary"` —
`domain` has no visual effect on secondary buttons, per `Button`'s own
contract, so leave them as-is.)

- [ ] **Step 6: Move the loading spinner and notification switch off `accentRed`**

Replace both occurrences of `colors.accentRed` in this file:

```tsx
        <ActivityIndicator color={colors.accentRed} />
```
→
```tsx
        <ActivityIndicator color={colors.domainNutrition} />
```

```tsx
          trackColor={{ true: colors.accentRed, false: colors.borderStrong }}
```
→
```tsx
          trackColor={{ true: colors.domainNutrition, false: colors.borderStrong }}
```

- [ ] **Step 7: Add macro icons next to each macro number**

Replace the four `macroItem` blocks:

```tsx
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, styles.macroProtein]}>{macros.proteinG}g</Text>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, styles.macroFat]}>{macros.fatG}g</Text>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, styles.macroCarbs]}>{macros.carbsG}g</Text>
              <Text style={styles.macroLabel}>Gluc</Text>
            </View>
```

with:

```tsx
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="protein" size={16} />
                <Text style={[styles.macroValue, styles.macroProtein]}>{macros.proteinG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="fat" size={16} />
                <Text style={[styles.macroValue, styles.macroFat]}>{macros.fatG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="carbs" size={16} />
                <Text style={[styles.macroValue, styles.macroCarbs]}>{macros.carbsG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Gluc</Text>
            </View>
```

(The plain `kcal` item deliberately has no icon — calories aren't one of the
three macro-vocabulary colors, and there's no fourth icon for it in this
plan's scope.)

Add the `macroValueRow` style:

```ts
    macroValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
```

- [ ] **Step 8: Run the tests and confirm they pass**

Run: `npx jest home.test.tsx`
Expected: PASS, all tests including the new mascot one.

- [ ] **Step 9: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 10: Commit**

```bash
git add "src/app/(tabs)/home.tsx" src/__tests__/home.test.tsx
git commit -m "feat: migrate Accueil to the claymorphic system (mascot, domain color, macro icons)"
```

---

### Task 7: Migrate Plan (`(tabs)/plan.tsx`)

**Files:**
- Modify: `src/app/(tabs)/plan.tsx`
- Test: Create `src/__tests__/plan-screen.test.tsx`

**Interfaces:**
- Consumes: `Mascot` (Phase 1), `EmptyState`'s `domain` prop (Task 1),
  `ChoiceGroup`'s `domain` prop (Task 2).
- Produces: nothing consumed by a later task.

Plan's default domain is `nutrition`. This screen currently has **no**
dedicated test file — this task creates one, scoped to the mascot/domain
changes this task makes (not a full screen test suite, which is out of
scope for this plan).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/plan-screen.test.tsx`. Check `src/__tests__/recipes-
screen.test.tsx` first for this repo's established pattern for mocking
`useAuth`, `expo-router`, and the `lib/mealPlanData` module — follow that
same mocking shape here rather than inventing a new one, since `plan.tsx`
imports the same kind of dependencies (`useAuth`, `getCurrentPlan`,
`fetchRecipes`). At minimum, cover:

```tsx
  it('shows the idle mascot in the empty-plan state', async () => {
    // with getCurrentPlan mocked to resolve null
    const { getByTestId } = await render(<PlanScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest plan-screen.test.tsx`
Expected: FAIL — no `testID="mascot-image"` exists yet in the empty state.

- [ ] **Step 3: Add the mascot and domain wiring**

In `src/app/(tabs)/plan.tsx`, add the import:

```tsx
import { Mascot } from '../../components/ui/Mascot';
```

Replace the empty-plan `EmptyState`:

```tsx
        <EmptyState
          illustration={require('../../../assets/images/illustrations/empty-plan.png')}
          title="Aucun plan pour l'instant"
          message="Génère ton premier plan de repas de la semaine."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
        />
```

with:

```tsx
        <EmptyState
          icon={<Mascot pose="idle" size={120} />}
          title="Aucun plan pour l'instant"
          message="Génère ton premier plan de repas de la semaine."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
          domain="nutrition"
        />
```

(Switches from `illustration` to `icon` — `EmptyState` only renders one or
the other, and the mascot replaces the old static illustration entirely per
the spec.)

Add `domain="nutrition"` to the day-tabs `ChoiceGroup`:

```tsx
      <ChoiceGroup
        options={DAY_TAB_OPTIONS}
        value={String(activeDayIndex)}
        onChange={(value) => setActiveDayIndex(Number(value))}
        domain="nutrition"
      />
```

- [ ] **Step 4: Move `accentRed`/`accentRedDeep` off the legacy tokens**

```tsx
        <ActivityIndicator color={colors.accentRed} />
```
(the loading-state one, near the top of the render) →
```tsx
        <ActivityIndicator color={colors.domainNutrition} />
```

```tsx
                  {swappingId === entry.id ? (
                    <ActivityIndicator size="small" color={colors.accentRed} />
```
→
```tsx
                  {swappingId === entry.id ? (
                    <ActivityIndicator size="small" color={colors.domainNutrition} />
```

```ts
    swapHint: { ...typography.captionStrong, color: colors.accentRedDeep, marginLeft: spacing.md },
```
→
```ts
    swapHint: { ...typography.captionStrong, color: colors.domainNutritionDeep, marginLeft: spacing.md },
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest plan-screen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(tabs)/plan.tsx" src/__tests__/plan-screen.test.tsx
git commit -m "feat: migrate Plan to the claymorphic system (mascot, domain color)"
```

---

### Task 8: Migrate Recettes (`(tabs)/recipes.tsx`)

**Files:**
- Modify: `src/app/(tabs)/recipes.tsx`
- Test: Modify `src/__tests__/recipes-screen.test.tsx`

**Interfaces:**
- Consumes: `Mascot` (Phase 1), `ChoiceGroup`'s `domain` prop (Task 2).
- Produces: nothing consumed by a later task.

Recettes' default domain is `nutrition`. No macro icons here — see Task 4's
note (recipe list cards show only a calorie count).

- [ ] **Step 1: Write the failing test**

Read `src/__tests__/recipes-screen.test.tsx` first to find how it drives the
screen into the "no results" filtered state (it must already do this for
some existing assertion, or you'll need to set filters that produce zero
matches — check the test file's existing recipe fixtures before writing new
setup). Add:

```tsx
  it('shows the idle mascot when no recipe matches the filters', async () => {
    // drive filters to zero matches using this file's existing fixtures/setup
    const { getByTestId } = await render(<RecipesScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest recipes-screen.test.tsx`
Expected: FAIL — no `testID="mascot-image"` exists yet.

- [ ] **Step 3: Add the mascot and domain wiring**

In `src/app/(tabs)/recipes.tsx`, add the import:

```tsx
import { Mascot } from '../../components/ui/Mascot';
```

Replace the empty-results `EmptyState`:

```tsx
        <EmptyState
          title="Aucune recette ne correspond"
          message="Essaie d'assouplir tes filtres pour voir plus de résultats."
        />
```

with:

```tsx
        <EmptyState
          icon={<Mascot pose="idle" size={120} />}
          title="Aucune recette ne correspond"
          message="Essaie d'assouplir tes filtres pour voir plus de résultats."
        />
```

(No `actionLabel`/`onAction` here — same as before, so no `domain` prop is
meaningful either; `EmptyState` only renders a `Button` when both are
given.)

Add `domain="nutrition"` to both `ChoiceGroup`s:

```tsx
      <ChoiceGroup options={MEAL_TYPE_OPTIONS} value={mealType} onChange={setMealType} domain="nutrition" />
      <TagFilterGroup options={TAG_OPTIONS} value={tags} onChange={setTags} />
      <ChoiceGroup options={PREP_TIME_OPTIONS} value={prepTimeValue} onChange={setPrepTimeValue} domain="nutrition" />
```

(`TagFilterGroup` is untouched — it's a different component, not in this
plan's scope; confirm it doesn't also hardcode `accentRed` by a quick read,
but do not modify it unless it does, since it's not named in the spec.)

- [ ] **Step 4: Move `accentRed` off the legacy token**

```tsx
        <ActivityIndicator color={colors.accentRed} />
```
→
```tsx
        <ActivityIndicator color={colors.domainNutrition} />
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest recipes-screen.test.tsx`
Expected: PASS, all tests including the new one.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(tabs)/recipes.tsx" src/__tests__/recipes-screen.test.tsx
git commit -m "feat: migrate Recettes to the claymorphic system (mascot, domain color)"
```

---

### Task 9: Migrate Muscu (`(tabs)/workout.tsx`)

**Files:**
- Modify: `src/app/(tabs)/workout.tsx`
- Test: Modify `src/__tests__/workout-completion.test.tsx`

**Interfaces:**
- Consumes: `Mascot` (Phase 1), `ChoiceGroup`'s `domain` prop (Task 2).
- Produces: nothing consumed by a later task.

Muscu's default domain is `sport`. **No effort-level icons** in this task —
see the spec's correction note; there is no effort/intensity data in the
current model, so this task is mascot + domain-color wiring only, matching
the other screens' scope exactly.

- [ ] **Step 1: Write the failing test**

Read `src/__tests__/workout-completion.test.tsx` first for its existing
mock setup (it already renders `WorkoutScreen` with a mocked
`trainingProfile`). Add:

```tsx
  it('shows the idle mascot in the header', async () => {
    const { getByTestId } = await render(<WorkoutScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest workout-completion.test.tsx`
Expected: FAIL — no `testID="mascot-image"` exists yet.

- [ ] **Step 3: Add the mascot to the header**

In `src/app/(tabs)/workout.tsx`, add the import:

```tsx
import { Mascot } from '../../components/ui/Mascot';
```

Replace:

```tsx
      <Text style={styles.title}>{homeWorkoutProgram.title}</Text>
      <Text style={styles.subtitle}>{homeWorkoutProgram.subtitle}</Text>
```

with:

```tsx
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{homeWorkoutProgram.title}</Text>
          <Text style={styles.subtitle}>{homeWorkoutProgram.subtitle}</Text>
        </View>
        <Mascot pose="idle" size={64} />
      </View>
```

Add the two new styles (alongside `title`/`subtitle` in `createStyles`):

```ts
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerText: { flex: 1, marginRight: spacing.md },
```

(`subtitle`'s existing `marginBottom: spacing.lg` stays on the `Text` style
itself, unaffected by this wrapping.)

- [ ] **Step 4: Add `domain="sport"` to both `ChoiceGroup`s and both `Button`s**

```tsx
      <ChoiceGroup options={LEVEL_OPTIONS} value={trainingProfile.experienceLevel} onChange={handleLevelChange} domain="sport" />
```

```tsx
      <ChoiceGroup
        options={SESSION_TAB_OPTIONS}
        value={String(activeSessionIndex)}
        onChange={(value) => setActiveSessionIndex(Number(value))}
        domain="sport"
      />
```

```tsx
              <Button title="Commencer" onPress={() => handleStartSession(index)} domain="sport" />
```

```tsx
                <Button
                  title="Marquer comme terminée"
                  onPress={handleToggleCompletion}
                  loading={loggingCompletion}
                  domain="sport"
                />
```

- [ ] **Step 5: Move `accentRed`/`accentRedDeep` off the legacy tokens**

```tsx
        <ActivityIndicator color={colors.accentRed} />
```
(the loading-state one) →
```tsx
        <ActivityIndicator color={colors.domainSport} />
```

```tsx
      {savingLevel && <ActivityIndicator size="small" color={colors.accentRed} />}
```
→
```tsx
      {savingLevel && <ActivityIndicator size="small" color={colors.domainSport} />}
```

```ts
    completionUndoLink: { ...typography.caption, color: colors.accentRedDeep },
```
→
```ts
    completionUndoLink: { ...typography.caption, color: colors.domainSportDeep },
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx jest workout-completion.test.tsx`
Expected: PASS, all tests including the new one.

- [ ] **Step 7: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(tabs)/workout.tsx" src/__tests__/workout-completion.test.tsx
git commit -m "feat: migrate Muscu to the claymorphic system (mascot, domain color)"
```

---

### Task 10: Migrate Progression (`progression.tsx`)

**Files:**
- Modify: `src/app/progression.tsx`
- Test: Modify `src/__tests__/progression-screen.test.tsx`

**Interfaces:**
- Consumes: `Mascot` (Phase 1).
- Produces: nothing consumed by a later task.

Progression's default domain is `progress`.

- [ ] **Step 1: Write the failing tests**

Read `src/__tests__/progression-screen.test.tsx` first — it already has
fixtures for a streak value in its main test. Add two tests, adjusting the
mocked streak value per case (check the existing test's mock shape for
`fetchMyCompletions`/`computeStats` and reuse it):

```tsx
  it('shows the celebrating mascot when the streak is a multiple of 7', async () => {
    // mock stats so stats.streak === 7 (or reuse/adjust this file's existing streak fixture to 7)
    const { getByTestId } = await render(<ProgressionScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
    // The Mascot component itself doesn't expose its `pose` prop on the
    // rendered element, so assert indirectly isn't possible here without a
    // testID per pose — instead, confirm this via the source in Step 3/4
    // and keep this test as a smoke check that the mascot renders at all
    // in this state. (Mascot.test.tsx already covers pose-switching
    // behavior in isolation.)
  });

  it('shows the idle mascot when the streak is not a multiple of 7', async () => {
    // mock stats so stats.streak === 3 (or reuse/adjust this file's existing streak fixture to 3)
    const { getByTestId } = await render(<ProgressionScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest progression-screen.test.tsx`
Expected: FAIL — no `testID="mascot-image"` exists yet.

- [ ] **Step 3: Add the mascot near the header**

In `src/app/progression.tsx`, add the import:

```tsx
import { Mascot } from '../components/ui/Mascot';
```

Replace:

```tsx
      <Text style={styles.title}>Progression</Text>

      <Card style={styles.headerCard}>
```

with:

```tsx
      <View style={styles.titleRow}>
        <Text style={styles.title}>Progression</Text>
        <Mascot pose={stats.streak > 0 && stats.streak % 7 === 0 ? 'celebrating' : 'idle'} size={64} />
      </View>

      <Card style={styles.headerCard}>
```

Add the `titleRow` style (alongside `title` in `createStyles`, and remove
`title`'s own `marginBottom: spacing.lg` since the row now carries that
spacing instead — otherwise the gap doubles up):

```ts
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
```

```ts
    title: { ...typography.display, color: colors.textPrimary },
```

(was `title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },`)

- [ ] **Step 4: Move `accentRed` off the legacy tokens**

```tsx
        <ActivityIndicator color={colors.accentRed} />
```
→
```tsx
        <ActivityIndicator color={colors.domainProgress} />
```

```ts
    dayDotDone: { backgroundColor: colors.accentRed, borderColor: colors.accentRed },
```
→
```ts
    dayDotDone: { backgroundColor: colors.domainProgress, borderColor: colors.domainProgress },
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest progression-screen.test.tsx`
Expected: PASS, all tests including the two new ones.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add src/app/progression.tsx src/__tests__/progression-screen.test.tsx
git commit -m "feat: migrate Progression to the claymorphic system (mascot, domain color)"
```

---

### Task 11: Mascot celebration at end of workout session

**Files:**
- Modify: `src/app/workout-session.tsx`
- Test: Modify `src/__tests__/workout-session.test.tsx`

**Interfaces:**
- Consumes: `Mascot` (Phase 1).
- Produces: nothing consumed by a later task.

This is a targeted change, not a full screen migration — `workout-
session.tsx` is not one of the 5 screens in this plan's scope; only the
finished-session moment changes, per the spec.

- [ ] **Step 1: Update the existing test to expect the new copy**

In `src/__tests__/workout-session.test.tsx`, change:

```ts
    expect(await findByText('Séance terminée 🎉')).toBeTruthy();
```

to:

```ts
    expect(await findByText('Séance terminée')).toBeTruthy();
```

- [ ] **Step 2: Run the test to confirm it now fails**

Run: `npx jest workout-session.test.tsx`
Expected: FAIL on that one assertion — the screen still renders
`"Séance terminée 🎉"` with the emoji, not the plain string.

- [ ] **Step 3: Add the mascot and update the copy**

In `src/app/workout-session.tsx`, add the import:

```tsx
import { Mascot } from '../components/ui/Mascot';
```

Replace:

```tsx
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedTitle}>Séance terminée 🎉</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Marquer la séance comme terminée" onPress={handleFinish} loading={finishing} />
        </View>
```

with:

```tsx
        <View style={styles.finishedContainer}>
          <Mascot pose="celebrating" size={140} />
          <Text style={styles.finishedTitle}>Séance terminée</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Marquer la séance comme terminée" onPress={handleFinish} loading={finishing} domain="sport" />
        </View>
```

Check `finishedContainer`'s existing style (read the file's `createStyles`
around `finishedContainer`) — it should already center its children
(`alignItems: 'center'`); if it doesn't, add `alignItems: 'center'` so the
mascot and title line up. Add spacing below the mascot if
`finishedContainer` doesn't already have a `gap`:

```ts
    finishedContainer: { /* ...existing properties..., */ gap: spacing.md },
```

(Only add `gap: spacing.md` if the existing object doesn't already space its
children — check first, don't duplicate a spacing property that's already
there under a different name.)

Also move `countdown`'s `colors.accentRed` off the legacy token, since this
file is being touched anyway and it's the same rule applied everywhere
else:

```ts
    countdown: { ...typography.hero, color: colors.accentRed, marginBottom: spacing.xl },
```
→
```ts
    countdown: { ...typography.hero, color: colors.domainSport, marginBottom: spacing.xl },
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest workout-session.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/workout-session.tsx src/__tests__/workout-session.test.tsx
git commit -m "feat: celebrate session completion with the mascot instead of an emoji"
```

---

### Task 12: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: clean (per the pre-existing-error caveat in Global Constraints —
confirm no NEW error appears in any file this plan touched).

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: all tests pass, including every new/modified test file from
Tasks 1–11.

- [ ] **Step 3: Grep for leftover legacy references in the 6 migrated files**

```bash
grep -n "accentRed" "src/app/(tabs)/home.tsx" "src/app/(tabs)/plan.tsx" "src/app/(tabs)/recipes.tsx" "src/app/(tabs)/workout.tsx" src/app/progression.tsx src/app/workout-session.tsx
```

Expected: no matches. (`accentRed*` itself still exists in
`src/theme/tokens.ts` for the ~15 screens this plan doesn't touch — that's
correct and expected, not a leftover to fix.)

- [ ] **Step 4: Confirm the old icon dependencies are actually gone from the tab bar**

```bash
grep -n "Ionicons\|KgIcon" "src/app/(tabs)/_layout.tsx"
```

Expected: no matches — Task 3 replaced every `tabBarIcon` with `TabIcon`.
(`Ionicons`/`KgIcon` may still exist as files/dependencies; this check is
only about the tab bar no longer using them, per Task 3's own note.)

- [ ] **Step 5: Run the app and check on-device before going further**

Start the app (Expo Go or a simulator/emulator — no EAS build) and manually
walk: Accueil (mascot in header, breathing; "Générer" button amber; macro
icons next to each number), Plan (empty state shows the mascot if you have
no plan, or the day tabs are amber when selected if you do), Recettes
(filter pills amber when selected; trigger a zero-result filter to see the
mascot in the empty state), Muscu (mascot in header; level/session tabs and
both buttons green), a full workout session through to completion (mascot
bounces in celebrating, "Séance terminée" with no emoji), Progression
(mascot idle or celebrating depending on your current streak; day dots and
streak numbers rose-pink). Also check the tab bar itself: all 6 icons
present, active tab fully opaque, inactive tabs dimmed. This step is not
optional — this exact design system already reverted one change (dark
mode) after an on-device look caught something no test did; the same
lesson from Phase 1 applies here.

- [ ] **Step 6: Commit if Step 3 or 4 required any cleanup**

Only if either grep found something to fix — otherwise this task produces
no diff of its own and there's nothing to commit.

---

## Follow-up work (separate plan, not part of this one)

- **Phase 3**: the remaining ~8 screens not in this plan's scope — auth
  (login/signup/forgot-password/onboarding), recipe detail, exercise
  detail, generate-plan, grocery-list, weight-log. Each needs the same
  mascot/domain-color/icon treatment this plan gave its 5 screens.
- **The 2 remaining mascot poses** (moving/transition,
  encouraging-after-a-setback) — generate only once a real placement in a
  later phase actually needs one; Phase 2 doesn't.
- **Effort/intensity data model** — if a future design wants a per-exercise
  effort indicator (the idea this plan's spec originally carried, based on
  a mockup that invented the detail), that starts with adding real
  effort/intensity data to `homeWorkoutProgram.ts`'s session/exercise
  types, not with icons alone.
- **`TagFilterGroup`** (used by Recettes for its tag filter row) was not
  touched by this plan — confirm whether it also hardcodes `accentRed` and
  give it the same `domain` treatment as `ChoiceGroup` if so, when Recettes
  gets deeper attention in a later phase.
