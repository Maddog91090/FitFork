# Meal & Workout Planner — Design

## Overview

A mobile application that generates a weekly meal plan matched to the user's
caloric needs (based on their goal — cut, bulk, or maintain) alongside a
strength-training program tailored to their training availability, experience
level, and equipment access.

## Platform & Users

- **Platform**: Mobile app (React Native + Expo), targeting iOS and Android
  from a single codebase.
- **Users**: Multi-user, with accounts. Each user has their own profile, goals,
  generated plans, and history.

## Tech Stack

- **Client**: React Native (Expo)
- **Backend**: Supabase — Postgres database, built-in Auth, auto-generated
  REST API, Row Level Security (RLS) for per-user data isolation.
- **Generation logic**: Runs client-side in the Expo app for V1 (deterministic
  functions operating on data read from Supabase). Can be moved to Supabase
  Edge Functions later if the logic grows too complex or needs to be hidden
  from the client.

Rejected alternatives:
- *React Native + Firebase*: Firestore's NoSQL model is a worse fit for the
  relational nature of recipes → ingredients → macros and workout templates →
  exercises; more application-level work to compensate.
- *React Native + custom Node/Express + Postgres backend*: full control, but
  significantly more upfront work to build and host auth, API, and security
  that Supabase provides out of the box.

## Data Model

### Profile & goals
- `profiles`: sex, age, height, current weight, daily activity level (excluding
  training), goal (bulk / cut / maintain)
- `weight_logs`: date + weight entries — powers progress tracking and TDEE
  recalculation
- `training_profile`: training days/week, experience level (beginner /
  intermediate / advanced), equipment access (full gym / limited home /
  bodyweight only)

### Nutrition
- `recipes`: name, meal type (breakfast / lunch / dinner / snack), calories
  and macros for a base serving
- `recipe_ingredients`: ingredients and quantities per recipe (canonical unit
  per ingredient — grams, ml, or "piece" — to avoid unit-mixing when
  aggregating)
- `weekly_meal_plans`: one generated plan per user per week, with that week's
  calorie/macro targets
- `meal_plan_entries`: each meal slot (day × meal type → chosen recipe +
  `portion_multiplier` scaling the recipe to hit the slot's calorie target)

### Training
- `exercises`: name, muscle group, equipment required
- `workout_templates`: predefined programs (e.g. Push/Pull/Legs, Full Body,
  Upper/Lower), tagged with days/week, level, and equipment required
- `template_days` / `template_exercises`: structure of each template (day →
  exercises with sets/reps)
- `user_workout_programs`: a template instance assigned to a user

### Derived (not stored)
The grocery list is computed on demand by aggregating
`recipe_ingredients × portion_multiplier` across the week's
`meal_plan_entries`, grouped by ingredient.

### Security
All user-owned tables (`profiles`, `weight_logs`, `weekly_meal_plans`,
`meal_plan_entries`, `user_workout_programs`) are protected by Postgres Row
Level Security so a user can only read/write their own rows.

## Meal Plan Generation

1. **Compute needs**: BMR via Mifflin-St Jeor (weight, height, age, sex).
   TDEE = BMR × daily-activity multiplier, plus a flat +200 kcal per training
   day — training days come from `training_profile`, so activity is not
   asked for twice. Apply the goal adjustment (cut: −17.5%, bulk: +12.5%,
   maintain: unchanged). Macro targets: protein at 2.0 g/kg bodyweight, fat
   at 28% of calories, carbs fill the remainder. These constants are
   centralized in one place in the code so they're easy to tune later.
2. **Distribute across meals**: daily calories split across meal slots using
   fixed default ratios — breakfast 25%, lunch 35%, dinner 30%, snack 10% —
   giving each slot a calorie target.
3. **Select recipes**: for each day × meal-type slot, choose a recipe of the
   matching meal type, avoiding repeating the same recipe more than twice in
   the week (relaxed automatically if the recipe pool for that meal type is
   too small), then compute a `portion_multiplier` to scale it to the slot's
   calorie target (±5–10% tolerance). The multiplier is clamped (e.g.
   0.5×–2×) to keep portions realistic, even if that means a larger deviation
   from the exact target.
4. **Check the week total**: after filling all 7 days, verify the weekly
   total calories/macros are within tolerance of the target; if not, nudge
   the portions of the last meal of each day to close the gap.

**Meal swap**: replaces a slot's recipe with another of the same meal type,
recomputes its `portion_multiplier` against the original slot target, and
updates the grocery list.

## Workout Program Generation

- **Template selection**: filter `workout_templates` by the user's
  `training_profile` — days/week determines split type (2–3 days → Full Body,
  4 days → Upper/Lower, 5–6 days → Push/Pull/Legs), level adjusts volume and
  exercise complexity, and equipment excludes templates requiring gear the
  user doesn't have. If no exact match exists, the closest available template
  is used rather than failing.
- **Persistence**: unlike the meal plan (regenerated weekly for variety), the
  workout program stays the same week over week once assigned — consistent
  with how strength progression works. It's only regenerated when the user
  changes their `training_profile` or explicitly requests a new program.
- **Display**: shown alongside the current week's meal plan for a combined
  nutrition + training view.
- **Out of scope for V1**: logging sets/reps/weight performed, and automatic
  program progression based on logged performance (planned for v2).

## Progress Tracking & Grocery List

**Progress tracking**: before generating the next week's meal plan, the app
compares the user's actual weight trend (moving average of recent
`weight_logs`) against the trend expected for their goal (−0.75%
bodyweight/week cutting, +0.375%/week bulking). If the deviation is
significant (actual trend differs from expected by more than 50%), it
adjusts next week's calorie target by ±150 kcal before regenerating the
plan. If there isn't enough weight data (fewer than 2 entries), the
originally computed target is kept as-is.

**Grocery list**: auto-generated by aggregating
`recipe_ingredients × portion_multiplier` across the week's meal plan,
grouped by ingredient, using each ingredient's single canonical unit.
Displayed as a checklist; checked-off state is local UI state only (not
persisted) for V1.

## Error Handling & Edge Cases

- No recipe close enough to a slot's target → use the best available match
  and flag it visually as approximate.
- Recipe pool too small for the anti-repetition rule → rule is relaxed
  automatically.
- No workout template matches the training profile exactly → fall back to
  the closest available template.
- Profile/goal changes mid-week → the current week's plan is not modified
  retroactively (the user may have already shopped); changes apply starting
  with the next generation.
- Portion multiplier would go outside 0.5×–2× → clamp it, accepting a larger
  calorie-target deviation instead of an unrealistic portion.
- Offline → last generated plan remains viewable from local cache;
  generating or modifying a plan requires connectivity.

## Testing Strategy

- **Unit tests** on pure functions: BMR/TDEE/macro calculations (against known
  reference values), recipe selection/scaling algorithm (output within
  tolerance), workout template matching logic.
- **Integration tests** against Supabase: RLS policies enforce that a user
  cannot read another user's data.
- **Manual E2E tests** on the core flow: onboarding → plan generation → swap
  a meal → grocery list → log weight → next week's regeneration.

## V1 Scope Summary

**In scope**: profile & goal onboarding, automatic TDEE/macro calculation,
weekly meal plan generation from an in-house curated recipe database, meal
swapping, auto-generated grocery list, weekly workout program from predefined
templates, weight logging with calorie-target recalculation for future weeks.

**Explicitly out of scope for V1**: AI-generated recipes, external nutrition
APIs, workout session logging (sets/reps/weight performed), automatic workout
progression based on logged performance. These are candidates for v2.
