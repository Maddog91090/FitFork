# Claymorphic Mascot Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's "Soft Neutral" design system with the claymorphic,
multi-domain-color identity from
`docs/superpowers/specs/2026-08-09-claymorphic-mascot-design-system-design.md`
— new color/shape/typography/motion tokens, the `Card`/`Button`/
`PressableScale` shared components re-skinned on them, and a base mascot
component with its first two poses — as a shippable, on-device testable
foundation for the screen-by-screen rollout that follows.

**Architecture:** The app has a hard house rule (`fitfork-design` skill,
`AGENTS.md`): every screen and shared component reads colors, type, spacing,
radius, shadow and motion from `src/theme/tokens.ts` — never inline. Swapping
values in `tokens.ts` re-skins the ~20 screens that already consume it with
**zero changes to those screens**, the same mechanism the (superseded) Coral
Rush plan relied on. This plan touches `tokens.ts` plus exactly the three
shared components the design spec names for Phase 1 (`Card`, `Button`,
`PressableScale`) plus one new component (`Mascot`). Two genuinely new
technical pieces: a "clay" look (puffy volume, soft two-tone shadow) that
React Native cannot express with a CSS-style inset shadow, so it is faked
with a low-opacity diagonal `LinearGradient` sheen self-clipped to each
surface's own `borderRadius` (no `overflow: hidden` needed, which would
otherwise clip the surface's own drop shadow too); and a domain-color system
that replaces the single scarce `accentRed` with four color families
(`domainNutrition`, `domainSport`, `domainProgress`, `domainNeutral`) that
`Button` picks between via a new `domain` prop.

**Tech Stack:** Expo SDK 57 / React Native, TypeScript, `react-native-reanimated`
4.5 (springs, shared values, `interpolateColor`), `expo-linear-gradient`
(new dependency), `expo-image`, `expo-font` / `@expo-google-fonts/*`, Jest +
`jest-expo` + `@testing-library/react-native`.

## Global Constraints

- Zero hex codes, zero raw `fontSize`/`fontWeight` in any screen or component
  diff — everything comes from `src/theme/tokens.ts`.
- Every tappable element stays at minimum `state.minTouchSize` (44pt) with a
  visible pressed state and `accessibilityRole`.
- Every new foreground/background text pairing must be ≥ 4.5:1 contrast
  (WCAG AA), verified by an in-repo test — not eyeballed. `textTertiary` is
  the one documented exception (decorative-only, fails AA on purpose). Every
  hex value used below was pre-computed against this exact 4.5:1 threshold
  (relative-luminance WCAG formula) before being written into this plan, so
  the "Expected: PASS" outcomes are not guesses.
- The app stays **light-only** — no dark palette work in this plan.
- French, tutoiement, throughout (no new user-facing copy is introduced by
  this plan — it is tokens and shared components only).
- `npx tsc --noEmit` and `npx jest` must be clean before any task is
  considered done.
- No EAS build is triggered by this plan, automatically or otherwise —
  iterate via Expo Go or a simulator/emulator. Only run a build if the user
  explicitly asks for one outside this plan.
- When a Reanimated API is used that the hand-written mock at
  `__mocks__/react-native-reanimated.js` doesn't cover yet, extend that file
  in the same task rather than trying to load the library's real mock (which
  crashes under `jest-expo` — see the mock file's own header comment).

---

### Task 1: Palette tokens — domain colors and warm surfaces

