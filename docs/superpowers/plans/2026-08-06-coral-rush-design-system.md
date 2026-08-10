# Coral Rush Design System — Implementation Plan

> **SUPERSEDED — do not execute.** Coral Rush was never implemented (no task
> below was completed). The design direction was replaced by the claymorphic
> / multi-domain-color / generic-mascot spec at
> `docs/superpowers/specs/2026-08-09-claymorphic-mascot-design-system-design.md`.
> This plan is kept for historical reference only.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's "Soft Neutral" design system with "Coral Rush" — new
color/typography/motion tokens, a cheetah mascot component, and its first two
flagship placements (onboarding, end-of-workout) — as a shippable, on-device
testable foundation for the rest of the rollout.

**Architecture:** The app already has a hard house rule (`fitfork-design`
skill, `AGENTS.md`): every screen and shared component reads colors, type,
spacing and motion from `src/theme/tokens.ts` — never inline. That means
swapping the values in `tokens.ts` re-skins essentially the whole app with
**zero changes to screens or shared components** (`Button`, `Card`,
`PressableScale`, etc. all already consume `colors.accentRed`,
`typography.*`, `motion.*` by reference). The only genuinely new surface area
in this DA is the mascot: a new `Mascot` component plus real illustration
assets. This plan delivers tokens + mascot + two flagship placements as one
coherent, testable slice — see **Follow-up work** at the end for why the
remaining placements (home streak card, empty states, full copy pass) are
deliberately a separate plan.

**Tech Stack:** Expo / React Native, TypeScript, `react-native-reanimated`
(springs), `expo-image` + `expo-font` / `@expo-google-fonts/*`, Jest +
`jest-expo` + `@testing-library/react-native`.

## Global Constraints

- Zero hex codes, zero raw `fontSize`/`fontWeight` in any screen or component
  diff — everything comes from `src/theme/tokens.ts`.
- Every tappable element stays at minimum `state.minTouchSize` (44pt) with a
  visible pressed state and `accessibilityRole`.
- Every new foreground/background text pairing must be ≥ 4.5:1 contrast
  (WCAG AA) — verified by an in-repo test, not eyeballed. `textTertiary` is
  the one documented exception (decorative-only, fails AA on purpose).
- The app stays **light-only** — no dark palette work in this plan.
- French, tutoiement, throughout.
- `npx tsc --noEmit` and `npx jest` must be clean before any task is
  considered done.
- Shape/radius tokens (`radius.sm` 12px, `radius.md` 14px, `radius.lg` 16px)
  already sit inside the spec's "10–16px, no systematic pill" range — no
  radius changes are needed anywhere in this plan.

---

### Task 1: Palette tokens — Coral Reef

