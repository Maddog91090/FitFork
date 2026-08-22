# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Primary: everyday people pursuing weight loss or getting back into shape at home, without a coach or gym membership. They want structure — a meal plan and a workout program — without having to design one themselves.

## Product Purpose

Dualo (Android package `com.maddog91steam.fitpro`) is a home fitness + nutrition planning app. It computes calorie/macro targets from the user's profile, generates a personalized weekly meal plan and a home-workout program in one action, and tracks adherence over time (weight log, workout completions, streaks).

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

## Brand

- User-facing product name: **Dualo** (renamed from FitFork). `app.json`'s `name` is now `"Dualo"`; `slug` (`fitpro`), the URL `scheme` (`mealworkoutplanner`), and the Android `package` (`com.maddog91steam.fitpro`) are untouched legacy scaffold identifiers — left as-is since changing them is a separate, higher-risk decision (Android package name is effectively permanent once published) not part of this rename.
- Dualo is also the name of the app's mascot character — a rounded seed-shaped creature whose color splits left/right between the nutrition and sport domains (honey yellow / plum purple). Current app icon, favicon, and splash screen use it; full design spec is tracked outside this repo (session memory), not yet written back into a project doc.
- No visual design system is currently mandated. The app has carried two incompatible ones in short succession (a custom "claymorphic" system, then a Material 3 migration — see git history on `src/theme/tokens.ts` if archaeology is ever needed), and the direction is being reconsidered from scratch rather than extending either. Don't treat any existing screen's current look, or any doc describing a past direction, as the target to match until a new direction is chosen and documented.

## Evidence on Hand

- Real recipe and exercise content already in the codebase (`src/lib/mealPlanData.ts`, `src/lib/exercises.ts`) — no placeholder or lorem content.
- `assets/images/mascot/` holds the old broccoli-character poses (`idle`/`celebrating`/`encouraging`) — superseded by the Dualo character (see Brand above) and not currently used anywhere; not yet cleaned up.
- No user testimonials, benchmarks, or press exist — none should be fabricated.

## Product Principles

1. Generate, don't diary — remove planning effort (compute targets → generate the plan/program in one action) rather than asking the user to log everything manually from a blank slate.
2. Usable without a coach or gym — exercise instructions, session structure, and copy all assume a solo user working out at home.

## Accessibility & Inclusion

- 44pt+ minimum touch targets and `accessibilityRole` are enforced as a hard constraint across the existing component library (`Button`, `ChoiceGroup`, `PressableScale`, etc.).
- AA contrast (4.5:1 body text, 3:1 non-text UI) is verified for every domain-color token against its paired background (`src/__tests__/tokens.test.ts`).
- No screen-reader-specific or motor-accessibility need beyond the above baseline has been separately confirmed.
