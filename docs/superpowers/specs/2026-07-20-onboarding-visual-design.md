# Onboarding Visual Design (Figma pilot) — Design

## Overview

The app currently has no visual design — screens are functional, unstyled
React Native views (see `src/app/onboarding.tsx`: one long scrolling form
with default `Button`/`TextInput` elements). This project produces the first
real visual design pass for the app, delivered as an editable Figma file,
using the **onboarding flow** as the pilot screen. The resulting design
system (tokens + components) is meant to be reused for the app's other 8
screens (login, signup, home, generate-plan, plan, workout, grocery-list,
weight-log) in a later pass — not built here.

This is a design/visual deliverable, not a code change. No app code is
modified as part of this project.

## Scope

**In scope**: one Figma file containing a design system page and an
onboarding page with 5 connected frames.

**Out of scope**: the other 8 screens (explicitly deferred to a future
pass once this pilot is validated), any code implementation of the new
onboarding flow in `src/app/onboarding.tsx`, dark-mode/light-mode toggle
(this design is dark-only, matching the "Athletic Dark" direction chosen),
localization (French copy only, matching the current app copy).

## Content & Flow

The current onboarding screen collects 9 fields in a single scroll form.
This design restructures them into a 4-step wizard + a recap step, with no
change to the underlying fields or validation rules already implemented in
`src/app/onboarding.tsx` — only presentation changes.

1. **Ton profil** — Sexe (2-option pill toggle), Âge, Taille (cm), Poids (kg)
2. **Ton activité** — Niveau d'activité quotidienne (5-option pill list),
   Objectif (3-option pill list: Sèche / Maintien / Prise de masse)
3. **Ton entraînement** — Jours d'entraînement/semaine (numeric field),
   Niveau d'expérience (3-option pill list), Matériel disponible (3-option
   pill list)
4. **Récap** — read-only summary of all 9 answers, grouped by the three
   preceding steps, with a "Valider" primary button and a way to go back
   and edit any step

Each of steps 1–3 has: a segmented progress indicator (4 segments, current
step lit), a step counter label ("Étape X/4"), a title, an optional
subtitle, the step's fields, and a primary "Continuer" button. A back
link/chevron returns to the previous step (step 1 returns to login/signup
context, consistent with current behavior).

## Visual Style — "Athletic Dark"

Chosen via visual comparison against three alternatives (Clinical Blue,
Warm Wellness, Bold Energetic): a dark, high-contrast, performance-oriented
aesthetic.

**Color tokens**

| Token | Value | Usage |
|---|---|---|
| `bg/base` | `#0E0E12` | Screen background |
| `bg/surface` | `#18181D` | Cards, input fields, unselected pills |
| `border/default` | `#2A2A32` | Borders, dividers, inactive progress segments |
| `accent/lime` | `#C6FF3D` | Selection state, focus, primary CTA, active progress segment |
| `text/primary` | `#FFFFFF` | Titles |
| `text/secondary` | `#8A8A94` | Labels, subtitles, step counter |

**Typography**: Inter (fallback -apple-system). Titles and field labels are
bold, uppercase, with slight letter-spacing. Body/subtitle text is regular
weight, sentence case.

**Shape**: 6px corner radius throughout (small/angular, not the rounded-pill
look of the rejected directions) — consistent with the "performance" feel.

**Progress indicator**: 4 short horizontal segments (not numbered circles —
this was compared visually against a numbered-circle alternative and the
segmented bar was preferred). Completed/current segment is lime, upcoming
segments are `border/default`.

**Input fields**: underline style — no box, just a 2px bottom border in
`border/default` that turns `accent/lime` on focus. Chosen over a boxed/filled
alternative for a cleaner, less boxy feel against the dark background.

**Choice pills**: rectangular (6px radius) options in a vertical list.
Selected = lime-tinted translucent background + lime border + lime text,
uppercase. Unselected = `bg/surface` background + `border/default` border +
`text/secondary` text, uppercase.

**Primary button**: solid `accent/lime` fill, `bg/base` text, uppercase,
bold, 6px radius, full width.

## Figma Deliverable Structure

One Figma file with two pages:

1. **"Design System" page** — the tokens above published as real Figma
   styles (color styles + text styles), plus reusable components:
   `ProgressBar` (4-segment, with an active-step variant property),
   `ChoicePill` (selected/unselected variant), `ChoicePillGroup` (auto-layout
   wrapper), `TextFieldUnderline` (default/focused variant), `PrimaryButton`,
   `BackLink`.
2. **"Onboarding" page** — 5 frames at 393×852 (iPhone gabarit): Profil,
   Activité, Entraînement, Récap, built from the components above, connected
   with Figma flow arrows in sequence (1→2→3→4→Récap).

Components are named and structured for reuse when the design extends to
the app's other screens in a future pass.

## Testing / Validation

Not applicable in the usual sense (this is a static design artifact, not
executable code). Validation is: the Figma file opens, the 5 frames render
using the shared components (not one-off shapes), and the flow arrows
connect the steps in order. The user reviews the rendered frames in Figma
directly before this is considered done.
