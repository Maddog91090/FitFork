-- 'Blanc de poulet' and 'Escalope de poulet' are the same shopping item
-- (chicken breast) named differently depending on how each recipe was
-- written, which produced two separate grocery-list lines instead of one
-- merged line whenever both kinds of recipe landed in the same week's plan
-- -- the same class of bug as the Concombre unit mismatch (0020), but from
-- inconsistent naming rather than inconsistent units. Both are already
-- recorded in grams, so this is a rename only, no quantity conversion.
update public.recipe_ingredients
set ingredient_name = 'Blanc de poulet'
where ingredient_name = 'Escalope de poulet';
