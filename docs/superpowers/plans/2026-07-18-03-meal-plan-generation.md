# Meal Plan Generation (Plan 3 of 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user with a completed profile pick which meal slots to generate for the week, get a full weekly meal plan matched to their calorie/macro targets, view it, swap individual meals, and see an auto-generated grocery list.

**Architecture:** A pure, dependency-free generation algorithm (`src/lib/mealPlan.ts`) picks a recipe per selected slot from a seeded reference table and scales its portion to the slot's calorie share. A persistence layer (`src/lib/mealPlanData.ts`) saves/loads plans against two new Supabase tables (`weekly_meal_plans`, `meal_plan_entries`), plus read-only access to a shared `recipes`/`recipe_ingredients` reference schema (not user-owned, seeded once). Three new screens cover slot selection + generation, plan viewing + swapping, and the grocery list.

**Tech Stack:** Same as Plans 1-2 (Expo/React Native/TypeScript, Expo Router, Supabase JS client, Jest). No new dependencies.

## Global Constraints

- Backend is Supabase (Postgres + Auth + RLS) — no custom backend server.
- Meal-type calorie ratios: breakfast 25%, lunch 35%, dinner 30%, snack 10% (per spec's Meal Plan Generation section).
- Recipe repetition: avoid using the same recipe more than twice across the week for a given meal type pool; relax this automatically if the pool is too small (per spec).
- Portion scaling: `portionMultiplier = slotTargetCalories / recipe.baseCalories`, clamped to `[0.5, 2]` (per spec).
- Meal slot selection is made fresh at every generation — no saved recurring template (per spec, confirmed during brainstorming).
- Unselected slots get no entry at all: no recipe, no calories allocated, and their share of the day's calories is **not** redistributed to other slots (per spec, confirmed during brainstorming).
- Simplification versus the design spec's step 4 ("nudge the last meal of each day to close the weekly gap"): this plan does **not** implement that rebalancing pass. Each slot's own ±clamp already bounds the error, and the nudge step is a refinement, not core functionality — deferred past V1 to keep the algorithm's first version simple and fully deterministic/testable. Flag this to the human partner if it resurfaces as a real accuracy complaint.
- Grocery list: aggregate `recipe_ingredients × portionMultiplier` across the current week's `meal_plan_entries`, grouped by ingredient name, using each ingredient's single canonical unit (g, ml, or piece) — no unit-mixing (per spec).
- Recipe selection is deterministic (least-used-recipe-first, stable tie-break) — no randomness — so the algorithm is unit-testable without mocking a PRNG.
- Routes/lib live under `src/app/`, `src/lib/`, `src/__tests__/` (established in Plan 1). `src/lib/targets.ts` exports `computeTargetsFromProfile(profile, trainingProfile): MacroTargets` (Plan 2) — this plan's daily calorie target comes from `MacroTargets.calories / 7`... **no** — `MacroTargets.calories` from Plan 2 is already a **daily** target (Plan 2's `nutrition.ts` computes TDEE as a daily figure), so the weekly generation screen calls `computeTargetsFromProfile` once and uses its `calories` field directly as the per-day calorie target for every day of the week. Do not divide by 7.
- `getProfile`/`getTrainingProfile` (Plan 2, `src/lib/profile.ts`) return `Promise<Profile | null>` / `Promise<TrainingProfile | null>`; both must be non-null before generating (mirrors the existing `home.tsx` gate).

---

## File Structure

```
supabase/migrations/
  0002_recipes_and_meal_plans.sql   # recipes, recipe_ingredients (public read-only) + weekly_meal_plans, meal_plan_entries (RLS) + 15 seed recipes
  0003_expand_recipe_catalog.sql     # 39 more seed recipes (54 total: 14 breakfast, 14 lunch, 14 dinner, 12 snack)
src/lib/
  mealPlan.ts                        # Pure generation algorithm: generateWeeklyPlan(), pickReplacementRecipe()
  mealPlanData.ts                    # Supabase data access: fetchRecipes, saveWeeklyPlan, getCurrentPlan, updatePlanEntry
src/app/
  generate-plan.tsx                  # Day x meal-type slot-selection grid, triggers generation, saves, navigates to /plan
  plan.tsx                           # Displays the current week's plan; tap a meal to swap it
  grocery-list.tsx                   # Aggregated shopping list for the current week's plan
  home.tsx                           # MODIFIED: add navigation links to /generate-plan, /plan, /grocery-list
src/__tests__/
  mealPlan.test.ts                   # Unit tests for the generation algorithm (deterministic, no I/O)
```

---

### Task 1: Recipe and meal plan schema, with seed data

**Files:**
- Create: `supabase/migrations/0002_recipes_and_meal_plans.sql`

