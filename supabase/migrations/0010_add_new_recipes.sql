-- Seed data: 4 new recipes (1 lunch, 3 dinner)
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Gnocchis poêlés, chorizo & tomates cerises', 'dinner', 560, 22, 24, 60, 440),
  ('Tartare de saumon avocat-mangue', 'lunch', 430, 34, 24, 20, 350),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 'dinner', 480, 35, 11, 55, 400),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 'dinner', 440, 33, 16, 38, 420)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Gnocchis', 200, 'g' from public.recipes where name = 'Gnocchis poêlés, chorizo & tomates cerises'
union all select id, 'Chorizo doux', 60, 'g' from public.recipes where name = 'Gnocchis poêlés, chorizo & tomates cerises'
union all select id, 'Tomates cerises', 150, 'g' from public.recipes where name = 'Gnocchis poêlés, chorizo & tomates cerises'
union all select id, 'Roquette', 30, 'g' from public.recipes where name = 'Gnocchis poêlés, chorizo & tomates cerises'
union all select id, 'Saumon', 150, 'g' from public.recipes where name = 'Tartare de saumon avocat-mangue'
union all select id, 'Avocat', 0.5, 'piece' from public.recipes where name = 'Tartare de saumon avocat-mangue'
union all select id, 'Mangue', 0.5, 'piece' from public.recipes where name = 'Tartare de saumon avocat-mangue'
union all select id, 'Citron vert', 0.5, 'piece' from public.recipes where name = 'Tartare de saumon avocat-mangue'
union all select id, 'Huile de sésame', 5, 'ml' from public.recipes where name = 'Tartare de saumon avocat-mangue'
union all select id, 'Sésame grillé', 5, 'g' from public.recipes where name = 'Tartare de saumon avocat-mangue'
union all select id, 'Crevettes', 150, 'g' from public.recipes where name = 'Crevettes ail-persil-piment, tagliatelles citronnées'
union all select id, 'Tagliatelles (poids sec)', 80, 'g' from public.recipes where name = 'Crevettes ail-persil-piment, tagliatelles citronnées'
union all select id, 'Ail', 2, 'piece' from public.recipes where name = 'Crevettes ail-persil-piment, tagliatelles citronnées'
union all select id, 'Persil', 5, 'g' from public.recipes where name = 'Crevettes ail-persil-piment, tagliatelles citronnées'
union all select id, 'Piment', 1, 'g' from public.recipes where name = 'Crevettes ail-persil-piment, tagliatelles citronnées'
union all select id, 'Citron', 1, 'piece' from public.recipes where name = 'Crevettes ail-persil-piment, tagliatelles citronnées'
union all select id, 'Parmesan', 15, 'g' from public.recipes where name = 'Crevettes ail-persil-piment, tagliatelles citronnées'
union all select id, 'Cabillaud', 150, 'g' from public.recipes where name = 'Cabillaud rôti, sauce vierge & écrasé de patate douce'
union all select id, 'Tomate', 1, 'piece' from public.recipes where name = 'Cabillaud rôti, sauce vierge & écrasé de patate douce'
union all select id, 'Olives', 20, 'g' from public.recipes where name = 'Cabillaud rôti, sauce vierge & écrasé de patate douce'
union all select id, 'Basilic', 5, 'g' from public.recipes where name = 'Cabillaud rôti, sauce vierge & écrasé de patate douce'
union all select id, 'Huile d''olive', 10, 'ml' from public.recipes where name = 'Cabillaud rôti, sauce vierge & écrasé de patate douce'
union all select id, 'Citron', 0.5, 'piece' from public.recipes where name = 'Cabillaud rôti, sauce vierge & écrasé de patate douce'
union all select id, 'Patate douce', 200, 'g' from public.recipes where name = 'Cabillaud rôti, sauce vierge & écrasé de patate douce'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Gnocchis poêlés, chorizo & tomates cerises', 1, 'Fais dorer les gnocchis à sec dans une poêle jusqu''à ce qu''ils soient croustillants.'),
  ('Gnocchis poêlés, chorizo & tomates cerises', 2, 'Ajoute le chorizo doux coupé en dés et les tomates cerises, laisse fondre 5 minutes.'),
  ('Gnocchis poêlés, chorizo & tomates cerises', 3, 'Termine avec une poignée de roquette avant de servir.'),
  ('Tartare de saumon avocat-mangue', 1, 'Coupe le saumon très frais au couteau en petits dés.'),
  ('Tartare de saumon avocat-mangue', 2, 'Ajoute l''avocat et la mangue coupés en petits dés, le jus de citron vert et un filet d''huile de sésame.'),
  ('Tartare de saumon avocat-mangue', 3, 'Mélange délicatement, parsème de sésame grillé et dresse dans un cercle si tu veux le côté resto.'),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 1, 'Fais cuire les tagliatelles selon les instructions du paquet.'),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 2, 'Fais sauter les crevettes 3 minutes avec l''ail, le persil et une pincée de piment.'),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 3, 'Déglace au jus de citron, puis mélange aux tagliatelles avec le zeste de citron et le parmesan.'),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 1, 'Fais cuire le cabillaud à la poêle pendant 8 minutes.'),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 2, 'Prépare la sauce vierge en mélangeant la tomate en dés, les olives, le basilic, l''huile d''olive et le citron.'),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 3, 'Écrase la patate douce cuite à la fourchette et sers avec le cabillaud nappé de sauce vierge.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
