# Recipe Detail Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tapping a meal entry on the plan screen navigates to a dedicated recipe detail screen showing macros, ingredients with quantities, and step-by-step preparation instructions.

**Architecture:** `recipes.preparation` (a single free-text paragraph, added by the previous branch) is replaced by a new `recipe_instructions` table mirroring `exercise_instructions`'s shape (ordered steps per recipe). A new screen `src/app/recipe/[id].tsx` fetches the recipe, its ingredients, and its instructions in parallel and renders them. `plan.tsx`'s tap-to-expand is removed in favor of navigating to this screen.

**Tech Stack:** Expo (React Native, TypeScript, Expo Router dynamic routes), Supabase (Postgres, RLS, PostgREST), Jest (`jest-expo` preset) with mocked Supabase client for `*Data.ts` files.

## Global Constraints

- Migrations are SQL files applied manually via the Supabase SQL Editor (no CLI access). Apply in small numbered pieces with curl verification between each.
- `src/lib/<name>.ts` files are pure (no Supabase import); `<name>Data.ts` files hold I/O, tested via `jest.mock('../lib/supabase', () => ({ supabase: { from: jest.fn() } }))`.
- No dedicated UI test for `plan.tsx` or the new `recipe/[id].tsx` screen — consistent with every other screen in this project, verified manually instead.
- This plan does not touch `src/lib/mealPlan.ts`'s selection/generation logic, or the "Échanger" swap behavior in `plan.tsx` — only the preparation-content model and how it's displayed.

---

### Task 1: Schema migration — replace preparation column with recipe_instructions table

**Files:**
- Create: `supabase/migrations/0009_recipe_instructions.sql`

**Interfaces:**
- Produces: `recipes.preparation` column dropped. New table `recipe_instructions` (id, recipe_id, step_number, text — public-read RLS, single select policy, no write policies). Task 2's `mealPlanData.ts` queries this exact table/column names and no longer selects `recipes.preparation`.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0009_recipe_instructions.sql`:

