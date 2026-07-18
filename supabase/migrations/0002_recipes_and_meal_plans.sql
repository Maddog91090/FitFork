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
