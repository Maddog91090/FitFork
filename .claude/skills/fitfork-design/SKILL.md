---
name: fitfork-design
description: FitPro's visual identity — the "Soft Neutral" design system. Read this BEFORE writing or changing any UI in this repo: screens under src/app, components under src/components, anything touching src/theme/tokens.ts, and any work described as styling, restyling, layout, spacing, colors, typography, animation, empty states, or "make it look better". Also read it when reviewing a screen's design or writing French UI copy.
---

# FitPro — Soft Neutral

## The direction, in one sentence

FitPro looks like a **calm editorial wellness app that happens to track hard
training**: warm off-white paper, a soft serif for anything you read as a
headline or a number, a clean geometric sans for everything you act on, and a
single confident red used sparingly enough that it always means something.

Not "performance app": no black backgrounds, no neon, no full-caps slabs, no
aggressive gradients. The energy comes from **typographic contrast** (serif vs
sans) and from **restraint with the red** — not from loudness.

## The one hard rule

**Everything visual comes from `src/theme/tokens.ts`.** No hex codes, no raw
`fontSize`, no raw `fontWeight`, no magic paddings or durations in a screen or
component. If a value you need isn't in the tokens, the fix is to add it to the
tokens with a reason — not to inline it.

The single exception in the codebase today is `emptyIcon: { fontSize: 32 }`,
which sizes an emoji glyph rather than text.

## Color

Call `useThemeColors()` inside the component — never import the static
`colors` export in a screen or a shared component. It resolves to
`lightColors` or `darkColors` based on the OS setting (`useColorScheme()`
under the hood) and re-renders when the user flips their system theme, which
the static object can't do. Because the palette is now dynamic, styles move
into a factory function called with `useMemo`:

```tsx
export function Thing() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.card} />;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({ card: { backgroundColor: colors.bgSurface } });
}
```