```sql
alter table public.recipes drop column if exists preparation;

create table if not exists public.recipe_instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  step_number integer not null check (step_number >= 1),
  text text not null
);

alter table public.recipe_instructions enable row level security;

create policy "Anyone can read recipe instructions"
  on public.recipe_instructions for select
  using (true);

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Porridge avoine-banane', 1, 'Fais chauffer le lait dans une casserole.'),
  ('Porridge avoine-banane', 2, 'Ajoute les flocons d''avoine et laisse mijoter à feu doux pendant 5 minutes en remuant régulièrement.'),
  ('Porridge avoine-banane', 3, 'Écrase la banane et incorpore-la en fin de cuisson, puis sers chaud.'),
  ('Œufs brouillés et pain complet', 1, 'Bats les œufs dans un bol avec une pincée de sel.'),
  ('Œufs brouillés et pain complet', 2, 'Fais-les cuire à feu doux dans une poêle beurrée en remuant constamment jusqu''à obtenir une texture crémeuse.'),
  ('Œufs brouillés et pain complet', 3, 'Sers avec les tranches de pain complet légèrement toastées.'),
  ('Yaourt grec, granola et fruits rouges', 1, 'Verse le yaourt grec dans un bol.'),
  ('Yaourt grec, granola et fruits rouges', 2, 'Ajoute le granola par-dessus pour garder son croquant.'),
  ('Yaourt grec, granola et fruits rouges', 3, 'Termine avec les fruits rouges frais ou décongelés.'),
  ('Pancakes protéinés', 1, 'Mélange la farine, les œufs et la whey protéine jusqu''à obtenir une pâte homogène sans grumeaux.'),
  ('Pancakes protéinés', 2, 'Fais chauffer une poêle légèrement huilée à feu moyen.'),
  ('Pancakes protéinés', 3, 'Verse des petites louches de pâte et fais cuire 2 minutes de chaque côté jusqu''à ce que des bulles apparaissent en surface.'),
  ('Poulet grillé, riz et brocolis', 1, 'Fais cuire le riz selon les instructions du paquet.'),
  ('Poulet grillé, riz et brocolis', 2, 'Grille le blanc de poulet à la poêle ou au grill 5-6 minutes de chaque côté.'),
  ('Poulet grillé, riz et brocolis', 3, 'Fais cuire les brocolis à la vapeur 8 minutes.'),
  ('Poulet grillé, riz et brocolis', 4, 'Assemble le tout dans une assiette.'),
  ('Saumon, quinoa et légumes vapeur', 1, 'Rince le quinoa puis fais-le cuire dans deux fois son volume d''eau pendant environ 15 minutes.'),
  ('Saumon, quinoa et légumes vapeur', 2, 'Cuis le pavé de saumon à la poêle ou au four 12-15 minutes.'),
  ('Saumon, quinoa et légumes vapeur', 3, 'Fais cuire les légumes à la vapeur en parallèle.'),
  ('Wrap dinde-avocat', 1, 'Écrase l''avocat à la fourchette et tartine-le sur la tortilla.'),
  ('Wrap dinde-avocat', 2, 'Ajoute les tranches de dinde par-dessus.'),
  ('Wrap dinde-avocat', 3, 'Roule fermement le wrap et coupe-le en deux.'),
  ('Buddha bowl pois chiches', 1, 'Fais cuire le riz selon les instructions du paquet.'),
  ('Buddha bowl pois chiches', 2, 'Rince les pois chiches et fais-les revenir quelques minutes à la poêle avec les épinards jusqu''à ce qu''ils soient tendres.'),
  ('Buddha bowl pois chiches', 3, 'Dresse le tout dans un bol.'),
  ('Steak haché, patate douce et haricots verts', 1, 'Coupe la patate douce en cubes et fais-la rôtir au four 25 minutes à 200°C.'),
  ('Steak haché, patate douce et haricots verts', 2, 'Fais cuire les haricots verts à la vapeur.'),
  ('Steak haché, patate douce et haricots verts', 3, 'Saisis le steak haché à la poêle 3-4 minutes de chaque côté selon la cuisson désirée.'),
  ('Pâtes bolognaise (bœuf 5%)', 1, 'Fais cuire les pâtes dans l''eau bouillante salée selon les instructions du paquet.'),
  ('Pâtes bolognaise (bœuf 5%)', 2, 'Fais revenir le bœuf haché dans une poêle jusqu''à ce qu''il soit doré.'),
  ('Pâtes bolognaise (bœuf 5%)', 3, 'Ajoute la sauce tomate et laisse mijoter 10 minutes.'),
  ('Pâtes bolognaise (bœuf 5%)', 4, 'Mélange aux pâtes égouttées.'),
  ('Cabillaud, riz basmati et courgettes', 1, 'Fais cuire le riz basmati selon les instructions du paquet.'),
  ('Cabillaud, riz basmati et courgettes', 2, 'Fais cuire le cabillaud à la vapeur ou au four 12 minutes.'),
  ('Cabillaud, riz basmati et courgettes', 3, 'Fais revenir les courgettes coupées en rondelles à la poêle avec un filet d''huile d''olive.'),
  ('Tofu sauté, nouilles et légumes', 1, 'Fais cuire les nouilles selon les instructions du paquet.'),
  ('Tofu sauté, nouilles et légumes', 2, 'Coupe le tofu en cubes et fais-le dorer à la poêle avec un peu d''huile.'),
  ('Tofu sauté, nouilles et légumes', 3, 'Ajoute les légumes sautés et mélange le tout avec les nouilles égouttées.'),
  ('Barre protéinée maison', 1, 'Mélange les flocons d''avoine avec la whey protéine et un peu d''eau ou de lait jusqu''à obtenir une pâte compacte.'),
  ('Barre protéinée maison', 2, 'Étale-la sur une plaque et tasse bien.'),
  ('Barre protéinée maison', 3, 'Réfrigère au moins 1 heure avant de découper en barres.'),
  ('Pomme et beurre de cacahuète', 1, 'Coupe la pomme en quartiers.'),
  ('Pomme et beurre de cacahuète', 2, 'Sers-la accompagnée du beurre de cacahuète pour tremper.'),
  ('Fromage blanc et miel', 1, 'Verse le fromage blanc dans un bol.'),
  ('Fromage blanc et miel', 2, 'Arrose-le d''un filet de miel juste avant de servir.'),
  ('Muesli maison et lait d''amande', 1, 'Verse le muesli dans un bol.'),
  ('Muesli maison et lait d''amande', 2, 'Ajoute le lait d''amande froid par-dessus juste avant de servir pour garder le croquant.'),
  ('Omelette au fromage et jambon', 1, 'Bats les œufs dans un bol avec une pincée de sel.'),
  ('Omelette au fromage et jambon', 2, 'Fais chauffer une poêle beurrée et verse les œufs.'),
  ('Omelette au fromage et jambon', 3, 'Ajoute le jambon coupé en dés et le fromage râpé.'),
  ('Omelette au fromage et jambon', 4, 'Replie l''omelette en deux une fois prise.'),
  ('Smoothie bowl banane-myrtille', 1, 'Mixe la banane, les myrtilles et le yaourt grec ensemble jusqu''à obtenir une texture épaisse et lisse.'),
  ('Smoothie bowl banane-myrtille', 2, 'Verse dans un bol et ajoute des toppings de ton choix si tu veux.'),
  ('Toast à l''avocat et œuf poché', 1, 'Fais toaster le pain complet.'),
  ('Toast à l''avocat et œuf poché', 2, 'Poche les œufs dans une casserole d''eau frémissante additionnée d''un peu de vinaigre pendant 3 minutes.'),
  ('Toast à l''avocat et œuf poché', 3, 'Écrase l''avocat sur le pain toasté et dépose l''œuf poché par-dessus.'),
  ('Crêpes à la farine complète et miel', 1, 'Mélange la farine complète avec les œufs et un peu de lait pour obtenir une pâte à crêpe fluide.'),
  ('Crêpes à la farine complète et miel', 2, 'Fais cuire les crêpes dans une poêle chaude légèrement huilée.'),
  ('Crêpes à la farine complète et miel', 3, 'Arrose de miel avant de servir.'),
  ('Bagel au saumon fumé et fromage frais', 1, 'Coupe le bagel en deux et fais-le légèrement toaster.'),
  ('Bagel au saumon fumé et fromage frais', 2, 'Tartine de fromage frais.'),
  ('Bagel au saumon fumé et fromage frais', 3, 'Ajoute les tranches de saumon fumé par-dessus.'),
  ('Porridge protéiné chocolat-noisette', 1, 'Fais chauffer le lait dans une casserole.'),
  ('Porridge protéiné chocolat-noisette', 2, 'Ajoute les flocons d''avoine et laisse mijoter à feu doux 5 minutes.'),
  ('Porridge protéiné chocolat-noisette', 3, 'Incorpore la whey protéine hors du feu en remuant bien pour éviter les grumeaux.'),
  ('Gaufres maison et fruits', 1, 'Mélange la farine avec les œufs et un peu de lait pour former une pâte à gaufre.'),
  ('Gaufres maison et fruits', 2, 'Fais cuire dans un gaufrier chaud quelques minutes jusqu''à ce qu''elles soient dorées.'),
  ('Gaufres maison et fruits', 3, 'Sers avec les fruits rouges.'),
  ('Skyr et flocons d''avoine', 1, 'Verse le skyr dans un bol.'),
  ('Skyr et flocons d''avoine', 2, 'Ajoute les flocons d''avoine.'),
  ('Skyr et flocons d''avoine', 3, 'Arrose d''un filet de miel avant de servir.'),
  ('Sandwich œufs-bacon', 1, 'Fais cuire le bacon à la poêle jusqu''à ce qu''il soit croustillant.'),
  ('Sandwich œufs-bacon', 2, 'Fais cuire les œufs au plat ou brouillés.'),
  ('Sandwich œufs-bacon', 3, 'Assemble le tout entre les tranches de pain complet.'),
  ('Salade César au poulet', 1, 'Grille le blanc de poulet à la poêle 5-6 minutes de chaque côté puis coupe-le en lamelles.'),
  ('Salade César au poulet', 2, 'Mélange la salade romaine avec le parmesan râpé.'),
  ('Salade César au poulet', 3, 'Dispose le poulet par-dessus.'),
  ('Riz sauté au tofu et légumes', 1, 'Fais cuire le riz selon les instructions du paquet puis laisse-le refroidir si possible.'),
  ('Riz sauté au tofu et légumes', 2, 'Fais dorer le tofu coupé en cubes à la poêle.'),
  ('Riz sauté au tofu et légumes', 3, 'Ajoute les légumes sautés et le riz, et fais sauter le tout à feu vif quelques minutes.'),
  ('Poke bowl saumon-avocat', 1, 'Fais cuire le riz selon les instructions du paquet et laisse-le tiédir.'),
  ('Poke bowl saumon-avocat', 2, 'Coupe le saumon en cubes et tranche l''avocat.'),
  ('Poke bowl saumon-avocat', 3, 'Dresse le tout sur le riz.'),
  ('Sandwich club poulet-bacon', 1, 'Fais cuire le bacon à la poêle jusqu''à ce qu''il soit croustillant.'),
  ('Sandwich club poulet-bacon', 2, 'Grille le blanc de poulet.'),
  ('Sandwich club poulet-bacon', 3, 'Assemble entre les tranches de pain complet en superposant poulet et bacon.'),
  ('Pâtes au thon et tomates', 1, 'Fais cuire les pâtes dans l''eau bouillante salée selon les instructions du paquet.'),
  ('Pâtes au thon et tomates', 2, 'Fais chauffer la sauce tomate dans une poêle.'),
  ('Pâtes au thon et tomates', 3, 'Émiette le thon égoutté et mélange le tout aux pâtes égouttées.'),
  ('Curry de poulet et riz basmati', 1, 'Fais cuire le riz basmati selon les instructions du paquet.'),
  ('Curry de poulet et riz basmati', 2, 'Fais dorer le blanc de poulet coupé en morceaux dans une poêle.'),
  ('Curry de poulet et riz basmati', 3, 'Ajoute le lait de coco et laisse mijoter 10 minutes à feu doux.'),
  ('Salade de lentilles et feta', 1, 'Fais cuire les lentilles selon les instructions du paquet puis laisse-les refroidir.'),
  ('Salade de lentilles et feta', 2, 'Mélange-les avec les légumes coupés en dés.'),
  ('Salade de lentilles et feta', 3, 'Émiette la feta par-dessus.'),
  ('Burrito bœuf-haricots rouges', 1, 'Fais revenir le bœuf haché à la poêle jusqu''à ce qu''il soit doré.'),
  ('Burrito bœuf-haricots rouges', 2, 'Ajoute les haricots rouges égouttés et laisse chauffer quelques minutes.'),
  ('Burrito bœuf-haricots rouges', 3, 'Garnis la tortilla et roule fermement le burrito.'),
  ('Bol de quinoa aux crevettes', 1, 'Rince le quinoa et fais-le cuire dans deux fois son volume d''eau environ 15 minutes.'),
  ('Bol de quinoa aux crevettes', 2, 'Fais sauter les crevettes à la poêle 3-4 minutes jusqu''à ce qu''elles soient roses.'),
  ('Bol de quinoa aux crevettes', 3, 'Dresse le tout avec les légumes vapeur.'),
  ('Sandwich thon-crudités', 1, 'Égoutte le thon et mélange-le avec les crudités coupées en petits morceaux.'),
  ('Sandwich thon-crudités', 2, 'Garnis les tranches de pain complet avec ce mélange.'),
  ('Poulet rôti et pommes de terre', 1, 'Fais rôtir la cuisse de poulet au four à 200°C pendant 35-40 minutes jusqu''à ce que la peau soit dorée.'),
  ('Poulet rôti et pommes de terre', 2, 'Fais cuire les pommes de terre coupées en morceaux au four en même temps.'),
  ('Poulet rôti et pommes de terre', 3, 'Fais cuire les haricots verts à la vapeur.'),
  ('Chili con carne et riz', 1, 'Fais cuire le riz selon les instructions du paquet.'),
  ('Chili con carne et riz', 2, 'Fais revenir le bœuf haché à la poêle jusqu''à ce qu''il soit doré.'),
  ('Chili con carne et riz', 3, 'Ajoute les haricots rouges égouttés et laisse mijoter 15 minutes à feu doux.'),
  ('Gratin de saumon et brocolis', 1, 'Fais cuire les brocolis à la vapeur quelques minutes.'),
  ('Gratin de saumon et brocolis', 2, 'Dispose le saumon et les brocolis dans un plat à gratin, nappe de crème légère.'),
  ('Gratin de saumon et brocolis', 3, 'Fais cuire au four à 200°C pendant 20 minutes.'),
  ('Escalope de dinde et purée', 1, 'Fais cuire l''escalope de dinde à la poêle 4-5 minutes de chaque côté.'),
  ('Escalope de dinde et purée', 2, 'Fais bouillir les pommes de terre jusqu''à ce qu''elles soient tendres.'),
  ('Escalope de dinde et purée', 3, 'Écrase-les avec le beurre pour former une purée.'),
  ('Risotto aux champignons et parmesan', 1, 'Fais revenir le riz arborio dans une poêle.'),
  ('Risotto aux champignons et parmesan', 2, 'Ajoute progressivement du bouillon chaud en remuant régulièrement jusqu''à absorption complète, environ 18 minutes.'),
  ('Risotto aux champignons et parmesan', 3, 'Incorpore les champignons poêlés et le parmesan râpé en fin de cuisson.'),
  ('Curry de crevettes et riz', 1, 'Fais cuire le riz selon les instructions du paquet.'),
  ('Curry de crevettes et riz', 2, 'Fais sauter les crevettes à la poêle 2-3 minutes.'),
  ('Curry de crevettes et riz', 3, 'Ajoute le lait de coco et laisse mijoter 5 minutes à feu doux.'),
  ('Poêlée de bœuf et légumes asiatiques', 1, 'Fais chauffer un filet d''huile dans un wok ou une grande poêle.'),
  ('Poêlée de bœuf et légumes asiatiques', 2, 'Fais saisir le bœuf émincé à feu vif quelques minutes.'),
  ('Poêlée de bœuf et légumes asiatiques', 3, 'Ajoute les légumes sautés et la sauce soja, puis mélange bien avant de servir.'),
  ('Lasagnes à la viande', 1, 'Fais revenir le bœuf haché à la poêle avec la sauce tomate pendant 10 minutes.'),
  ('Lasagnes à la viande', 2, 'Monte les lasagnes en alternant plaques de pâtes et sauce à la viande.'),
  ('Lasagnes à la viande', 3, 'Fais cuire au four à 200°C pendant 30 minutes.'),
  ('Filet de poisson blanc et légumes rôtis', 1, 'Coupe les légumes et fais-les rôtir au four à 200°C avec un filet d''huile d''olive pendant 20 minutes.'),
  ('Filet de poisson blanc et légumes rôtis', 2, 'Fais cuire le filet de poisson blanc à la poêle ou au four 10-12 minutes.'),
  ('Chili végétarien et riz complet', 1, 'Fais cuire le riz complet selon les instructions du paquet.'),
  ('Chili végétarien et riz complet', 2, 'Fais chauffer les haricots rouges égouttés avec la sauce tomate dans une casserole.'),
  ('Chili végétarien et riz complet', 3, 'Laisse mijoter 15 minutes à feu doux.'),
  ('Amandes et fruits secs', 1, 'Mélange les amandes et les fruits secs dans un petit bol, prêt à emporter.'),
  ('Smoothie protéiné banane', 1, 'Mixe la banane, le lait et la whey protéine ensemble jusqu''à obtenir une texture lisse et mousseuse.'),
  ('Houmous et bâtonnets de légumes', 1, 'Coupe les carottes et le concombre en bâtonnets.'),
  ('Houmous et bâtonnets de légumes', 2, 'Sers-les accompagnés du houmous pour tremper.'),
  ('Yaourt et granola', 1, 'Verse le yaourt grec dans un bol.'),
  ('Yaourt et granola', 2, 'Ajoute le granola par-dessus juste avant de servir pour garder son croquant.'),
  ('Barre de céréales maison', 1, 'Mélange les flocons d''avoine avec le miel et les fruits secs jusqu''à obtenir une pâte collante.'),
  ('Barre de céréales maison', 2, 'Étale sur une plaque et tasse bien.'),
  ('Barre de céréales maison', 3, 'Réfrigère au moins 1 heure avant de découper en barres.'),
  ('Fromage cottage et fruits rouges', 1, 'Verse le fromage cottage dans un bol.'),
  ('Fromage cottage et fruits rouges', 2, 'Ajoute les fruits rouges frais ou décongelés par-dessus.'),
  ('Toast au beurre de cacahuète et banane', 1, 'Fais toaster la tranche de pain complet.'),
  ('Toast au beurre de cacahuète et banane', 2, 'Tartine de beurre de cacahuète.'),
  ('Toast au beurre de cacahuète et banane', 3, 'Dispose les rondelles de banane par-dessus.'),
  ('Œuf dur et fruit', 1, 'Fais cuire les œufs dans l''eau bouillante pendant 9-10 minutes.'),
  ('Œuf dur et fruit', 2, 'Passe-les sous l''eau froide avant de les écaler.'),
  ('Œuf dur et fruit', 3, 'Sers accompagnés de la pomme.'),
  ('Shake protéiné chocolat', 1, 'Mixe la whey protéine avec le lait jusqu''à obtenir une texture lisse et mousseuse.'),
  ('Shake protéiné chocolat', 2, 'Sers immédiatement.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
```

