# Apple-Style Motion & Materials Foundation — Design

## Scope

**Problem:** The app's shared UI kit (`src/theme/tokens.ts`, `src/components/ui/{Button,Card,TextField,EmptyState}.tsx`, `src/components/ChoiceGroup.tsx`) has zero motion — presses, focus, and selection all swap style instantly with no feedback, no spring, no interruptibility. `react-native-reanimated` and `react-native-gesture-handler` are installed but unused anywhere in `src/`. `expo-glass-effect` (native iOS Liquid Glass) is installed but unused. Typography is ad-hoc inline `fontSize`/`fontWeight` per call site with a single fixed look, no size-specific tracking/leading. There is no dark mode and none is being added here (see Out of scope).

**Goal:** Rework the shared foundation only — tokens plus the five listed components plus the tab bar chrome — so every screen inherits spring-based press feedback, a translucent glass tab bar, jump-free focus/selection transitions, and an optical type scale, without rewriting individual screens. This is approach "A" from brainstorming: motion + materials, light theme only.

**Out of scope:** Dark mode / `useColorScheme` / theme provider (tokens stay flat exports — a deliberate deferral, not an oversight, so this PR doesn't touch all 16 screen-level import sites). Per-screen typography adoption (screens keep their existing inline styles; the new `typography.ts` scale is only wired into the 5 shared components for now). Drag/swipe gestures, bottom sheets, `react-native-gesture-handler` (no gesture-driven UI exists yet to attach it to — pulling it in now would be unused surface). The pre-existing failing test `onboarding-wizard.test.tsx` ("blocks advancing from step 1...", a 5s timeout) is unrelated and untouched.

## Motion tokens — `src/theme/motion.ts`

Apple's damping-ratio/response model, converted to Reanimated's `withSpring({ damping, stiffness, mass })` via the standard critically-damped conversion (`mass = 1`, `stiffness = (2π/response)² · mass`, `damping = 2 · dampingRatio · √(stiffness · mass)`):

```ts
export function springConfig(dampingRatio: number, response: number, mass = 1) {
  const stiffness = (2 * Math.PI / response) ** 2 * mass;
  const damping = 2 * dampingRatio * Math.sqrt(stiffness * mass);
  return { mass, stiffness, damping };
}

export const motion = {
  spring: {
    // Press feedback: near-instant, no overshoot. §1/§4.
    press: springConfig(1.0, 0.15),
    // Focus rings, selection swaps: critically damped, slightly slower settle. §4.
    settle: springConfig(1.0, 0.3),
  },
} as const;
```

Only two presets — no bounce/momentum preset, since nothing in this scope's components is gesture/velocity-driven (no bounce is honest here per §4: overshoot is reserved for momentum interactions, which don't exist yet in this codebase).

`useReducedMotion()` hook in the same file wraps `AccessibilityInfo.isReduceMotionEnabled()` + the `reduceMotionChanged` event, returning a boolean. Components check it and skip the spring (snap the shared value directly via `.value = target` instead of `withSpring`) — satisfies §14 without a separate code path per component.

## Typography tokens — `src/theme/typography.ts`

Named scale, each entry only `fontSize`/`lineHeight`/`letterSpacing` (font weight stays a per-usage choice, matching current call sites). Scoped to the sizes this PR's components actually use — no unused "display/title" tier invented ahead of need (screens, which do have real headings, keep their existing inline styles per Out of scope, and get a larger tier when they adopt this module):

```ts
export const typography = {
  label:   { fontSize: 11, lineHeight: 14, letterSpacing: 0.4 }, // uppercase labels
  body:    { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
} as const;
```

Positive tracking on the small uppercase `label`, near-zero/slightly positive on `body`/`caption` — the small-text half of §15's size-specific tracking rule (this scope has no large text to demonstrate the negative-tracking half). Wired into: `Button` label (`body`), `ChoiceGroup` pill label (`body`), `TextField` label (`label`) and input (`body`), `EmptyState` title (`body`, keeps its existing `fontWeight: '700'`) and message (`caption`).

## Component changes

**`Button.tsx`** — `useSharedValue` scale (default `1`), animated via `useAnimatedStyle` on the `Pressable`'s wrapping `Animated.View`. `onPressIn` → spring to `0.97` using `motion.spring.press`; `onPressOut` → spring back to `1`. Feedback starts on press-down, not on release (§1). Reanimated springs already animate from the live value and are interruptible by construction, so a fast double-tap re-targets cleanly with no extra code (§3).

**`ChoiceGroup.tsx`** — same press-scale treatment per pill, plus the selected-pill background/text-color swap becomes an animated cross-fade (`useSharedValue` 0/1 progress per pill, `withSpring(motion.spring.settle)`, colors via `interpolateColor`) instead of an instant style swap. This is the one component flagged during exploration as having literally zero animation despite being an interactive selector.

**`TextField.tsx`** — two fixes: (1) the focus border is always rendered at `borderWidth: 2`, transparent when unfocused, colored when focused — removes the current 2px layout jump on focus; (2) the border-color transition animates via a `focusProgress` shared value (`motion.spring.settle`) driving `interpolateColor` between transparent and `colors.accentRed`, instead of an instant swap. Label/input text adopt `typography.label`/`typography.body`.

**`EmptyState.tsx`** — typography only (`typography.body` on the title, `typography.caption` on the message — both keep their existing `fontWeight`/color, only size/lineHeight/letterSpacing move onto the shared scale). No motion change — it's a static state, not an interaction; adding entrance animation here would be scope creep beyond what brainstorming approved.

