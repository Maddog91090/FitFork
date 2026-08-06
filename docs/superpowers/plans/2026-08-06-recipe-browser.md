# Page de découverte des recettes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Recettes" tab listing every recipe in the catalog, with
three cumulative filters at the top (meal type, category/protein tags,
prep-time bucket) to help the user find one to cook.

**Architecture:** A new Supabase migration adds `prep_time_minutes` to
`recipes` and a `recipe_tags` join table, backfilled for all 86 existing
recipes. `fetchRecipes()` grows to include both via a single embedded
Supabase query. A pure `filterRecipes` function (recipe[] + active filters
→ recipe[]) drives the new screen, which loads the full catalog once and
filters entirely client-side.

**Tech Stack:** Expo Router, Supabase (Postgres), existing `ChoiceGroup`
component plus a new multi-select sibling component.

## Global Constraints

- Tag vocabulary is fixed: `poulet`, `boeuf`, `porc`, `dinde`,
  `poisson_fruits_de_mer`, `oeuf`, `vegetarien`. No admin UI to add tags —
  assignment happens only via migration SQL.
- Category tag filtering is AND (a recipe must carry every selected tag).
  Meal-type and prep-time filters are single-select ("Tous" or one value).
  All three filter axes combine with AND.
- No search bar in this version.
- All data is fetched once per screen visit (on focus); filtering after
  that is pure client-side computation, no additional network calls.
- Visual values (colors, font sizes/weights, spacing, radii) must come
  from `src/theme/tokens.ts` — never inline a hex code, font size, or
  font weight (`.claude/skills/fitfork-design/SKILL.md`, referenced from
  `AGENTS.md`).
- Recipes without a `prep_time_minutes` value are excluded from a strict
  time bucket but remain visible under "Tous".

---

### Task 1: Migration — prep time + category tags for all 86 recipes

**Files:**
- Create: `supabase/migrations/0019_recipe_tags_and_prep_time.sql`

**Interfaces:**
- Produces: `recipes.prep_time_minutes integer null` column;
  `recipe_tags` table (`id uuid`, `recipe_id uuid references recipes(id)`,
  `tag text`) — consumed by Task 2's `fetchRecipes()` update via an
  embedded select (`recipe_tags(tag)`).

No application code touches this file directly, so there's no
red/green test cycle here — the deliverable is verified by inspection
(every one of the 86 recipe names below must exist verbatim in the
existing migrations) and by Task 2's tests, which exercise the shape this
migration produces.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0019_recipe_tags_and_prep_time.sql`:

```sql
-- Adds a prep-time field and a many-to-many category/protein tag system to
-- recipes, needed for the recipe browser screen's filters. The tag
-- vocabulary (poulet, boeuf, porc, dinde, poisson_fruits_de_mer, oeuf,
-- vegetarien) is fixed and enforced at the application layer, not by a
-- database check constraint.

alter table public.recipes
  add column prep_time_minutes integer null;

create table if not exists public.recipe_tags (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag text not null
);

alter table public.recipe_tags enable row level security;

create policy "Anyone can read recipe tags"
  on public.recipe_tags for select
  using (true);

