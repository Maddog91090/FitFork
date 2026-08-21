# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Primary: everyday people pursuing weight loss or getting back into shape at home, without a coach or gym membership. They want structure — a meal plan and a workout program — without having to design one themselves.

## Product Purpose

FitFork (Android package `com.maddog91steam.fitpro`) is a home fitness + nutrition planning app. It computes calorie/macro targets from the user's profile, generates a personalized weekly meal plan and a home-workout program in one action, and tracks adherence over time (weight log, workout completions, streaks).

## Positioning

The confirmed differentiator: automatic, one-click generation of a full weekly meal plan and workout program from the user's computed targets — not a manual food/exercise diary. `generate-plan.tsx` computes targets from the profile plus recent weight trend, then generates matching recipes and sessions in a single action.

## Operating Context

- Home use, mobile-first (Android phone). Used both while planning (browsing the plan/recipes ahead of time) and mid-session (workout screen, exercise detail) with the phone nearby during exercise.
- Weekly meal-plan cadence: a day × meal-type grid, individual meals swappable after generation, with a grocery list auto-aggregated from the week's recipes.
- Home workout sessions structured by experience level; exercise detail screens show start/end position photos and step instructions for solo use without a coach present.
- Weight logged manually on the user's own cadence; a trend percentage is computed over recent entries.
- Streak/badge gamification tracks weekly workout consistency (≥3 sessions in a week counts as a qualifying week) and other milestones.

## Capabilities and Constraints

- Auth: email/password + OAuth session via Supabase; an onboarding wizard captures profile (goals, body stats) and training profile (experience level) before targets can be computed.
- Meal planning: recipes carry base macros, scaled by portion; weekly plan generation respects a per-day/meal-type selection grid; individual meals are swappable after generation.
- Workout: a home-workout program keyed by experience level, multiple sessions per level, an exercise library with static instructional photos (no video).
- Progress: weight log with trend %, workout completion history, streak calculation (consecutive *qualifying weeks*, not consecutive days).
- Notifications: push reminders for workouts, scheduled server-side (Expo push).
- No effort/intensity data exists per exercise in the current data model — confirmed absent, not omitted by oversight.
- Push notifications don't work in Expo Go (SDK 53+ removed remote notifications from Expo Go) — a development build is required to test that flow.

## Brand Commitments

- User-facing product name: **FitFork**. (`app.json`'s `name`/`slug` still read `meal-workout-planner`/`fitpro` — legacy scaffold values from project creation, not the brand name.)
- Mascot: a stylized cartoon broccoli character, Pixar-style 3D shading, big expressive eyes, coral-orange sneakers — the app's primary brand identity, also used as the app icon, splash screen, and Android adaptive icon. Full concept history and the validated shared generation prompt live in `assets/images/mascot/README.md`. Current poses: `idle` (continuous presence), `celebrating` (milestones/completion), `encouraging` (reassurance after a setback — never mocking, never sad, never apologetic).
- Visual system: Material 3, themed through Material's own role system (buttons, cards, filter chips, native ripple feedback) rather than the earlier custom "claymorphic" system (generous radius, warm two-tier shadows, gradient clay-sheen overlays). Claymorphic was the confirmed choice for three phases; a later phase (4-5c) deliberately superseded it — every screen has migrated off the claymorphic tokens (`useThemeColors` has zero remaining consumers). Fredoka remains the single rounded typeface, themed through Material's type scale.
- Color: four domain-based accent colors (nutrition = amber, sport = green, progress = rose, neutral = brown) replace a single brand accent, applied by what the content *is* rather than as flat decoration — expressed via Material's swappable `tertiary` role.
- Light and dark, both first-class: dark mode was built, tested on-device, reverted once, then deliberately rebuilt and reactivated (`userInterfaceStyle: "automatic"`) once every screen had a scheme-aware Material equivalent. Both schemes are WCAG AA-verified (`src/__tests__/materialColors.test.ts`).
- Tone: French, tutoiement, sober functional copy — no exclamation marks, no hype. Energy is reserved for the mascot's celebration/encouragement moments only, never for body copy.
- Full design-system documentation lives in the root `DESIGN.md`.

## Evidence on Hand

- Real recipe and exercise content already in the codebase (`src/lib/mealPlanData.ts`, `src/lib/exercises.ts`) — no placeholder or lorem content.
- Mascot poses `idle`/`celebrating`/`encouraging` (transparent PNGs, `assets/images/mascot/`) generated from one validated shared prompt.
- No user testimonials, benchmarks, or press exist — none should be fabricated.

## Product Principles

1. Generate, don't diary — remove planning effort (compute targets → generate the plan/program in one action) rather than asking the user to log everything manually from a blank slate.
2. Usable without a coach or gym — exercise instructions, session structure, and copy all assume a solo user working out at home.
3. Motivation lives in the mascot, not the copy — functional text stays sober; personality and encouragement concentrate in mascot placements (idle presence, celebration, encouragement-after-setback), never in body copy.
4. One accent color per domain, not one brand color — nutrition/sport/progress/neutral each get their own token family, chosen by what the content is, not by decoration.
5. Support light and dark deliberately, not by default — the app tested a light-only decision, reverted it, then rebuilt dark mode properly (full Material migration, WCAG-verified both schemes) before turning it back on.

## Accessibility & Inclusion

- 44pt+ minimum touch targets and `accessibilityRole` are enforced as a hard constraint across the existing component library (`Button`, `ChoiceGroup`, `PressableScale`, etc.).
- AA contrast (4.5:1 body text, 3:1 non-text UI) is verified for every domain-color token against its paired background (`src/__tests__/tokens.test.ts`).
- No screen-reader-specific or motor-accessibility need beyond the above baseline has been separately confirmed.