**Interfaces:**
- Produces: Postgres tables `recipes` (id, name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g — public read-only, no user ownership), `recipe_ingredients` (id, recipe_id, ingredient_name, quantity, unit — public read-only), `weekly_meal_plans` (id, user_id, created_at, target_calories, target_protein_g, target_fat_g, target_carbs_g — RLS-owned), `meal_plan_entries` (id, plan_id, day_index 0-6, meal_type, recipe_id, portion_multiplier — RLS-owned via `plan_id`'s parent). Seeded with 54 recipes total (14 breakfast, 14 lunch, 14 dinner, 12 snack) across two migration files — 15 in this one, 39 more added by this task's Step 5 — and their ingredients. Task 2's `mealPlan.ts` and Task 3's `mealPlanData.ts` read/write these exact column names.

- [ ] **Step 1: Write the migration and seed SQL**

Create `supabase/migrations/0002_recipes_and_meal_plans.sql`:

```sql
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  base_calories numeric not null check (base_calories > 0),
  base_protein_g numeric not null check (base_protein_g >= 0),
  base_fat_g numeric not null check (base_fat_g >= 0),
  base_carbs_g numeric not null check (base_carbs_g >= 0),
  base_serving_g numeric not null check (base_serving_g > 0)
);

alter table public.recipes enable row level security;

create policy "Anyone can read recipes"
  on public.recipes for select
  using (true);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_name text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g', 'ml', 'piece'))
);

alter table public.recipe_ingredients enable row level security;

create policy "Anyone can read recipe ingredients"
  on public.recipe_ingredients for select
  using (true);

create table if not exists public.weekly_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  target_calories numeric not null,
  target_protein_g numeric not null,
  target_fat_g numeric not null,
  target_carbs_g numeric not null
);

alter table public.weekly_meal_plans enable row level security;

create policy "Users can select own plans"
  on public.weekly_meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on public.weekly_meal_plans for insert
  with check (auth.uid() = user_id);

create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekly_meal_plans(id) on delete cascade,
  day_index integer not null check (day_index >= 0 and day_index <= 6),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid not null references public.recipes(id),
  portion_multiplier numeric not null check (portion_multiplier > 0)
);

alter table public.meal_plan_entries enable row level security;

create policy "Users can select own plan entries"
  on public.meal_plan_entries for select
  using (exists (
    select 1 from public.weekly_meal_plans wp
    where wp.id = meal_plan_entries.plan_id and wp.user_id = auth.uid()
  ));

create policy "Users can insert own plan entries"
  on public.meal_plan_entries for insert
  with check (exists (
    select 1 from public.weekly_meal_plans wp
    where wp.id = meal_plan_entries.plan_id and wp.user_id = auth.uid()
  ));

create policy "Users can update own plan entries"
  on public.meal_plan_entries for update
  using (exists (
    select 1 from public.weekly_meal_plans wp
    where wp.id = meal_plan_entries.plan_id and wp.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.weekly_meal_plans wp
    where wp.id = meal_plan_entries.plan_id and wp.user_id = auth.uid()
  ));

-- Seed data: 15 recipes (4 breakfast, 4 lunch, 4 dinner, 3 snack)
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Porridge avoine-banane', 'breakfast', 350, 12, 8, 58, 300),
  ('Œufs brouillés et pain complet', 'breakfast', 420, 24, 20, 32, 250),
  ('Yaourt grec, granola et fruits rouges', 'breakfast', 380, 20, 12, 48, 280),
  ('Pancakes protéinés', 'breakfast', 450, 28, 14, 52, 300),
  ('Poulet grillé, riz et brocolis', 'lunch', 650, 45, 15, 78, 450),
  ('Saumon, quinoa et légumes vapeur', 'lunch', 600, 38, 22, 58, 420),
  ('Wrap dinde-avocat', 'lunch', 550, 32, 20, 55, 350),
  ('Buddha bowl pois chiches', 'lunch', 580, 22, 18, 82, 400),
  ('Steak haché, patate douce et haricots verts', 'dinner', 620, 40, 20, 60, 420),
  ('Pâtes bolognaise (bœuf 5%)', 'dinner', 700, 35, 18, 92, 450),
  ('Cabillaud, riz basmati et courgettes', 'dinner', 520, 36, 10, 68, 400),
  ('Tofu sauté, nouilles et légumes', 'dinner', 560, 24, 16, 78, 400),
  ('Barre protéinée maison', 'snack', 220, 15, 8, 22, 60),
  ('Pomme et beurre de cacahuète', 'snack', 260, 8, 16, 24, 180),
  ('Fromage blanc et miel', 'snack', 180, 14, 4, 22, 200)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Flocons d''avoine', 80, 'g' from public.recipes where name = 'Porridge avoine-banane'
union all select id, 'Banane', 1, 'piece' from public.recipes where name = 'Porridge avoine-banane'
union all select id, 'Lait', 200, 'ml' from public.recipes where name = 'Porridge avoine-banane'
union all select id, 'Œufs', 3, 'piece' from public.recipes where name = 'Œufs brouillés et pain complet'
union all select id, 'Pain complet', 2, 'piece' from public.recipes where name = 'Œufs brouillés et pain complet'
union all select id, 'Yaourt grec', 200, 'g' from public.recipes where name = 'Yaourt grec, granola et fruits rouges'
union all select id, 'Granola', 50, 'g' from public.recipes where name = 'Yaourt grec, granola et fruits rouges'
union all select id, 'Fruits rouges', 100, 'g' from public.recipes where name = 'Yaourt grec, granola et fruits rouges'
union all select id, 'Farine', 100, 'g' from public.recipes where name = 'Pancakes protéinés'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Pancakes protéinés'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Pancakes protéinés'
union all select id, 'Blanc de poulet', 200, 'g' from public.recipes where name = 'Poulet grillé, riz et brocolis'
union all select id, 'Riz', 150, 'g' from public.recipes where name = 'Poulet grillé, riz et brocolis'
union all select id, 'Brocolis', 150, 'g' from public.recipes where name = 'Poulet grillé, riz et brocolis'
union all select id, 'Saumon', 180, 'g' from public.recipes where name = 'Saumon, quinoa et légumes vapeur'
union all select id, 'Quinoa', 120, 'g' from public.recipes where name = 'Saumon, quinoa et légumes vapeur'
union all select id, 'Légumes vapeur', 150, 'g' from public.recipes where name = 'Saumon, quinoa et légumes vapeur'
union all select id, 'Dinde tranchée', 150, 'g' from public.recipes where name = 'Wrap dinde-avocat'
union all select id, 'Avocat', 1, 'piece' from public.recipes where name = 'Wrap dinde-avocat'
union all select id, 'Tortilla', 1, 'piece' from public.recipes where name = 'Wrap dinde-avocat'
union all select id, 'Pois chiches', 200, 'g' from public.recipes where name = 'Buddha bowl pois chiches'
union all select id, 'Épinards', 100, 'g' from public.recipes where name = 'Buddha bowl pois chiches'
union all select id, 'Riz', 100, 'g' from public.recipes where name = 'Buddha bowl pois chiches'
union all select id, 'Bœuf haché 5%', 200, 'g' from public.recipes where name = 'Steak haché, patate douce et haricots verts'
union all select id, 'Patate douce', 200, 'g' from public.recipes where name = 'Steak haché, patate douce et haricots verts'
union all select id, 'Haricots verts', 150, 'g' from public.recipes where name = 'Steak haché, patate douce et haricots verts'
union all select id, 'Pâtes', 100, 'g' from public.recipes where name = 'Pâtes bolognaise (bœuf 5%)'
union all select id, 'Bœuf haché 5%', 150, 'g' from public.recipes where name = 'Pâtes bolognaise (bœuf 5%)'
union all select id, 'Sauce tomate', 150, 'g' from public.recipes where name = 'Pâtes bolognaise (bœuf 5%)'
union all select id, 'Cabillaud', 180, 'g' from public.recipes where name = 'Cabillaud, riz basmati et courgettes'
union all select id, 'Riz basmati', 120, 'g' from public.recipes where name = 'Cabillaud, riz basmati et courgettes'
union all select id, 'Courgettes', 150, 'g' from public.recipes where name = 'Cabillaud, riz basmati et courgettes'
union all select id, 'Tofu', 180, 'g' from public.recipes where name = 'Tofu sauté, nouilles et légumes'
union all select id, 'Nouilles', 120, 'g' from public.recipes where name = 'Tofu sauté, nouilles et légumes'
union all select id, 'Légumes sautés', 150, 'g' from public.recipes where name = 'Tofu sauté, nouilles et légumes'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Barre protéinée maison'
union all select id, 'Flocons d''avoine', 30, 'g' from public.recipes where name = 'Barre protéinée maison'
union all select id, 'Pomme', 1, 'piece' from public.recipes where name = 'Pomme et beurre de cacahuète'
union all select id, 'Beurre de cacahuète', 30, 'g' from public.recipes where name = 'Pomme et beurre de cacahuète'
union all select id, 'Fromage blanc', 200, 'g' from public.recipes where name = 'Fromage blanc et miel'
union all select id, 'Miel', 15, 'g' from public.recipes where name = 'Fromage blanc et miel'
;
```

- [ ] **Step 2: Apply the migration (manual — needs Supabase dashboard access)**

Same process as Plan 2's Task 1: open the Supabase SQL Editor for this project, paste the full contents of `supabase/migrations/0002_recipes_and_meal_plans.sql`, run it, and confirm no errors plus that `recipes`, `recipe_ingredients`, `weekly_meal_plans`, and `meal_plan_entries` all appear under **Table Editor**, and that `recipes` has 15 rows.

- [ ] **Step 3: Verify via the REST API**

```bash
curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/recipes?select=id,name,meal_type" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" | head -c 300
```

Expected: a JSON array of 15 recipe objects (readable with the anon key, since `recipes` is public-read). Then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/weekly_meal_plans?select=*" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: `200` (empty array — RLS-protected, no rows visible to an unauthenticated anon request, but the table exists and is exposed).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_recipes_and_meal_plans.sql
git commit -m "Add recipes, recipe_ingredients, weekly_meal_plans, meal_plan_entries schema with seed data"
```

- [ ] **Step 5: Expand the recipe catalog past fifty recipes**

15 recipes is a thin pool for the anti-repetition rule (spec: avoid repeating a recipe more than twice a week). Add 39 more (14 breakfast, 14 lunch, 14 dinner, 12 snack — 54 total) as a second, separate migration file, so the already-applied `0002` migration is never re-run (its `insert` statements have no dedup key and would create duplicates if replayed).

Create `supabase/migrations/0003_expand_recipe_catalog.sql`:

```sql
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Muesli maison et lait d''amande', 'breakfast', 380, 14, 10, 55, 280),
  ('Omelette au fromage et jambon', 'breakfast', 430, 28, 30, 8, 220),
  ('Smoothie bowl banane-myrtille', 'breakfast', 340, 15, 6, 58, 350),
  ('Toast à l''avocat et œuf poché', 'breakfast', 400, 18, 22, 34, 250),
  ('Crêpes à la farine complète et miel', 'breakfast', 420, 14, 12, 62, 280),
  ('Bagel au saumon fumé et fromage frais', 'breakfast', 450, 26, 20, 40, 240),
  ('Porridge protéiné chocolat-noisette', 'breakfast', 400, 25, 12, 48, 300),
  ('Gaufres maison et fruits', 'breakfast', 410, 12, 14, 60, 280),
  ('Skyr et flocons d''avoine', 'breakfast', 360, 26, 6, 48, 280),
  ('Sandwich œufs-bacon', 'breakfast', 440, 24, 24, 32, 230),
  ('Salade César au poulet', 'lunch', 580, 40, 26, 42, 400),
  ('Riz sauté au tofu et légumes', 'lunch', 560, 22, 18, 76, 420),
  ('Poke bowl saumon-avocat', 'lunch', 610, 34, 24, 62, 420),
  ('Sandwich club poulet-bacon', 'lunch', 600, 38, 24, 55, 350),
  ('Pâtes au thon et tomates', 'lunch', 590, 32, 14, 82, 420),
  ('Curry de poulet et riz basmati', 'lunch', 640, 38, 22, 70, 430),
  ('Salade de lentilles et feta', 'lunch', 540, 24, 20, 62, 380),
  ('Burrito bœuf-haricots rouges', 'lunch', 620, 34, 22, 68, 400),
  ('Bol de quinoa aux crevettes', 'lunch', 550, 30, 16, 68, 400),
  ('Sandwich thon-crudités', 'lunch', 520, 30, 16, 60, 320),
  ('Poulet rôti et pommes de terre', 'dinner', 600, 42, 18, 62, 430),
  ('Chili con carne et riz', 'dinner', 650, 36, 20, 78, 420),
  ('Gratin de saumon et brocolis', 'dinner', 580, 38, 26, 42, 400),
  ('Escalope de dinde et purée', 'dinner', 560, 40, 14, 62, 400),
  ('Risotto aux champignons et parmesan', 'dinner', 600, 20, 20, 82, 400),
  ('Curry de crevettes et riz', 'dinner', 580, 32, 18, 70, 420),
  ('Poêlée de bœuf et légumes asiatiques', 'dinner', 590, 38, 20, 60, 400),
  ('Lasagnes à la viande', 'dinner', 680, 36, 26, 70, 450),
  ('Filet de poisson blanc et légumes rôtis', 'dinner', 500, 36, 12, 58, 400),
  ('Chili végétarien et riz complet', 'dinner', 560, 22, 14, 82, 420),
  ('Amandes et fruits secs', 'snack', 240, 8, 18, 14, 50),
  ('Smoothie protéiné banane', 'snack', 250, 22, 4, 32, 300),
  ('Houmous et bâtonnets de légumes', 'snack', 200, 8, 10, 20, 200),
  ('Yaourt et granola', 'snack', 230, 12, 6, 32, 220),
  ('Barre de céréales maison', 'snack', 190, 6, 8, 24, 50),
  ('Fromage cottage et fruits rouges', 'snack', 180, 18, 4, 16, 200),
  ('Toast au beurre de cacahuète et banane', 'snack', 260, 10, 14, 26, 150),
  ('Œuf dur et fruit', 'snack', 170, 12, 10, 10, 150),
  ('Shake protéiné chocolat', 'snack', 220, 24, 4, 20, 300)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Muesli', 80, 'g' from public.recipes where name = 'Muesli maison et lait d''amande'
union all select id, 'Lait d''amande', 200, 'ml' from public.recipes where name = 'Muesli maison et lait d''amande'
union all select id, 'Œufs', 3, 'piece' from public.recipes where name = 'Omelette au fromage et jambon'
union all select id, 'Jambon', 60, 'g' from public.recipes where name = 'Omelette au fromage et jambon'
union all select id, 'Fromage râpé', 30, 'g' from public.recipes where name = 'Omelette au fromage et jambon'
union all select id, 'Banane', 1, 'piece' from public.recipes where name = 'Smoothie bowl banane-myrtille'
union all select id, 'Myrtilles', 100, 'g' from public.recipes where name = 'Smoothie bowl banane-myrtille'
union all select id, 'Yaourt grec', 150, 'g' from public.recipes where name = 'Smoothie bowl banane-myrtille'
union all select id, 'Pain complet', 2, 'piece' from public.recipes where name = 'Toast à l''avocat et œuf poché'
union all select id, 'Avocat', 1, 'piece' from public.recipes where name = 'Toast à l''avocat et œuf poché'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Toast à l''avocat et œuf poché'
union all select id, 'Farine complète', 100, 'g' from public.recipes where name = 'Crêpes à la farine complète et miel'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Crêpes à la farine complète et miel'
union all select id, 'Miel', 20, 'g' from public.recipes where name = 'Crêpes à la farine complète et miel'
union all select id, 'Bagel', 1, 'piece' from public.recipes where name = 'Bagel au saumon fumé et fromage frais'
union all select id, 'Saumon fumé', 80, 'g' from public.recipes where name = 'Bagel au saumon fumé et fromage frais'
union all select id, 'Fromage frais', 40, 'g' from public.recipes where name = 'Bagel au saumon fumé et fromage frais'
union all select id, 'Flocons d''avoine', 70, 'g' from public.recipes where name = 'Porridge protéiné chocolat-noisette'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Porridge protéiné chocolat-noisette'
union all select id, 'Lait', 200, 'ml' from public.recipes where name = 'Porridge protéiné chocolat-noisette'
union all select id, 'Farine', 100, 'g' from public.recipes where name = 'Gaufres maison et fruits'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Gaufres maison et fruits'
union all select id, 'Fruits rouges', 80, 'g' from public.recipes where name = 'Gaufres maison et fruits'
union all select id, 'Skyr', 200, 'g' from public.recipes where name = 'Skyr et flocons d''avoine'
union all select id, 'Flocons d''avoine', 50, 'g' from public.recipes where name = 'Skyr et flocons d''avoine'
union all select id, 'Miel', 15, 'g' from public.recipes where name = 'Skyr et flocons d''avoine'
union all select id, 'Pain complet', 2, 'piece' from public.recipes where name = 'Sandwich œufs-bacon'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Sandwich œufs-bacon'
union all select id, 'Bacon', 40, 'g' from public.recipes where name = 'Sandwich œufs-bacon'
union all select id, 'Blanc de poulet', 180, 'g' from public.recipes where name = 'Salade César au poulet'
union all select id, 'Salade romaine', 100, 'g' from public.recipes where name = 'Salade César au poulet'
union all select id, 'Parmesan', 30, 'g' from public.recipes where name = 'Salade César au poulet'
union all select id, 'Tofu', 180, 'g' from public.recipes where name = 'Riz sauté au tofu et légumes'
union all select id, 'Riz', 150, 'g' from public.recipes where name = 'Riz sauté au tofu et légumes'
union all select id, 'Légumes sautés', 150, 'g' from public.recipes where name = 'Riz sauté au tofu et légumes'
union all select id, 'Saumon', 150, 'g' from public.recipes where name = 'Poke bowl saumon-avocat'
union all select id, 'Avocat', 1, 'piece' from public.recipes where name = 'Poke bowl saumon-avocat'
union all select id, 'Riz', 150, 'g' from public.recipes where name = 'Poke bowl saumon-avocat'
union all select id, 'Pain complet', 3, 'piece' from public.recipes where name = 'Sandwich club poulet-bacon'
union all select id, 'Blanc de poulet', 120, 'g' from public.recipes where name = 'Sandwich club poulet-bacon'
union all select id, 'Bacon', 30, 'g' from public.recipes where name = 'Sandwich club poulet-bacon'
union all select id, 'Pâtes', 100, 'g' from public.recipes where name = 'Pâtes au thon et tomates'
union all select id, 'Thon', 150, 'g' from public.recipes where name = 'Pâtes au thon et tomates'
union all select id, 'Sauce tomate', 150, 'g' from public.recipes where name = 'Pâtes au thon et tomates'
union all select id, 'Blanc de poulet', 180, 'g' from public.recipes where name = 'Curry de poulet et riz basmati'
union all select id, 'Riz basmati', 150, 'g' from public.recipes where name = 'Curry de poulet et riz basmati'
union all select id, 'Lait de coco', 100, 'ml' from public.recipes where name = 'Curry de poulet et riz basmati'
union all select id, 'Lentilles', 180, 'g' from public.recipes where name = 'Salade de lentilles et feta'
union all select id, 'Feta', 50, 'g' from public.recipes where name = 'Salade de lentilles et feta'
union all select id, 'Légumes', 100, 'g' from public.recipes where name = 'Salade de lentilles et feta'
union all select id, 'Bœuf haché 5%', 150, 'g' from public.recipes where name = 'Burrito bœuf-haricots rouges'
union all select id, 'Haricots rouges', 100, 'g' from public.recipes where name = 'Burrito bœuf-haricots rouges'
union all select id, 'Tortilla', 1, 'piece' from public.recipes where name = 'Burrito bœuf-haricots rouges'
union all select id, 'Crevettes', 150, 'g' from public.recipes where name = 'Bol de quinoa aux crevettes'
union all select id, 'Quinoa', 120, 'g' from public.recipes where name = 'Bol de quinoa aux crevettes'
union all select id, 'Légumes vapeur', 120, 'g' from public.recipes where name = 'Bol de quinoa aux crevettes'
union all select id, 'Pain complet', 2, 'piece' from public.recipes where name = 'Sandwich thon-crudités'
union all select id, 'Thon', 120, 'g' from public.recipes where name = 'Sandwich thon-crudités'
union all select id, 'Crudités', 80, 'g' from public.recipes where name = 'Sandwich thon-crudités'
union all select id, 'Cuisse de poulet', 200, 'g' from public.recipes where name = 'Poulet rôti et pommes de terre'
union all select id, 'Pommes de terre', 250, 'g' from public.recipes where name = 'Poulet rôti et pommes de terre'
union all select id, 'Haricots verts', 100, 'g' from public.recipes where name = 'Poulet rôti et pommes de terre'
union all select id, 'Bœuf haché 5%', 180, 'g' from public.recipes where name = 'Chili con carne et riz'
union all select id, 'Haricots rouges', 150, 'g' from public.recipes where name = 'Chili con carne et riz'
union all select id, 'Riz', 100, 'g' from public.recipes where name = 'Chili con carne et riz'
union all select id, 'Saumon', 180, 'g' from public.recipes where name = 'Gratin de saumon et brocolis'
union all select id, 'Brocolis', 150, 'g' from public.recipes where name = 'Gratin de saumon et brocolis'
union all select id, 'Crème légère', 60, 'g' from public.recipes where name = 'Gratin de saumon et brocolis'
union all select id, 'Escalope de dinde', 180, 'g' from public.recipes where name = 'Escalope de dinde et purée'
union all select id, 'Pommes de terre', 250, 'g' from public.recipes where name = 'Escalope de dinde et purée'
union all select id, 'Beurre', 15, 'g' from public.recipes where name = 'Escalope de dinde et purée'
union all select id, 'Riz arborio', 120, 'g' from public.recipes where name = 'Risotto aux champignons et parmesan'
union all select id, 'Champignons', 150, 'g' from public.recipes where name = 'Risotto aux champignons et parmesan'
union all select id, 'Parmesan', 40, 'g' from public.recipes where name = 'Risotto aux champignons et parmesan'
union all select id, 'Crevettes', 180, 'g' from public.recipes where name = 'Curry de crevettes et riz'
union all select id, 'Riz', 150, 'g' from public.recipes where name = 'Curry de crevettes et riz'
union all select id, 'Lait de coco', 100, 'ml' from public.recipes where name = 'Curry de crevettes et riz'
union all select id, 'Bœuf émincé', 180, 'g' from public.recipes where name = 'Poêlée de bœuf et légumes asiatiques'
union all select id, 'Légumes sautés', 150, 'g' from public.recipes where name = 'Poêlée de bœuf et légumes asiatiques'
union all select id, 'Sauce soja', 20, 'ml' from public.recipes where name = 'Poêlée de bœuf et légumes asiatiques'
union all select id, 'Bœuf haché 5%', 180, 'g' from public.recipes where name = 'Lasagnes à la viande'
union all select id, 'Pâtes à lasagne', 100, 'g' from public.recipes where name = 'Lasagnes à la viande'
union all select id, 'Sauce tomate', 150, 'g' from public.recipes where name = 'Lasagnes à la viande'
union all select id, 'Filet de poisson blanc', 180, 'g' from public.recipes where name = 'Filet de poisson blanc et légumes rôtis'
union all select id, 'Légumes rôtis', 200, 'g' from public.recipes where name = 'Filet de poisson blanc et légumes rôtis'
union all select id, 'Huile d''olive', 10, 'ml' from public.recipes where name = 'Filet de poisson blanc et légumes rôtis'
union all select id, 'Haricots rouges', 200, 'g' from public.recipes where name = 'Chili végétarien et riz complet'
union all select id, 'Riz complet', 120, 'g' from public.recipes where name = 'Chili végétarien et riz complet'
union all select id, 'Sauce tomate', 100, 'g' from public.recipes where name = 'Chili végétarien et riz complet'
union all select id, 'Amandes', 30, 'g' from public.recipes where name = 'Amandes et fruits secs'
union all select id, 'Fruits secs', 20, 'g' from public.recipes where name = 'Amandes et fruits secs'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Smoothie protéiné banane'
union all select id, 'Banane', 1, 'piece' from public.recipes where name = 'Smoothie protéiné banane'
union all select id, 'Lait', 200, 'ml' from public.recipes where name = 'Smoothie protéiné banane'
union all select id, 'Houmous', 80, 'g' from public.recipes where name = 'Houmous et bâtonnets de légumes'
union all select id, 'Carottes', 100, 'g' from public.recipes where name = 'Houmous et bâtonnets de légumes'
union all select id, 'Concombre', 100, 'g' from public.recipes where name = 'Houmous et bâtonnets de légumes'
union all select id, 'Yaourt grec', 150, 'g' from public.recipes where name = 'Yaourt et granola'
union all select id, 'Granola', 40, 'g' from public.recipes where name = 'Yaourt et granola'
union all select id, 'Flocons d''avoine', 30, 'g' from public.recipes where name = 'Barre de céréales maison'
union all select id, 'Miel', 15, 'g' from public.recipes where name = 'Barre de céréales maison'
union all select id, 'Fruits secs', 15, 'g' from public.recipes where name = 'Barre de céréales maison'
union all select id, 'Fromage cottage', 150, 'g' from public.recipes where name = 'Fromage cottage et fruits rouges'
union all select id, 'Fruits rouges', 60, 'g' from public.recipes where name = 'Fromage cottage et fruits rouges'
union all select id, 'Pain complet', 1, 'piece' from public.recipes where name = 'Toast au beurre de cacahuète et banane'
union all select id, 'Beurre de cacahuète', 20, 'g' from public.recipes where name = 'Toast au beurre de cacahuète et banane'
union all select id, 'Banane', 1, 'piece' from public.recipes where name = 'Toast au beurre de cacahuète et banane'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Œuf dur et fruit'
union all select id, 'Pomme', 1, 'piece' from public.recipes where name = 'Œuf dur et fruit'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Shake protéiné chocolat'
union all select id, 'Lait', 250, 'ml' from public.recipes where name = 'Shake protéiné chocolat'
;
```

Apply this migration the same way as before (manual, via the Supabase SQL Editor — needs the human partner). Then re-run the Step 3 verification, now expecting **54** recipes instead of 15, and commit this file too:

```bash
git add supabase/migrations/0003_expand_recipe_catalog.sql
git commit -m "Expand recipe catalog to 54 recipes for better variety and repetition avoidance"
```

---

### Task 2: Meal generation algorithm (TDD)

**Files:**
- Create: `src/lib/mealPlan.ts`
- Test: `src/__tests__/mealPlan.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no I/O).
- Produces:
  ```ts
  export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

  export type RecipeOption = {
    id: string;
    mealType: MealType;
    baseCalories: number;
  };

  export type MealSlot = {
    dayIndex: number; // 0-6
    mealType: MealType;
  };

  export type GeneratedEntry = {
    dayIndex: number;
    mealType: MealType;
    recipeId: string;
    portionMultiplier: number;
  };

  export function generateWeeklyPlan(
    dailyTargetCalories: number,
    selectedSlots: MealSlot[],
    recipes: RecipeOption[]
  ): GeneratedEntry[];

  export function pickReplacementRecipe(
    mealType: MealType,
    excludeRecipeId: string,
    recipes: RecipeOption[]
  ): RecipeOption | null;

  export const MEAL_TYPE_RATIOS: Record<MealType, number>;
  export function clampPortionMultiplier(raw: number): number;
  ```
  Task 3's `mealPlanData.ts` calls `generateWeeklyPlan` to build the rows it saves, and calls `pickReplacementRecipe` for the swap feature. Task 5's `plan.tsx` reuses `MEAL_TYPE_RATIOS` and `clampPortionMultiplier` to recompute a portion when swapping a meal (same math `generateWeeklyPlan` uses internally, exposed so it isn't duplicated).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/mealPlan.test.ts`:

```ts
import {
  generateWeeklyPlan,
  pickReplacementRecipe,
  clampPortionMultiplier,
  type RecipeOption,
  type MealSlot,
} from '../lib/mealPlan';

const RECIPES: RecipeOption[] = [
  { id: 'b1', mealType: 'breakfast', baseCalories: 400 },
  { id: 'b2', mealType: 'breakfast', baseCalories: 400 },
  { id: 'l1', mealType: 'lunch', baseCalories: 600 },
  { id: 'l2', mealType: 'lunch', baseCalories: 600 },
  { id: 'd1', mealType: 'dinner', baseCalories: 600 },
  { id: 's1', mealType: 'snack', baseCalories: 200 },
];

describe('generateWeeklyPlan', () => {
  it('creates one entry per selected slot', () => {
    const slots: MealSlot[] = [
      { dayIndex: 0, mealType: 'breakfast' },
      { dayIndex: 0, mealType: 'lunch' },
    ];
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ dayIndex: 0, mealType: 'breakfast' });
    expect(result[1]).toMatchObject({ dayIndex: 0, mealType: 'lunch' });
  });

  it('creates no entry for an unselected slot (no redistribution)', () => {
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'breakfast' }];
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    expect(result).toHaveLength(1);
    expect(result.find((e) => e.mealType === 'lunch')).toBeUndefined();
  });

  it('scales portionMultiplier to the slot calorie share (breakfast = 25%)', () => {
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'breakfast' }];
    // 2000 * 0.25 = 500 target; recipe baseCalories 400 -> multiplier 500/400 = 1.25
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    expect(result[0].portionMultiplier).toBeCloseTo(1.25, 5);
  });

  it('clamps portionMultiplier to a maximum of 2', () => {
    const tinyRecipe: RecipeOption[] = [{ id: 'b1', mealType: 'breakfast', baseCalories: 50 }];
    // target 500 / baseCalories 50 = 10, clamped to 2
    const result = generateWeeklyPlan(2000, [{ dayIndex: 0, mealType: 'breakfast' }], tinyRecipe);
    expect(result[0].portionMultiplier).toBe(2);
  });

  it('clamps portionMultiplier to a minimum of 0.5', () => {
    const hugeRecipe: RecipeOption[] = [{ id: 'b1', mealType: 'breakfast', baseCalories: 5000 }];
    // target 500 / baseCalories 5000 = 0.1, clamped to 0.5
    const result = generateWeeklyPlan(2000, [{ dayIndex: 0, mealType: 'breakfast' }], hugeRecipe);
    expect(result[0].portionMultiplier).toBe(0.5);
  });

  it('avoids repeating the same recipe more than twice when the pool allows it', () => {
    const slots: MealSlot[] = [0, 1, 2, 3].map((dayIndex) => ({ dayIndex, mealType: 'breakfast' as const }));
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    const counts = new Map<string, number>();
    for (const entry of result) counts.set(entry.recipeId, (counts.get(entry.recipeId) ?? 0) + 1);
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(2);
  });

  it('relaxes the repeat limit when the recipe pool is smaller than the slot count', () => {
    const oneRecipeOnly: RecipeOption[] = [{ id: 'b1', mealType: 'breakfast', baseCalories: 400 }];
    const slots: MealSlot[] = [0, 1, 2, 3].map((dayIndex) => ({ dayIndex, mealType: 'breakfast' as const }));
    const result = generateWeeklyPlan(2000, slots, oneRecipeOnly);
    expect(result).toHaveLength(4);
    expect(result.every((e) => e.recipeId === 'b1')).toBe(true);
  });

  it('skips a slot when no recipe exists for its meal type', () => {
    const noSnackRecipes = RECIPES.filter((r) => r.mealType !== 'snack');
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'snack' }];
    const result = generateWeeklyPlan(2000, slots, noSnackRecipes);
    expect(result).toHaveLength(0);
  });
});

describe('pickReplacementRecipe', () => {
  it('returns a different recipe of the same meal type', () => {
    const result = pickReplacementRecipe('breakfast', 'b1', RECIPES);
    expect(result).not.toBeNull();
    expect(result!.mealType).toBe('breakfast');
    expect(result!.id).not.toBe('b1');
  });

  it('returns null when no alternative exists', () => {
    const onlyOneBreakfast = RECIPES.filter((r) => r.id === 'b1');
    const result = pickReplacementRecipe('breakfast', 'b1', onlyOneBreakfast);
    expect(result).toBeNull();
  });
});

describe('clampPortionMultiplier', () => {
  it('leaves an in-range value unchanged', () => {
    expect(clampPortionMultiplier(1.25)).toBe(1.25);
  });

  it('clamps above 2 down to 2', () => {
    expect(clampPortionMultiplier(10)).toBe(2);
  });

  it('clamps below 0.5 up to 0.5', () => {
    expect(clampPortionMultiplier(0.1)).toBe(0.5);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/mealPlan.test.ts
```

Expected: FAIL — `Cannot find module '../lib/mealPlan'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the generation algorithm**

Create `src/lib/mealPlan.ts`:

```ts
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type RecipeOption = {
  id: string;
  mealType: MealType;
  baseCalories: number;
};

export type MealSlot = {
  dayIndex: number;
  mealType: MealType;
};

export type GeneratedEntry = {
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
  portionMultiplier: number;
};

export const MEAL_TYPE_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

const MIN_PORTION_MULTIPLIER = 0.5;
const MAX_PORTION_MULTIPLIER = 2;
const MAX_REPEATS_PER_WEEK = 2;

export function clampPortionMultiplier(raw: number): number {
  return Math.max(MIN_PORTION_MULTIPLIER, Math.min(MAX_PORTION_MULTIPLIER, raw));
}

function leastUsed(candidates: RecipeOption[], usageCount: Map<string, number>): RecipeOption {
  return candidates.reduce((best, candidate) =>
    (usageCount.get(candidate.id) ?? 0) < (usageCount.get(best.id) ?? 0) ? candidate : best
  );
}

export function generateWeeklyPlan(
  dailyTargetCalories: number,
  selectedSlots: MealSlot[],
  recipes: RecipeOption[]
): GeneratedEntry[] {
  const usageCount = new Map<string, number>();
  const entries: GeneratedEntry[] = [];

  for (const slot of selectedSlots) {
    const candidates = recipes.filter((r) => r.mealType === slot.mealType);
    if (candidates.length === 0) continue;

    const underLimit = candidates.filter((r) => (usageCount.get(r.id) ?? 0) < MAX_REPEATS_PER_WEEK);
    const pool = underLimit.length > 0 ? underLimit : candidates;
    const recipe = leastUsed(pool, usageCount);

    const slotTargetCalories = dailyTargetCalories * MEAL_TYPE_RATIOS[slot.mealType];
    const portionMultiplier = clampPortionMultiplier(slotTargetCalories / recipe.baseCalories);

    usageCount.set(recipe.id, (usageCount.get(recipe.id) ?? 0) + 1);
    entries.push({
      dayIndex: slot.dayIndex,
      mealType: slot.mealType,
      recipeId: recipe.id,
      portionMultiplier,
    });
  }

  return entries;
}

export function pickReplacementRecipe(
  mealType: MealType,
  excludeRecipeId: string,
  recipes: RecipeOption[]
): RecipeOption | null {
  const alternatives = recipes.filter((r) => r.mealType === mealType && r.id !== excludeRecipeId);
  if (alternatives.length === 0) return null;
  return alternatives[0];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/mealPlan.test.ts
```

Expected: `13 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mealPlan.ts src/__tests__/mealPlan.test.ts
git commit -m "Add meal plan generation algorithm"
```

---

### Task 3: Meal plan persistence layer (TDD, mocked Supabase client)

**Files:**
- Create: `src/lib/mealPlanData.ts`
- Test: `src/__tests__/mealPlanData.test.ts`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts` (Plan 1); `MealType`, `GeneratedEntry` from `src/lib/mealPlan.ts` (Task 2).
- Produces:
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
  };

  export type RecipeIngredient = {
    recipeId: string;
    ingredientName: string;
    quantity: number;
    unit: 'g' | 'ml' | 'piece';
  };

  export type SavedPlanEntry = {
    id: string;
    dayIndex: number;
    mealType: MealType;
    recipeId: string;
    portionMultiplier: number;
  };

  export type SavedPlan = {
    id: string;
    entries: SavedPlanEntry[];
  };

  export function fetchRecipes(): Promise<Recipe[]>;
  export function fetchRecipeIngredients(recipeIds: string[]): Promise<RecipeIngredient[]>;
  export function saveWeeklyPlan(
    userId: string,
    targets: { calories: number; proteinG: number; fatG: number; carbsG: number },
    entries: GeneratedEntry[]
  ): Promise<string>; // returns the new plan's id
  export function getCurrentPlan(userId: string): Promise<SavedPlan | null>;
  export function updatePlanEntry(entryId: string, recipeId: string, portionMultiplier: number): Promise<void>;
  ```
  Task 4 calls `fetchRecipes` and `saveWeeklyPlan`. Task 5 calls `fetchRecipes`, `getCurrentPlan`, and `updatePlanEntry`. Task 6 calls `getCurrentPlan` and `fetchRecipeIngredients`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/mealPlanData.test.ts`:

```ts
import {
  fetchRecipes,
  fetchRecipeIngredients,
  saveWeeklyPlan,
  getCurrentPlan,
  updatePlanEntry,
} from '../lib/mealPlanData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchRecipes', () => {
  it('maps rows to the Recipe shape', async () => {
    const select = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'r1',
          name: 'Porridge',
          meal_type: 'breakfast',
          base_calories: 350,
          base_protein_g: 12,
          base_fat_g: 8,
          base_carbs_g: 58,
          base_serving_g: 300,
        },
      ],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecipes();

    expect(result).toEqual([
      {
        id: 'r1',
        name: 'Porridge',
        mealType: 'breakfast',
        baseCalories: 350,
        baseProteinG: 12,
        baseFatG: 8,
        baseCarbsG: 58,
        baseServingG: 300,
      },
    ]);
  });

  it('throws on a Supabase error', async () => {
    const select = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchRecipes()).rejects.toThrow('boom');
  });
});

describe('fetchRecipeIngredients', () => {
  it('returns an empty array without calling Supabase when given no recipe ids', async () => {
    const result = await fetchRecipeIngredients([]);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('maps rows to the RecipeIngredient shape', async () => {
    const inFn = jest.fn().mockResolvedValue({
      data: [{ recipe_id: 'r1', ingredient_name: "Flocons d'avoine", quantity: 80, unit: 'g' }],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ in: inFn });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecipeIngredients(['r1']);

    expect(result).toEqual([{ recipeId: 'r1', ingredientName: "Flocons d'avoine", quantity: 80, unit: 'g' }]);
    expect(inFn).toHaveBeenCalledWith('recipe_id', ['r1']);
  });
});

describe('saveWeeklyPlan', () => {
  it('inserts the plan then its entries and returns the plan id', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'plan-1' }, error: null });
    const selectAfterInsert = jest.fn().mockReturnValue({ single });
    const planInsert = jest.fn().mockReturnValue({ select: selectAfterInsert });
    const entriesInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ insert: planInsert })
      .mockReturnValueOnce({ insert: entriesInsert });

    const planId = await saveWeeklyPlan(
      'user-1',
      { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 },
      [{ dayIndex: 0, mealType: 'breakfast', recipeId: 'r1', portionMultiplier: 1.2 }]
    );

    expect(planId).toBe('plan-1');
    expect(planInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      target_calories: 2000,
      target_protein_g: 150,
      target_fat_g: 60,
      target_carbs_g: 200,
    });
    expect(entriesInsert).toHaveBeenCalledWith([
      { plan_id: 'plan-1', day_index: 0, meal_type: 'breakfast', recipe_id: 'r1', portion_multiplier: 1.2 },
    ]);
  });

  it('does not call a second table for entries when there are none', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'plan-1' }, error: null });
    const selectAfterInsert = jest.fn().mockReturnValue({ single });
    const planInsert = jest.fn().mockReturnValue({ select: selectAfterInsert });
    (supabase.from as jest.Mock).mockReturnValue({ insert: planInsert });

    const planId = await saveWeeklyPlan('user-1', { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 }, []);

    expect(planId).toBe('plan-1');
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});

describe('getCurrentPlan', () => {
  it('returns null when the user has no plan', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getCurrentPlan('user-1');

    expect(result).toBeNull();
  });

  it('returns the most recent plan with its mapped entries', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'plan-1' }, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const planEq = jest.fn().mockReturnValue({ order });
    const planSelect = jest.fn().mockReturnValue({ eq: planEq });

    const entriesEq = jest.fn().mockResolvedValue({
      data: [{ id: 'e1', day_index: 0, meal_type: 'breakfast', recipe_id: 'r1', portion_multiplier: 1.2 }],
      error: null,
    });
    const entriesSelect = jest.fn().mockReturnValue({ eq: entriesEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: planSelect })
      .mockReturnValueOnce({ select: entriesSelect });

    const result = await getCurrentPlan('user-1');

    expect(result).toEqual({
      id: 'plan-1',
      entries: [{ id: 'e1', dayIndex: 0, mealType: 'breakfast', recipeId: 'r1', portionMultiplier: 1.2 }],
    });
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});

describe('updatePlanEntry', () => {
  it('updates the recipe and portion multiplier for an entry', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await updatePlanEntry('entry-1', 'r2', 0.9);

    expect(update).toHaveBeenCalledWith({ recipe_id: 'r2', portion_multiplier: 0.9 });
    expect(eq).toHaveBeenCalledWith('id', 'entry-1');
  });

  it('throws on a Supabase error', async () => {
    const eq = jest.fn().mockResolvedValue({ error: new Error('boom') });
    const update = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await expect(updatePlanEntry('entry-1', 'r2', 0.9)).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/mealPlanData.test.ts
```

Expected: FAIL — `Cannot find module '../lib/mealPlanData'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the persistence layer**

Create `src/lib/mealPlanData.ts`:

```ts
import { supabase } from './supabase';
import type { MealType, GeneratedEntry } from './mealPlan';

export type Recipe = {
  id: string;
  name: string;
  mealType: MealType;
  baseCalories: number;
  baseProteinG: number;
  baseFatG: number;
  baseCarbsG: number;
  baseServingG: number;
};

export type RecipeIngredient = {
  recipeId: string;
  ingredientName: string;
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
};

export type SavedPlanEntry = {
  id: string;
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
  portionMultiplier: number;
};

export type SavedPlan = {
  id: string;
  entries: SavedPlanEntry[];
};

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g');

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    mealType: row.meal_type,
    baseCalories: row.base_calories,
    baseProteinG: row.base_protein_g,
    baseFatG: row.base_fat_g,
    baseCarbsG: row.base_carbs_g,
    baseServingG: row.base_serving_g,
  }));
}