**`Card.tsx`** — adds an optional `variant?: 'solid' | 'glass'` prop, default `'solid'` (current behavior, zero visual change for every existing call site). `'glass'` renders via a new `GlassSurface` wrapper (see below) instead of the flat `bgSurface` + shadow. No existing call site is switched to `'glass'` in this PR — the variant exists so the tab bar's glass treatment (next section) and any future call site can opt in without duplicating the availability-check logic.

## `GlassSurface` — `src/components/ui/GlassSurface.tsx`

Thin wrapper around `expo-glass-effect`. Gates on `isGlassEffectAPIAvailable()`, not `isLiquidGlassAvailable()` — the package's own docs flag that some iOS 26 betas report Liquid Glass as designed-for but crash if `GlassView`/`GlassContainer` are actually mounted, and `isGlassEffectAPIAvailable()` is the check they say to use before rendering either. A local `useReduceTransparency()` hook (same shape as `motion.ts`'s `useReducedMotion`, but wrapping `AccessibilityInfo.isReduceTransparencyEnabled()` / `reduceTransparencyChanged`) additionally forces the fallback when the user has that accessibility setting on — §14's `prefers-reduced-transparency` has no CSS-equivalent media query on RN, so this is the direct platform substitute:

```tsx
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';

export function GlassSurface({ style, tintColor, children }: GlassSurfaceProps) {
  const reduceTransparency = useReduceTransparency();

  if (!isGlassEffectAPIAvailable() || reduceTransparency) {
    // Android / iOS without the API / reduced-transparency: flat, solid fallback.
    return <View style={[styles.fallback, style]}>{children}</View>;
  }
  return (
    <GlassView style={style} tintColor={tintColor} glassEffectStyle="regular">
      {children}
    </GlassView>
  );
}
```

`styles.fallback` is only `backgroundColor: colors.bgSurface` + `shadow.card` — no `borderRadius`, deliberately. Shape (radius, padding) stays the caller's responsibility via the `style` prop, so `GlassSurface` only ever owns "what material is this surface," never "what shape is it" — `Card`'s `glass` variant supplies its own `radius.lg`, the tab bar supplies none (full-bleed bar).

## Tab bar — `src/app/(tabs)/_layout.tsx`

`tabBarBackground` (the `Tabs` `screenOptions` render-prop) is set to render `<GlassSurface style={StyleSheet.absoluteFill} />`, and `tabBarStyle` drops its solid `backgroundColor` (the glass surface now paints it) but keeps the existing border. This is the one "structural chrome" change in scope — shared across every tab screen, not a per-screen edit.

**Deliberate trade-off:** the full §12 pattern (`position: 'absolute'` tab bar + content scrolling underneath) is *not* done here. It requires each of the 5 tab screens to reserve bottom padding via `useBottomTabBarHeight()` — and that hook is only reachable through `expo-router`'s internal, undocumented `build/react-navigation/bottom-tabs` path in this Expo Router version (there is no installed standalone `@react-navigation/bottom-tabs` package to import it from normally). Building 5 screen edits on an unstable private import path is worse than the alternative: the tab bar stays in normal (non-absolute) layout flow exactly as today, and only its background material changes from flat color to translucent glass. This still delivers a real visual upgrade (native blur/tint instead of flat paint) and keeps this PR's footprint exactly at "shared foundation, zero screens touched."

## Testing

**Jest/Reanimated prerequisite (verified, not assumed):** rendering any component that calls Reanimated hooks currently crashes under Jest (`Cannot read properties of undefined (reading 'loadUnpackers')`) because `react-native-worklets` (Reanimated 4's native worklet runtime) tries to load its native module in the Jest/Node environment. The fix is `resolver: 'react-native-worklets/jest/resolver.js'` in `jest.config.js` — a resolver the package ships specifically for this, which makes Jest resolve worklets' plain (non-`.native`) source instead of the native-binding file. Confirmed empirically: a throwaway component using `useSharedValue`/`useAnimatedStyle`/`withSpring` fails without this line and passes with it; the full existing suite (112 tests) still passes unchanged with the resolver added.

- `motion.ts`: unit tests for `springConfig` against exact computed values (`springConfig(1.0, 0.15)` → `{ mass: 1, stiffness: 1754.60, damping: 83.78 }`, verified by direct calculation) plus relative-ordering checks (shorter response ⇒ stiffer; lower damping ratio ⇒ less damping at equal stiffness). A `useReducedMotion` test using `@testing-library/react-native`'s `renderHook` + `waitFor`, mocking `AccessibilityInfo.isReduceMotionEnabled`.
- `typography.ts`: unit test asserting the tracking/line-height ordering described above (not exact pixel values, which would just restate the constants).
- `ChoiceGroup.tsx`: new `src/__tests__/ChoiceGroup.test.tsx` (none exists today) — the refactor from a single function into a `ChoiceGroup` + internal `Pill` subcomponent is substantial enough that the pre-existing behavior contract (renders all option labels, calls `onChange` with the pressed option's value) needs a regression guard, independent of the new animation.
- Existing `Button.test.tsx` / `Card.test.tsx` / `TextField.test.tsx` / `EmptyState.test.tsx` are re-run as-is; they assert on rendered text/props, not animation internals, so they pass unchanged.
- `GlassSurface`: smoke test per branch — mock `isGlassEffectAPIAvailable` (from `expo-glass-effect`) true/false and assert `GlassView` vs. the fallback `View` mounts; a third case with `isGlassEffectAPIAvailable` true but reduce-transparency mocked on, asserting the fallback still wins.
- Manual check: `npx tsc --noEmit` and `npx jest` both clean (baseline re-confirmed: 112/112 passing, no pre-existing failures) before calling this done.
