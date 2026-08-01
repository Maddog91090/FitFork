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

Named scale, each entry only `fontSize`/`lineHeight`/`letterSpacing` (font weight stays a per-usage choice, matching current call sites):

```ts
export const typography = {
  title:   { fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  body:    { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  label:   { fontSize: 11, lineHeight: 14, letterSpacing: 0.4 }, // uppercase labels
} as const;
```

Negative tracking on the larger `title` size, positive on the small uppercase `label`, near-zero on `body` — direct application of §15. Wired into `TextField` (label + input), `EmptyState` (title + message), `Card`/`Button` untouched (button label is a control, not prose — stays as-is to avoid scope creep).

## Component changes

**`Button.tsx`** — `useSharedValue` scale (default `1`), animated via `useAnimatedStyle` on the `Pressable`'s wrapping `Animated.View`. `onPressIn` → spring to `0.97` using `motion.spring.press`; `onPressOut` → spring back to `1`. Feedback starts on press-down, not on release (§1). Reanimated springs already animate from the live value and are interruptible by construction, so a fast double-tap re-targets cleanly with no extra code (§3).

**`ChoiceGroup.tsx`** — same press-scale treatment per pill, plus the selected-pill background/text-color swap becomes an animated cross-fade (`useSharedValue` 0/1 progress per pill, `withSpring(motion.spring.settle)`, colors via `interpolateColor`) instead of an instant style swap. This is the one component flagged during exploration as having literally zero animation despite being an interactive selector.

**`TextField.tsx`** — two fixes: (1) the focus border is always rendered at `borderWidth: 2`, transparent when unfocused, colored when focused — removes the current 2px layout jump on focus; (2) the border-color transition animates via a `focusProgress` shared value (`motion.spring.settle`) driving `interpolateColor` between transparent and `colors.accentRed`, instead of an instant swap. Label/input text adopt `typography.label`/`typography.body`.

**`EmptyState.tsx`** — typography only (`typography.title`/`typography.body` on the two text nodes). No motion change — it's a static state, not an interaction; adding entrance animation here would be scope creep beyond what brainstorming approved.

**`Card.tsx`** — adds an optional `variant?: 'solid' | 'glass'` prop, default `'solid'` (current behavior, zero visual change for every existing call site). `'glass'` renders via a new `GlassSurface` wrapper (see below) instead of the flat `bgSurface` + shadow. No existing call site is switched to `'glass'` in this PR — the variant exists so the tab bar's glass treatment (next section) and any future call site can opt in without duplicating the availability-check logic.

## `GlassSurface` — `src/components/ui/GlassSurface.tsx`

Thin wrapper around `expo-glass-effect`:

```tsx
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

export function GlassSurface({ style, tintColor, children }: GlassSurfaceProps) {
  if (!isLiquidGlassAvailable()) {
    // Android / older iOS / reduced-transparency-unaware devices: flat, solid fallback.
    return <View style={[styles.fallback, style]}>{children}</View>;
  }
  return (
    <GlassView style={style} tintColor={tintColor} glassEffectStyle="regular">
      {children}
    </GlassView>
  );
}
```

`styles.fallback` reuses `colors.bgSurface` + `shadow.card` — the exact pre-existing `Card` solid look, so there is no broken/unstyled state on Android. This single fallback point also satisfies §14 (`prefers-reduced-transparency` has no direct RN equivalent, but `isLiquidGlassAvailable()` false is the same code path, so any platform without real glass gets the solid surface rather than a fake blur).

## Tab bar — `src/app/(tabs)/_layout.tsx`

`tabBarBackground` (Expo Router's `Tabs.Screen` / `react-navigation` bottom-tabs option) is set to render `<GlassSurface style={StyleSheet.absoluteFill} />`, and `tabBarStyle` drops its solid `backgroundColor` (glass surface now paints it) but keeps the existing border. This is the one "structural chrome" change in scope — it's shared across every tab screen, not a per-screen edit, and directly demonstrates §12 (floating translucent chrome, content scrolling underneath, which already happens since the tab bar already floats over screen content today).

## Testing

- `motion.ts`: unit test `springConfig` against known input/output pairs (e.g. `springConfig(1, 0.15)` produces the expected stiffness/damping numbers from the formula) — pure function, no RN dependency.
- `Button.test.tsx` / existing `ChoiceGroup` (no test file exists yet for it today — none added here, matches repo convention of not testing pure-presentational interaction wiring beyond what's already covered) — existing Button/Card/EmptyState/TextField test files are re-run as-is; they assert on rendered text/props, not animation internals, so they should pass unchanged. If Reanimated's `useAnimatedStyle` needs a jest mock that isn't already covered by `jest-expo`'s preset, add it to `jest.setup.js` (verified empirically during implementation, not assumed here).
- No test for `GlassSurface`'s two branches beyond a smoke render (mocking `isLiquidGlassAvailable` true/false and asserting `GlassView` vs. fallback `View` is what mounts) — matches the "smoke.test.ts" style already in the repo.
- Manual check: `npx tsc --noEmit` and `npx jest` both clean (baseline: 111 passing / 1 pre-existing unrelated failure) before calling this done.
