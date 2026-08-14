---
name: fitfork-design
description: FitPro's visual identity — the claymorphic, multi-domain-color, mascot-driven design system. Read this BEFORE writing or changing any UI in this repo: screens under src/app, components under src/components, anything touching src/theme/tokens.ts, and any work described as styling, restyling, layout, spacing, colors, typography, animation, empty states, or "make it look better". Also read it when reviewing a screen's design or writing French UI copy.
---

# FitPro — Claymorphic

## The direction, in one sentence

FitPro looks like a **puffy, claymorphic fitness and nutrition app**: warm
off-white surfaces with soft rounded volume and gentle two-layer shadows
instead of flat cards, one rounded display family (Fredoka) for everything
you read, four domain colors instead of a single brand accent, and a
permanent broccoli mascot that lives in the app and reacts to what you do.

Not "flat and minimal": generous radii everywhere, no hard outlines, and a
deliberately bouncy press feel on buttons, chips, and cells. The energy comes
from **volume and motion** — not from a loud palette or aggressive gradients.

## The one hard rule

**Everything visual comes from `src/theme/tokens.ts`.** No hex codes, no raw
`fontSize`, no raw `fontWeight`, no magic paddings or durations in a screen or
component. If a value you need isn't in the tokens, the fix is to add it to the
tokens with a reason — not to inline it.

The single exception in the codebase today is `emptyIcon: { fontSize: 32 }`,
which sizes an emoji glyph rather than text.

## Color

Call `useThemeColors()` inside the component — never import the static
`colors` export in a screen or a shared component. The app is light-only by
decision (see **Where things stand** below), so today `useThemeColors()`
always returns `lightColors` — but it stays a hook, not an inlined constant,
so no call site needs to change if that decision is ever revisited. Because
the palette is resolved through a function, styles move into a factory
function called with `useMemo`:

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

