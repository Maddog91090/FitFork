-- Seed data: 1 new dinner recipe
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 'dinner', 440, 45, 14, 30, 420)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Escalope de poulet', 150, 'g' from public.recipes where name = 'Escalope de poulet, sauce moutarde légère & haricots verts'
union all select id, 'Moutarde', 15, 'ml' from public.recipes where name = 'Escalope de poulet, sauce moutarde légère & haricots verts'
union all select id, 'Fromage blanc', 45, 'g' from public.recipes where name = 'Escalope de poulet, sauce moutarde légère & haricots verts'
union all select id, 'Haricots verts', 200, 'g' from public.recipes where name = 'Escalope de poulet, sauce moutarde légère & haricots verts'
union all select id, 'Pommes de terre', 150, 'g' from public.recipes where name = 'Escalope de poulet, sauce moutarde légère & haricots verts'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 1, 'Fais poêler l''escalope de poulet jusqu''à ce qu''elle soit bien cuite.'),
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 2, 'Déglace avec la moutarde, le fromage blanc et un filet d''eau chaude pour obtenir une sauce crémeuse sans crème.'),
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 3, 'Fais cuire les haricots verts et les pommes de terre à la vapeur, puis sers le tout ensemble.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