export async function fetchRecipeIngredients(recipeIds: string[]): Promise<RecipeIngredient[]> {
  if (recipeIds.length === 0) return [];

  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_name, quantity, unit')
    .in('recipe_id', recipeIds);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    recipeId: row.recipe_id,
    ingredientName: row.ingredient_name,
    quantity: row.quantity,
    unit: row.unit,
  }));
}

export async function saveWeeklyPlan(
  userId: string,
  targets: { calories: number; proteinG: number; fatG: number; carbsG: number },
  entries: GeneratedEntry[]
): Promise<string> {
  const { data: plan, error: planError } = await supabase
    .from('weekly_meal_plans')
    .insert({
      user_id: userId,
      target_calories: targets.calories,
      target_protein_g: targets.proteinG,
      target_fat_g: targets.fatG,
      target_carbs_g: targets.carbsG,
    })
    .select('id')
    .single();

  if (planError) throw planError;
  const planId = plan.id;

  if (entries.length > 0) {
    const { error: entriesError } = await supabase.from('meal_plan_entries').insert(
      entries.map((entry) => ({
        plan_id: planId,
        day_index: entry.dayIndex,
        meal_type: entry.mealType,
        recipe_id: entry.recipeId,
        portion_multiplier: entry.portionMultiplier,
      }))
    );
    if (entriesError) throw entriesError;
  }

  return planId;
}

