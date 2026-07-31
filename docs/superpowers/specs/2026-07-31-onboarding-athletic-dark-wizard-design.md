# Onboarding Athletic Dark Wizard — Code Implementation Design

## Overview

`2026-07-20-onboarding-visual-design.md` produced a Figma design for a
4-step wizard + recap onboarding flow ("Athletic Dark" style), explicitly
scoped as a design artifact only — no app code was changed. The current
`src/app/onboarding.tsx` is still the original unstyled single-scroll form:
default `Button`/`TextInput`, no dark background, no step structure, no
illustration.

This project translates that Figma design into working code: restructure
`src/app/onboarding.tsx` into the 4-step wizard + recap, build the shared
Athletic Dark design tokens and components the Figma file specified, and
wire up per-step validation and recap editing. It also sets up a reusable
component base for restyling the app's other 8 screens later (deferred,
not built here).

**Out of scope**: the other 8 screens, the onboarding hero illustration
(`2026-07-31-onboarding-hero-illustration-design.md` — depends on this
wizard existing, built as a separate follow-up plan), any change to the
underlying fields, validation rules, or Supabase calls beyond restructuring
them per-step (same `upsertProfile`/`upsertTrainingProfile` calls, same
field set).

## Architecture

Single screen, local component state. `src/app/onboarding.tsx` keeps a
`currentStep` state (`0` Profil, `1` Activité, `2` Entraînement, `3`
Récap) and renders the current step's fields conditionally. All field
values live in the same component state as today (`sex`, `age`, etc.) —
navigating between steps doesn't reset or persist anything externally, it's
pure UI state. No new routes, no route params. This was chosen over a
route-per-step structure because it avoids threading in-progress form data
through navigation params or a global store for what is fundamentally one
form with staged visibility.

## Design Tokens & Shared Components

New `src/lib/theme.ts` exporting the Athletic Dark tokens as named
constants:

| Token | Value |
|---|---|
| `bgBase` | `#0E0E12` |
| `bgSurface` | `#18181D` |
| `borderDefault` | `#2A2A32` |
| `accentLime` | `#C6FF3D` |
| `textPrimary` | `#FFFFFF` |
| `textSecondary` | `#8A8A94` |
| `stateError` | `#FF5C5C` |

`stateError` is a new addition (not in the Figma spec, which didn't cover
error states) — a readable red against `bgBase`/`bgSurface`, replacing the
current plain `color: 'red'` error text.

Five new components in `src/components/`, all consuming `theme.ts`:

- **`ProgressBar`**: 4 segments, prop `currentStep: number` (0-3), segments
  `<= currentStep` render `accentLime`, others `borderDefault`.
- **`ChoicePill`** + **`ChoicePillGroup`**: vertical list of pills (replaces
  `ChoiceGroup`, which becomes unused once `onboarding.tsx` is migrated —
  `ChoiceGroup.tsx` is deleted). Selected = lime-tinted background + lime
  border + lime text; unselected = `bgSurface` background + `borderDefault`
  border + `textSecondary` text. Uppercase labels.
- **`TextFieldUnderline`**: 2px bottom border, `borderDefault` default,
  `accentLime` on focus, no box background.
- **`PrimaryButton`**: solid `accentLime` fill, `bgBase` text, uppercase,
  bold, 6px radius, full width, supports a `disabled` prop (used to block
  "Continuer" until the current step validates).
- **`BackLink`**: chevron + text, `textSecondary` color.

Shape: 6px corner radius on all interactive elements (pills, fields,
button), matching the Figma spec.

**Typography**: Inter, added via `@expo-google-fonts/inter` (`Inter_400Regular`,
`Inter_700Bold`) and `expo-font`'s `useFonts` hook in `onboarding.tsx`,
falling back to the system font while loading (matches the Figma spec's
"Inter, fallback -apple-system").

## Step Content

Same 9 fields and grouping as the Figma spec, unchanged from today's
validation rules — only split across steps instead of one scroll form:

1. **Profil**: Sexe (`ChoicePillGroup`, 2 options), Âge, Taille (cm), Poids
   (kg) — three `TextFieldUnderline` numeric fields.
2. **Activité**: Niveau d'activité quotidienne (`ChoicePillGroup`, 5
   options), Objectif (`ChoicePillGroup`, 3 options).
3. **Entraînement**: Jours d'entraînement/semaine (`TextFieldUnderline`
   numeric), Niveau d'expérience (`ChoicePillGroup`, 3 options), Matériel
   disponible (`ChoicePillGroup`, 3 options).
4. **Récap**: read-only summary grouped into the three sections above, each
   with a "Modifier" link that sets `currentStep` back to that section
   (values stay pre-filled, since they live in the same component state) —
   plus the final "Valider" `PrimaryButton`.

Each of steps 1-3 renders: `ProgressBar` (4 segments), a step counter label
("Étape X/4"), title, the step's fields via the components above, and a
`PrimaryButton` labeled "Continuer".

## Validation

Each step validates only its own fields before enabling "Continuer" —
the existing `handleSubmit` validation logic (age/height/weight
numeric-and-positive checks, day-count 0-7 integer check, all choice
fields non-null) is split so each step's slice runs against that step's
current state, and `PrimaryButton`'s `disabled` prop reflects the result.
The Récap step re-runs no additional validation (all fields were already
validated on the way in) — its "Valider" button calls `upsertProfile` then
`upsertTrainingProfile` exactly as today, and on failure shows the same
error banner (now styled with `stateError`) instead of navigating.

## Navigation

`BackLink` is omitted on step 1 (Profil) — the screen is entered via
`router.replace('/onboarding')` from `home.tsx`/`workout.tsx`/
`generate-plan.tsx`, so there's typically nothing in the navigation stack
to return to. Steps 2-4 (including Récap) show `BackLink`, decrementing
`currentStep` by one (Récap's per-section "Modifier" links jump directly
to a specific step instead of stepping back one at a time).

## Testing

Component tests with `@testing-library/react-native` (same library already
used in `auth-context.test.tsx`):

- One test file per new shared component (`ProgressBar`, `ChoicePill`/
  `ChoicePillGroup`, `TextFieldUnderline`, `PrimaryButton`, `BackLink`) —
  render output and interaction (e.g. `ChoicePill` calls `onChange` with
  the right value on press; `PrimaryButton` doesn't fire `onPress` when
  `disabled`).
- An integration test on `onboarding.tsx` covering: "Continuer" stays
  disabled until step 1's fields are valid; progressing through all 4 steps
  reaches Récap with the entered values displayed; a "Modifier" link on
  Récap returns to the right step with fields pre-filled; final "Valider"
  calls `upsertProfile`/`upsertTrainingProfile` and navigates to `/home`
  (mocking those calls the way `supabase` is already mocked elsewhere).

## Testing / Validation

Automated: the component and integration tests above, run via `npm test`
(existing Jest + `jest-expo` setup, no config changes needed). Manual: the
user runs the app (`npx expo start`), walks through the 4 steps + Récap on
a simulator/device, confirming the dark theme renders correctly, validation
blocks progression as expected, and "Modifier" links pre-fill correctly.