**Files:**
- Modify: `src/theme/tokens.ts` (`lightColors` object only)
- Test: Create `src/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `lightColors.domainNutrition` / `domainNutritionDeep`,
  `domainSport` / `domainSportDeep`, `domainProgress` / `domainProgressDeep`,
  `domainNeutral` / `domainNeutralDeep` — consumed by Task 6 (`Button`).
  `lightColors.accentRed` / `accentRedDeep` / `accentRedSoft` **keep their
  existing key names** (21 screens outside this plan's scope still read them)
  but change value to the same hex as the progress domain, so every
  unmigrated screen picks up a coherent new-palette color instead of the old
  red until it's migrated to a real domain token in a later plan — see
  "Follow-up work" at the end of this plan.

- [ ] **Step 1: Write the failing contrast test**

Create `src/__tests__/tokens.test.ts`:

```ts
import { lightColors } from '../theme/tokens';

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('lightColors contrast (WCAG AA, 4.5:1)', () => {
  it.each([
    ['textPrimary on bgBase', lightColors.textPrimary, lightColors.bgBase],
    ['textPrimary on bgSurface', lightColors.textPrimary, lightColors.bgSurface],
    ['textPrimary on bgSunken', lightColors.textPrimary, lightColors.bgSunken],
    ['textSecondary on bgBase', lightColors.textSecondary, lightColors.bgBase],
    ['textSecondary on bgSurface', lightColors.textSecondary, lightColors.bgSurface],
    ['textSecondary on bgSunken', lightColors.textSecondary, lightColors.bgSunken],
    ['domainNutritionDeep on bgBase', lightColors.domainNutritionDeep, lightColors.bgBase],
    ['domainSportDeep on bgBase', lightColors.domainSportDeep, lightColors.bgBase],
    ['domainProgressDeep on bgBase', lightColors.domainProgressDeep, lightColors.bgBase],
    ['domainNeutralDeep on bgBase', lightColors.domainNeutralDeep, lightColors.bgBase],
    ['textOnAccent on domainNutrition (fill)', lightColors.textOnAccent, lightColors.domainNutrition],
    ['textOnAccent on domainSport (fill)', lightColors.textOnAccent, lightColors.domainSport],
    ['textOnAccent on domainProgress (fill)', lightColors.textOnAccent, lightColors.domainProgress],
    ['textOnAccent on domainNeutral (fill)', lightColors.textOnAccent, lightColors.domainNeutral],
  ])('%s is at least 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('textTertiary intentionally fails AA on bgBase (decorative use only)', () => {
    expect(contrastRatio(lightColors.textTertiary, lightColors.bgBase)).toBeLessThan(4.5);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails against the current (Soft Neutral) values**

Run: `npx jest tokens.test.ts`
Expected: FAIL — `lightColors.domainNutritionDeep` (and the other `domain*`
keys) don't exist yet, so `relativeLuminance(undefined)` throws inside the
first `domain*` test case. That confirms the test exercises tokens that
don't exist yet, which is this step's only job — not a clean per-case
red/green table yet.

- [ ] **Step 3: Replace `lightColors` in `src/theme/tokens.ts`**

```ts
export const lightColors = {
  // Surfaces — light warm cream base (lighter than Soft Neutral's paper, to
  // let the saturated domain colors read as vivid rather than muddy), pure
  // white raised, soft peach sunken.
  bgBase: '#FFFBF5',
  bgSurface: '#FFFFFF',
  bgSunken: '#FFF3E0',

  // Text — warm ink instead of Soft Neutral's cool gray-black, to match the
  // warmer surfaces. textSecondary is AA-compliant on bgBase/bgSurface/
  // bgSunken (6.0–6.6:1). textTertiary fails AA on purpose: decorative or
  // redundant text only.
  textPrimary: '#2E2418',
  textSecondary: '#6B5A46',
  textTertiary: '#B8A78E',
  textOnAccent: '#FFFFFF',

  // Legacy single-accent keys — kept because 21 screens outside this plan's
  // scope still read them directly. Repointed to the progress-domain color
  // (the closest emotional match to the old "important/celebratory" red) so
  // those screens look coherent with the new palette immediately, rather
  // than staying stuck on Soft Neutral red. A later plan replaces each call
  // site with the correct per-screen domain token and deletes these three
  // keys — see "Follow-up work".
  accentRed: '#C2325A',
  accentRedDeep: '#A31C42',
  accentRedSoft: '#FFE3E9',

  // Domain colors — nutrition/sport/progress each own a hue; there is no
  // single brand accent anymore. `*Deep` is for text/icons at body size and
  // for a button's pressed-state fill; the base tone is for large fills
  // (buttons, big icon backgrounds) and passes AA with white text on top.
  domainNutrition: '#B25900',
  domainNutritionDeep: '#8A5200',
  domainSport: '#187A57',
  domainSportDeep: '#0E4F38',
  domainProgress: '#C2325A',
  domainProgressDeep: '#A31C42',
  domainNeutral: '#7A5C34',
  domainNeutralDeep: '#6B4F26',

  // Lines. divider = inside a surface, border = around one. Warmed to match
  // the new surfaces.
  divider: '#FBEAD3',
  border: '#F0D9B8',
  borderStrong: '#E0C093',

  // Status — unchanged. Not part of this design system's scope.
  error: '#DC2626',
  errorSoft: '#FBEAE7',
  success: '#15803D',
  successSoft: '#E6F2EA',
  warning: '#B45309',
  warningSoft: '#FBF0E2',

  // Domain vocabulary — macros and training intensity. Unchanged: these are
  // a finer-grained vocabulary than the four screen-level domain colors
  // above (e.g. all three macros can appear together on one nutrition
  // screen), and the design spec never asked to touch them.
  macroProtein: '#C2410C',
  macroCarbs: '#0F766E',
  macroFat: '#4338CA',
  effort: '#DC2626',
  rest: '#0369A1',

  overlay: 'rgba(46, 36, 24, 0.45)',
} as const;
```

- [ ] **Step 4: Run the test again and confirm every pair passes**

Run: `npx jest tokens.test.ts`
Expected: PASS — all 14 contrast pairs ≥ 4.5:1, `textTertiary` confirmed
< 4.5:1.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `npx jest`
Expected: PASS. No test in this repo asserts a literal `accentRed*` hex
value (confirmed by grep before writing this plan), so this should be clean.

- [ ] **Step 6: Commit**

```bash
git add src/theme/tokens.ts src/__tests__/tokens.test.ts
git commit -m "feat: swap Soft Neutral palette for domain colors"
```

---

### Task 2: Shape tokens — generous radius, warm two-tier shadow, clay overlay

**Files:**
- Modify: `src/theme/tokens.ts` (`radius`, `shadow`)
- Test: Modify `src/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `radius.*` (same 7 keys, larger values — every existing
  consumer gets puffier corners for free), `shadow.subtle` / `card` /
  `raised` (same 3 keys, warmer/bigger values; the `shadow.button` key is
  **removed** — its only consumer, `Button.tsx`, is rewritten in Task 6 to
  compute a domain-tinted shadow color at the call site instead), and a new
  `clayOverlay` token (plain data: gradient stops/direction for the puffy
  highlight sheen) consumed by Task 5 (`Card`) and Task 6 (`Button`).

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/tokens.test.ts` (add `radius` to the existing
top-of-file import first):

```ts
import { lightColors, radius } from '../theme/tokens';
```

Then append below the existing `describe` block:

```ts
describe('radius', () => {
  it('is generous everywhere — no small corners in the claymorphic direction', () => {
    expect(radius.xs).toBeGreaterThanOrEqual(10);
    expect(radius.sm).toBeGreaterThanOrEqual(16);
    expect(radius.md).toBeGreaterThanOrEqual(20);
    expect(radius.lg).toBeGreaterThanOrEqual(24);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest tokens.test.ts`
Expected: FAIL — `radius.xs` is still `8`, `radius.sm` is still `12`.

- [ ] **Step 3: Update `radius` and `shadow` in `src/theme/tokens.ts`**

Replace the `radius` export:

```ts
export const radius = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 26,
  xl: 32,
  pill: 28,
  full: 999,
} as const;
```

Replace the `shadow` export:

```ts
/**
 * Claymorphic elevation. Every shadow is warm-tinted (never pure black) to
 * read as depth in a puffy material rather than a hard drop shadow. There is
 * no per-domain shadow tier here — `Button`'s primary variant overrides
 * `shadowColor` per domain at the call site (see Task 6); everything else
 * uses these as-is.
 */
export const shadow = {
  subtle: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  card: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  raised: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

/**
 * The "puffy" inner-highlight illusion. React Native has no CSS-style inset
 * shadow, so the claymorphic volume cue is faked with a low-opacity diagonal
 * sheen laid on top of a surface: lighter top-left (catching light), fading
 * through transparent, to a faint warm dark bottom-right (falling into
 * shadow). Consumers render this as an `expo-linear-gradient` `LinearGradient`
 * sized to `StyleSheet.absoluteFill` **with its own `borderRadius`
 * matching the surface** — a view always clips its own background/gradient
 * fill to its own border radius, so no `overflow: 'hidden'` is needed on the
 * parent (which would otherwise also clip the parent's drop shadow).
 */
export const clayOverlay = {
  colors: ['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)', 'rgba(58,46,34,0.10)'],
  locations: [0, 0.55, 1],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;
```

- [ ] **Step 4: Run the test again and confirm it passes**

Run: `npx jest tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `npx jest`
Expected: PASS — no test asserts an exact shadow or radius value, and
`shadow.button` had exactly one consumer (`Button.tsx`), which Task 6
rewrites; nothing else in the repo references it (confirmed by grep before
writing this plan).

- [ ] **Step 6: Commit**

```bash
git add src/theme/tokens.ts src/__tests__/tokens.test.ts
git commit -m "feat: generous radius, warm two-tier shadow, clay overlay token"
```

---

### Task 3: Typography tokens — Fredoka

**Files:**
- Modify: `package.json` (swap `@expo-google-fonts/fraunces` and
  `@expo-google-fonts/plus-jakarta-sans` for `@expo-google-fonts/fredoka`)
- Modify: `src/theme/tokens.ts` (`fontFamily` values and doc comment only)
- Modify: `src/app/_layout.tsx` (font imports and `useFonts` map)
- Test: Modify `src/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: nothing from Tasks 1–2.
- Produces: `fontFamily.displayBold` = `'Fredoka_700Bold'`,
  `displaySemiBold` = `'Fredoka_600SemiBold'`, `bodyRegular` =
  `'Fredoka_400Regular'`, `bodyMedium` = `'Fredoka_500Medium'`,
  `bodySemiBold` = `'Fredoka_600SemiBold'`, `bodyBold` = `'Fredoka_700Bold'`
  — every `typography.*` entry that spreads these (`hero`, `display`,
  `title`, `metric`, `heading`, `body`, `label`, etc.) picks up the single
  rounded family with no further change, same mechanism as Task 1's colors.

- [ ] **Step 1: Add the dependency, remove the old ones**

```bash
npx expo install @expo-google-fonts/fredoka
npm uninstall @expo-google-fonts/fraunces @expo-google-fonts/plus-jakarta-sans
```

- [ ] **Step 2: Write the failing typography test**

Add `fontFamily` to the top-of-file import in
`src/__tests__/tokens.test.ts`:

```ts
import { fontFamily, lightColors, radius } from '../theme/tokens';
```

Append below the existing `describe` blocks:

```ts
describe('fontFamily', () => {
  it('uses a single rounded family for both display and body weights', () => {
    expect(fontFamily.displayBold).toBe('Fredoka_700Bold');
    expect(fontFamily.displaySemiBold).toBe('Fredoka_600SemiBold');
    expect(fontFamily.bodyRegular).toBe('Fredoka_400Regular');
    expect(fontFamily.bodyMedium).toBe('Fredoka_500Medium');
    expect(fontFamily.bodySemiBold).toBe('Fredoka_600SemiBold');
    expect(fontFamily.bodyBold).toBe('Fredoka_700Bold');
  });

  it('has no leftover Fraunces or Plus Jakarta Sans reference', () => {
    const values = Object.values(fontFamily);
    expect(values.some((v) => v.includes('Fraunces'))).toBe(false);
    expect(values.some((v) => v.includes('PlusJakartaSans'))).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx jest tokens.test.ts`
Expected: FAIL — `fontFamily.displayBold` is still `'Fraunces_700Bold'` and
`fontFamily.bodyRegular` is still `'PlusJakartaSans_400Regular'`.

- [ ] **Step 4: Swap `fontFamily` in `src/theme/tokens.ts`**

```ts
/**
 * Custom fonts are loaded in `src/app/_layout.tsx`. React Native does not
 * synthesize weights for custom fonts, so weight lives in the family name —
 * never pair these with `fontWeight`. Fredoka carries everything — titles,
 * hero text, numbers, body, labels — there is no second family in this
 * design system.
 */
export const fontFamily = {
  displaySemiBold: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  bodyRegular: 'Fredoka_400Regular',
  bodyMedium: 'Fredoka_500Medium',
  bodySemiBold: 'Fredoka_600SemiBold',
  bodyBold: 'Fredoka_700Bold',
} as const;
```

- [ ] **Step 5: Load the new font weights in `src/app/_layout.tsx`**

Replace the four font imports:

```ts
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
```

with:

```ts
import { Fredoka_400Regular } from '@expo-google-fonts/fredoka/400Regular';
import { Fredoka_500Medium } from '@expo-google-fonts/fredoka/500Medium';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
```

And in the `useFonts` call, replace:

```ts
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
```

with:

```ts
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx jest tokens.test.ts`
Expected: PASS.

- [ ] **Step 7: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/theme/tokens.ts src/app/_layout.tsx src/__tests__/tokens.test.ts
git commit -m "feat: swap Fraunces + Plus Jakarta Sans for Fredoka"
```

---

### Task 4: Motion tokens — bouncier springs, claymorphic squish

**Files:**
- Modify: `src/theme/tokens.ts` (`motion.spring`, `motion.duration`,
  `state` — drop `pressedOpacity`, tighten `pressedScale`)
- Modify: `src/components/ui/PressableScale.tsx` (drop the opacity dip, keep
  scale only; fix doc comment)
- Test: Modify `src/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `motion.spring.snappy` (existing key, bouncier values — every
  caller, including `PressableScale`, gets more bounce for free),
  `motion.spring.celebrate` (new, for `Mascot`'s celebration pose in
  Task 7), `motion.duration.idle` (new, for `Mascot`'s idle breathing loop
  in Task 7), `state.pressedScale` (existing key, more pronounced — `0.90`
  instead of `0.97`). `state.pressedOpacity` is **removed** — its only
  consumer (`PressableScale`) stops using it in this task.

- [ ] **Step 1: Write the failing test**

Add `motion` to the top-of-file import in `src/__tests__/tokens.test.ts`:

```ts
import { fontFamily, lightColors, motion, radius } from '../theme/tokens';
```

Append below the existing `describe` blocks:

```ts
describe('motion.spring', () => {
  it('snappy is bouncier than Soft Neutral (lower damping, higher stiffness)', () => {
    expect(motion.spring.snappy.damping).toBeLessThanOrEqual(10);
    expect(motion.spring.snappy.stiffness).toBeGreaterThanOrEqual(240);
  });

  it('celebrate exists for reward moments and bounces more than snappy', () => {
    expect(motion.spring.celebrate).toBeDefined();
    expect(motion.spring.celebrate.damping).toBeLessThan(motion.spring.snappy.damping);
  });
});

describe('motion.duration', () => {
  it('has an idle-loop duration for the mascot breathing animation', () => {
    expect(motion.duration.idle).toBeGreaterThan(motion.duration.slow);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest tokens.test.ts`
Expected: FAIL — `snappy.damping` is still `14`, `celebrate` and
`duration.idle` don't exist.

- [ ] **Step 3: Update `motion` and `state` in `src/theme/tokens.ts`**

```ts
export const motion = {
  duration: {
    instant: 90,
    fast: 160,
    base: 240,
    slow: 360,
    /** One full cycle of the mascot's idle breathing loop (see Mascot.tsx). */
    idle: 2400,
  },
  curve: {
    standard: [0.2, 0, 0, 1],
    entrance: [0.05, 0.7, 0.1, 1],
    exit: [0.3, 0, 0.8, 0.15],
  },
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    /** Base of the "chips and cells" press pattern — visibly bouncy, the
     *  default feel for everyday taps and button presses in this direction. */
    snappy: { damping: 8, stiffness: 260, mass: 0.9 },
    /** Reward moments only: the mascot's celebration pose bouncing in.
     *  Pronounced overshoot — do not use for routine taps, it would read as
     *  exhausting rather than delightful. */
    celebrate: { damping: 5, stiffness: 220, mass: 1 },
  },
} as const;
```

In the same file, update `state` (remove `pressedOpacity`, tighten
`pressedScale`):

```ts
/** Interaction states — applied consistently so touch feels the same app-wide. */
export const state = {
  /** Visible claymorphic squish under the finger — deliberately pronounced. */
  pressedScale: 0.9,
  disabledOpacity: 0.55,
  hitSlop: 8,
  /** Minimum tappable square, per platform accessibility guidance. */
  minTouchSize: 44,
} as const;
```

- [ ] **Step 4: Update `PressableScale.tsx` to drop the opacity dip**

Replace the whole file:

```tsx
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { state, motion } from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * A Pressable that springs down on touch instead of snapping. This is the
 * "chips and cells" press pattern from the design system — a spring rather
 * than a static scale, so a tap feels physical and claymorphic-squishy.
 * Buttons have their own press animation (color + scale together, see
 * Button.tsx); do not use this for them.
 *
 * The scale rests at 1 and drops to state.pressedScale under the finger; the
 * snappy spring gives the release a visible bounce.
 */
export function PressableScale({ style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(1 - pressed.value * (1 - state.pressedScale), motion.spring.snappy) },
    ],
  }));

  return (
    <AnimatedPressable
      {...props}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        pressed.value = 1;
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = 0;
        onPressOut?.(e);
      }}
    >
      {props.children}
    </AnimatedPressable>
  );
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest tokens.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `npx jest`
Expected: PASS — no existing test asserts exact spring config or
`pressedScale`/`pressedOpacity` values (confirmed by grep before writing
this plan), and `pressedOpacity` had exactly one consumer, the file just
rewritten.

- [ ] **Step 7: Commit**

```bash
git add src/theme/tokens.ts src/components/ui/PressableScale.tsx src/__tests__/tokens.test.ts
git commit -m "feat: bouncier springs, claymorphic squish, celebrate spring"
```

---

### Task 5: `Card` component — claymorphic surface

**Files:**
- Modify: `package.json` (add `expo-linear-gradient`)
- Create: `__mocks__/expo-linear-gradient.js`
- Modify: `src/components/ui/Card.tsx`
- Test: Modify `src/__tests__/Card.test.tsx`

**Interfaces:**
- Consumes: `radius.lg`, `shadow.card`, `clayOverlay` from Task 2.
- Produces: `Card`'s rendered output now includes a child with
  `testID="card-clay-overlay"` — informational for Task 6's own tests, not a
  hard dependency (Button does not import from Card).

- [ ] **Step 1: Add the dependency**

```bash
npx expo install expo-linear-gradient
```

- [ ] **Step 2: Add the Jest manual mock**

`expo-linear-gradient` renders via a native view; under `jest-expo` it needs
the same hand-mock treatment as `react-native-reanimated` (see that file's
header comment for why — the same reasoning applies here: render as a plain
`View`, drop the props that aren't valid `View` props). Create
`__mocks__/expo-linear-gradient.js`:

```js
// Manual Jest mock for expo-linear-gradient — renders as a plain View so
// tests can assert on structure and layout without a native gradient
// renderer. Jest applies this automatically to every test file for any
// node_modules import of 'expo-linear-gradient', the same mechanism as
// __mocks__/react-native-reanimated.js.
const React = require('react');
const { View } = require('react-native');

const LinearGradient = React.forwardRef(({ colors, locations, start, end, ...rest }, ref) =>
  React.createElement(View, { ref, ...rest })
);

module.exports = { __esModule: true, LinearGradient };
```

- [ ] **Step 3: Write the failing test**

Append to `src/__tests__/Card.test.tsx`:

```tsx
  it('renders a clay overlay behind its content', async () => {
    const { getByTestId } = await render(
      <Card>
        <Text>Contenu</Text>
      </Card>
    );
    expect(getByTestId('card-clay-overlay')).toBeTruthy();
  });
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `npx jest Card.test.tsx`
Expected: FAIL — no element with `testID="card-clay-overlay"` exists yet.

- [ ] **Step 5: Implement `src/components/ui/Card.tsx`**

```tsx
import { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clayOverlay, radius, shadow, spacing, useThemeColors, type ThemeColors } from '../../theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        testID="card-clay-overlay"
        pointerEvents="none"
        colors={clayOverlay.colors}
        locations={clayOverlay.locations}
        start={clayOverlay.start}
        end={clayOverlay.end}
        style={styles.overlay}
      />
      {children}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow.card,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      // A view clips its own background/gradient fill to its own radius —
      // this needs no `overflow: 'hidden'` on `card`, which would otherwise
      // also clip `card`'s own drop shadow (see clayOverlay's doc comment
      // in tokens.ts).
      borderRadius: radius.lg,
    },
  });
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx jest Card.test.tsx`
Expected: PASS, both the existing "renders its children" test and the new
overlay test.

- [ ] **Step 7: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json __mocks__/expo-linear-gradient.js src/components/ui/Card.tsx src/__tests__/Card.test.tsx
git commit -m "feat: claymorphic Card with clay-overlay sheen"
```

---

### Task 6: `Button` component — domain color, squish, clay overlay

**Files:**
- Modify: `__mocks__/react-native-reanimated.js` (add `interpolateColor`)
- Modify: `src/components/ui/Button.tsx`
- Test: Modify `src/__tests__/Button.test.tsx`

**Interfaces:**
- Consumes: `domainNutrition(Deep)` / `domainSport(Deep)` /
  `domainProgress(Deep)` / `domainNeutral(Deep)` from Task 1;
  `radius.lg`, `shadow.raised`, `clayOverlay` from Task 2; `motion.spring.snappy`,
  `state.pressedScale` from Task 4; `LinearGradient` (and its Jest mock) from
  Task 5.
- Produces: `Button` gains a `domain?: 'nutrition' | 'sport' | 'progress' |
  'neutral'` prop (default `'neutral'`), meaningful only for
  `variant="primary"`. `testID="button-pressable"` on the root and
  `testID="button-clay-overlay"` on the gradient are new, stable test hooks.

- [ ] **Step 1: Extend the Reanimated mock with `interpolateColor`**

`Button`'s press-color transition needs `interpolateColor`, which
`__mocks__/react-native-reanimated.js` doesn't cover yet. Since the mock
resolves every animation to its end value synchronously, and this component
only ever drives it with a discrete `0`/`1` shared value (no continuous
drag), a two-point step function is a faithful mock — add this export
alongside the existing ones (after `withDelay`):

```js
  // Discrete two-point mock: real Reanimated does true interpolation, but
  // every consumer in this app only ever animates between 0 and 1 (press
  // states), so snapping to the nearer end of the range is exact enough for
  // tests to assert the committed style.
  interpolateColor: (value, inputRange, outputRange) =>
    value <= inputRange[0] ? outputRange[0] : outputRange[outputRange.length - 1],
```

- [ ] **Step 2: Write the failing tests**

`src/__tests__/Button.test.tsx` doesn't import from `'react-native'` or
`'../theme/tokens'` yet — add both as new import lines at the top of the
file, above the existing `import { Button } ...` line:

```tsx
import { StyleSheet } from 'react-native';
import { lightColors } from '../theme/tokens';
```

Then append inside the `describe('Button', ...)` block, after the existing
`it`s:

```tsx
  it('fills a primary button with its domain color', async () => {
    const { getByTestId } = await render(
      <Button title="Continuer" onPress={() => {}} domain="sport" />
    );
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightColors.domainSport);
  });

  it('defaults to the neutral domain when none is given', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} />);
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightColors.domainNeutral);
  });

  it('renders a clay overlay for the primary variant', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} />);
    expect(getByTestId('button-clay-overlay')).toBeTruthy();
  });

  it('does not render a clay overlay for the secondary variant', async () => {
    const { queryByTestId } = await render(
      <Button title="Continuer" onPress={() => {}} variant="secondary" />
    );
    expect(queryByTestId('button-clay-overlay')).toBeNull();
  });
