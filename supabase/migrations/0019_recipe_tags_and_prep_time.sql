-- Adds a prep-time field and a many-to-many category/protein tag system to
-- recipes, needed for the recipe browser screen's filters. The tag
-- vocabulary (poulet, boeuf, porc, dinde, poisson_fruits_de_mer, oeuf,
-- vegetarien) is fixed and enforced at the application layer, not by a
-- database check constraint.
--
-- Recipe names below are backfilled against this project's real recipe
-- catalog (67 recipes) rather than the older 86-recipe catalog described in
-- earlier local migration files -- the two diverged after the recipe bank
-- was replaced directly against this database outside of this repo's
-- migration history.

alter table public.recipes
  add column prep_time_minutes integer null;

create table if not exists public.recipe_tags (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag text not null,
  unique (recipe_id, tag)
);

alter table public.recipe_tags enable row level security;

create policy "Anyone can read recipe tags"
  on public.recipe_tags for select
  using (true);

-- Backfill prep_time_minutes for the 67 existing recipes.
update public.recipes r
set prep_time_minutes = v.minutes
from (values
  ('Bowl skyr, fruits rouges & granola', 5),
  ('Muffins aux œufs, épinards & feta', 25),
  ('Omelette aux légumes & fromage frais', 15),
  ('Ricotta battue, miel & amandes façon colazione', 5),
  ('Tartines avocat-œuf poché', 15),
  ('Blanquette de dinde allégée', 35),
  ('Boulettes de bœuf à la sauce arrabbiata', 30),
  ('Bowl bœuf teriyaki express', 15),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 25),
  ('Cajun shrimp & maïs poêlé', 15),
  ('Crevettes à la diabla, riz coco-coriandre', 25),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 20),
  ('Curry de lentilles corail, riz basmati', 25),
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 25),
  ('Escalope milanaise revisitée au four', 25),
  ('Fajitas de poulet, poivrons & oignons', 20),
  ('Filet mignon de porc à la moutarde, écrasé de pommes de terre', 30),
  ('Gnocchis poêlés, chorizo & tomates cerises', 20),
  ('Hachis parmentier allégé', 35),
  ('Meatloaf de dinde & purée légère', 35),
  ('Poêlée de bœuf haché, courgettes & tomates', 20),
  ('Poulet basquaise express', 25),
  ('Poulet rôti au citron, pommes de terre fondantes', 50),
  ('Saumon en croûte de sésame, riz vinaigré', 20),
  ('Saumon laqué miso-soja, brocoli sauté', 20),
  ('Souvlaki de poulet, riz & tzatziki', 25),
  ('Steak haché, purée de céleri & haricots verts', 25),
  ('Bagel au saumon fumé & fromage frais', 10),
  ('Bowl burrito au bœuf', 25),
  ('Bowl de poulet teriyaki, riz & brocoli', 20),
  ('Buddha bowl quinoa, pois chiches & légumes rôtis', 25),
  ('Buffalo chicken bowl', 20),
  ('Burger maison patate douce', 30),
  ('Chili con carne maison', 30),
  ('Curry vert de crevettes, riz jasmin', 25),
  ('Falafels maison, houmous & salade', 20),
  ('Papillote de cabillaud à la provençale', 25),
  ('Pâtes thon-citron-roquette', 15),
  ('Poêlée de porc au curry & riz', 25),
  ('Poke bowl au thon, riz & edamame', 15),
  ('Salade César au poulet grillé', 20),
  ('Salade de lentilles, feta & légumes rôtis', 20),
  ('Salade thaï poulet-cacahuète', 15),
  ('Sauté de crevettes, nouilles & légumes croquants', 15),
  ('Tacos de poisson & slaw citron vert', 20),
  ('Tartare de saumon avocat-mangue', 15),
  ('Wrap de dinde, houmous & crudités', 10),
  ('Wrap de poulet, crudités & sauce yaourt-citron', 10),
  ('Barre protéinée maison avoine-chocolat', 10),
  ('Bâtonnets de céleri au beurre de cacahuète', 5),
  ('Blinis fromage frais & saumon fumé', 5),
  ('Boules d''énergie amande-datte', 10),
  ('Caprese express au thon (ou classique)', 5),
  ('Cottage cheese « ranch » & crudités', 10),
  ('Dip haricots-fromage blanc & crudités', 10),
  ('Houmous & bâtonnets de légumes', 5),
  ('Œufs durs + galettes de riz', 12),
  ('Pois chiches rôtis épicés', 30),
  ('Pudding chia, lait & fruits rouges', 5),
  ('Rillettes de poulet maison & crudités', 10),
  ('Roulés de dinde & fromage frais', 5),
  ('Skyr + jambon roulé', 5),
  ('Smoothie protéiné banane-beurre de cacahuète', 5),
  ('Tartine chèvre frais & concombre', 5),
  ('Thon-fromage frais sur cracottes', 5),
  ('Toast de seigle, avocat & graines', 5),
  ('Yaourt grec, miel & noix', 5)
) as v(name, minutes)
where r.name = v.name;

