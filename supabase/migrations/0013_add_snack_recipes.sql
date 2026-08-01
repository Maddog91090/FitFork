-- Seed data: 3 new snack recipes
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Skyr + jambon roulé', 'snack', 180, 28, 3, 9, 190),
  ('Œufs durs + galettes de riz', 'snack', 230, 16, 11, 16, 120),
  ('Thon-fromage frais sur cracottes', 'snack', 210, 22, 6, 15, 110)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Skyr nature', 150, 'g' from public.recipes where name = 'Skyr + jambon roulé'
union all select id, 'Blanc de dinde (tranches)', 2, 'piece' from public.recipes where name = 'Skyr + jambon roulé'
union all select id, 'Œufs durs', 2, 'piece' from public.recipes where name = 'Œufs durs + galettes de riz'
union all select id, 'Galette de riz complet', 2, 'piece' from public.recipes where name = 'Œufs durs + galettes de riz'
union all select id, 'Thon (boîte, égoutté)', 70, 'g' from public.recipes where name = 'Thon-fromage frais sur cracottes'
union all select id, 'Fromage frais allégé (type St Môret)', 30, 'g' from public.recipes where name = 'Thon-fromage frais sur cracottes'
union all select id, 'Cracottes', 2, 'piece' from public.recipes where name = 'Thon-fromage frais sur cracottes'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Skyr + jambon roulé', 1, 'Verse le skyr nature poivré dans un bol pour tremper.'),
  ('Skyr + jambon roulé', 2, 'Roule les tranches de blanc de dinde et sers-les à côté.'),
  ('Œufs durs + galettes de riz', 1, 'Fais cuire les œufs dans l''eau bouillante 9-10 minutes (prépare-en 6 d''avance pour la semaine).'),
  ('Œufs durs + galettes de riz', 2, 'Passe-les sous l''eau froide, écale-les, puis sers-les avec les galettes de riz complet.'),
  ('Thon-fromage frais sur cracottes', 1, 'Égoutte le thon et écrase-le à la fourchette avec le fromage frais allégé.'),
  ('Thon-fromage frais sur cracottes', 2, 'Tartine le mélange sur les cracottes et sers.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