```

- [ ] **Step 3: Run them to confirm they fail**

Run: `npx jest Button.test.tsx`
Expected: FAIL — no `testID="button-pressable"` or `"button-clay-overlay"`
exists yet, and `Button` has no `domain` prop.

- [ ] **Step 4: Implement `src/components/ui/Button.tsx`**

```tsx
import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  clayOverlay,
  motion,
  radius,
  shadow,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary';
type ButtonDomain = 'nutrition' | 'sport' | 'progress' | 'neutral';

const DOMAIN_FILL: Record<ButtonDomain, keyof ThemeColors> = {
  nutrition: 'domainNutrition',
  sport: 'domainSport',
  progress: 'domainProgress',
  neutral: 'domainNeutral',
};

const DOMAIN_DEEP: Record<ButtonDomain, keyof ThemeColors> = {
  nutrition: 'domainNutritionDeep',
  sport: 'domainSportDeep',
  progress: 'domainProgressDeep',
  neutral: 'domainNeutralDeep',
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Which domain's clay color fills the button. Ignored for variant="secondary". */
  domain?: ButtonDomain;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  domain = 'neutral',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  const pressed = useSharedValue(0);

  const fillColor = colors[DOMAIN_FILL[domain]];
  const deepColor = colors[DOMAIN_DEEP[domain]];
  const restColor = isDisabled ? colors.bgSurface : variant === 'primary' ? fillColor : colors.bgSurface;
  const downColor = isDisabled ? colors.bgSurface : variant === 'primary' ? deepColor : colors.bgSunken;
  const shadowTint = variant === 'primary' ? deepColor : colors.textPrimary;

  // transform (scale) and backgroundColor are both driven by the same
  // `pressed` shared value, so the squish and the color darken land on the
  // exact same frame — see PressableScale.tsx for the same one-shared-value
  // pattern.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * (1 - state.pressedScale), motion.spring.snappy) }],
    backgroundColor: interpolateColor(pressed.value, [0, 1], [restColor, downColor]),
  }));

  return (
    <AnimatedPressable
      testID="button-pressable"
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPressIn={() => {
        if (!isDisabled) pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      style={[styles.base, { shadowColor: shadowTint }, isDisabled && styles.disabledShadow, animatedStyle]}
    >
      {variant === 'primary' && !isDisabled && (
        <LinearGradient
          testID="button-clay-overlay"
          pointerEvents="none"
          colors={clayOverlay.colors}
          locations={clayOverlay.locations}
          start={clayOverlay.start}
          end={clayOverlay.end}
          style={styles.overlay}
        />
      )}
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textOnAccent : colors.textPrimary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' ? styles.labelPrimary : styles.labelSecondary,
            isDisabled && styles.labelDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      minHeight: state.minTouchSize,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.raised,
    },
    disabledShadow: {
      shadowOpacity: 0.04,
      elevation: 0,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      borderRadius: radius.lg,
    },
    label: {
      ...typography.label,
    },
    labelPrimary: {
      color: colors.textOnAccent,
    },
    labelSecondary: {
      color: colors.textPrimary,
    },
    labelDisabled: {
      color: colors.textSecondary,
    },
  });
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest Button.test.tsx`
Expected: PASS — all 8 tests (4 existing + 4 new).

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add __mocks__/react-native-reanimated.js src/components/ui/Button.tsx src/__tests__/Button.test.tsx
git commit -m "feat: domain-colored, squishy, claymorphic Button"
```