export async function getCurrentPlan(userId: string): Promise<SavedPlan | null> {
  const { data: plan, error: planError } = await supabase
    .from('weekly_meal_plans')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) throw planError;
  if (!plan) return null;

  const { data: entries, error: entriesError } = await supabase
    .from('meal_plan_entries')
    .select('id, day_index, meal_type, recipe_id, portion_multiplier')
    .eq('plan_id', plan.id);

  if (entriesError) throw entriesError;

  return {
    id: plan.id,
    entries: (entries ?? []).map((row: any) => ({
      id: row.id,
      dayIndex: row.day_index,
      mealType: row.meal_type,
      recipeId: row.recipe_id,
      portionMultiplier: row.portion_multiplier,
    })),
  };
}

export async function updatePlanEntry(
  entryId: string,
  recipeId: string,
  portionMultiplier: number
): Promise<void> {
  const { error } = await supabase
    .from('meal_plan_entries')
    .update({ recipe_id: recipeId, portion_multiplier: portionMultiplier })
    .eq('id', entryId);

  if (error) throw error;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/mealPlanData.test.ts
```

Expected: `10 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mealPlanData.ts src/__tests__/mealPlanData.test.ts
git commit -m "Add meal plan persistence layer"
```

---

### Task 4: Slot selection and generate screen

**Files:**
- Create: `src/app/generate-plan.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Plan 1); `getProfile`, `getTrainingProfile` (Plan 2, `src/lib/profile.ts`); `computeTargetsFromProfile` (Plan 2, `src/lib/targets.ts`); `fetchRecipes`, `saveWeeklyPlan` (Task 3); `generateWeeklyPlan`, `MealSlot`, `MealType` (Task 2).
- Produces: route `/generate-plan`. Task 5 and Task 6 link here (and here links to `/plan` on success).

