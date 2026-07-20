# Recipe Preparation Instructions — Design

## Scope

This spec covers adding a preparation text (a single free-text block, not a numbered step list) to every recipe in the catalog (54 rows). It does not touch the meal-selection algorithm (`src/lib/mealPlan.ts`, `mealPlanData.ts`'s `generateWeeklyPlan`/`pickReplacementRecipe`) — the user chose to scope this project to "no preparation instructions" specifically, not "not enough variety/logic in recipe selection."

**Goal:** A user viewing their meal plan can tap any meal entry to see how to prepare it, without leaving the screen or waiting on a network request.

**Out of scope:** step-by-step numbered instructions (unlike the exercise-instructions feature, recipes get one continuous paragraph — the user's explicit choice), video/images, editing preparation text from the app (content is authored once via migration).

## A Discovered UX Conflict

`src/app/plan.tsx` currently makes the *entire* meal-entry row pressable, and that tap triggers `handleSwap` (swaps the recipe for another of the same meal type). Reusing the same tap for "expand preparation" would silently break the existing swap feature. Resolution (confirmed with the user): the row's tap now expands/collapses the preparation text instead, and swapping gets its own explicit "Échanger" button/element next to the row.

## Data Model

A single column on the existing `recipes` table (no new child table needed — this is one block of text, not an ordered list, unlike `exercise_instructions`):

```sql
alter table public.recipes add column preparation text;
-- backfilled for all 54 existing recipes
alter table public.recipes alter column preparation set not null;
```

## Data Flow

`fetchRecipes()` in `src/lib/mealPlanData.ts` selects the new column. The `Recipe` type gains:

```ts
export type Recipe = {
  id: string;
  name: string;
  mealType: MealType;
  baseCalories: number;
  baseProteinG: number;
  baseFatG: number;
  baseCarbsG: number;
  baseServingG: number;
  preparation: string;
};
```

No change to `generateWeeklyPlan`, `pickReplacementRecipe`, or `saveWeeklyPlan`/`getCurrentPlan` — `preparation` is a display-only field read directly off the already-fetched `recipes` list in `plan.tsx` (the screen already fetches all recipes via `fetchRecipes()` and looks them up by id via `recipeById`).

## UI

In `src/app/plan.tsx`:
- The meal-entry row's `onPress` changes from `handleSwap` to a local expand/collapse toggle (a `Set<string>` of expanded entry ids — `entry.id` is already a stable unique UUID per entry, so no composite key is needed here unlike the workout screen's `dayNumber-index`).
- When expanded, the recipe's `preparation` text renders as a paragraph beneath the row.
- A separate, explicit "Échanger" pressable element (kept small, e.g. inline next to the meal name) triggers the existing `handleSwap` logic — unchanged behavior, just moved to its own tap target.

## Testing

- `mealPlanData.test.ts`: the existing `fetchRecipes` test is extended to assert `preparation` is selected and mapped onto the `Recipe` shape.
- No dedicated test for `plan.tsx`'s expand/collapse or the relocated swap button — consistent with every other screen in this project (verified manually instead).