---

### Task 7: `Mascot` component — base pose set

**Files:**
- Create: `assets/images/mascot/mascot-idle.png`
- Create: `assets/images/mascot/mascot-celebrating.png`
- Create: `assets/images/mascot/README.md`
- Modify: `__mocks__/react-native-reanimated.js` (add `withRepeat`,
  `withSequence`, `Easing.sin`)
- Create: `src/components/ui/Mascot.tsx`
- Test: Create `src/__tests__/Mascot.test.tsx`

**Interfaces:**
- Consumes: `motion.spring.celebrate`, `motion.duration.idle` from Task 4.
- Produces: `Mascot` component and `MascotPose` type
  (`'idle' | 'celebrating'`) — the base for the follow-up plan that wires
  the mascot into actual screens (see "Follow-up work").

The design spec deliberately leaves the mascot's species/silhouette
undecided (2–3 illustrated options to be proposed during implementation,
not guessed in the spec). This task's first step is that proposal —a real
checkpoint, not a placeholder: it produces concrete concept art and pauses
for a human pick before generating the final production poses.

- [ ] **Step 1: Generate 3 concept options and pause for approval**

Use the `media-use` skill (this environment's image-generation/resolution
skill) to generate **one concept sheet per option**, each showing the same
generic sporty creature — no fixed species — in a simple standing pose, in
the claymorphic house style. Shared style block (prepend to every prompt):