- [ ] **Step 1: Create the generate-plan screen**

Create `src/app/generate-plan.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Button, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, saveWeeklyPlan } from '../lib/mealPlanData';
import { generateWeeklyPlan, type MealSlot, type MealType } from '../lib/mealPlan';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

function defaultSelection(): boolean[][] {
  return DAY_LABELS.map(() => MEAL_TYPES.map(() => true));
}

export default function GeneratePlanScreen() {
  const { session, loading } = useAuth();
  const [selected, setSelected] = useState<boolean[][]>(defaultSelection());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const toggle = (dayIndex: number, mealIndex: number) => {
    setSelected((prev) =>
      prev.map((row, d) => (d === dayIndex ? row.map((v, m) => (m === mealIndex ? !v : v)) : row))
    );
  };

  const handleGenerate = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setGenerating(true);
    try {
      const [profile, trainingProfile] = await Promise.all([
        getProfile(session.user.id),
        getTrainingProfile(session.user.id),
      ]);

      if (!profile || !trainingProfile) {
        router.replace('/onboarding');
        return;
      }

      const targets = computeTargetsFromProfile(profile, trainingProfile);
      const recipes = await fetchRecipes();
      const recipeOptions = recipes.map((r) => ({ id: r.id, mealType: r.mealType, baseCalories: r.baseCalories }));

      const slots: MealSlot[] = [];
      selected.forEach((row, dayIndex) => {
        row.forEach((isSelected, mealIndex) => {
          if (isSelected) slots.push({ dayIndex, mealType: MEAL_TYPES[mealIndex] });
        });
      });

      const entries = generateWeeklyPlan(targets.calories, slots, recipeOptions);
      await saveWeeklyPlan(session.user.id, targets, entries);
      router.replace('/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choisis les repas à générer</Text>
      {DAY_LABELS.map((dayLabel, dayIndex) => (
        <View key={dayLabel} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((mealType, mealIndex) => (
              <Pressable
                key={mealType}
                onPress={() => toggle(dayIndex, mealIndex)}
                style={[styles.cell, selected[dayIndex][mealIndex] && styles.cellSelected]}
              >
                <Text style={selected[dayIndex][mealIndex] ? styles.cellLabelSelected : styles.cellLabel}>
                  {MEAL_TYPE_LABELS[mealType]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={generating ? 'Génération...' : 'Générer le plan'}
        onPress={handleGenerate}
        disabled={generating}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  dayRow: { marginBottom: 12 },
  dayLabel: { fontWeight: '600', marginBottom: 4 },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { borderWidth: 1, borderColor: '#888', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 },
  cellSelected: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  cellLabel: { color: '#333' },
  cellLabelSelected: { color: '#fff' },
  error: { color: 'red', marginTop: 16, marginBottom: 8 },
});
```