-- Backfill category/protein tags for the 67 existing recipes. A recipe may
-- carry more than one tag (e.g. an egg dish with no meat gets both oeuf and
-- vegetarien).
insert into public.recipe_tags (recipe_id, tag)
select r.id, v.tag
from (values
  ('Bowl skyr, fruits rouges & granola', 'vegetarien'),
  ('Muffins aux œufs, épinards & feta', 'oeuf'),
  ('Muffins aux œufs, épinards & feta', 'vegetarien'),
  ('Omelette aux légumes & fromage frais', 'oeuf'),
  ('Omelette aux légumes & fromage frais', 'vegetarien'),
  ('Ricotta battue, miel & amandes façon colazione', 'vegetarien'),
  ('Tartines avocat-œuf poché', 'oeuf'),
  ('Tartines avocat-œuf poché', 'vegetarien'),
  ('Blanquette de dinde allégée', 'dinde'),
  ('Boulettes de bœuf à la sauce arrabbiata', 'boeuf'),
  ('Bowl bœuf teriyaki express', 'boeuf'),
  ('Cabillaud rôti, sauce vierge & écrasé de patate douce', 'poisson_fruits_de_mer'),
  ('Cajun shrimp & maïs poêlé', 'poisson_fruits_de_mer'),
  ('Crevettes à la diabla, riz coco-coriandre', 'poisson_fruits_de_mer'),
  ('Crevettes ail-persil-piment, tagliatelles citronnées', 'poisson_fruits_de_mer'),
  ('Curry de lentilles corail, riz basmati', 'vegetarien'),
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 'poulet'),
  ('Escalope milanaise revisitée au four', 'poulet'),
  ('Fajitas de poulet, poivrons & oignons', 'poulet'),
  ('Filet mignon de porc à la moutarde, écrasé de pommes de terre', 'porc'),
  ('Gnocchis poêlés, chorizo & tomates cerises', 'porc'),
  ('Hachis parmentier allégé', 'boeuf'),
  ('Meatloaf de dinde & purée légère', 'dinde'),
  ('Poêlée de bœuf haché, courgettes & tomates', 'boeuf'),
  ('Poulet basquaise express', 'poulet'),
  ('Poulet rôti au citron, pommes de terre fondantes', 'poulet'),
  ('Saumon en croûte de sésame, riz vinaigré', 'poisson_fruits_de_mer'),
  ('Saumon laqué miso-soja, brocoli sauté', 'poisson_fruits_de_mer'),
  ('Souvlaki de poulet, riz & tzatziki', 'poulet'),
  ('Steak haché, purée de céleri & haricots verts', 'boeuf'),
  ('Bagel au saumon fumé & fromage frais', 'poisson_fruits_de_mer'),
  ('Bowl burrito au bœuf', 'boeuf'),
  ('Bowl de poulet teriyaki, riz & brocoli', 'poulet'),
  ('Buddha bowl quinoa, pois chiches & légumes rôtis', 'vegetarien'),
  ('Buffalo chicken bowl', 'poulet'),
  ('Burger maison patate douce', 'boeuf'),
  ('Chili con carne maison', 'boeuf'),
  ('Curry vert de crevettes, riz jasmin', 'poisson_fruits_de_mer'),
  ('Falafels maison, houmous & salade', 'vegetarien'),
  ('Papillote de cabillaud à la provençale', 'poisson_fruits_de_mer'),
  ('Pâtes thon-citron-roquette', 'poisson_fruits_de_mer'),
  ('Poêlée de porc au curry & riz', 'porc'),
  ('Poke bowl au thon, riz & edamame', 'poisson_fruits_de_mer'),
  ('Salade César au poulet grillé', 'poulet'),
  ('Salade de lentilles, feta & légumes rôtis', 'vegetarien'),
  ('Salade thaï poulet-cacahuète', 'poulet'),
  ('Sauté de crevettes, nouilles & légumes croquants', 'poisson_fruits_de_mer'),
  ('Tacos de poisson & slaw citron vert', 'poisson_fruits_de_mer'),
  ('Tartare de saumon avocat-mangue', 'poisson_fruits_de_mer'),
  ('Wrap de dinde, houmous & crudités', 'dinde'),
  ('Wrap de poulet, crudités & sauce yaourt-citron', 'poulet'),
  ('Barre protéinée maison avoine-chocolat', 'vegetarien'),
  ('Bâtonnets de céleri au beurre de cacahuète', 'vegetarien'),
  ('Blinis fromage frais & saumon fumé', 'poisson_fruits_de_mer'),
  ('Boules d''énergie amande-datte', 'vegetarien'),
  ('Caprese express au thon (ou classique)', 'poisson_fruits_de_mer'),
  ('Cottage cheese « ranch » & crudités', 'vegetarien'),
  ('Dip haricots-fromage blanc & crudités', 'vegetarien'),
  ('Houmous & bâtonnets de légumes', 'vegetarien'),
  ('Œufs durs + galettes de riz', 'oeuf'),
  ('Œufs durs + galettes de riz', 'vegetarien'),
  ('Pois chiches rôtis épicés', 'vegetarien'),
  ('Pudding chia, lait & fruits rouges', 'vegetarien'),
  ('Rillettes de poulet maison & crudités', 'poulet'),
  ('Roulés de dinde & fromage frais', 'dinde'),
  ('Skyr + jambon roulé', 'dinde'),
  ('Smoothie protéiné banane-beurre de cacahuète', 'vegetarien'),
  ('Tartine chèvre frais & concombre', 'vegetarien'),
  ('Thon-fromage frais sur cracottes', 'poisson_fruits_de_mer'),
  ('Toast de seigle, avocat & graines', 'vegetarien'),
  ('Yaourt grec, miel & noix', 'vegetarien')
) as v(name, tag)
join public.recipes r on r.name = v.name
on conflict (recipe_id, tag) do nothing;