-- Backfill prep_time_minutes for the 86 existing recipes.
update public.recipes r
set prep_time_minutes = v.minutes
from (values
  ('Porridge avoine-banane', 10),
  ('Œufs brouillés et pain complet', 10),
  ('Yaourt grec, granola et fruits rouges', 5),
  ('Pancakes protéinés', 15),
  ('Poulet grillé, riz et brocolis', 25),
  ('Saumon, quinoa et légumes vapeur', 25),
  ('Wrap dinde-avocat', 10),
  ('Buddha bowl pois chiches', 20),
  ('Steak haché, patate douce et haricots verts', 30),
  ('Pâtes bolognaise (bœuf 5%)', 30),
  ('Cabillaud, riz basmati et courgettes', 25),
  ('Tofu sauté, nouilles et légumes', 20),
  ('Barre protéinée maison', 10),
  ('Pomme et beurre de cacahuète', 5),
  ('Fromage blanc et miel', 5),
  ('Muesli maison et lait d''amande', 5),
  ('Omelette au fromage et jambon', 10),
  ('Smoothie bowl banane-myrtille', 10),
  ('Toast à l''avocat et œuf poché', 15),
  ('Crêpes à la farine complète et miel', 20),
  ('Bagel au saumon fumé et fromage frais', 10),
  ('Porridge protéiné chocolat-noisette', 10),
  ('Gaufres maison et fruits', 20),
  ('Skyr et flocons d''avoine', 5),
  ('Sandwich œufs-bacon', 15),
  ('Salade César au poulet', 20),
  ('Riz sauté au tofu et légumes', 20),
  ('Poke bowl saumon-avocat', 15),
  ('Sandwich club poulet-bacon', 15),
  ('Pâtes au thon et tomates', 20),
  ('Curry de poulet et riz basmati', 30),
  ('Salade de lentilles et feta', 15),
  ('Burrito bœuf-haricots rouges', 25),
  ('Bol de quinoa aux crevettes', 20),
  ('Sandwich thon-crudités', 10),
  ('Poulet rôti et pommes de terre', 45),
  ('Chili con carne et riz', 35),
  ('Gratin de saumon et brocolis', 35),
  ('Escalope de dinde et purée', 30),
  ('Risotto aux champignons et parmesan', 35),
  ('Curry de crevettes et riz', 25),
  ('Poêlée de bœuf et légumes asiatiques', 20),
  ('Lasagnes à la viande', 45),
  ('Filet de poisson blanc et légumes rôtis', 30),
  ('Chili végétarien et riz complet', 30),
  ('Amandes et fruits secs', 2),
  ('Smoothie protéiné banane', 5),
  ('Houmous et bâtonnets de légumes', 5),
  ('Yaourt et granola', 5),
  ('Barre de céréales maison', 10),
  ('Fromage cottage et fruits rouges', 5),
  ('Toast au beurre de cacahuète et banane', 5),
  ('Œuf dur et fruit', 12),
  ('Shake protéiné chocolat', 5),
  ('Gnocchis poêlés, chorizo & tomates cerises', 20),
  ('Tartare de saumon avocat-mangue', 15),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 20),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 25),
  ('Bowl bœuf teriyaki express', 15),
  ('Salade thaï poulet-cacahuète', 15),
  ('Saumon laqué miso-soja, brocoli sauté', 20),
  ('Sauté de crevettes, nouilles & légumes croquants', 15),
  ('Skyr + jambon roulé', 5),
  ('Œufs durs + galettes de riz', 12),
  ('Thon-fromage frais sur cracottes', 5),
  ('Yaourt grec, miel & noix', 5),
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 25),
  ('Bowl burrito au bœuf', 25),
  ('Tacos de poisson & slaw citron vert', 20),
  ('Dip haricots-fromage blanc & crudités', 10),
  ('Fajitas de poulet, poivrons & oignons', 20),
  ('Crevettes à la diabla, riz coco-coriandre', 25),
  ('Burger maison patate douce', 30),
  ('Buffalo chicken bowl', 20),
  ('Cottage cheese « ranch » & crudités', 10),
  ('Meatloaf de dinde & purée légère', 35),
  ('Cajun shrimp & maïs poêlé', 15),
  ('Papillote de cabillaud à la provençale', 25),
  ('Tartine chèvre frais & concombre', 5),
  ('Blanquette de dinde allégée', 35),
  ('Poulet basquaise express', 25),
  ('Ricotta battue, miel & amandes façon colazione', 5),
  ('Pâtes thon-citron-roquette', 15),
  ('Caprese express au thon (ou classique)', 5),
  ('Escalope milanaise revisitée au four', 25),
  ('Boulettes de bœuf à la sauce arrabbiata', 30)
) as v(name, minutes)
where r.name = v.name;

