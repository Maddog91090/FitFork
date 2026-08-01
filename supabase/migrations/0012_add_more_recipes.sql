-- Seed data: 4 new recipes (2 lunch, 2 dinner)
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Bowl bœuf teriyaki express', 'dinner', 520, 40, 18, 48, 430),
  ('Salade thaï poulet-cacahuète', 'lunch', 430, 42, 20, 18, 370),
  ('Saumon laqué miso-soja, brocoli sauté', 'dinner', 470, 37, 26, 22, 390),
  ('Sauté de crevettes, nouilles & légumes croquants', 'lunch', 445, 34, 9, 52, 420)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Bœuf émincé (bavette ou haché)', 180, 'g' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Riz', 120, 'g' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Sauce soja', 30, 'ml' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Miel', 5, 'g' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Ail', 2, 'piece' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Gingembre râpé', 5, 'g' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Concombre', 0.5, 'piece' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Graines de sésame', 5, 'g' from public.recipes where name = 'Bowl bœuf teriyaki express'
union all select id, 'Blanc de poulet', 150, 'g' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Chou blanc', 100, 'g' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Carotte râpée', 50, 'g' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Coriandre', 5, 'g' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Beurre de cacahuète', 15, 'g' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Sauce soja', 15, 'ml' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Citron vert', 0.5, 'piece' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Piment', 1, 'g' from public.recipes where name = 'Salade thaï poulet-cacahuète'
union all select id, 'Saumon', 150, 'g' from public.recipes where name = 'Saumon laqué miso-soja, brocoli sauté'
union all select id, 'Miso', 15, 'g' from public.recipes where name = 'Saumon laqué miso-soja, brocoli sauté'
union all select id, 'Sauce soja', 5, 'ml' from public.recipes where name = 'Saumon laqué miso-soja, brocoli sauté'
union all select id, 'Miel', 5, 'g' from public.recipes where name = 'Saumon laqué miso-soja, brocoli sauté'
union all select id, 'Brocoli', 200, 'g' from public.recipes where name = 'Saumon laqué miso-soja, brocoli sauté'
union all select id, 'Ail', 1, 'piece' from public.recipes where name = 'Saumon laqué miso-soja, brocoli sauté'
union all select id, 'Crevettes', 150, 'g' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
union all select id, 'Poivron', 100, 'g' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
union all select id, 'Pois gourmands', 50, 'g' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
union all select id, 'Nouilles de riz (cuites)', 80, 'g' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
union all select id, 'Sauce soja', 15, 'ml' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
union all select id, 'Huile de sésame', 5, 'ml' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
union all select id, 'Ail', 1, 'piece' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
union all select id, 'Gingembre', 5, 'g' from public.recipes where name = 'Sauté de crevettes, nouilles & légumes croquants'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Bowl bœuf teriyaki express', 1, 'Saisis le bœuf émincé 3 minutes à feu vif dans une poêle ou un wok.'),
  ('Bowl bœuf teriyaki express', 2, 'Prépare une sauce minute avec la sauce soja, le miel, l''ail et le gingembre râpé, puis nappe le bœuf.'),
  ('Bowl bœuf teriyaki express', 3, 'Sers sur le riz avec le concombre en bâtonnets et les graines de sésame.'),
  ('Salade thaï poulet-cacahuète', 1, 'Fais poêler le poulet émincé quelques minutes jusqu''à ce qu''il soit doré.'),
  ('Salade thaï poulet-cacahuète', 2, 'Dispose-le sur un lit de chou blanc et de carotte râpés, puis parsème de coriandre.'),
  ('Salade thaï poulet-cacahuète', 3, 'Mélange le beurre de cacahuète, la sauce soja, le citron vert et le piment, allonge d''un filet d''eau chaude, puis nappe la salade.'),
  ('Saumon laqué miso-soja, brocoli sauté', 1, 'Badigeonne le saumon d''un mélange miso, sauce soja et miel.'),
  ('Saumon laqué miso-soja, brocoli sauté', 2, 'Fais-le cuire à la poêle 4 minutes de chaque côté jusqu''à ce que ça caramélise.'),
  ('Saumon laqué miso-soja, brocoli sauté', 3, 'Fais sauter le brocoli au wok avec l''ail et sers-le à côté du saumon.'),
  ('Sauté de crevettes, nouilles & légumes croquants', 1, 'Fais sauter les crevettes au wok.'),
  ('Sauté de crevettes, nouilles & légumes croquants', 2, 'Ajoute le poivron et les pois gourmands, puis les nouilles de riz cuites.'),
  ('Sauté de crevettes, nouilles & légumes croquants', 3, 'Assaisonne avec la sauce soja, l''huile de sésame, l''ail et le gingembre, puis mélange bien.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