- [ ] **Step 2: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/generate-plan
```

Expected: `200`. Stop the server once confirmed. (Toggling cells and generating a real plan requires a human with a real browser or Expo Go, and a completed onboarding profile.)

- [ ] **Step 3: Commit**

```bash
git add src/app/generate-plan.tsx
git commit -m "Add slot selection and generate-plan screen"
```

---

### Task 5: Plan view screen with meal swap

**Files:**
- Create: `src/app/plan.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Plan 1); `getCurrentPlan`, `updatePlanEntry`, `fetchRecipes`, `Recipe` (Task 3); `pickReplacementRecipe`, `MEAL_TYPE_RATIOS`, `clampPortionMultiplier` (Task 2).
- Produces: route `/plan`. Task 6 links here; this screen links to `/generate-plan` (no plan yet) and `/grocery-list`.

- [ ] **Step 1: Create the plan view screen**

Create `src/app/plan.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../lib/mealPlanData';
import { pickReplacementRecipe, MEAL_TYPE_RATIOS, clampPortionMultiplier, type MealType } from '../lib/mealPlan';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

export default function PlanScreen() {
  const { session, loading } = useAuth();
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const [currentPlan, allRecipes] = await Promise.all([getCurrentPlan(session.user.id), fetchRecipes()]);
      setPlan(currentPlan);
      setRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du plan.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const recipeById = new Map(recipes.map((r) => [r.id, r]));

  const handleSwap = async (entryId: string, mealType: MealType, currentRecipeId: string) => {
    if (!plan) return;
    setSwappingId(entryId);
    setError(null);
    try {
      const recipeOptions = recipes.map((r) => ({ id: r.id, mealType: r.mealType, baseCalories: r.baseCalories }));
      const replacement = pickReplacementRecipe(mealType, currentRecipeId, recipeOptions);
      if (!replacement) {
        setError('Aucune autre recette disponible pour ce repas.');
        return;
      }

      const currentEntry = plan.entries.find((e) => e.id === entryId);
      if (!currentEntry) return;

      const dailyTargetCalories = currentTargetCalories(currentEntry, recipeById, mealType);
      const slotTarget = dailyTargetCalories * MEAL_TYPE_RATIOS[mealType];
      const newMultiplier = clampPortionMultiplier(slotTarget / replacement.baseCalories);

      await updatePlanEntry(entryId, replacement.id, newMultiplier);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'échange.');
    } finally {
      setSwappingId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!plan || plan.entries.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ marginBottom: 16 }}>Aucun plan pour l'instant.</Text>
        <Link href="/generate-plan">Générer un plan</Link>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {DAY_LABELS.map((dayLabel, dayIndex) => {
        const dayEntries = plan.entries.filter((e) => e.dayIndex === dayIndex);
        if (dayEntries.length === 0) return null;
        return (
          <View key={dayLabel} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{dayLabel}</Text>
            {dayEntries.map((entry) => {
              const recipe = recipeById.get(entry.recipeId);
              return (
                <Pressable
                  key={entry.id}
                  style={styles.entryRow}
                  onPress={() => handleSwap(entry.id, entry.mealType, entry.recipeId)}
                  disabled={swappingId === entry.id}
                >
                  <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                  <Text style={styles.recipeName}>
                    {recipe ? recipe.name : entry.recipeId} ({Math.round(entry.portionMultiplier * 100)}%)
                  </Text>
                  <Text style={styles.swapHint}>{swappingId === entry.id ? '...' : 'Échanger'}</Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
      <Link href="/grocery-list" style={styles.groceryLink}>
        Voir la liste de courses
      </Link>
    </ScrollView>
  );
}

// SavedPlan.entries only stores portionMultiplier, not the daily calorie target that
// produced it. Reconstruct it from the entry being replaced instead of adding a new
// column: since portionMultiplier = clamp(dailyTarget * mealTypeRatio / baseCalories),
// un-clamping by re-deriving from the current (already-clamped) values keeps the swap
// consistent with what's on screen.
function currentTargetCalories(
  currentEntry: SavedPlan['entries'][number],
  recipeById: Map<string, Recipe>,
  mealType: MealType
): number {
  const currentRecipe = recipeById.get(currentEntry.recipeId);
  if (!currentRecipe) return 0;
  return (currentRecipe.baseCalories * currentEntry.portionMultiplier) / MEAL_TYPE_RATIOS[mealType];
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  dayBlock: { marginBottom: 20 },
  dayLabel: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealTypeLabel: { width: 90, color: '#666' },
  recipeName: { flex: 1 },
  swapHint: { color: '#208AEF' },
  error: { color: 'red', marginBottom: 16 },
  groceryLink: { marginTop: 16, textAlign: 'center' },
});
```

