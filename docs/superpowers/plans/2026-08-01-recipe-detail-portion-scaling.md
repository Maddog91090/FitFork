# Recipe Detail Portion Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the recipe detail screen show ingredient quantities and macros scaled to the meal plan's actual portion for that slot, instead of the recipe's base (unscaled) values.

**Architecture:** The plan screen (`plan.tsx`) is the only navigation entry point to the recipe detail screen and already holds each entry's `portionMultiplier`. It passes that value as a route query parameter. The recipe detail screen (`recipe/[id].tsx`) reads the parameter (defaulting to `1` if absent/invalid), and uses two new pure scaling functions in `src/lib/mealPlan.ts` to compute display values — no new network requests.

**Tech Stack:** React Native + Expo Router (`useLocalSearchParams`, `router.push`), TypeScript, Jest (`jest-expo` preset).

## Global Constraints

- `g`/`ml` ingredient quantities scale as `quantity * multiplier`, rounded to 1 decimal place (matches existing rounding in `grocery-list.tsx`).
- `piece` ingredient quantities scale as `Math.max(1, Math.round(quantity * multiplier))` — never display 0 pieces.
- Recipe macros (`baseCalories`, `baseProteinG`, `baseFatG`, `baseCarbsG`, `baseServingG`) scale as `Math.round(value * multiplier)`.
- A portion banner (`Portion : {round(multiplier * 100)} % de la recette de base`) shows only when the resolved multiplier is not exactly `1`.
- Missing or invalid `portion` route param falls back to multiplier `1` (base values, no banner) — preserves current behavior for any direct/deep link.

---

### Task 1: Add ingredient/macro scaling helpers to `mealPlan.ts`

**Files:**
- Modify: `src/lib/mealPlan.ts` (add near `clampPortionMultiplier`, around line 33-35)
- Test: `src/__tests__/mealPlan.test.ts` (append new `describe` blocks)

**Interfaces:**
- Consumes: nothing new — pure functions, no dependency on other tasks.
- Produces:
  - `export type ScalableIngredient = { quantity: number; unit: 'g' | 'ml' | 'piece' }`
  - `export function scaleIngredientQuantity(ingredient: ScalableIngredient, multiplier: number): number`
  - `export function scaleMacroValue(value: number, multiplier: number): number`
  - These are consumed by Task 2 in `recipe/[id].tsx`. `ScalableIngredient` is deliberately a minimal structural type (not imported from `mealPlanData.ts`) so `mealPlan.ts` gains no dependency on `mealPlanData.ts`; a `RecipeIngredient` value (which has `quantity`/`unit` plus extra fields) satisfies it structurally when passed as a variable.

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/mealPlan.test.ts` (add `scaleIngredientQuantity` and `scaleMacroValue` to the existing import from `'../lib/mealPlan'` at the top of the file, then add these `describe` blocks at the end of the file):

```ts
describe('scaleIngredientQuantity', () => {
  it('scales a gram quantity and rounds to 1 decimal', () => {
    const result = scaleIngredientQuantity({ quantity: 100, unit: 'g' }, 1.234);
    expect(result).toBe(123.4);
  });

  it('scales a ml quantity and rounds to 1 decimal', () => {
    const result = scaleIngredientQuantity({ quantity: 250, unit: 'ml' }, 0.5);
    expect(result).toBe(125);
  });

  it('is a no-op for multiplier 1 on g/ml units', () => {
    expect(scaleIngredientQuantity({ quantity: 150, unit: 'g' }, 1)).toBe(150);
  });

  it('rounds a piece quantity to the nearest whole piece', () => {
    expect(scaleIngredientQuantity({ quantity: 1, unit: 'piece' }, 1.5)).toBe(2);
  });

  it('never rounds a piece quantity down to 0', () => {
    expect(scaleIngredientQuantity({ quantity: 1, unit: 'piece' }, 0.2)).toBe(1);
  });

  it('is a no-op for multiplier 1 on piece units', () => {
    expect(scaleIngredientQuantity({ quantity: 3, unit: 'piece' }, 1)).toBe(3);
  });
});

describe('scaleMacroValue', () => {
  it('scales a macro value and rounds to the nearest integer', () => {
    expect(scaleMacroValue(33, 1.5)).toBe(50);
  });

  it('is a no-op for multiplier 1', () => {
    expect(scaleMacroValue(400, 1)).toBe(400);
  });
});
```

Update the top-of-file import to:

```ts
import {
  generateWeeklyPlan,
  pickReplacementRecipe,
  clampPortionMultiplier,
  scaleIngredientQuantity,
  scaleMacroValue,
  type RecipeOption,
  type MealSlot,
} from '../lib/mealPlan';
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest mealPlan.test.ts`
Expected: FAIL — `scaleIngredientQuantity` and `scaleMacroValue` are not exported from `'../lib/mealPlan'`.

- [ ] **Step 3: Implement the helpers**

In `src/lib/mealPlan.ts`, add directly after the existing `clampPortionMultiplier` function (after line 35):

```ts
export type ScalableIngredient = {
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
};

export function scaleIngredientQuantity(ingredient: ScalableIngredient, multiplier: number): number {
  const scaled = ingredient.quantity * multiplier;
  if (ingredient.unit === 'piece') {
    return Math.max(1, Math.round(scaled));
  }
  return Math.round(scaled * 10) / 10;
}

