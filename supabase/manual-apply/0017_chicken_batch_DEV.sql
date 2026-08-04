-- Seed data: 3 new chicken recipes (1 lunch, 1 dinner, 1 snack)
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Poulet katsu, riz & salade de chou', 'dinner', 560, 49, 11, 66, 450),
  ('Pâtes au poulet, tomates cerises & basilic', 'lunch', 600, 46, 18, 63, 450),
  ('Galettes de riz, poulet & houmous', 'snack', 190, 19, 6, 16, 130)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Blanc de poulet', 150, 'g' from public.recipes where name = 'Poulet katsu, riz & salade de chou'
union all select id, 'Chapelure', 25, 'g' from public.recipes where name = 'Poulet katsu, riz & salade de chou'
union all select id, 'Œufs', 1, 'piece' from public.recipes where name = 'Poulet katsu, riz & salade de chou'
union all select id, 'Riz', 50, 'g' from public.recipes where name = 'Poulet katsu, riz & salade de chou'
union all select id, 'Chou blanc', 80, 'g' from public.recipes where name = 'Poulet katsu, riz & salade de chou'
union all select id, 'Carottes', 40, 'g' from public.recipes where name = 'Poulet katsu, riz & salade de chou'
union all select id, 'Sauce soja', 15, 'ml' from public.recipes where name = 'Poulet katsu, riz & salade de chou'
union all select id, 'Blanc de poulet', 130, 'g' from public.recipes where name = 'Pâtes au poulet, tomates cerises & basilic'
union all select id, 'Pâtes', 80, 'g' from public.recipes where name = 'Pâtes au poulet, tomates cerises & basilic'
union all select id, 'Tomates cerises', 120, 'g' from public.recipes where name = 'Pâtes au poulet, tomates cerises & basilic'
union all select id, 'Parmesan', 15, 'g' from public.recipes where name = 'Pâtes au poulet, tomates cerises & basilic'
union all select id, 'Huile d''olive', 10, 'ml' from public.recipes where name = 'Pâtes au poulet, tomates cerises & basilic'
union all select id, 'Ail', 1, 'piece' from public.recipes where name = 'Pâtes au poulet, tomates cerises & basilic'
union all select id, 'Basilic', 5, 'g' from public.recipes where name = 'Pâtes au poulet, tomates cerises & basilic'
union all select id, 'Galette de riz complet', 2, 'piece' from public.recipes where name = 'Galettes de riz, poulet & houmous'
union all select id, 'Blanc de poulet', 70, 'g' from public.recipes where name = 'Galettes de riz, poulet & houmous'
union all select id, 'Houmous', 30, 'g' from public.recipes where name = 'Galettes de riz, poulet & houmous'
union all select id, 'Piment d''Espelette', 1, 'g' from public.recipes where name = 'Galettes de riz, poulet & houmous'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Poulet katsu, riz & salade de chou', 1, 'Aplatis le blanc de poulet, passe-le dans l''œuf battu puis dans la chapelure en pressant bien.'),
  ('Poulet katsu, riz & salade de chou', 2, 'Fais-le cuire au four à 200 °C pendant 20 minutes jusqu''à ce que la panure soit dorée et croustillante.'),
  ('Poulet katsu, riz & salade de chou', 3, 'Fais cuire le riz selon les instructions du paquet, et émince finement le chou blanc et les carottes.'),
  ('Poulet katsu, riz & salade de chou', 4, 'Tranche le poulet en lanières et sers-le sur le riz avec la salade de chou et la sauce soja.'),
  ('Pâtes au poulet, tomates cerises & basilic', 1, 'Fais cuire les pâtes dans l''eau bouillante salée selon les instructions du paquet.'),
  ('Pâtes au poulet, tomates cerises & basilic', 2, 'Fais dorer le poulet coupé en morceaux dans l''huile d''olive avec l''ail écrasé.'),
  ('Pâtes au poulet, tomates cerises & basilic', 3, 'Ajoute les tomates cerises coupées en deux et laisse-les compoter quelques minutes.'),
  ('Pâtes au poulet, tomates cerises & basilic', 4, 'Mélange avec les pâtes égouttées, puis termine avec le parmesan et le basilic ciselé.'),
  ('Galettes de riz, poulet & houmous', 1, 'Tartine les galettes de riz avec le houmous.'),
  ('Galettes de riz, poulet & houmous', 2, 'Répartis le poulet cuit et effiloché par-dessus, puis saupoudre de piment d''Espelette.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