- [ ] **Step 2: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/plan
```

Expected: `200`. Stop the server once confirmed. (Seeing the actual week grid, tapping to swap, and confirming the portion updates requires a human with a real browser or Expo Go, and an existing generated plan.)

- [ ] **Step 3: Commit**

```bash
git add src/app/plan.tsx
git commit -m "Add plan view screen with meal swap"
```

---

### Task 6: Grocery list screen and home screen navigation

**Files:**
- Create: `src/app/grocery-list.tsx`
- Modify: `src/app/home.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Plan 1); `getCurrentPlan`, `fetchRecipeIngredients` (Task 3).
- Produces: route `/grocery-list`; `home.tsx` gains links to `/generate-plan` and `/plan`. This is the last screen this plan builds.

- [ ] **Step 1: Create the grocery list screen**

Create `src/app/grocery-list.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../lib/mealPlanData';

type AggregatedIngredient = { name: string; quantity: number; unit: string };

export default function GroceryListScreen() {
  const { session, loading } = useAuth();
  const [items, setItems] = useState<AggregatedIngredient[]>([]);
  const [hasPlan, setHasPlan] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const plan = await getCurrentPlan(session.user.id);
      if (!plan || plan.entries.length === 0) {
        setHasPlan(false);
        setItems([]);
        return;
      }
      setHasPlan(true);

      const recipeIds = Array.from(new Set(plan.entries.map((e) => e.recipeId)));
      const ingredients = await fetchRecipeIngredients(recipeIds);

      const totals = new Map<string, AggregatedIngredient>();
      for (const entry of plan.entries) {
        const recipeIngredients = ingredients.filter((i) => i.recipeId === entry.recipeId);
        for (const ingredient of recipeIngredients) {
          const key = `${ingredient.ingredientName}|${ingredient.unit}`;
          const scaledQuantity = ingredient.quantity * entry.portionMultiplier;
          const existing = totals.get(key);
          if (existing) {
            existing.quantity += scaledQuantity;
          } else {
            totals.set(key, { name: ingredient.ingredientName, quantity: scaledQuantity, unit: ingredient.unit });
          }
        }
      }

      setItems(Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la liste de courses.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !session || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ marginBottom: 16 }}>Aucun plan pour l'instant.</Text>
        <Link href="/generate-plan">Générer un plan</Link>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Liste de courses</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {items.map((item) => (
        <View key={`${item.name}|${item.unit}`} style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.quantity}>
            {Math.round(item.quantity * 10) / 10} {item.unit}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: { flex: 1 },
  quantity: { color: '#666' },
  error: { color: 'red', marginBottom: 16 },
});
```

