-- Same class of bug as 0021 (Blanc de poulet / Escalope de poulet): the same
-- shopping item recorded under two different name strings, producing
-- avoidable duplicate lines in the grocery list. Found by auditing every
-- ingredient name in the catalog for this pattern after the poulet report.
-- All merges below were verified to already share the same unit ('g' or
-- 'piece'), so these are renames only, no quantity conversion. 'Thon frais
-- (pavé)' is deliberately left alone -- it's fresh tuna, a different
-- product from canned tuna, not a naming variant of it.

-- Singular/plural split.
update public.recipe_ingredients
set ingredient_name = 'Poivron'
where ingredient_name = 'Poivrons';

update public.recipe_ingredients
set ingredient_name = 'Pomme de terre'
where ingredient_name = 'Pommes de terre';

-- Same canned-tuna-in-water product, described two different ways.
update public.recipe_ingredients
set ingredient_name = 'Thon (boîte, égoutté)'
where ingredient_name = 'Thon au naturel (boîte)';

-- Both are plain wheat tortillas (the corn variant is separately and
-- correctly named 'Tortillas de maïs' and is left untouched).
update public.recipe_ingredients
set ingredient_name = 'Tortillas'
where ingredient_name = 'Tortilla de blé complet';