> Claymorphic character illustration: a single generic sporty creature
> mascot for a fitness and nutrition app, standing in a simple front-facing
> pose. Puffy, rounded, gently 3D "clay" shapes — soft gradient shading with
> a light source from the upper left, no hard outlines, no flat vector look.
> Warm, friendly, chunky proportions. Transparent background (PNG with alpha
> channel). One single centered character, no text, no logos, no props.
> Square canvas, at least 1024×1024px.

Concept-specific additions:

- **Concept A — round blob athlete:** "A soft round bean/blob-shaped body,
  no visible neck, two stubby arms and two stubby legs, wearing a simple
  thin sporty headband. Big round expressive eyes, small friendly smile."
- **Concept B — bouncy pill critter:** "An oval/capsule-shaped body standing
  upright on two small rounded feet, short arms with simple wristbands. A
  slightly more elongated, energetic silhouette than a round blob. Simple
  friendly dot eyes and a small open smile."
- **Concept C — chunky star sprite:** "A soft five-point rounded star/blob
  hybrid shape with two arms and two legs emerging from the points, wearing
  a tiny rounded cap. Very simple graphic face — two dot eyes, no mouth
  detail beyond a gentle curve."

Save the three images anywhere convenient (they are not app assets, only
review material — do not commit them). Show them to the user and **stop
here for their pick** before continuing to Step 2 — do not guess which one
to carry forward.