-- Backfill category/protein tags for the 86 existing recipes. A recipe may
-- carry more than one tag (e.g. a sandwich with both chicken and bacon).
insert into public.recipe_tags (recipe_id, tag)
select r.id, v.tag
from (values
  ('Porridge avoine-banane', 'vegetarien'),
  ('Œufs brouillés et pain complet', 'oeuf'),
  ('Œufs brouillés et pain complet', 'vegetarien'),
  ('Yaourt grec, granola et fruits rouges', 'vegetarien'),
  ('Pancakes protéinés', 'oeuf'),
  ('Pancakes protéinés', 'vegetarien'),
  ('Poulet grillé, riz et brocolis', 'poulet'),
  ('Saumon, quinoa et légumes vapeur', 'poisson_fruits_de_mer'),
  ('Wrap dinde-avocat', 'dinde'),
  ('Buddha bowl pois chiches', 'vegetarien'),
  ('Steak haché, patate douce et haricots verts', 'boeuf'),
  ('Pâtes bolognaise (bœuf 5%)', 'boeuf'),
  ('Cabillaud, riz basmati et courgettes', 'poisson_fruits_de_mer'),
  ('Tofu sauté, nouilles et légumes', 'vegetarien'),
  ('Barre protéinée maison', 'vegetarien'),
  ('Pomme et beurre de cacahuète', 'vegetarien'),
  ('Fromage blanc et miel', 'vegetarien'),
  ('Muesli maison et lait d''amande', 'vegetarien'),
  ('Omelette au fromage et jambon', 'oeuf'),
  ('Omelette au fromage et jambon', 'porc'),
  ('Smoothie bowl banane-myrtille', 'vegetarien'),
  ('Toast à l''avocat et œuf poché', 'oeuf'),
  ('Toast à l''avocat et œuf poché', 'vegetarien'),
  ('Crêpes à la farine complète et miel', 'oeuf'),
  ('Crêpes à la farine complète et miel', 'vegetarien'),
  ('Bagel au saumon fumé et fromage frais', 'poisson_fruits_de_mer'),
  ('Porridge protéiné chocolat-noisette', 'vegetarien'),
  ('Gaufres maison et fruits', 'oeuf'),
  ('Gaufres maison et fruits', 'vegetarien'),
  ('Skyr et flocons d''avoine', 'vegetarien'),
  ('Sandwich œufs-bacon', 'oeuf'),
  ('Sandwich œufs-bacon', 'porc'),
  ('Salade César au poulet', 'poulet'),
  ('Riz sauté au tofu et légumes', 'vegetarien'),
  ('Poke bowl saumon-avocat', 'poisson_fruits_de_mer'),
  ('Sandwich club poulet-bacon', 'poulet'),
  ('Sandwich club poulet-bacon', 'porc'),
  ('Pâtes au thon et tomates', 'poisson_fruits_de_mer'),
  ('Curry de poulet et riz basmati', 'poulet'),
  ('Salade de lentilles et feta', 'vegetarien'),
  ('Burrito bœuf-haricots rouges', 'boeuf'),
  ('Bol de quinoa aux crevettes', 'poisson_fruits_de_mer'),
  ('Sandwich thon-crudités', 'poisson_fruits_de_mer'),
  ('Poulet rôti et pommes de terre', 'poulet'),
  ('Chili con carne et riz', 'boeuf'),
  ('Gratin de saumon et brocolis', 'poisson_fruits_de_mer'),
  ('Escalope de dinde et purée', 'dinde'),
  ('Risotto aux champignons et parmesan', 'vegetarien'),
  ('Curry de crevettes et riz', 'poisson_fruits_de_mer'),
  ('Poêlée de bœuf et légumes asiatiques', 'boeuf'),
  ('Lasagnes à la viande', 'boeuf'),
  ('Filet de poisson blanc et légumes rôtis', 'poisson_fruits_de_mer'),
  ('Chili végétarien et riz complet', 'vegetarien'),
  ('Amandes et fruits secs', 'vegetarien'),
  ('Smoothie protéiné banane', 'vegetarien'),
  ('Houmous et bâtonnets de légumes', 'vegetarien'),
  ('Yaourt et granola', 'vegetarien'),
  ('Barre de céréales maison', 'vegetarien'),
  ('Fromage cottage et fruits rouges', 'vegetarien'),
  ('Toast au beurre de cacahuète et banane', 'vegetarien'),
  ('Œuf dur et fruit', 'oeuf'),
  ('Œuf dur et fruit', 'vegetarien'),
  ('Shake protéiné chocolat', 'vegetarien'),
  ('Gnocchis poêlés, chorizo & tomates cerises', 'porc'),
  ('Tartare de saumon avocat-mangue', 'poisson_fruits_de_mer'),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 'poisson_fruits_de_mer'),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 'poisson_fruits_de_mer'),
  ('Bowl bœuf teriyaki express', 'boeuf'),
  ('Salade thaï poulet-cacahuète', 'poulet'),
  ('Saumon laqué miso-soja, brocoli sauté', 'poisson_fruits_de_mer'),
  ('Sauté de crevettes, nouilles & légumes croquants', 'poisson_fruits_de_mer'),
  ('Skyr + jambon roulé', 'dinde'),
  ('Œufs durs + galettes de riz', 'oeuf'),
  ('Œufs durs + galettes de riz', 'vegetarien'),
  ('Thon-fromage frais sur cracottes', 'poisson_fruits_de_mer'),
  ('Yaourt grec, miel & noix', 'vegetarien'),
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 'poulet'),
  ('Bowl burrito au bœuf', 'boeuf'),
  ('Tacos de poisson & slaw citron vert', 'poisson_fruits_de_mer'),
  ('Dip haricots-fromage blanc & crudités', 'vegetarien'),
  ('Fajitas de poulet, poivrons & oignons', 'poulet'),
  ('Crevettes à la diabla, riz coco-coriandre', 'poisson_fruits_de_mer'),
  ('Burger maison patate douce', 'boeuf'),
  ('Buffalo chicken bowl', 'poulet'),
  ('Cottage cheese « ranch » & crudités', 'vegetarien'),
  ('Meatloaf de dinde & purée légère', 'dinde'),
  ('Cajun shrimp & maïs poêlé', 'poisson_fruits_de_mer'),
  ('Papillote de cabillaud à la provençale', 'poisson_fruits_de_mer'),
  ('Tartine chèvre frais & concombre', 'vegetarien'),
  ('Blanquette de dinde allégée', 'dinde'),
  ('Poulet basquaise express', 'poulet'),
  ('Ricotta battue, miel & amandes façon colazione', 'vegetarien'),
  ('Pâtes thon-citron-roquette', 'poisson_fruits_de_mer'),
  ('Caprese express au thon (ou classique)', 'poisson_fruits_de_mer'),
  ('Escalope milanaise revisitée au four', 'poulet'),
  ('Boulettes de bœuf à la sauce arrabbiata', 'boeuf')
) as v(name, tag)
join public.recipes r on r.name = v.name;
```

- [ ] **Step 2: Verify recipe name coverage**

Every `name` referenced above must match a recipe inserted by an earlier
migration exactly (accents, punctuation, apostrophes included) — the
`update ... where r.name = v.name` and the `join ... on r.name = v.name`
are silent no-ops for any name that doesn't match exactly, so a typo here
just leaves that recipe's `prep_time_minutes` null / tags empty rather
than erroring. Cross-check by running this against each of
`supabase/migrations/0002_recipes_and_meal_plans.sql`,
`0003_expand_recipe_catalog.sql`, `0011_add_new_recipes.sql`,
`0012_add_more_recipes.sql`, `0013_add_snack_recipes.sql`,
`0014_add_yaourt_grec_noix_recipe.sql`,
`0015_add_escalope_poulet_moutarde_recipe.sql`,
`0016_add_recipe_batch.sql`: grep each file's `insert into public.recipes`
block for recipe names and confirm all 86 appear exactly once each in
both the `prep_time_minutes` backfill and the `recipe_tags` backfill (with
2 entries for the 10 two-tag recipes: "Œufs brouillés et pain complet",
"Pancakes protéinés", "Omelette au fromage et jambon", "Toast à l'avocat
et œuf poché", "Crêpes à la farine complète et miel", "Gaufres maison et
fruits", "Sandwich œufs-bacon", "Sandwich club poulet-bacon", "Œuf dur et
fruit", "Œufs durs + galettes de riz").

- [ ] **Step 3: Apply the migration**

This project's other migrations are applied outside this repo (no
`supabase` CLI or `supabase/config.toml` present locally) — apply this one
the same way the human partner has applied the previous 18 (Supabase
dashboard SQL editor, or `supabase db push` from an environment with the
CLI configured against this project). This step is on the human partner,
not the implementer — note it in the task report rather than attempting
it.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0019_recipe_tags_and_prep_time.sql
git commit -m "feat: add recipe prep-time and category tags, backfill 86 recipes"
```

