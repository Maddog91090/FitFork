# Recipe Detail Portion Scaling — Design

## Context

The meal plan generator already computes a `portionMultiplier` per meal
slot to hit the day's calorie target (`generateWeeklyPlan` +
`nudgeDaysToTarget` in `src/lib/mealPlan.ts`), and the grocery list already
scales ingredient quantities by that multiplier (`grocery-list.tsx`).

The recipe detail screen (`src/app/recipe/[id].tsx`) — reached by tapping a
meal on the plan screen — is the one place that does not: it always shows
the recipe's base ingredient quantities and base macros, regardless of the
portion the plan actually assigned to that meal slot. A user cooking from
this screen sees quantities that don't match what the plan intended.

## Goal

When opened from the plan screen, the recipe detail screen shows
ingredient quantities and macros scaled to the meal slot's actual portion,
not the recipe's base values.

## Data flow

`plan.tsx` is the only place that navigates to `/recipe/[id]`
(`plan.tsx:108`), and it already holds `entry.portionMultiplier` for every
entry. That value is passed as a route query parameter:

```
router.push(`/recipe/${entry.recipeId}?portion=${entry.portionMultiplier}`)
```

`recipe/[id].tsx` reads it via
`useLocalSearchParams<{ id: string; portion?: string }>()`, parses it to a
number, and falls back to `1` if the param is missing or fails to parse as
a positive finite number (e.g. a direct/deep link to the recipe screen
without a plan context). No new network request is introduced — base
recipe and ingredient data are still fetched exactly as today; only the
display layer applies the multiplier.

## Scaling logic

A new pure function `scaleIngredient(ingredient: RecipeIngredient, multiplier: number)`
lives in `src/lib/mealPlan.ts` next to `clampPortionMultiplier`, so it's
unit-testable without any UI dependency:

- `g` / `ml` units: `quantity * multiplier`, rounded to 1 decimal place
  (matches the rounding already used in `grocery-list.tsx`).
- `piece` units: `Math.max(1, Math.round(quantity * multiplier))` — never
  displays 0 pieces. This mirrors the existing 0.5×–2× portion clamp
  philosophy: accept a larger deviation from the exact calorie target
  rather than show a nonsensical value (0 eggs, 1.5 eggs).

Recipe macros (`baseCalories`, `baseProteinG`, `baseFatG`, `baseCarbsG`,
`baseServingG`) are scaled with the same `× multiplier` rule as `g`/`ml`
ingredients, rounded to the nearest integer for display.

## UI changes (`src/app/recipe/[id].tsx`)

- When the resolved portion multiplier is not exactly `1`, show a banner
  under the title: `Portion : {round(multiplier * 100)} % de la recette de base`.
- The macros line and ingredient list render the scaled values (not the
  base values) whenever a portion multiplier is present at all — including
  when it's `1`, in which case scaled equals base and no banner is shown.
- Preparation instructions are unchanged — steps don't depend on quantity.

## Edge cases

- Direct/deep link to the recipe screen without a `portion` param → treated
  as portion `1`: base values shown, no banner. Matches current behavior.
- Invalid `portion` param (non-numeric, ≤ 0) → same fallback to `1`.

## Testing

- Unit tests for `scaleIngredient`:
  - `g`/`ml` scaling with rounding to 1 decimal.
  - `piece` scaling with rounding and the floor-of-1 rule (including a
    multiplier low enough that naive rounding would hit 0).
  - `multiplier = 1` is a no-op (returns the original quantity).
- No new Supabase/integration tests needed — no query changes.

## Out of scope

- Any other screen (grocery list and generation logic already handle
  scaling correctly).
- Changing the underlying generation/nudging algorithm.
