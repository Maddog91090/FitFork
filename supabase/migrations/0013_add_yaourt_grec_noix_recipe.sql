-- Seed data: 1 new snack recipe
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Yaourt grec, miel & noix', 'snack', 220, 15, 11, 16, 170)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Yaourt grec', 150, 'g' from public.recipes where name = 'Yaourt grec, miel & noix'
union all select id, 'Miel', 5, 'g' from public.recipes where name = 'Yaourt grec, miel & noix'
union all select id, 'Cerneaux de noix', 15, 'g' from public.recipes where name = 'Yaourt grec, miel & noix'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Yaourt grec, miel & noix', 1, 'Verse le yaourt grec dans un bol.'),
  ('Yaourt grec, miel & noix', 2, 'Arrose d''un filet de miel.'),
  ('Yaourt grec, miel & noix', 3, 'Parsème de cerneaux de noix concassés juste avant de servir.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