- [ ] **Step 2: Add navigation links to the home screen**

In `src/app/home.tsx`, add `Link` to the imports from `expo-router` (it currently imports `router` only) and add two links after the macro summary block, before the sign-out button. Replace:

```tsx
import { router } from 'expo-router';
```

with:

```tsx
import { Link, router } from 'expo-router';
```

Then replace:

```tsx
      <View style={{ marginTop: 16 }}>
        <Button title="Se déconnecter" onPress={signOut} />
      </View>
```

with:

```tsx
      <View style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
        <Link href="/generate-plan">Générer le plan de la semaine</Link>
        <Link href="/plan">Voir mon plan</Link>
      </View>
      <View style={{ marginTop: 16 }}>
        <Button title="Se déconnecter" onPress={signOut} />
      </View>
```

- [ ] **Step 3: Run the full automated test suite**

```bash
npx jest
```

Expected: all tests pass (smoke, auth-context, nutrition, targets, profile, mealPlan, mealPlanData — no regressions from Plans 1-2 or earlier tasks in this plan).

- [ ] **Step 4: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/grocery-list
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/home
```

Expected: both `200`. Stop the server once confirmed. (Seeing the actual aggregated list, and the new home screen links, requires a human with a real browser or Expo Go.)

- [ ] **Step 5: Commit**

```bash
git add src/app/grocery-list.tsx src/app/home.tsx
git commit -m "Add grocery list screen and home screen navigation"
```

---

## Plan Complete

At the end of this plan: a signed-in user with a completed profile can pick which meals to generate for the week, get a full plan matched to their calorie/macro targets, view it day by day, tap any meal to swap it for an alternative (with the portion recalculated to keep the same calorie target), and see an aggregated grocery list — with `src/lib/mealPlan.ts`'s pure algorithm and `src/lib/mealPlanData.ts`'s persistence functions as the stable interfaces Plan 4 (workout program generation) can follow the same pattern from.

