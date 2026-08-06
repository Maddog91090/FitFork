-- 'Concombre' is measured in grams in every recipe except one, where it was
-- entered as '0.5 piece' (0012_add_more_recipes.sql). Because the grocery
-- list aggregates ingredients by (name, unit), this mismatched unit produced
-- a second, un-mergeable 'Concombre' line whenever that recipe shared a
-- weekly plan with any other cucumber recipe -- reading as a duplicate.
--
-- Converts it to grams to match the other 10 recipes' convention (50g is
-- the most common quantity among them, and matches this recipe's own use as
-- a garnish, per its instructions: "concombre en bâtonnets").
update public.recipe_ingredients ri
set quantity = 50, unit = 'g'
from public.recipes r
where ri.recipe_id = r.id
  and r.name = 'Bowl bœuf teriyaki express'
  and ri.ingredient_name = 'Concombre'
  and ri.unit = 'piece';