---

### Task 2: `Recipe` type and `fetchRecipes()` gain tags and prep time

**Files:**
- Modify: `src/lib/mealPlanData.ts:4-14` (type), `:37-56` (`fetchRecipes`)
- Test: `src/__tests__/mealPlanData.test.ts:19-65`

**Interfaces:**
- Consumes: `recipe_tags` table and `recipes.prep_time_minutes` column
  from Task 1 (the Supabase call itself is mocked in tests, so this task
  does not require the migration to be applied to pass its tests).
- Produces: `Recipe.prepTimeMinutes: number | null`,
  `Recipe.tags: string[]` — consumed by Task 3's `filterRecipes` and
  Task 4's screen.

- [ ] **Step 1: Write the failing test**

In `src/__tests__/mealPlanData.test.ts`, replace the existing `'maps rows
to the Recipe shape'` test (inside `describe('fetchRecipes', ...)`) with:

```ts
  it('maps rows to the Recipe shape, including tags and prep time', async () => {
    const order = jest.fn().mockResolvedValue({
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
          image_url: 'https://example.com/porridge.jpg',
          prep_time_minutes: 10,
          recipe_tags: [{ tag: 'vegetarien' }],
        },
      ],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ order });
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
        imageUrl: 'https://example.com/porridge.jpg',
        prepTimeMinutes: 10,
        tags: ['vegetarien'],
      },
    ]);
    expect(select).toHaveBeenCalledWith(
      'id, name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g, image_url, prep_time_minutes, recipe_tags(tag)'
    );
    expect(order).toHaveBeenCalledWith('id');
  });

  it('defaults tags to an empty array when a recipe has none', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'r2',
          name: 'Recette sans tag',
          meal_type: 'snack',
          base_calories: 100,
          base_protein_g: 5,
          base_fat_g: 2,
          base_carbs_g: 10,
          base_serving_g: 50,
          image_url: null,
          prep_time_minutes: null,
          recipe_tags: [],
        },
      ],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecipes();

    expect(result[0].tags).toEqual([]);
    expect(result[0].prepTimeMinutes).toBeNull();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest mealPlanData.test.ts`