There is no single brand accent anymore. Instead, four **domain colors** each
own a functional area of the app, each with a base tone (large fills — button
backgrounds, big icon backgrounds — AA-safe with white text on top) and a
`*Deep` pair (text/icons at body size, and a button's pressed-state fill):

| Domain | Token | For |
| --- | --- | --- |
| Nutrition | `domainNutrition` / `domainNutritionDeep` | Meals, recipes, macros screens |
| Sport | `domainSport` / `domainSportDeep` | Workouts, exercises, training screens |
| Progress | `domainProgress` / `domainProgressDeep` | Streaks, milestones, weight/progress tracking |
| Neutral | `domainNeutral` / `domainNeutralDeep` | Anything that isn't domain-specific (settings, generic confirmations) |

`Button`'s `domain` prop (see `src/components/ui/Button.tsx`) selects which of
these four families fills a primary button. `variant="secondary"` **ignores**
`domain` entirely — a secondary button is always `bgSurface`/`bgSunken` with a
`textPrimary`-tinted shadow, regardless of what domain it's contextually in.

Other surface/text tokens keep the same names and intent as before:

| Use | Token |
| --- | --- |
| Screen background | `bgBase` |
| Cards, inputs, anything raised | `bgSurface` |
| Recessed / pressed-secondary areas | `bgSunken` |
| Primary text | `textPrimary` |
| Secondary text, labels, captions | `textSecondary` |
| Text on a domain-color fill | `textOnAccent` |
| Line inside a surface | `divider` |
| Line around a surface | `border` / `borderStrong` |

Rules:

- **One domain per screen.** A screen that's fundamentally about nutrition
  uses `domainNutrition` for its accents; a sport screen uses `domainSport`;
  don't mix two domain colors as accents on the same screen without a reason
  — this mirrors the old "red is scarce" rule, just per-domain instead of
  per-app.
- `textTertiary` **fails WCAG AA on purpose.** Use it only for text that is
  decorative or repeats information already available — never for labels,
  values, placeholders, or errors.
- Never write `'#FFFFFF'` for text on a domain fill — that's `colors.textOnAccent`.
- Macros always keep their hue, everywhere they appear (cards, charts, legends):
  `macroProtein` (terracotta), `macroCarbs` (teal), `macroFat` (indigo).
  Training uses `effort` and `rest`. Never re-map these per screen.
- Every foreground token used for text is ≥ 4.5:1 on `bgBase`/`bgSurface`/
  `bgSunken`. If you add or change a color, verify the ratio before
  committing (a quick WCAG relative-luminance script is enough; there's no
  in-repo validator) — the same practice used to derive the current domain
  colors.

**Legacy `accentRed` / `accentRedDeep` / `accentRedSoft`.** These three keys
still exist in `lightColors` and are still read directly by the ~20 screens
that haven't been migrated to the domain system yet. They are a **transitional
shim only**: `accentRed`/`accentRedDeep` hold the exact `domainProgress`/
`domainProgressDeep` values; `accentRedSoft` got its own new light rose-pink
value coherent with that same hue rather than reusing a named token (there is
no `domainProgressSoft` token today). Together this makes unmigrated screens
read as visually coherent with the new palette instead of clashing against
it. Do **not** reach for `accentRed*` in new or touched code — use the domain
tokens directly. A later screen-by-screen rollout replaces every remaining
`accentRed*` call site with the correct per-screen domain token and deletes
these three keys for good.

## Typography

One family, loaded in `src/app/_layout.tsx`: **Fredoka**, a rounded display
sans. It carries everything — hero text, screen titles, big numbers, body
copy, buttons — there is no second family and no serif/sans distinction
driving the type scale anymore.

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
- `metric` — a single big number standing alone, set in the bold display
  weight so it reads as the heaviest number on the screen. **Not** for a 3- or
  4-up row of numbers on a phone: it wraps. Use `title` there.
- `heading` / `subheading` — headings inside content
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
- Radius is generous throughout this direction — there is no small-radius
  anywhere on screen today. `sm` is the smallest radius actually in use (small
  cells, inputs), `md`/`lg` for cards and buttons, `xl` for larger surfaces,
  `pill` for chips, `full` for circles. `radius.xs` (10) exists in the scale
  but isn't used anywhere currently — treat reaching for it as a signal to
  double check the surface really needs to look that tight in this direction.

**Elevation is claymorphic and has two parts, used together:**

1. **Shadow tiers** — `shadow.subtle` → `card` → `raised`, all warm-tinted
   (`#3A2E22`, never pure black) so they read as depth in a puffy material
   rather than a hard drop shadow. There's no per-domain shadow tier here —
   `Button.tsx` overrides `shadowColor` at the call site for both variants
   (primary gets the domain's `*Deep` color, secondary gets
   `colors.textPrimary`); everything else uses these tiers as-is. Shadows stay
   soft and low-opacity by design — deepening one to make something stand out
   is the wrong lever; hierarchy comes from type and space first.
2. **`clayOverlay`** — the "puffy inner-highlight" illusion. React Native has
   no CSS-style inset shadow, so the claymorphic volume cue is faked with a
   low-opacity diagonal gradient sheen laid on top of a surface: lighter
   top-left (catching light), fading through transparent, to a faint warm dark
   bottom-right (falling into shadow). Render it as an `expo-linear-gradient`
   `LinearGradient` sized to `StyleSheet.absoluteFill`, **with its own
   `borderRadius` matching the surface** — a view always clips its own
   background/gradient fill to its own border radius, so the parent surface
   deliberately does **not** get `overflow: 'hidden'`, which would otherwise
   also clip the parent's own drop shadow. See `Card.tsx` and `Button.tsx` for
   the pattern in place (`clayOverlay` on primary buttons only — secondary
   buttons don't get the sheen).

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
- **Bounce is the deliberate default feel** in this direction — the opposite
  of the old "no bounce on a button" rule. Both `PressableScale` (chips,
  cells) and `Button` (primary and secondary) use `motion.spring.snappy`
  (`damping: 8, stiffness: 260`), which is visibly springy on both press and
  release. This is intentional, not an animation bug to tone down.
- `motion.spring.celebrate` (`damping: 5, stiffness: 220`, a pronounced
  overshoot) exists specifically for the mascot's celebration bounce. Reserve
  it for genuine reward moments — using it for routine taps would read as
  exhausting rather than delightful.

What is wired today, to copy rather than reinvent:

- **`PressableScale`** (`src/components/ui/PressableScale.tsx`) is the springy
  "chips and cells" press pattern — a shared value driving
  `withSpring(motion.spring.snappy)` on **scale only** (no opacity dip — that
  was dropped from this component). Use it for chips, cells, and list rows.
  Buttons have their own press animation; never give a button this.
- **`Button`** (`src/components/ui/Button.tsx`) animates scale and
  `backgroundColor` together, both as pure functions of a single `pressed`
  shared value that is itself sprung (`withSpring(motion.spring.snappy)`) in
  `onPressIn`/`onPressOut` — so the squish and the color darken are read from
  the same continuously-animating value on every frame, genuinely
  synchronized rather than one snapping instantly while the other animates.
- **Onboarding step transitions** wrap the step body in an `Animated.View`
  keyed by `step` with `entering={FadeInDown…entrance}`, so each step replays
  the entrance. The keyed-remount trick is the simplest way to fire an entering
  animation on a value change.
- **Onboarding progress segments** grow a fill left-to-right with
  `scaleX` + `transformOrigin: 'left'` over `duration.base`, rather than
  snapping color.

Testing note: `react-native-reanimated` cannot load under jest-expo (its native
worklets module crashes), so `__mocks__/react-native-reanimated.js` hand-mocks
the small surface the app uses — animated components render as plain views,
animations resolve to their target value. Add to that file when you reach for a
reanimated API it doesn't cover yet; don't try to load the library's own mock.

## Mascot

`Mascot` (`src/components/ui/Mascot.tsx`) is a stylized cartoon **broccoli**
character — arms, legs, big expressive Pixar-style eyes, coral-orange
sneakers as its only clothing accent. The species is a deliberate choice made
via a human checkpoint during implementation: the original design spec asked
only for a "generic sporty creature, no fixed species," and the pick pivoted
mid-implementation to this specific broccoli character. Treat the species as
settled, not a placeholder — don't propose a different creature without a new
checkpoint.

Two poses ship today:

- **`idle`** — the default, continuous appearance. Breathes with a slow scale
  pulse (`motion.duration.idle`, a full 2.4s cycle) so it reads as alive even
  when nothing is happening — this is the design spec's "présence continue"
  requirement, not a one-off animation.
- **`celebrating`** — a triggered reward moment. Bounces in with the
  pronounced-overshoot `motion.spring.celebrate`. Because a real screen will
  almost always mount `Mascot` as `idle` and then flip its `pose` prop to
  `celebrating` in response to an event (rather than mounting fresh already
  celebrating), the component resets its scale to the pre-bounce starting
  point before springing back to 1 whenever `pose` changes — otherwise a
  scale that's already resting near 1 would spring from ~1 to 1 and produce
  no visible bounce.

`Mascot` is **foundation-only** — it is not yet wired into any screen. Screen
placements (end-of-workout, meal logged, streak milestones, and similar
moments described as follow-up work) are a separate, later effort.

Two more poses from the design spec are not built yet: a moving/transition
pose (for loading and screen transitions) and an encouraging-after-a-setback
pose (deflated but never mocking or guilt-inducing, matching the app's
error-copy tone below).

## Interaction and accessibility

- Every `Pressable` needs a visible pressed state. Two accepted patterns:
  darken the fill and squish the scale together (buttons — see
  `src/components/ui/Button.tsx`), or the scale-only spring (chips, cells) —
  reach for `PressableScale`, which springs it, rather than re-implementing a
  static `state.pressedScale` style.
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
  no guilt ("Tu as encore raté...") — for functional copy (labels, errors,
  buttons, informational content).
- The mascot's own lines and celebration messages are the one exception: they
  get energy and exclamation marks — a dedicated zone for enthusiasm, not a
  blanket tone change. Functional copy elsewhere keeps the sober register
  above.
- Errors say what happened and what to do next, in that order, and stay
  factual — the mascot never appears in an error state, so a failure is never
  read as the app poking fun at the user.
- Empty states name the benefit of acting, not the emptiness itself.
- Labels are nouns ("Poids", "Objectif"), buttons are verbs ("Générer le plan").

## Before you call a screen done

1. Zero hex codes, zero raw `fontSize`/`fontWeight` in the diff.
2. One domain color per screen — don't mix two domains' accents without a
   reason (see **Color** above).
3. Every tappable thing: pressed state, 44pt minimum, accessibility role.
4. Text steps come from `typography`, and there are no more than four distinct
   steps on the screen.
5. Spacing values all come from `spacing`.
6. Copy tutoies, and no string is longer than it needs to be.
7. `npx tsc --noEmit` and `npx jest` are clean.

## Where things stand

**The claymorphic/domain-color/mascot system is the shipped, current state of
every screen — not just the shared components.** Tokens
(`src/theme/tokens.ts`: domain colors, single-family typography, generous
radii, two-layer claymorphic shadows + `clayOverlay`, bouncier motion
springs), the shared components (`Button`, `Card`, `PressableScale`,
`ChoiceGroup`, `TagFilterGroup`, `EmptyState`, `TextField`, `BackLink`,
`ErrorNotice`, `Sparkline`, `TabIcon`, `ExercisePhotoPair`), and every screen
under `src/app` all read `useThemeColors()`/`typography`/`shadow` — there is
no second token system anywhere in the codebase. Every `Button`/`ChoiceGroup`/
`TagFilterGroup`/`EmptyState` call site passes an explicit `domain` prop
matched to its screen (auth/onboarding screens use `"neutral"` since they
aren't domain-specific). `Mascot` is placed on the workout-session finish
screen (`celebrating` pose) — the other three poses/placements described
above (a moving/transition pose, an encouraging-after-a-setback placement,
and mascot appearances for meal-logged/streak moments) are still open
follow-up work, not yet wired in. The two 🔥 streak-counter emoji
(`home.tsx`, `progression.tsx`) also haven't been replaced by a claymorphic
icon, and no screen has had a dedicated copy pass beyond what already reads
correctly — both remain open follow-up work too.

**History worth knowing so this doesn't happen again:** between this file
being written and this update, a separate work session fully rebuilt the app
onto a parallel "Material 3" token system (`useMaterialColors`,
`materialTypography`, `materialElevation`, Material-role color names) across
every shared component and screen, without updating this file or `AGENTS.md`
— so for a stretch, the actual app was flat/neutral-shadowed Material 3 while
this skill kept describing (and mandating) claymorphic. That drift was only
caught when a design request surfaced the mismatch between what this file
said and what the app actually looked like. The product decision was to
revert to claymorphic as the real direction; the Material 3 layer, its
dark-mode color scheme, and the tests that only made sense for it were
deleted outright rather than kept as a parallel system. If a future session
ever wants to explore Material 3 (or any other system) again, that has to be
a deliberate, documented decision that updates this file in the same change —
never a silent screen-by-screen drift that leaves the doc behind.

**The previous system this replaced ("Soft Neutral") and its history** —
single warm-red accent, Fraunces serif + Plus Jakarta Sans, tokens (light-only
— see **Dark mode** below for why there's no dark palette), `useThemeColors()`,
the typography pass across all screens, three brand illustrations, the app
icon/splash, and a first motion pass (onboarding step transitions and
progress fill, springy chip/cell presses) — all shipped, and its layout and
copy decisions (not its colors/type/shape, which the token swap already
overwrote everywhere) are what's left recognizable on any screen the Phase 1
rollout above hasn't reached yet. Kept here as history; do not use it as a
guide for new work, which follows this file's current sections instead.

**Charts.** Read the `dataviz` skill before writing the first line of chart
code. One thing learned building the weight trend that's still relevant here:
the brand/domain color does **not** go to a chart mark — the screen's one
domain-colored primary action already owns that emphasis, so a chart's
emphasis instead comes from ink weight (`textSecondary` line, `textPrimary`
current point). `Sparkline` draws a single series from rotated views, no
charting dependency. It reads `useThemeColors()` like everything else, rather
than hardcoding a color of its own.

**Dark mode — tried, then reverted. The app is light-only by decision.**

Dark mode was fully built (theme-aware tokens, dark-safe transparent assets,
native dark splash) and shipped, but the first real look on-device showed a
dark login screen the user didn't like, and the call — deliberately, not from
a bug — was to drop dark mode everywhere rather than patch just that screen.
Current state:

- `useThemeColors()` in `src/theme/tokens.ts` still exists and every screen
  still calls it — it just always returns `lightColors` now. This was the
  one-file fix: no screen or component needed touching, because they were
  never coupled to `useColorScheme()` directly. `darkColors` was deleted
  rather than kept dead — it's still in git history (`228667e`) if dark mode
  ever comes back.
- `app.json`'s `userInterfaceStyle` is `"light"` (not `"automatic"`), the
  splash screen's `dark` variant block was removed, and `_layout.tsx`'s
  `<StatusBar>` is hardcoded to `style="dark"`. All three matter: leaving any
  of them on "automatic" would let native chrome (status bar, splash) follow
  the OS scheme while the JS-rendered UI stays light — exactly the mismatch
  this was meant to avoid.
- The illustrations and logo are still exported fully **transparent** (no
  baked background) — that was the right call independent of dark mode (it
  also sidesteps any background-color mismatch on light), so nothing there
  needed reverting. The decontamination technique — for every pixel with
  `0 < alpha < 255`, recover `fg = (observed − bg×(1−alpha)) / alpha`, gated
  on the pixel being light-colored so real drop shadows aren't touched — is
  still the right tool if a background-bleed halo ever shows up on a new
  asset; it just isn't a dark-mode-specific concern anymore.
- If dark mode is revisited later: the old WCAG-verified `darkColors` values
  (from the "Soft Neutral" era, now stale against the new domain palette) are
  recoverable from `228667e`, but re-verify the **rendered** result on-device
  before shipping again — that step never happened last time before the
  revert, and a fresh dark palette derived from the current domain colors
  would need the same on-device check plus a full WCAG re-verification, not
  just resurrecting the old values.

**Illustrations beyond the three that shipped under Soft Neutral.** The
onboarding hero and the plan / grocery empty states are in
`assets/images/illustrations/`; see that folder's README and
`docs/superpowers/specs/2026-08-02-illustrations-soft-neutral-design.md` (that
spec's "generate on the exact background color" guidance is superseded by the
transparent approach above). The weight-log empty state is still unillustrated.
Whether/how these get restyled for the claymorphic direction is part of the
screen-by-screen rollout, not decided here.

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
text/logos. The claymorphic direction's spec explicitly keeps this
photorealistic house style unchanged and frames it inside a puffy claymorphic
card instead of replacing it with illustration — the photo/UI contrast is
assumed, not a gap to fix.

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

**Exercise detail pages — shipped, 21/21 unique exercises.** Tapping any
exercise name inside an expanded session card (now a `PressableScale`, not
plain text) opens `exercise/[id].tsx` — name, two demonstration photos side
by side ("Position de départ" / "Position finale"), and numbered French
how-to steps, mirroring `recipe/[id].tsx`'s photo-then-numbered-steps layout.
Same architecture call as the session photos: `src/lib/exercises.ts` is a
static catalog (`Exercise` type, `id`/`name`/`instructions`/two
`require()`'d images), bundled under `assets/images/exercises/`, because the
workout program has no DB table to hang it on. The ~30 raw exercise strings
across all 9 sessions collapse to 21 unique movements (e.g. "Squats",
"Squats complets", and "Squats à vide" are all the same bodyweight squat);
each `CircuitExercise`/`SeriesExercise` entry in `homeWorkoutProgram.ts`
carries an `exerciseId` pointing at the catalog, cross-checked at generation
time so every id actually resolves. Two photos per exercise (not one, unlike
recipes/sessions) specifically to show the movement's start and end position.
Same "achievable home workout" house style as session photos; the exercise
rows deliberately do not turn a domain color to signal tappability — one
domain color per screen is still the rule (now per-domain rather than
per-app), and the session cards they live inside already establish "tap for
more" via press feedback alone, not color.