export function scaleMacroValue(value: number, multiplier: number): number {
  return Math.round(value * multiplier);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest mealPlan.test.ts`
Expected: PASS (all tests in the file, including the pre-existing ones).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mealPlan.ts src/__tests__/mealPlan.test.ts
git commit -m "Add ingredient/macro portion scaling helpers"
```

---

### Task 2: Wire the portion multiplier from the plan screen to the recipe detail screen

**Files:**
- Modify: `src/app/plan.tsx:108`
- Modify: `src/app/recipe/[id].tsx`

**Interfaces:**
- Consumes: `scaleIngredientQuantity(ingredient: ScalableIngredient, multiplier: number): number` and `scaleMacroValue(value: number, multiplier: number): number` from `../../lib/mealPlan` (Task 1). `RecipeIngredient` (has `quantity: number; unit: 'g' | 'ml' | 'piece'`) already satisfies `ScalableIngredient` structurally.
- Produces: nothing consumed by later tasks — this is the last task.

- [ ] **Step 1: Pass `portionMultiplier` as a route param from the plan screen**

In `src/app/plan.tsx`, change line 108 from:

```tsx
<Pressable style={styles.entryInfo} onPress={() => router.push(`/recipe/${entry.recipeId}`)}>
```

to:

```tsx
<Pressable
  style={styles.entryInfo}
  onPress={() => router.push(`/recipe/${entry.recipeId}?portion=${entry.portionMultiplier}`)}
>
```

- [ ] **Step 2: Read and resolve the portion param in the recipe detail screen**

In `src/app/recipe/[id].tsx`, update the imports and param handling. Change:

```tsx
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  fetchRecipes,
  fetchRecipeIngredients,
  fetchRecipeInstructions,
  type Recipe,
  type RecipeIngredient,
} from '../../lib/mealPlanData';
```

to:

```tsx
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  fetchRecipes,
  fetchRecipeIngredients,
  fetchRecipeInstructions,
  type Recipe,
  type RecipeIngredient,
} from '../../lib/mealPlanData';
import { scaleIngredientQuantity, scaleMacroValue } from '../../lib/mealPlan';
```

Change the params line from:

```tsx
const { id } = useLocalSearchParams<{ id: string }>();
```

to:

```tsx
const { id, portion: portionParam } = useLocalSearchParams<{ id: string; portion?: string }>();
const parsedPortion = Number(portionParam);
const portionMultiplier = Number.isFinite(parsedPortion) && parsedPortion > 0 ? parsedPortion : 1;
```

- [ ] **Step 3: Render scaled macros, the portion banner, and scaled ingredients**

Replace the macros `<Text>` block:

```tsx
<Text style={styles.macros}>
  {recipe.baseCalories} kcal — {recipe.baseProteinG}g prot / {recipe.baseFatG}g lip / {recipe.baseCarbsG}g gluc ({recipe.baseServingG}g)
</Text>
```

with:

```tsx
<Text style={styles.macros}>
  {scaleMacroValue(recipe.baseCalories, portionMultiplier)} kcal — {scaleMacroValue(recipe.baseProteinG, portionMultiplier)}g prot / {scaleMacroValue(recipe.baseFatG, portionMultiplier)}g lip / {scaleMacroValue(recipe.baseCarbsG, portionMultiplier)}g gluc ({scaleMacroValue(recipe.baseServingG, portionMultiplier)}g)
</Text>
{portionMultiplier !== 1 && (
  <Text style={styles.portionBanner}>
    Portion : {Math.round(portionMultiplier * 100)} % de la recette de base
  </Text>
)}
```

Replace the ingredients list:

```tsx
{ingredients.map((ing, index) => (
  <Text key={index} style={styles.ingredientLine}>
    {ing.ingredientName} — {ing.quantity}{ing.unit}
  </Text>
))}
```

with:

```tsx
{ingredients.map((ing, index) => (
  <Text key={index} style={styles.ingredientLine}>
    {ing.ingredientName} — {scaleIngredientQuantity(ing, portionMultiplier)}{ing.unit}
  </Text>
))}
```

Add a `portionBanner` style to the `StyleSheet.create` block at the bottom of the file, alongside the existing `macros` style:

```ts
portionBanner: { color: '#208AEF', fontWeight: '600', marginBottom: 16 },
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the full test suite**

Run: `npx jest`
Expected: PASS — no existing test references the changed `<Text>` content in `plan.tsx` or `recipe/[id].tsx`, so nothing else should break.

- [ ] **Step 6: Manually verify in the app**

Run: `npx expo start --web`, sign in, open the current meal plan, and tap a meal whose displayed portion (the `%` shown next to the recipe name on the plan screen, e.g. "Poulet basquaise (150%)") is not 100%. Confirm:
- The banner reads `Portion : 150 % de la recette de base` (matching the plan screen's percentage).
- Displayed kcal/macros equal the base values × 1.5 (rounded).
- Each ingredient quantity equals its base quantity × 1.5 (rounded to 1 decimal for g/ml, rounded to a whole number ≥ 1 for piece units).

Then tap a meal at exactly 100% portion and confirm no banner is shown and values match the base recipe.

- [ ] **Step 7: Commit**

```bash
git add src/app/plan.tsx src/app/recipe/[id].tsx
git commit -m "Scale recipe detail ingredients and macros to the plan's portion"
```