- [ ] **Step 2: Generate the two V1 poses for the chosen concept**

Using the same shared style block and the chosen concept's specific
description from Step 1 as a consistent character reference, generate two
poses:

- `mascot-idle.png`: "Standing upright in a friendly, welcoming pose, one
  limb raised in a small wave, warm confident expression, weight centered
  and relaxed — this is the default at-rest pose, shown continuously."
- `mascot-celebrating.png`: "Both arms raised straight up in a triumphant
  pose, one foot lifted as if mid-bounce, joyful open expression — this is
  the milestone/success celebration pose, maximum energy, but keep the same
  proportions and color palette as the idle pose so they read as the same
  character."

Both **transparent PNG, square, at least 1024×1024** — transparency lets a
single asset sit on `bgBase`, `bgSurface`, or `bgSunken` with no seam.

- [ ] **Step 3: Save and verify the files**

Save to `assets/images/mascot/mascot-idle.png` and
`assets/images/mascot/mascot-celebrating.png` exactly as named — Task 7's
component `require()`s these exact paths. Then:

```bash
ls -la assets/images/mascot/*.png
file assets/images/mascot/*.png
```

Expected: two files, each reported as `PNG image data`, non-zero size. Open
each in an image viewer and visually confirm the background is transparent
(checkerboard, not a solid color) — there is no automated transparency
check in this repo, this is a manual gate.

