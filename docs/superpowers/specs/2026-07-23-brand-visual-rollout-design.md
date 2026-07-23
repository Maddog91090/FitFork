# Brand Visual Rollout (All Screens) — Design

## Overview

The FitPro brand identity (logo, app icon, splash screen — see
`2026-07-22-brand-visual-identity-design.md`) is in place, but every app
screen is still unstyled default React Native (`View`/`Text`/`Button`/
`TextInput`, no shared design system). This project defines a shared
visual design system — colors, typography, spacing, and reusable
components — and applies it across all 10 screens of the app, plus
introduces a persistent bottom tab bar for the authenticated area.

This supersedes the earlier `2026-07-20-onboarding-visual-design.md`
("Athletic Dark" Figma pilot for onboarding only), which was never
implemented in code. That direction (dark background, lime accent) is
abandoned in favor of a palette consistent with the brand identity
already shipped in the app icon/splash screen.

This is a design/visual deliverable (Figma), not a code change. Code
implementation is planned separately after this spec is approved.

## Scope

**In scope**: one Figma file with a design system page (tokens +
components) and one page per screen (10 screens), plus the bottom tab
bar for the authenticated area.

**Out of scope**: the logo mark itself (the current plate/track icon
stays as-is; the user flagged it may be redesigned separately later —
not part of this project). Any onboarding/empty-state illustrations
beyond what's already covered by shared components (no bespoke
illustration artwork is produced here). Code implementation (planned as
a follow-up once this spec is approved).

## Visual Style — "Soft Neutral"

Chosen via visual comparison against two alternatives (Clean Editorial —
pure white, minimal accents; Bold Sport — full-color blocks, heavy
uppercase type). Soft Neutral reads as calmer and more "wellness" than
"performance," while still using the brand's red/white/navy-adjacent
palette.

**Color tokens**

| Token | Value | Usage |
|---|---|---|
| `bg/base` | `#F7F5F2` | Screen background (warm off-white, not pure white) |
| `bg/surface` | `#FFFFFF` | Cards, input fields, buttons, tab bar |
| `text/primary` | `#1E1B18` | Titles, primary content text |
| `text/secondary` | `#9A958D` | Labels, captions, secondary metadata |
| `accent/red` | `#DC2626` | Primary CTA, selected states, key values, active tab |
| `border/divider` | `#F0ECE3` | Hairline dividers inside cards (e.g. list rows) |
| `state/error` | `#DC2626` | Error text (reuses accent red — no separate error color) |

**Typography**: system default font (San Francisco on iOS, Roboto on
Android — no custom font added). Titles: bold (700–800 weight). Labels/
captions: uppercase, small size (~11px), `text/secondary` color, medium
letter-spacing. Body/values: regular-to-semibold weight, sentence case.

**Shape & elevation**: large corner radius throughout — 12–14px on
fields/buttons, 14–16px on cards. No borders; depth comes from soft
drop shadows (`0 2px 8–10px rgba(0,0,0,.05–.06)`) rather than outlines.

**Buttons**: primary = solid `accent/red` fill, white bold text, 14px
radius, colored shadow tint (`rgba(220,38,38,.25)`). Secondary = white
fill, `text/primary` bold text, neutral shadow. Disabled = white fill,
`text/secondary` text, faint shadow.

**Input fields**: white filled rounded field (no visible border at
rest), focus state = 2px `accent/red` outline ring.

**Choice pills**: rounded-full (20px radius). Selected = solid
`accent/red` fill, white text. Unselected = white fill, `text/primary`
text, neutral shadow.

**Cards**: white, 14–16px radius, soft shadow, no border. Used for list
rows (meal entries, exercises, grocery items, weight history) and
grouped content.

**Empty states**: centered card with a large (56px) outlined icon in
`text/secondary`, bold title, secondary-color explanatory line, and a
primary-button CTA below.

## Navigation

The authenticated area (Home, Plan, Programme musculation, Liste de
courses, Suivi de poids) gets a persistent bottom tab bar — 5 tabs, each
with an outline-style icon (home, calendar, dumbbell, shopping cart, and
a circular "kg" badge for weight — chosen over a bathroom-scale or
trend-chart icon for directness at small size) plus a label. Active tab
= `accent/red` icon + label (bold); inactive = `text/secondary`.

Screens outside the tab bar (full-screen, no tabs visible): Login,
Signup, Onboarding, Générer le plan, Détail recette. These are reached
via navigation from within the tabbed area (or, for login/signup, before
authentication) and return to a tabbed screen on completion.

## Screens

All 10 screens are restyled with the tokens/components above. Content
and business logic are unchanged — this is presentation-only.

1. **Login** — logo mark at top, brand wordmark, email/password fields,
   primary button, secondary text link to Signup.
2. **Signup** — same layout as Login; the post-submit "check your email"
   confirmation state uses the same centered layout with a link back to
   Login.
3. **Onboarding** — restructured as a 4-step wizard + recap (structure
   already validated in the superseded 2026-07-20 spec, only the visual
   skin changes): segmented progress bar, step counter, step title,
   fields/pills per step, primary "Continuer" button. Recap step groups
   all answers by the 3 preceding steps with a "Valider" button.
4. **Home** — greeting header, a card summarizing today's macro targets
   (calories/protein/fat/carbs), a quick-actions row (secondary button
   to view the plan, primary button to generate one).
5. **Générer le plan** — a day × meal-type selection grid (toggleable
   cells, selected = red fill) followed by a primary "Générer le plan"
   button.
6. **Plan** — meal entries grouped by day as cards (meal type, recipe
   name, calories/portion %, "Échanger" swap action); empty state when
   no plan exists yet.
7. **Détail recette** — title + macros header, ingredients list, numbered
   preparation steps (red circular step badges).
8. **Programme musculation** (workout) — exercises grouped by training
   day as collapsible cards (name, sets/reps/muscle group, chevron to
   expand instructions); regenerate button below.
9. **Liste de courses** (grocery-list) — aggregated ingredients as a
   single card with hairline-divided rows (name + quantity); empty state
   when no plan exists.
10. **Suivi de poids** (weight-log) — input field + primary "Enregistrer"
    button, followed by a history card with hairline-divided rows (date +
    weight).

## Testing / Validation

Not applicable in the usual sense (static Figma deliverable, not
executable code). Validation is: the user reviews the Figma file's 10
screens plus the design-system page. Once a follow-up implementation
plan turns this into React Native code, validation shifts to visually
confirming each screen in the running app (iOS/Android) matches the
approved mockups and that no existing functionality (auth, plan
generation, swap, workout regeneration, weight logging) regresses.