The static `colors` export still exists (it's `lightColors`) for the rare
non-component call site — tests mostly — that can't call a hook.

The names carry the intent — respect it:

| Use | Token |
| --- | --- |
| Screen background | `bgBase` |
| Cards, inputs, anything raised | `bgSurface` |
| Recessed / pressed-secondary areas | `bgSunken` |
| Primary text | `textPrimary` |
| Secondary text, labels, captions | `textSecondary` |
| Text on a red fill | `textOnAccent` |
| Red fills and large type | `accentRed` |
| **Red text or icons at body size**, pressed primary | `accentRedDeep` |
| Red-tinted background | `accentRedSoft` |
| Line inside a surface | `divider` |
| Line around a surface | `border` / `borderStrong` |

Rules:

- **Red is a scarce resource.** One primary action per screen, plus selected
  states. If two things on screen are red, one of them is wrong.
- `textTertiary` **fails WCAG AA on purpose.** Use it only for text that is
  decorative or repeats information already available — never for labels,
  values, placeholders, or errors.
- Never write `'#FFFFFF'` for text on red — that's `colors.textOnAccent`.
- Macros always keep their hue, everywhere they appear (cards, charts, legends):
  `macroProtein` (terracotta), `macroCarbs` (teal), `macroFat` (indigo).
  Training uses `effort` and `rest`. Never re-map these per screen.
- Every foreground token is ≥ 4.5:1 on `bgBase`/`bgSurface` — **in both
  `lightColors` and `darkColors`.** If you add or change a color, verify the
  ratio in both palettes before committing (a quick WCAG relative-luminance
  script is enough; there's no in-repo validator). `darkColors` is not just
  light-colors-inverted: several light-mode text shades (the macro hues,
  `accentRedDeep`) are too dark to read on a near-black background and needed
  a lighter step picked specifically for dark contrast, not a mechanical flip.

## Typography

Two families, loaded in `src/app/_layout.tsx`:

- **Fraunces** (soft serif) — titles, hero text, and standalone numbers. This is
  where the app's character lives.
- **Plus Jakarta Sans** — body, labels, buttons, tabs, anything tappable.

React Native does **not** synthesize weights for custom fonts. Weight lives in
the family name, so:

> Never use `fontWeight` in this codebase. Never use `fontFamily` and
> `fontWeight` together. Spread a whole `typography.*` entry —
> `{ ...typography.title, color: colors.textPrimary }` — instead of picking
> individual sizes off it.

Scale, and what each step is for:

- `hero` — the one thing a screen is about (a user's name, a headline)
- `display` — screen titles
- `title` — card titles, section headings that carry weight
- `metric` — a single big number standing alone. **Not** for a 3- or 4-up row
  of numbers on a phone: it wraps. Use `title` there.
- `heading` / `subheading` — sans headings inside content
- `body` / `bodyStrong` — running text
- `label` — buttons, tabs, chips
- `caption` / `captionStrong` — metadata, secondary rows
- `overline` — eyebrows, field labels, step counters. Always uppercase (it sets
  `textTransform` itself — don't re-declare it).

No italics: no italic face is loaded, and RN would fake or drop it. If you want
emphasis, change the step or the color.

## Rhythm, radius, elevation

- Spacing comes from `spacing` (4/8/12/16/24/32/48). Screens pad with
  `layout.screenPaddingX`; sections separate by `layout.sectionGap`.
- `layout.maxContentWidth` exists because this app also runs on web — center
  content rather than letting a line of text run 900px wide.
- Radius: `sm` for inputs and small cells, `lg` for cards, `pill` for chips,
  `full` for circles. Don't mix three radii in one component.
- Elevation is `shadow.subtle` → `card` → `raised`. `shadow.button` is red-tinted
  and belongs only to the primary button. Shadows are soft and low-opacity by
  design — deepening one to make something stand out is the wrong lever;
  hierarchy comes from type and space first.

## Motion

`motion` holds durations, cubic-bezier control points, and spring configs. It is
deliberately dependency-free (plain numbers), so build the Reanimated value at
the call site:

```ts
withTiming(1, {
  duration: motion.duration.base,
  easing: Easing.bezier(...motion.curve.entrance),
});
```

- Things arriving use `curve.entrance`, things leaving use `curve.exit`,
  everything else uses `curve.standard`.
- Nothing on a tap should take longer than `duration.fast`. Reserve
  `duration.slow` for a screen-level transition.
- Motion confirms an action; it never announces itself. No bounce on a button,
  no spinning icons for decoration.

What is wired today, to copy rather than reinvent:

- **`PressableScale`** (`src/components/ui/PressableScale.tsx`) is the springy
  version of the "chips and cells" press pattern — a shared value driving
  `withSpring(motion.spring.snappy)` on scale and opacity. Use it for chips,
  cells, and list rows. Buttons still darken; never give a button this.
- **Onboarding step transitions** wrap the step body in an `Animated.View`
  keyed by `step` with `entering={FadeInDown…entrance}`, so each step replays
  the entrance. The keyed-remount trick is the simplest way to fire an entering
  animation on a value change.
- **Onboarding progress segments** grow a red fill left-to-right with
  `scaleX` + `transformOrigin: 'left'` over `duration.base`, rather than
  snapping color.

Testing note: `react-native-reanimated` cannot load under jest-expo (its native
worklets module crashes), so `__mocks__/react-native-reanimated.js` hand-mocks
the small surface the app uses — animated components render as plain views,
animations resolve to their target value. Add to that file when you reach for a
reanimated API it doesn't cover yet; don't try to load the library's own mock.

## Interaction and accessibility

- Every `Pressable` needs a visible pressed state. Two accepted patterns:
  darken the fill (buttons — see `src/components/ui/Button.tsx`), or the scale +
  opacity dip (chips, cells) — reach for `PressableScale`, which springs it,
  rather than re-implementing a static `state.pressedScale` style.
- Every tappable element is at least `state.minTouchSize` tall.
- Every `Pressable` gets an `accessibilityRole` and, when it has state, an
  `accessibilityState`.
- Disabled means `state.disabledOpacity` plus `textSecondary` — never
  `textTertiary`, which would drop below AA.
- Focused inputs thicken their border; compensate the padding so the box doesn't
  jump (see `src/components/ui/TextField.tsx`).

## UI copy (French)

The app tutoies the user and speaks like a coach who respects their time:
"Choisis les repas à générer", "Ton profil", "Session expirée, reconnecte-toi."

- Second person singular, always. Never "vous".
- Short, concrete, no exclamation marks, no hype ("Boom !", "Incroyable !"),
  no guilt ("Tu as encore raté...").
- Errors say what happened and what to do next, in that order.
- Empty states name the benefit of acting, not the emptiness itself.
- Labels are nouns ("Poids", "Objectif"), buttons are verbs ("Générer le plan").

## Before you call a screen done

1. Zero hex codes, zero raw `fontSize`/`fontWeight` in the diff.
2. Exactly one red primary action.
3. Every tappable thing: pressed state, 44pt minimum, accessibility role.
4. Text steps come from `typography`, and there are no more than four distinct
   steps on the screen.
5. Spacing values all come from `spacing`.
6. Copy tutoies, and no string is longer than it needs to be.
7. `npx tsc --noEmit` and `npx jest` are clean.

## Where things stand

Shipped: tokens (light **and** dark), `useThemeColors()`, both fonts, the
shared components (`Button`, `Card`, `TextField`, `EmptyState`, `ChoiceGroup`,
`Sparkline`, `PressableScale`), the typography pass across all screens, the
three brand illustrations (transparent, dark-safe), the app icon / splash
(also dark-safe, with a native dark splash variant), and the first motion pass
(onboarding step transitions and progress fill, springy chip and cell
presses).

**Charts.** Read the `dataviz` skill before writing the first line of chart
code. Two things it does not know about this app, learned building the weight
trend: the serif `typography.metric` is right for a hero number here even
though the skill warns against display faces, because the serif is systematic
across the app rather than decoration; and the brand red does **not** go to a
chart mark — the screen's one primary action already owns it, so emphasis
comes from ink weight (`textSecondary` line, `textPrimary` current point).
`Sparkline` draws a single series from rotated views, no charting dependency.
It already reads `useThemeColors()`, so it's dark-mode-correct with no extra
work.

**Dark mode — shipped, here's what to know:**

- `app.json` is back to `userInterfaceStyle: "automatic"`; the splash screen
  has a native `dark` variant (`expo-splash-screen`'s plugin supports a
  `dark: { image, backgroundColor }` key since it's SDK-native, not a custom
  hack) pointing at the same transparent splash image with a dark
  `backgroundColor`.
- The three illustrations and the logo were re-exported **fully transparent**
  (no baked background at all, unlike the first light-only pass) specifically
  so they self-adapt to either theme — the "generate on the exact background
  color" approach documented lower in this file is now historical: it was the
  right call before dark mode existed, but a transparent asset is strictly
  more robust once there are two themes to sit on.
- Getting there required un-premultiplying (decontaminating) the edges: a
  transparent PNG whose partially-transparent border pixels still carry the
  RGB of the old opaque background reads as an invisible seam on a light
  screen and a visible light **halo** on a dark one. Fix: for every pixel
  with `0 < alpha < 255`, recover the true foreground color with
  `fg = (observed − bg×(1−alpha)) / alpha` rather than just keeping the
  alpha-keyed cutout. Don't apply this blindly to every partial-alpha pixel,
  though — a soft drop shadow is *also* partial-alpha, and decontaminating it
  would be repainting a legitimate design element, not fixing a defect. Gate
  the correction on the pixel being light-colored (a real bg-bleed halo),
  and leave dark, low-alpha pixels (shadows) alone.
- One illustration — `onboarding-hero.png` — keeps a soft light glow along the
  track on a dark background even after that fix. That glow is baked into
  fully **opaque** pixels (the generator's own "speed motion" rendering
  style, not a matting artifact), so it can't be pixel-fixed without
  repainting the art. It's a judgment call whether that reads as an
  intentional "glowing track at night" effect or as unwanted haze — it hasn't
  been seen on an actual dark device yet, so don't assume either way; look
  before touching it again.
- Every dark color was chosen against a computed WCAG contrast ratio, not
  eyeballed — see the rule under **Color** above. The one thing not yet
  verified is the **rendered** result: this was built and type/test-checked
  in an environment that could composite the illustration/logo PNGs against
  the dark hex values pixel-by-pixel, but couldn't reliably force
  `prefers-color-scheme: dark` in the dev-server browser to see the actual
  React output live (`useColorScheme()` is captured at module load by
  react-native-web's Appearance polyfill; monkey-patching `matchMedia`
  afterward doesn't reach it). First real look happens on-device, where
  toggling system dark mode is native and instant.

**Illustrations beyond the three that shipped.** The onboarding hero and the
plan / grocery empty states are in `assets/images/illustrations/`; see that
folder's README and
`docs/superpowers/specs/2026-08-02-illustrations-soft-neutral-design.md` (that
spec's "generate on the exact background color" guidance is superseded by the
transparent approach above). The weight-log empty state is still unillustrated.

**Recipe photography — shipped, 32/32.** Every recipe has a photorealistic
3/4-angle dish photo, shown on `recipe/[id].tsx` under the title and macros,
before "Ingrédients". Recipes are Supabase-backed and user-editable in
principle, so the photos live in Supabase Storage (public `recipe-photos`
bucket) with the URL in `recipes.image_url`, not bundled as app assets — a
schema/data thing, not a static asset. The house style, baked into the prompt
template and **not to be regressed on** for future recipes: casual,
unpretentious home-cook plating (no ring molds, no architectural garnish, no
sauce-dot drizzle art) — a home cook should look at the photo and believe they
can make it, not that it came from a restaurant kitchen. Warm natural window
light, shallow depth of field, plain wood-table background, no hands/people/
text/logos.

**Workout-session photography — shipped, 9/9.** Every session card in
`(tabs)/workout.tsx` shows a photo above its title. Unlike recipes, the
workout program (`homeWorkoutProgram.ts`) is fully static data with no
Supabase table behind it, so these are bundled locally under
`assets/images/workouts/` and `require()`'d straight into each session
object's new `image` field, matching how the illustrations are bundled. House
style: a normal, relatable person (not a fitness-model physique) performing
the session's signature move in a plain home living room — mat or rug over a
wood floor, natural window light, no gym equipment, no mirrors, no branding —
so it reads as "you could do this in your own living room," the same
achievable ethos as the recipe photos, translated to training.