**Files:**
- Modify: `src/theme/tokens.ts` (`lightColors` object, `shadow.button`)
- Test: Create `src/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `lightColors.accentRed` / `accentRedDeep` / `accentRedSoft` now
  hold the coral values (existing key names — every component that already
  reads them, e.g. `Button.tsx`'s `colors.accentRed`, picks up the new brand
  color with no code change). New keys: `lightColors.accentTeal` /
  `accentTealDeep` / `accentTealSoft` (secondary accent — badges and
  secondary elements only, never a primary action, per the design spec).

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
    ['textSecondary on bgBase', lightColors.textSecondary, lightColors.bgBase],
    ['textSecondary on bgSurface', lightColors.textSecondary, lightColors.bgSurface],
    ['accentRedDeep on bgBase', lightColors.accentRedDeep, lightColors.bgBase],
    ['accentTealDeep on bgBase', lightColors.accentTealDeep, lightColors.bgBase],
    ['textOnAccent on accentRed', lightColors.textOnAccent, lightColors.accentRed],
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
Expected: passes today only by coincidence of the old palette — that's fine,
this step is a sanity check that the harness runs, not a red/green gate for
this particular test. Confirm it runs and reports pass/fail per pair (not a
crash), then move on.

- [ ] **Step 3: Replace `lightColors` in `src/theme/tokens.ts`**

```ts
export const lightColors = {
  // Surfaces — warm peach base, pure white for raised content.
  bgBase: '#FFF5F2',
  bgSurface: '#FFFFFF',
  bgSunken: '#FFE8E1',

  // Text — textSecondary is AA-compliant on bgBase and bgSurface (~4.8:1 / ~5.2:1).
  // textTertiary fails AA on purpose: decorative/redundant text only.
  textPrimary: '#3A3A5C',
  textSecondary: '#6B6B85',
  textTertiary: '#B89A93',
  textOnAccent: '#FFFFFF',

  // Brand accent — Coral Rush. Key names kept from Soft Neutral (accentRed*)
  // so every existing consumer picks up the new brand color for free.
  // accentRed is for fills and large type (~4.8:1 on bgBase, ~4.8:1 white-on-fill).
  // For red text or icons at body size, use accentRedDeep (~6.4:1).
  accentRed: '#CF3D26',
  accentRedDeep: '#A82D1A',
  accentRedSoft: '#FFEAE5',

  // Secondary accent — turquoise. Badges and secondary elements only, never
  // a primary action (see fitfork-design's "red is scarce" rule, same logic
  // now applies to teal being scarcer still).
  accentTeal: '#4ECDC4',
  accentTealDeep: '#1B7A73',
  accentTealSoft: '#E3F7F5',

  // Lines. divider = inside a surface, border = around one.
  divider: '#FFEDE7',
  border: '#F5DDD3',
  borderStrong: '#E8C9BC',

  // Status — unchanged by this DA (no spec requirement to touch these).
  error: '#DC2626',
  errorSoft: '#FBEAE7',
  success: '#15803D',
  successSoft: '#E6F2EA',
  warning: '#B45309',
  warningSoft: '#FBF0E2',

  // Domain vocabulary — macros and training intensity. Unchanged: still AA on
  // bgBase and hue-separated, and the spec never asked to touch them.
  macroProtein: '#C2410C',
  macroCarbs: '#0F766E',
  macroFat: '#4338CA',
  effort: '#DC2626',
  rest: '#0369A1',

  overlay: 'rgba(58, 58, 92, 0.45)',
} as const;
```

- [ ] **Step 4: Retint the button shadow**

In the same file, update `shadow.button`:

```ts
  button: {
    shadowColor: '#CF3D26',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
```

(Only `shadowColor` changes — was `'#DC2626'`.)

- [ ] **Step 5: Run the test again and confirm every pair passes**

Run: `npx jest tokens.test.ts`
Expected: PASS — all 7 contrast pairs ≥ 4.5:1, `textTertiary` confirmed < 4.5:1.

- [ ] **Step 6: Run the full suite to confirm nothing else broke**

Run: `npx jest`
Expected: PASS. No test in this repo asserts a literal hex value, so this
should be a clean pass — if anything fails, it's a real regression to
investigate before continuing.

- [ ] **Step 7: Commit**

```bash
git add src/theme/tokens.ts src/__tests__/tokens.test.ts
git commit -m "feat: swap Soft Neutral palette for Coral Rush"
```

---

### Task 2: Typography tokens — Space Grotesk

**Files:**
- Modify: `package.json` (add `@expo-google-fonts/space-grotesk`)
- Modify: `src/theme/tokens.ts` (`fontFamily`, `typography` comments)
- Modify: `src/app/_layout.tsx` (font imports and `useFonts` map)
- Test: Modify `src/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `fontFamily.displayBold` = `'SpaceGrotesk_700Bold'`,
  `fontFamily.displaySemiBold` = `'SpaceGrotesk_600SemiBold'` — every
  `typography.*` entry that spreads these (`hero`, `display`, `title`,
  `metric`) picks up the new family with no further change, same mechanism
  as Task 1's colors.

- [ ] **Step 1: Add the dependency**

```bash
npm install @expo-google-fonts/space-grotesk
```

This resolves to whatever the current published version is — don't hand-pin
a version number that may not exist; just let npm write the resolved range
into `package.json` the way it would for any new dependency.

- [ ] **Step 2: Write the failing typography test**

Change the existing `import { lightColors } from '../theme/tokens';` line at
the top of `src/__tests__/tokens.test.ts` to also pull in `fontFamily`:

```ts
import { fontFamily, lightColors } from '../theme/tokens';
```

Then append below the existing `describe` block:

```ts
describe('fontFamily', () => {
  it('uses Space Grotesk for display weights and keeps Plus Jakarta Sans for body', () => {
    expect(fontFamily.displayBold).toBe('SpaceGrotesk_700Bold');
    expect(fontFamily.displaySemiBold).toBe('SpaceGrotesk_600SemiBold');
    expect(fontFamily.bodyRegular).toBe('PlusJakartaSans_400Regular');
  });

  it('has no leftover Fraunces reference', () => {
    const values = Object.values(fontFamily);
    expect(values.some((v) => v.includes('Fraunces'))).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx jest tokens.test.ts`
Expected: FAIL — `fontFamily.displayBold` is still `'Fraunces_700Bold'`.

- [ ] **Step 4: Swap `fontFamily` in `src/theme/tokens.ts`**

```ts
export const fontFamily = {
  displaySemiBold: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  bodyRegular: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;
```

Also update the doc comment directly above `typography` (currently "Fraunces
(serif) carries titles and numbers") to: `Space Grotesk carries titles,
hero text and numbers; Plus Jakarta Sans carries everything the user reads
or taps.`

- [ ] **Step 5: Load the new font weights in `src/app/_layout.tsx`**

Replace the two Fraunces imports:

```ts
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
```

with:

```ts
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
```

And in the `useFonts` call, replace:

```ts
    Fraunces_600SemiBold,
    Fraunces_700Bold,
```

with:

```ts
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
```

- [ ] **Step 6: Remove the now-unused dependency**

```bash
npm uninstall @expo-google-fonts/fraunces
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npx jest tokens.test.ts`
Expected: PASS.

- [ ] **Step 8: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/theme/tokens.ts src/app/_layout.tsx src/__tests__/tokens.test.ts
git commit -m "feat: swap Fraunces for Space Grotesk"
```

---

### Task 3: Motion tokens — bouncier springs

**Files:**
- Modify: `src/theme/tokens.ts` (`motion.spring`)
- Modify: `src/components/ui/PressableScale.tsx` (doc comment only)
- Test: Modify `src/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `motion.spring.snappy` (existing key, new values — every caller,
  including `PressableScale`, gets more bounce for free), plus a new
  `motion.spring.celebrate` for reward moments (consumed by Task 7).

- [ ] **Step 1: Write the failing test**

Change the top-of-file import in `src/__tests__/tokens.test.ts` again, this
time adding `motion`:

```ts
import { fontFamily, lightColors, motion } from '../theme/tokens';
```

Then append below the existing `describe` blocks:

```ts
describe('motion.spring', () => {
  it('snappy has more bounce than Soft Neutral (lower damping, higher stiffness)', () => {
    expect(motion.spring.snappy.damping).toBeLessThanOrEqual(10);
    expect(motion.spring.snappy.stiffness).toBeGreaterThanOrEqual(240);
  });

  it('celebrate exists for reward moments and bounces more than snappy', () => {
    expect(motion.spring.celebrate).toBeDefined();
    expect(motion.spring.celebrate.damping).toBeLessThan(motion.spring.snappy.damping);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest tokens.test.ts`
Expected: FAIL — `snappy.damping` is still `14`, `celebrate` doesn't exist.

- [ ] **Step 3: Update `motion.spring` in `src/theme/tokens.ts`**

```ts
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    /** Base of the "chips and cells" press pattern — visibly bouncy now, not
     *  just snappy. This is the default feel for everyday taps in Coral Rush. */
    snappy: { damping: 10, stiffness: 260, mass: 0.9 },
    /** Reward moments only: milestones, streaks, the mascot showing up to
     *  celebrate. Pronounced overshoot — do not use this for routine taps,
     *  it would read as exhausting rather than delightful. */
    celebrate: { damping: 6, stiffness: 220, mass: 1 },
  },
```

- [ ] **Step 4: Fix the now-inaccurate doc comment in `PressableScale.tsx`**

The component's docstring currently says "the snappy spring makes the
release quick and unfussy, never bouncy" — that's no longer true. Replace
that sentence with:

```
 * the snappy spring gives the release a visible bounce — the Coral Rush
 * direction wants everyday taps to feel more alive than Soft Neutral did.
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest tokens.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `npx jest`
Expected: PASS — no existing test asserts exact spring config values.

- [ ] **Step 7: Commit**

```bash
git add src/theme/tokens.ts src/components/ui/PressableScale.tsx src/__tests__/tokens.test.ts
git commit -m "feat: bouncier base spring, add celebrate spring for reward moments"
```

---

### Task 4: Mascot illustration assets — the cheetah

**Files:**
- Create: `assets/images/mascot/cheetah-idle.png`
- Create: `assets/images/mascot/cheetah-running.png`
- Create: `assets/images/mascot/cheetah-celebrating.png`
- Create: `assets/images/mascot/cheetah-encouraging.png`
- Create: `assets/images/mascot/README.md`

This task has no automated test — a generated illustration's quality can't
be asserted in Jest. Task 5's component test instead checks that these exact
files exist and are wired up correctly.

- [ ] **Step 1: Generate the four poses**

Use the `media-use` skill (resolves image-generation needs in this
environment) with a shared style block and one pose-specific addition per
image. All four must be **transparent PNG, square, at least 1024×1024**, so
they work on both `bgBase` (peach) and `bgSurface` (white) without a seam —
this repo's illustrations already moved to transparent-only for exactly that
reason (see `fitfork-design/SKILL.md`, "Dark mode" section, decontamination
note).

Shared style block (prepend to every prompt):

> Flat vector illustration mascot: a cheetah character for a fitness and
> nutrition app called FitPro. Bold, simple, rounded shapes — no fine fur
> texture, no intricate detail, chunky/sporty aesthetic, not photorealistic.
> Primary color coral #FF6B5B for the body, deep navy #3A3A5C for
> spots/accents/outlines, white for eye highlights. Transparent background
> (PNG with alpha channel). One single centered character, no text, no
> logos, no props, no other objects in frame. Square canvas, at least
> 1024×1024px.

Pose additions:

- `cheetah-idle.png`: "Standing upright on hind legs in a friendly,
  welcoming pose, one paw raised in a wave, big open eyes, warm confident
  smile."
- `cheetah-running.png`: "Dynamic mid-stride sprinting pose, low to the
  ground, diagonal posture implying motion, determined expression. Keep any
  speed lines minimal and flat if used at all."
- `cheetah-celebrating.png`: "Both arms raised straight up in a triumphant
  jump, one foot off the ground, mouth open in a joyful shout — this is the
  milestone/success celebration pose, maximum energy."
- `cheetah-encouraging.png`: "Gentle, warm, reassuring posture — one paw
  resting as if patting a shoulder, soft closed-mouth smile, relaxed
  eyebrows. Used after a setback: encouraging, never mocking, not itself
  sad-looking."

- [ ] **Step 2: Save the four files**

Save each generated image to `assets/images/mascot/<name>.png` exactly as
named above — Task 5's component `require()`s these exact paths.

- [ ] **Step 3: Verify each file is a real, non-empty PNG**

Run (adjust for your shell):

```bash
ls -la assets/images/mascot/*.png
file assets/images/mascot/*.png
```

Expected: four files, each reported as `PNG image data`, non-zero size.
Then open each file in an image viewer and visually confirm the background
is transparent (checkerboard, not a solid color) — there is no automated
transparency check in this repo today (same as the existing
`assets/images/illustrations/` set), so this is a manual gate, not optional.

- [ ] **Step 4: Document the set**

Create `assets/images/mascot/README.md`:

```markdown
# Mascot — the Coral Rush cheetah

One file per pose. All transparent PNG, ≥1024×1024, generated per the prompt
recorded in `docs/superpowers/plans/2026-08-06-coral-rush-design-system.md`
(Task 4).

| File | Pose | Used by |
| --- | --- | --- |
| `cheetah-idle.png` | Idle / welcoming | `src/app/onboarding.tsx` |
| `cheetah-running.png` | Running / mid-transition | not yet wired (available for future loading states) |
| `cheetah-celebrating.png` | Celebration | `src/app/workout-session.tsx` (end of session) |
| `cheetah-encouraging.png` | Encouraging after a setback | not yet wired (reserved for a future error/failure moment) |

Being transparent, each pose works on both `colors.bgBase` and
`colors.bgSurface` with no seam — no need for per-surface variants like the
old baked-background illustrations required.
```

- [ ] **Step 5: Commit**

```bash
git add assets/images/mascot/
git commit -m "feat: add the four V1 cheetah mascot poses"
```

---

### Task 5: `Mascot` component

**Files:**
- Create: `src/components/ui/Mascot.tsx`
- Test: Create `src/__tests__/Mascot.test.tsx`

**Interfaces:**
- Consumes: the four PNGs from Task 4 (must exist on disk or `require()`
  fails at module load, taking the test down with it — Task 4 must be done
  first).
- Produces: `Mascot` component and `MascotPose` type
  (`'idle' | 'running' | 'celebrating' | 'encouraging'`), consumed by
  Task 6 and Task 7.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/Mascot.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Mascot, type MascotPose } from '../components/ui/Mascot';

const POSES: MascotPose[] = ['idle', 'running', 'celebrating', 'encouraging'];

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
      <Mascot pose="idle" style={{ width: '100%', aspectRatio: 2, maxHeight: 150 }} />
    );
    expect(getByTestId('mascot-image').props.style).toEqual({
      width: '100%',
      aspectRatio: 2,
      maxHeight: 150,
    });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest Mascot.test.tsx`
Expected: FAIL with "Cannot find module '../components/ui/Mascot'".

- [ ] **Step 3: Implement `src/components/ui/Mascot.tsx`**

```tsx
import { Image, type ImageProps } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

export type MascotPose = 'idle' | 'running' | 'celebrating' | 'encouraging';

const MASCOT_SOURCES: Record<MascotPose, ImageProps['source']> = {
  idle: require('../../../assets/images/mascot/cheetah-idle.png'),
  running: require('../../../assets/images/mascot/cheetah-running.png'),
  celebrating: require('../../../assets/images/mascot/cheetah-celebrating.png'),
  encouraging: require('../../../assets/images/mascot/cheetah-encouraging.png'),
};

type MascotProps = {
  /** Which moment this appearance is for — see assets/images/mascot/README.md. */
  pose: MascotPose;
  /** Square side in px, used only when `style` is omitted. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The Coral Rush mascot. `style` fully replaces the default size-based
 * sizing when given, so a caller that needs responsive sizing (percentage
 * width, aspectRatio) doesn't fight a baked-in width/height.
 */
export function Mascot({ pose, size = 160, style }: MascotProps) {
  return (
    <Image
      testID="mascot-image"
      source={MASCOT_SOURCES[pose]}
      style={style ?? { width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx jest Mascot.test.tsx`
Expected: PASS — all 4 poses render, both sizing modes assert correctly.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Mascot.tsx src/__tests__/Mascot.test.tsx
git commit -m "feat: add Mascot component"
```

---

### Task 6: Onboarding touchpoint — mascot idle

**Files:**
- Modify: `src/app/onboarding.tsx`

**Interfaces:**
- Consumes: `Mascot` from Task 5.

- [ ] **Step 1: Swap the import**

In `src/app/onboarding.tsx`, replace:

```ts
import { Image } from 'expo-image';
```

with:

```ts
import { Mascot } from '../components/ui/Mascot';
```

(`Image` isn't used anywhere else in this file — confirm with a search
before removing; if a later task in this rollout adds another `Image` here,
re-add the import then, not preemptively.)

- [ ] **Step 2: Swap the hero illustration**

Replace:

```tsx
      <Image
        source={require('../../assets/images/illustrations/onboarding-hero.png')}
        style={styles.hero}
        contentFit="contain"
      />
```

with:

```tsx
      <Mascot pose="idle" style={styles.hero} />
```

- [ ] **Step 3: Fix the now-stale comment above `hero` in `createStyles`**

The comment currently says the illustration "is generated on bgBase, so it
blends into the screen with no seam" — true of the old baked-background
asset, not of the new transparent mascot (which blends by having no
background at all, on any surface). Replace the comment block above the
`hero:` line with:

```ts
    // The mascot PNG is transparent, so `contain` shows it cleanly on
    // bgBase with no seam regardless of surface. maxHeight keeps the form
    // above the fold on a small phone. Same banner on all four steps.
    hero: { width: '100%', aspectRatio: 2.4, maxHeight: 150 },
```

- [ ] **Step 4: Run the onboarding tests**

Run: `npx jest onboarding`
Expected: PASS — no existing onboarding test references the old image, so
this should be a clean pass with no changes needed there.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding.tsx
git commit -m "feat: replace onboarding hero illustration with the mascot"
```

---

### Task 7: End-of-workout touchpoint — mascot celebration

**Files:**
- Modify: `src/app/workout-session.tsx`
- Modify: `src/__tests__/workout-session.test.tsx`

**Interfaces:**
- Consumes: `Mascot` from Task 5, `motion.spring.celebrate` from Task 3.

- [ ] **Step 1: Update the existing test to expect the new copy**

In `src/__tests__/workout-session.test.tsx`, the `findByText` assertion
around line 114 (`'Séance terminée 🎉'`, the only occurrence in the file)
becomes:

```ts
    expect(await findByText('Bravo, séance dans la poche ! 🎉')).toBeTruthy();
```

- [ ] **Step 2: Run the test to confirm it now fails**

Run: `npx jest workout-session.test.tsx`
Expected: FAIL on that one assertion — the screen still renders the old
copy.

- [ ] **Step 3: Add the imports**

In `src/app/workout-session.tsx`, add `motion` to the existing tokens
import:

```ts
import { centeredContent, motion, spacing, state, typography, useThemeColors, type ThemeColors } from '../theme/tokens';
```

Add two new imports below the existing `PressableScale` import:

```ts
import { Mascot } from '../components/ui/Mascot';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
```

- [ ] **Step 4: Add a `CelebrationMascot` component above `WorkoutSessionScreen`**

```tsx
/** Bounces the mascot in on mount — reward-moment motion, see motion.spring.celebrate. */
function CelebrationMascot() {
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, motion.spring.celebrate);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Mascot pose="celebrating" size={140} />
    </Animated.View>
  );
}
```

- [ ] **Step 5: Use it in the `finished` branch and update the copy**

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
          <CelebrationMascot />
          <Text style={styles.finishedTitle}>Bravo, séance dans la poche ! 🎉</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Marquer la séance comme terminée" onPress={handleFinish} loading={finishing} />
        </View>
```

- [ ] **Step 6: Run the test and confirm it passes**

Run: `npx jest workout-session.test.tsx`
Expected: PASS, all 5 tests in the file.

- [ ] **Step 7: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add src/app/workout-session.tsx src/__tests__/workout-session.test.tsx
git commit -m "feat: celebrate session completion with the mascot"
```

---

### Task 8: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: all tests pass, including the new `tokens.test.ts`,
`Mascot.test.tsx`, and the updated `workout-session.test.tsx`.

- [ ] **Step 3: Grep for leftover Soft Neutral references**

```bash
grep -rn "Fraunces\|#DC2626\|#F7F5F2" src/
```

Expected: no matches outside of files this plan didn't intend to touch
(`error`/`effort` legitimately keep `#DC2626` per Task 1 — confirm any hit is
one of those two, not a missed Button/Card/etc.).

- [ ] **Step 4: Run the app and check on-device before going further**

Start the app (Expo Go, per this project's usual fast-iteration path) and
manually walk: onboarding (mascot idle + coral palette + Space Grotesk
titles), a full workout session through to completion (celebration mascot +
bounce + new copy), and the home/plan/recipes tabs (palette propagation with
no code changes there).

This step is not optional. This exact design system previously shipped a
change (dark mode) that looked right on paper and was reverted after the
first real on-device look showed a problem no test caught — see
`fitfork-design/SKILL.md`'s "Dark mode" section. Do not roll out the
remaining touchpoints (Task list below, "Follow-up work") until this has
been checked on a real device or simulator, not just in Jest.

- [ ] **Step 5: Commit if Step 3 required any cleanup**

Only if Step 3 found something to fix — otherwise this task produces no
diff of its own and there's nothing to commit.

---

## Follow-up work (separate plan, not part of this one)

The design spec (`docs/superpowers/specs/2026-08-06-coral-rush-design-system-design.md`)
lists a full touchpoint set: onboarding, home, end-of-session, streaks, empty
states, success badges. This plan intentionally ships only two
(onboarding, end-of-session) plus the foundation, for two reasons:

1. **Scope.** The remaining touchpoints are repetitive, independent
   integrations of the same `Mascot` component into ~5 more screens — best
   drawn up as their own plan(s) once the mascot's actual illustrated style
   has been seen on-device, not speculatively alongside it.
2. **The dark-mode lesson.** This exact codebase already shipped a
   fully-built visual change broadly and had to revert it after an
   on-device check that should have happened before the rollout, not after.
   Task 8, Step 4 is this plan's version of that check — do it before
   opening the next plan.

When ready, the next plan should cover: the home screen's streak card and
greeting, the `plan`/`grocery-list` empty states (currently
`empty-plan.png` / `empty-grocery.png` — decide whether these become mascot
poses or stay separate illustrations), a success-badge moment in
`progression.tsx`, and the full "franchement hypé" copy pass across every
remaining screen (this plan only updated the one string tied to the
touchpoint it shipped). It should also re-run `assets/images/illustrations/`
against the new mascot to decide whether `onboarding-hero.png` and friends
are now dead files to delete.