- [ ] **Step 2: Apply the migration (manual — needs Supabase dashboard access)**

Apply in the Supabase SQL Editor in 2 numbered pieces:
1. `alter table public.recipes drop column if exists preparation;` + the `create table` + `enable row level security` + `create policy` statements — a confirmation dialog will likely appear for the RLS-enabling statement; accept it.
2. The `insert into ... select ... from (values ...) ... join` statement (151 step rows across 54 recipes).

Confirm no error banner appears after each piece before pasting the next.

- [ ] **Step 3: Verify via the REST API**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/recipes?select=preparation&limit=1" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
# Expected: 400 (column no longer exists)

curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/recipe_instructions?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" | grep -o '"id"' | wc -l
# Expected: 151
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0009_recipe_instructions.sql
git commit -m "Replace recipe preparation column with recipe_instructions table"
```

---

### Task 2: Data layer — drop preparation, add fetchRecipeInstructions

**Files:**
- Modify: `src/lib/mealPlanData.ts`
- Test: `src/__tests__/mealPlanData.test.ts`

**Interfaces:**
- Consumes: `recipe_instructions` table from Task 1 (columns `recipe_id`, `step_number`, `text`); `recipes` table no longer has `preparation`.
- Produces: `Recipe` type drops `preparation: string`. New `fetchRecipeInstructions(recipeId: string): Promise<string[]>` (ordered by `step_number`). Task 3's `recipe/[id].tsx` calls this exact function. `fetchRecipeIngredients`, `saveWeeklyPlan`, `getCurrentPlan`, `updatePlanEntry` are unchanged.

- [ ] **Step 1: Write the failing test**

In `src/__tests__/mealPlanData.test.ts`, update the import at the top to add `fetchRecipeInstructions`:

```ts
import {
  fetchRecipes,
  fetchRecipeIngredients,
  fetchRecipeInstructions,
  saveWeeklyPlan,
  getCurrentPlan,
  updatePlanEntry,
} from '../lib/mealPlanData';
```

Replace the `fetchRecipes` describe block's first test (leave the "throws on a Supabase error" test as-is, just remove `preparation` references if any — there are none in that second test):

```ts
describe('fetchRecipes', () => {
  it('maps rows to the Recipe shape', async () => {
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
      },
    ]);
    expect(order).toHaveBeenCalledWith('id');
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchRecipes()).rejects.toThrow('boom');
  });
});
```

Add a new describe block for `fetchRecipeInstructions` right after the `fetchRecipeIngredients` describe block (find it by searching for `describe('fetchRecipeIngredients'`):

```ts
describe('fetchRecipeInstructions', () => {
  it('returns step texts ordered by step_number', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        { step_number: 2, text: 'Deuxième étape.' },
        { step_number: 1, text: 'Première étape.' },
      ],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecipeInstructions('r1');

    expect(result).toEqual(['Première étape.', 'Deuxième étape.']);
    expect(eq).toHaveBeenCalledWith('recipe_id', 'r1');
    expect(order).toHaveBeenCalledWith('step_number');
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchRecipeInstructions('r1')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest mealPlanData.test.ts`
Expected: FAIL — `fetchRecipeInstructions` is not exported yet, and the `fetchRecipes` test's expectation no longer matching the current implementation's `preparation`-including output.

- [ ] **Step 3: Update the implementation**

In `src/lib/mealPlanData.ts`, remove `preparation` from the `Recipe` type:

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
```

Update `fetchRecipes` to drop `preparation` from the select string and the mapping:

```ts
export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g')
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
  }));
}
```

Add `fetchRecipeInstructions` right after `fetchRecipeIngredients`:

```ts
export async function fetchRecipeInstructions(recipeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('recipe_instructions')
    .select('step_number, text')
    .eq('recipe_id', recipeId)
    .order('step_number');

  if (error) throw error;

  return (data ?? []).map((row: any) => row.text);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest mealPlanData.test.ts`
Expected: PASS (all tests in the file, including the unmodified `fetchRecipeIngredients`, `saveWeeklyPlan`, `getCurrentPlan`, `updatePlanEntry` suites)

- [ ] **Step 5: Commit**

```bash
git add src/lib/mealPlanData.ts src/__tests__/mealPlanData.test.ts
git commit -m "Drop recipe preparation field, add fetchRecipeInstructions"
```

---

### Task 3: Recipe detail screen

**Files:**
- Create: `src/app/recipe/[id].tsx`

**Interfaces:**
- Consumes: `fetchRecipes`, `fetchRecipeIngredients`, `fetchRecipeInstructions` from `../../lib/mealPlanData` (Tasks 1-2). `Recipe`, `RecipeIngredient` types from the same module.
- Produces: a screen reachable at route `/recipe/[id]`. Task 4's `plan.tsx` navigates to this route.

- [ ] **Step 1: Create the screen**

Create `src/app/recipe/[id].tsx`:

```tsx
import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  fetchRecipes,
  fetchRecipeIngredients,
  fetchRecipeInstructions,
  type Recipe,
  type RecipeIngredient,
} from '../../lib/mealPlanData';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [allRecipes, allIngredients, steps] = await Promise.all([
        fetchRecipes(),
        fetchRecipeIngredients([id]),
        fetchRecipeInstructions(id),
      ]);
      setRecipe(allRecipes.find((r) => r.id === id) ?? null);
      setIngredients(allIngredients);
      setInstructions(steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la recette.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={styles.error}>{error ?? 'Recette introuvable.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.macros}>
        {recipe.baseCalories} kcal — {recipe.baseProteinG}g prot / {recipe.baseFatG}g lip / {recipe.baseCarbsG}g gluc ({recipe.baseServingG}g)
      </Text>

      <Text style={styles.sectionTitle}>Ingrédients</Text>
      {ingredients.map((ing, index) => (
        <Text key={index} style={styles.ingredientLine}>
          {ing.ingredientName} — {ing.quantity}{ing.unit}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Préparation</Text>
      {instructions.map((step, index) => (
        <Text key={index} style={styles.instructionLine}>
          {index + 1}. {step}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  macros: { color: '#666', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  ingredientLine: { marginBottom: 4 },
  instructionLine: { marginBottom: 8 },
  error: { color: 'red' },
});
```

- [ ] **Step 2: Run the full test suite**

Run: `npx jest`
Expected: PASS (no dedicated test exists for this screen, consistent with every other screen in this project — this confirms the new file didn't break any `*Data.ts`/`*.ts` test)

- [ ] **Step 3: Run the typecheck**

Run: `npx tsc --noEmit --project .`
Expected: zero errors referencing `src/app/recipe/[id].tsx` (pre-existing errors confined to `__tests__/*.test.ts` files, unrelated to this task, are expected and not a regression).

- [ ] **Step 4: Manually verify by direct navigation**

Start the app (`npx expo start --web`), and once you have a valid recipe id (e.g. from the Supabase Table Editor or by checking a network request on the plan screen), navigate directly to `http://localhost:8081/recipe/<that-id>` and confirm the screen shows the recipe's name, macros, ingredient list with quantities, and numbered preparation steps.

- [ ] **Step 5: Commit**

```bash
git add src/app/recipe/[id].tsx
git commit -m "Add recipe detail screen"
```

---

### Task 4: Navigate to the recipe detail screen from the plan

**Files:**
- Modify: `src/app/plan.tsx`

**Interfaces:**
- Consumes: the `/recipe/[id]` route from Task 3.
- Produces: nothing consumed by a later task (final task in this plan).

- [ ] **Step 1: Remove the expand/collapse state**

In `src/app/plan.tsx`, remove the `expanded` state and `toggleEntry` function (currently declared right after `swappingId`):

```ts
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleEntry = (entryId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };
```

Delete this block entirely — it's fully superseded by navigation.

- [ ] **Step 2: Change the row's tap target to navigate, and drop the inline preparation render**

Replace the per-entry rendering block with:

```tsx
              {dayEntries.map((entry) => {
                const recipe = recipeById.get(entry.recipeId);
                return (
                  <View key={entry.id} style={styles.entryContainer}>
                    <View style={styles.entryRow}>
                      <Pressable style={styles.entryInfo} onPress={() => router.push(`/recipe/${entry.recipeId}`)}>
                        <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                        <Text style={styles.recipeName}>
                          {recipe ? recipe.name : entry.recipeId} ({Math.round(entry.portionMultiplier * 100)}%)
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleSwap(entry.id, entry.mealType, entry.recipeId)}
                        disabled={swappingId === entry.id}
                      >
                        <Text style={styles.swapHint}>{swappingId === entry.id ? '...' : 'Échanger'}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
```

- [ ] **Step 3: Remove the now-unused preparationText style**

In the `StyleSheet.create({...})` block, remove the `preparationText` entry (no longer referenced):

```ts
  preparationText: { marginTop: 8, color: '#444' },
```

- [ ] **Step 4: Run the full test suite**

Run: `npx jest`
Expected: PASS (no dedicated test exists for `plan.tsx`)

- [ ] **Step 5: Run the typecheck**

Run: `npx tsc --noEmit --project .`
Expected: zero errors referencing `plan.tsx` (pre-existing test-file errors are expected and not a regression).

- [ ] **Step 6: Manually verify in the running app**

Start the app (`npx expo start --web`), open the meal plan screen, and confirm:
- Tapping a meal entry (the meal type + recipe name area) navigates to `/recipe/<id>` and shows that recipe's macros, ingredients, and numbered preparation steps.
- Navigating back returns to the plan screen with the plan still intact.
- Tapping "Échanger" still swaps the recipe, exactly as before, without navigating away.

- [ ] **Step 7: Commit**

```bash
git add src/app/plan.tsx
git commit -m "Navigate to recipe detail screen instead of inline expand"
```

---