- [ ] **Step 4: Document the set**

Create `assets/images/mascot/README.md`:

```markdown
# Mascot — base pose set

Two files, both transparent PNG, ≥1024×1024. Concept and prompts recorded in
`docs/superpowers/plans/2026-08-10-claymorphic-mascot-design-system.md`
(Task 7).

| File | Pose | Used by |
| --- | --- | --- |
| `mascot-idle.png` | Idle / at-rest, shown continuously | Not yet wired into a screen — this is the foundation component; screen placements are a follow-up plan. |
| `mascot-celebrating.png` | Celebration (milestone, streak, completion) | Not yet wired into a screen — same as above. |

Being transparent, each pose works on `bgBase`, `bgSurface`, or `bgSunken`
with no seam.

Two more poses are planned but not part of this base set — see "Follow-up
work" in the plan above: a moving/transition pose and an
encouraging-after-a-setback pose (never mocking, never sad-looking).
```

- [ ] **Step 5: Extend the Reanimated mock**

The idle breathing loop needs `withRepeat`, `withSequence`, and
`Easing.sin`, none of which `__mocks__/react-native-reanimated.js` covers
yet. Add these exports (`withRepeat`/`withSequence` follow the same
"resolve immediately" philosophy as the existing `identity` mock —
`withSequence` settles at its last step's value, `withRepeat` just returns
that resolved value since there is nothing to iterate synchronously):

```js
  withRepeat: (animation) => animation,
  withSequence: (...animations) => animations[animations.length - 1],
```

And add `sin` to the existing `Easing` object:

```js
  Easing: {
    bezier: () => (t) => t,
    linear: (t) => t,
    inOut: (fn) => fn,
    out: (fn) => fn,
    sin: (t) => t,
  },
```

- [ ] **Step 6: Write the failing test**

Create `src/__tests__/Mascot.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Mascot, type MascotPose } from '../components/ui/Mascot';

const POSES: MascotPose[] = ['idle', 'celebrating'];

describe('Mascot', () => {
  it.each(POSES)('renders an image for the %s pose', async (pose) => {
    const { getByTestId } = await render(<Mascot pose={pose} />);
    expect(getByTestId('mascot-image')).toBeTruthy();
  });

  it('defaults to a size x size square when no style is given', async () => {
    const { getByTestId } = await render(<Mascot pose="idle" size={96} />);
    expect(getByTestId('mascot-image').props.style).toEqual({ width: 96, height: 96 });
  });

  it('lets an explicit style fully replace the default sizing', async () => {
    const { getByTestId } = await render(
      <Mascot pose="idle" style={{ width: '100%', aspectRatio: 1, maxHeight: 150 }} />
    );
    expect(getByTestId('mascot-image').props.style).toEqual({
      width: '100%',
      aspectRatio: 1,
      maxHeight: 150,
    });
  });
});
```

- [ ] **Step 7: Run it to confirm it fails**

Run: `npx jest Mascot.test.tsx`
Expected: FAIL with "Cannot find module '../components/ui/Mascot'".

- [ ] **Step 8: Implement `src/components/ui/Mascot.tsx`**

