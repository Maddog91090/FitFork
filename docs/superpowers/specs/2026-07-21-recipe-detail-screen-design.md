# Recipe Detail Screen — Design

## Scope

This spec supersedes part of the just-merged `recipe-preparation-instructions` work: instead of a single free-text preparation paragraph shown inline via tap-to-expand on the meal plan screen, recipes get a dedicated detail screen showing macros, ingredients, and preparation as numbered steps — closer to a real recipe card.

**Goal:** Tapping a meal entry on the plan screen navigates to a recipe detail screen showing everything needed to cook it: name, macros, portion size, ingredient list with quantities, and step-by-step preparation.

**Out of scope:** photos/images, user-editable content, recipe search/browse outside the meal plan flow.

## Data Model Changes

`recipes.preparation` (the single-paragraph column added by the previous branch) is replaced by a new table, mirroring `exercise_instructions`'s exact shape:

```sql
alter table public.recipes drop column preparation;

create table public.recipe_instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  step_number integer not null check (step_number >= 1),
  text text not null
);

alter table public.recipe_instructions enable row level security;

create policy "Anyone can read recipe instructions"
  on public.recipe_instructions for select
  using (true);
```

All 54 recipes' preparation text is rewritten as 2-4 numbered steps (the single paragraphs from the previous branch, split at their natural sentence boundaries — same underlying technique knowledge, just structured).

## Data Flow

New function in `src/lib/mealPlanData.ts`:

```ts
export async function fetchRecipeInstructions(recipeId: string): Promise<string[]>
```

Queries `recipe_instructions` filtered by `recipe_id`, ordered by `step_number`, returns the `text` values in order. The `Recipe` type drops `preparation: string` (removed along with the column) and `fetchRecipes`'s select/mapping drops that field.

## Architecture

New screen `src/app/recipe/[id].tsx`:
- Reads `id` from the route (`useLocalSearchParams()`).
- Fetches in parallel: `fetchRecipes()` (finds the matching recipe by id for name/macros/serving size — same 54-row fetch already used elsewhere, cheap), `fetchRecipeIngredients([id])` (already exists, returns quantities), and `fetchRecipeInstructions(id)` (new).
- Renders: recipe name as title, macros (calories/protein/fat/carbs) and base serving size, an ingredient list (name + quantity + unit), and the preparation steps as a numbered list.

In `src/app/plan.tsx`: the meal-entry row's tap target (`entryInfo`) changes from `toggleEntry` (local expand/collapse) to `router.push('/recipe/' + entry.recipeId)`. The `expanded` state, `toggleEntry`, and the inline preparation-text rendering are removed — fully superseded by navigation. The "Échanger" button and its behavior are untouched.

## Testing

- `mealPlanData.test.ts`: add a test for `fetchRecipeInstructions` (mocked Supabase, asserts ordering by `step_number`). Update the `fetchRecipes` test to drop `preparation` from the fixture/expectation (since the column and field no longer exist).
- No dedicated test for `plan.tsx` or the new `recipe/[id].tsx` screen — consistent with every other screen in this project, verified manually instead.