Expected: FAIL — the actual `Recipe` shape doesn't have `prepTimeMinutes`
or `tags` yet, and the `select` call doesn't request the new columns.

- [ ] **Step 3: Update the type and the fetch function**

In `src/lib/mealPlanData.ts`, replace the `Recipe` type (lines 4-14) with:

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
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  tags: string[];
};
```

Replace `fetchRecipes()` (lines 37-56) with:

```ts
export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(
      'id, name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g, image_url, prep_time_minutes, recipe_tags(tag)'
    )
    .order('id');

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
    imageUrl: row.image_url,
    prepTimeMinutes: row.prep_time_minutes,
    tags: (row.recipe_tags ?? []).map((t: any) => t.tag),
  }));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest mealPlanData.test.ts`
Expected: PASS (all tests in the file, including the two new/updated
ones).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mealPlanData.ts src/__tests__/mealPlanData.test.ts
git commit -m "feat: include tags and prep time in Recipe and fetchRecipes"
```

---

### Task 3: `filterRecipes` — pure filtering logic

**Files:**
- Create: `src/lib/recipeFilters.ts`
- Test: `src/__tests__/recipeFilters.test.ts`

**Interfaces:**
- Consumes: `Recipe` type from `src/lib/mealPlanData.ts` (Task 2 —
  `tags`/`prepTimeMinutes` must exist on it), `MealType` from
  `src/lib/mealPlan.ts`.
- Produces:
  `export type PrepTimeFilter = 'all' | 15 | 30 | 45;`
  `export type RecipeFilters = { mealType: MealType | 'all'; tags: string[]; maxPrepTimeMinutes: PrepTimeFilter };`
  `export function matchesFilters(recipe: Recipe, filters: RecipeFilters): boolean`
  `export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[]`
  — consumed by `src/app/(tabs)/recipes.tsx` (Task 4).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/recipeFilters.test.ts`:

```ts
import { filterRecipes, type RecipeFilters } from '../lib/recipeFilters';
import type { Recipe } from '../lib/mealPlanData';

function makeRecipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: 'r1',
    name: 'Recette test',
    mealType: 'lunch',
    baseCalories: 500,
    baseProteinG: 30,
    baseFatG: 15,
    baseCarbsG: 50,
    baseServingG: 400,
    imageUrl: null,
    prepTimeMinutes: 20,
    tags: [],
    ...overrides,
  };
}

const NO_FILTERS: RecipeFilters = { mealType: 'all', tags: [], maxPrepTimeMinutes: 'all' };

