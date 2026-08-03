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

Import `colors`. The names carry the intent — respect it:

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
- Every foreground token is ≥ 4.5:1 on `bgBase`. If you add a color, verify the
  ratio before committing it, and write the ratio in the comment next to it.

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

## Interaction and accessibility

- Every `Pressable` needs a visible pressed state. Two accepted patterns:
  darken the fill (buttons — see `src/components/ui/Button.tsx`), or
  `state.pressedOpacity` + `state.pressedScale` (chips, cells).
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

Shipped: tokens, both fonts, the shared components (`Button`, `Card`,
`TextField`, `EmptyState`, `ChoiceGroup`), and the typography pass across all
screens.

Not built yet, and worth knowing before you plan work:

- **Dark mode.** No dark tokens exist. `app.json` still declares
  `userInterfaceStyle: "automatic"` while the app is light-only.
- **Illustrations beyond the three that shipped.** The onboarding hero and
  the plan / grocery empty states are in `assets/images/illustrations/`; see
  that folder's README and
  `docs/superpowers/specs/2026-08-02-illustrations-soft-neutral-design.md`.
  The rule that matters when adding one: an illustration is generated on the
  exact color it will sit over — `bgBase` on a screen, `bgSurface` inside a
  card — and measured before shipping, because a background a few points off
  bands visibly against a flat screen. Recipe and exercise imagery, and the
  weight-log empty state, are still unillustrated.
- **Charts.** `weight-log` shows a list where it wants a trend line. Read the
  `dataviz` skill before writing the first line of chart code, and take the
  series colors from `colors`.
- **Splash screen.** `assets/images/splash-icon.png` has an opaque white
  background, so `app.json`'s splash `backgroundColor` cannot move to `bgBase`
  until the asset is re-exported with transparency.