```tsx
import { useEffect } from 'react';
import { Image, type ImageProps } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import type { ImageStyle, StyleProp } from 'react-native';
import { motion } from '../../theme/tokens';

export type MascotPose = 'idle' | 'celebrating';

const MASCOT_SOURCES: Record<MascotPose, ImageProps['source']> = {
  idle: require('../../../assets/images/mascot/mascot-idle.png'),
  celebrating: require('../../../assets/images/mascot/mascot-celebrating.png'),
};

type MascotProps = {
  /** Which moment this appearance is for — see assets/images/mascot/README.md. */
  pose: MascotPose;
  /** Square side in px, used only when `style` is omitted. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The FitPro mascot. `idle` breathes continuously (a slow scale pulse) so it
 * reads as alive even when nothing is happening — the design spec's
 * "présence continue" requirement. `celebrating` bounces in once with an
 * overshooting spring instead. `style` fully replaces the default
 * size-based sizing when given, so a caller that needs responsive sizing
 * (percentage width, aspectRatio) doesn't fight a baked-in width/height.
 */
export function Mascot({ pose, size = 160, style }: MascotProps) {
  const scale = useSharedValue(pose === 'celebrating' ? 0.5 : 1);

  useEffect(() => {
    if (pose === 'idle') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      scale.value = withSpring(1, motion.spring.celebrate);
    }
  }, [pose, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Image
        testID="mascot-image"
        source={MASCOT_SOURCES[pose]}
        style={style ?? { width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}
```

- [ ] **Step 9: Run the tests and confirm they pass**

Run: `npx jest Mascot.test.tsx`
Expected: PASS — all 4 tests (2 pose renders + 2 sizing modes).

- [ ] **Step 10: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 11: Commit**

```bash
git add assets/images/mascot/ __mocks__/react-native-reanimated.js src/components/ui/Mascot.tsx src/__tests__/Mascot.test.tsx
git commit -m "feat: add base Mascot component with idle and celebrating poses"
```

---

### Task 8: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: all tests pass, including the grown `tokens.test.ts`, the
extended `Card.test.tsx` and `Button.test.tsx`, and the new
`Mascot.test.tsx`.

- [ ] **Step 3: Grep for leftover Soft Neutral references**

```bash
grep -rn "Fraunces\|PlusJakartaSans\|#F7F5F2\|#1E1B18\|#EFEBE5" src/
```

Expected: no matches. (`#DC2626` is expected to still appear, for `error`
and `effort` — those are intentionally unchanged by this plan, see Task 1's
`lightColors` comment.)

- [ ] **Step 4: Run the app and check on-device before going further**

Start the app (Expo Go, per this project's usual fast-iteration path — do
not build with EAS) and manually check: any screen using `Button` and
`Card` (e.g. the login screen) shows the new warm palette, generous
corners, and puffy clay-overlay sheen; press a primary button and confirm
the squish + color-darken feel synchronized; press a `PressableScale`
element (a chip or list row) and confirm the more pronounced bounce.

This step is not optional. This exact design system previously shipped a
change (dark mode) that looked right on paper and was reverted after the
first real on-device look showed a problem no test caught — see
`fitfork-design/SKILL.md`'s "Dark mode" section. Do not start the
screen-by-screen rollout (see "Follow-up work") until this has been checked
on a real device or simulator, not just in Jest.

- [ ] **Step 5: Commit if Step 3 required any cleanup**

Only if Step 3 found something to fix — otherwise this task produces no
diff of its own and there's nothing to commit.

---

## Follow-up work (separate plan, not part of this one)

The design spec
(`docs/superpowers/specs/2026-08-09-claymorphic-mascot-design-system-design.md`)
describes a full rollout beyond this foundation. This plan intentionally
ships only tokens + `Card`/`Button`/`PressableScale` + a 2-pose `Mascot`
component, for the same reason the (superseded) Coral Rush plan gave and
that still applies: the remaining work is repetitive, screen-by-screen
integration best drawn up once this foundation has been seen and approved
on-device (Task 8, Step 4), not speculatively alongside it.

When ready, the next plan(s) should cover, in roughly this order:

1. **Legacy accent cleanup.** Replace every direct `colors.accentRed` /
   `accentRedDeep` / `accentRedSoft` read across the 21 screens that still
   use them (`onboarding.tsx`, `home.tsx`, `workout-session.tsx`,
   `progression.tsx`, etc. — see the grep run before writing this plan) with
   the correct per-screen domain token, then delete the three legacy keys
   from `lightColors` entirely.
2. **`domain*Soft` and gradient-stop tokens**, added only once a screen
   actually needs a tinted chip/badge background or a two-stop gradient fill
   (e.g. macro chips) — not speculatively now.
3. **Mascot screen placements** — onboarding, home, end-of-workout/
   end-of-meal-logging celebration, streak milestones, empty states — each
   wired to the `Mascot` component from Task 7, plus the two remaining poses
   the design spec lists (moving/transition, encouraging-after-a-setback).
4. **Expressive screen transitions** — the design spec's fourth motion
   front (elements bouncing in on navigation rather than a plain slide).
   Out of scope here because it's a navigation-level concern touching
   `expo-router` screen options, not a token or shared-component change.
5. **The claymorphic icon set** replacing the current emoji glyphs
   (macros, empty states, categories) — a separate illustration effort, not
   blocking on the above.
6. **Two-registry copy pass** — mascot/celebration copy gets energy and
   exclamations; functional copy (labels, errors, buttons) stays sober, per
   the design spec's "Ton du texte" section. No copy changes were needed for
   this plan (it touches no user-facing strings).
7. **Screen-by-screen visual QA** of every screen that consumes `Card` and
   `Button` indirectly (all ~20 of them) once the token swap has propagated
   — confirm nothing reads as visually broken now that padding, radius,
   shadow and domain colors changed everywhere at once, not just in the two
   components this plan directly touched.