describe('filterRecipes', () => {
  it('returns every recipe when no filter is active', () => {
    const recipes = [makeRecipe({ id: 'a' }), makeRecipe({ id: 'b' })];
    expect(filterRecipes(recipes, NO_FILTERS)).toEqual(recipes);
  });

  it('filters by meal type', () => {
    const recipes = [
      makeRecipe({ id: 'a', mealType: 'breakfast' }),
      makeRecipe({ id: 'b', mealType: 'dinner' }),
    ];
    const result = filterRecipes(recipes, { ...NO_FILTERS, mealType: 'dinner' });
    expect(result.map((r) => r.id)).toEqual(['b']);
  });

  it('requires every selected tag to be present (AND logic)', () => {
    const recipes = [
      makeRecipe({ id: 'a', tags: ['poulet'] }),
      makeRecipe({ id: 'b', tags: ['poulet', 'porc'] }),
      makeRecipe({ id: 'c', tags: ['porc'] }),
    ];
    const result = filterRecipes(recipes, { ...NO_FILTERS, tags: ['poulet', 'porc'] });
    expect(result.map((r) => r.id)).toEqual(['b']);
  });

  it('filters by a prep-time upper bound', () => {
    const recipes = [
      makeRecipe({ id: 'a', prepTimeMinutes: 10 }),
      makeRecipe({ id: 'b', prepTimeMinutes: 40 }),
    ];
    const result = filterRecipes(recipes, { ...NO_FILTERS, maxPrepTimeMinutes: 15 });
    expect(result.map((r) => r.id)).toEqual(['a']);
  });

  it('excludes recipes with no prep time from a strict time bucket', () => {
    const recipes = [makeRecipe({ id: 'a', prepTimeMinutes: null })];
    const result = filterRecipes(recipes, { ...NO_FILTERS, maxPrepTimeMinutes: 15 });
    expect(result).toEqual([]);
  });

  it('keeps recipes with no prep time when the time filter is "all"', () => {
    const recipes = [makeRecipe({ id: 'a', prepTimeMinutes: null })];
    const result = filterRecipes(recipes, NO_FILTERS);
    expect(result.map((r) => r.id)).toEqual(['a']);
  });

  it('combines all three filter axes with AND', () => {
    const recipes = [
      makeRecipe({ id: 'a', mealType: 'dinner', tags: ['poulet'], prepTimeMinutes: 20 }),
      makeRecipe({ id: 'b', mealType: 'dinner', tags: ['poulet'], prepTimeMinutes: 40 }),
      makeRecipe({ id: 'c', mealType: 'lunch', tags: ['poulet'], prepTimeMinutes: 20 }),
    ];
    const result = filterRecipes(recipes, { mealType: 'dinner', tags: ['poulet'], maxPrepTimeMinutes: 30 });
    expect(result.map((r) => r.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest recipeFilters.test.ts`
Expected: FAIL with "Cannot find module '../lib/recipeFilters'".

- [ ] **Step 3: Implement**

Create `src/lib/recipeFilters.ts`:

```ts
import type { Recipe } from './mealPlanData';
import type { MealType } from './mealPlan';

export type PrepTimeFilter = 'all' | 15 | 30 | 45;

export type RecipeFilters = {
  mealType: MealType | 'all';
  tags: string[];
  maxPrepTimeMinutes: PrepTimeFilter;
};

export function matchesFilters(recipe: Recipe, filters: RecipeFilters): boolean {
  if (filters.mealType !== 'all' && recipe.mealType !== filters.mealType) {
    return false;
  }

  if (filters.tags.length > 0 && !filters.tags.every((tag) => recipe.tags.includes(tag))) {
    return false;
  }

  if (filters.maxPrepTimeMinutes !== 'all') {
    if (recipe.prepTimeMinutes == null || recipe.prepTimeMinutes > filters.maxPrepTimeMinutes) {
      return false;
    }
  }

  return true;
}

export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  return recipes.filter((recipe) => matchesFilters(recipe, filters));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest recipeFilters.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipeFilters.ts src/__tests__/recipeFilters.test.ts
git commit -m "feat: add pure filterRecipes for meal type, tags, and prep time"
```

---

### Task 4: "Recettes" tab — screen, multi-select tag chips, navigation

**Files:**
- Create: `src/components/TagFilterGroup.tsx`
- Create: `src/app/(tabs)/recipes.tsx`
- Modify: `src/app/(tabs)/_layout.tsx` (register the new tab)
- Test: `src/__tests__/recipes-screen.test.tsx`

**Interfaces:**
- Consumes: `fetchRecipes()` and `Recipe` from `src/lib/mealPlanData.ts`
  (Task 2); `filterRecipes`, `RecipeFilters`, `PrepTimeFilter` from
  `src/lib/recipeFilters.ts` (Task 3); `MealType` from
  `src/lib/mealPlan.ts`; the existing `ChoiceGroup` component and its
  exported `ChoiceOption<T>` type (`src/components/ChoiceGroup.tsx`).
- Produces: `export function TagFilterGroup<T extends string>(props: { options: ChoiceOption<T>[]; value: T[]; onChange: (value: T[]) => void })`
  — a multi-select sibling to `ChoiceGroup`, used only by this task but
  exported for reuse.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/recipes-screen.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecipesScreen from '../app/(tabs)/recipes';
import { useAuth } from '../lib/auth-context';
import { fetchRecipes } from '../lib/mealPlanData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  fetchRecipes: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

const CHICKEN_RECIPE = {
  id: 'r1',
  name: 'Poulet grillé',
  mealType: 'lunch',
  baseCalories: 500,
  baseProteinG: 40,
  baseFatG: 15,
  baseCarbsG: 50,
  baseServingG: 400,
  imageUrl: null,
  prepTimeMinutes: 20,
  tags: ['poulet'],
};

const VEG_RECIPE = {
  id: 'r2',
  name: 'Buddha bowl',
  mealType: 'lunch',
  baseCalories: 450,
  baseProteinG: 20,
  baseFatG: 12,
  baseCarbsG: 60,
  baseServingG: 400,
  imageUrl: null,
  prepTimeMinutes: 40,
  tags: ['vegetarien'],
};

describe('RecipesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (fetchRecipes as jest.Mock).mockResolvedValue([CHICKEN_RECIPE, VEG_RECIPE]);
  });

  it('shows every recipe with no filter selected', async () => {
    const { findByText } = await render(<RecipesScreen />);
    expect(await findByText('Poulet grillé')).toBeTruthy();
    expect(await findByText('Buddha bowl')).toBeTruthy();
  });

  it('narrows the list when a category tag is selected', async () => {
    const { findByText, getByText, queryByText } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('Poulet'));

    expect(await findByText('Poulet grillé')).toBeTruthy();
    expect(queryByText('Buddha bowl')).toBeNull();
  });

  it('shows an empty state when no recipe matches the active filters', async () => {
    const { findByText, getByText } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('Poulet'));
    await fireEvent.press(getByText('Végétarien'));

    expect(await findByText('Aucune recette ne correspond')).toBeTruthy();
  });

  it('filters by prep time', async () => {
    const { findByText, getByText, queryByText } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('≤ 30 min'));

    expect(await findByText('Poulet grillé')).toBeTruthy();
    expect(queryByText('Buddha bowl')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest recipes-screen.test.tsx`
Expected: FAIL with "Cannot find module '../app/(tabs)/recipes'".

- [ ] **Step 3: Implement the multi-select tag component**

Create `src/components/TagFilterGroup.tsx`:

```tsx
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './ui/PressableScale';
import type { ChoiceOption } from './ChoiceGroup';
import { radius, shadow, spacing, state, typography, useThemeColors, type ThemeColors } from '../theme/tokens';

type TagFilterGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
};

export function TagFilterGroup<T extends string>({ options, value, onChange }: TagFilterGroupProps<T>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggle = (optionValue: T) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <PressableScale
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={selected ? styles.labelSelected : styles.label}>{option.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    pill: {
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md + 2,
      minHeight: state.minTouchSize,
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      ...shadow.card,
    },
    pillSelected: {
      backgroundColor: colors.accentRed,
      shadowColor: colors.accentRed,
      shadowOpacity: 0.25,
    },
    label: { ...typography.subheading, color: colors.textPrimary },
    labelSelected: { ...typography.subheading, color: colors.textOnAccent },
  });
}
```

`ChoiceGroup` doesn't currently export `ChoiceOption` for outside use in a
type-only import from another module — check `src/components/ChoiceGroup.tsx:6`;
it already has `export type ChoiceOption<T extends string> = ...`, so no
change is needed there.

- [ ] **Step 4: Implement the screen**

Create `src/app/(tabs)/recipes.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { fetchRecipes, type Recipe } from '../../lib/mealPlanData';
import type { MealType } from '../../lib/mealPlan';
import { filterRecipes, type RecipeFilters, type PrepTimeFilter } from '../../lib/recipeFilters';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { TagFilterGroup } from '../../components/TagFilterGroup';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { centeredContent, radius, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

const MEAL_TYPE_OPTIONS: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'breakfast', label: 'Petit déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
];

const TAG_OPTIONS: { value: string; label: string }[] = [
  { value: 'poulet', label: 'Poulet' },
  { value: 'boeuf', label: 'Bœuf' },
  { value: 'porc', label: 'Porc' },
  { value: 'dinde', label: 'Dinde' },
  { value: 'poisson_fruits_de_mer', label: 'Poisson & fruits de mer' },
  { value: 'oeuf', label: 'Œuf' },
  { value: 'vegetarien', label: 'Végétarien' },
];

const PREP_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: '15', label: '≤ 15 min' },
  { value: '30', label: '≤ 30 min' },
  { value: '45', label: '≤ 45 min' },
];

function parsePrepTimeFilter(value: string): PrepTimeFilter {
  return value === 'all' ? 'all' : (Number(value) as PrepTimeFilter);
}

export default function RecipesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType | 'all'>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [prepTimeValue, setPrepTimeValue] = useState('all');

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const allRecipes = await fetchRecipes();
      setRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des recettes.');
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

  const filters: RecipeFilters = {
    mealType,
    tags,
    maxPrepTimeMinutes: parsePrepTimeFilter(prepTimeValue),
  };
  const filteredRecipes = filterRecipes(recipes, filters);

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <ChoiceGroup options={MEAL_TYPE_OPTIONS} value={mealType} onChange={setMealType} />
      <TagFilterGroup options={TAG_OPTIONS} value={tags} onChange={setTags} />
      <ChoiceGroup options={PREP_TIME_OPTIONS} value={prepTimeValue} onChange={setPrepTimeValue} />

      {filteredRecipes.length === 0 ? (
        <EmptyState
          title="Aucune recette ne correspond"
          message="Essaie d'assouplir tes filtres pour voir plus de résultats."
        />
      ) : (
        filteredRecipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
          >
            <Card style={styles.recipeCard}>
              <View style={styles.recipeRow}>
                <View style={styles.thumbFrame}>
                  {recipe.imageUrl && <Image source={{ uri: recipe.imageUrl }} style={styles.thumb} />}
                </View>
                <View style={styles.recipeText}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <Text style={styles.recipeMeta}>{Math.round(recipe.baseCalories)} kcal</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
    recipeCard: { marginBottom: spacing.sm },
    recipeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    thumbFrame: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
      backgroundColor: colors.bgSunken,
      overflow: 'hidden',
    },
    thumb: { width: '100%', height: '100%' },
    recipeText: { flex: 1 },
    recipeName: { ...typography.bodyStrong, color: colors.textPrimary },
    recipeMeta: { ...typography.caption, color: colors.textSecondary },
  });
}
```

- [ ] **Step 5: Register the new tab**

In `src/app/(tabs)/_layout.tsx`, add a new `<Tabs.Screen>` for `recipes`
right after the `plan` screen (position: Accueil, Plan, **Recettes**,
Muscu, Courses, Poids):

```tsx
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recettes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={22} color={color} />
          ),
        }}
      />
```

Insert it between the closing `/>` of the `plan` screen block and the
opening `<Tabs.Screen name="workout" ...>` block.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest recipes-screen.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 7: Run the full test suite**

Run: `npx jest --testPathIgnorePatterns "/node_modules/" "\.claude"`
(this repo can accumulate stale copies of itself under `.claude/worktrees/`
from past sessions, each with its own possibly-broken `node_modules` — a
bare `npx jest` sweeps those in as unrelated spurious failures, so scope
every full-suite run with this ignore pattern instead. Check
`.claude/worktrees/` for stale entries and skip the pattern if none exist.)
Expected: all suites passing, no regressions from the `Recipe` type
change touching `plan.tsx` / `recipe/[id].tsx` (neither destructures the
full `Recipe` shape exhaustively, so the two new fields are additive and
don't need changes there).

- [ ] **Step 8: Commit**

```bash
git add src/components/TagFilterGroup.tsx src/app/\(tabs\)/recipes.tsx src/app/\(tabs\)/_layout.tsx src/__tests__/recipes-screen.test.tsx
git commit -m "feat: add Recettes tab with meal-type, category, and prep-time filters"
```

---

## Final check

- [ ] Run the full test suite: `npx jest --testPathIgnorePatterns "/node_modules/" "\.claude"`
  Expected: all tests pass, including the new/updated
  `mealPlanData.test.ts`, `recipeFilters.test.ts`, and
  `recipes-screen.test.tsx`.
- [ ] Confirm with the human partner that migration
  `0019_recipe_tags_and_prep_time.sql` has been applied to the real
  Supabase project (Task 1, Step 3) — the app will show every recipe with
  no tags and no prep time until it is.
