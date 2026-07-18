insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Muesli maison et lait d''amande', 'breakfast', 380, 14, 10, 55, 280),
  ('Omelette au fromage et jambon', 'breakfast', 430, 28, 30, 8, 220),
  ('Smoothie bowl banane-myrtille', 'breakfast', 340, 15, 6, 58, 350),
  ('Toast à l''avocat et œuf poché', 'breakfast', 400, 18, 22, 34, 250),
  ('Crêpes à la farine complète et miel', 'breakfast', 420, 14, 12, 62, 280),
  ('Bagel au saumon fumé et fromage frais', 'breakfast', 450, 26, 20, 40, 240),
  ('Porridge protéiné chocolat-noisette', 'breakfast', 400, 25, 12, 48, 300),
  ('Gaufres maison et fruits', 'breakfast', 410, 12, 14, 60, 280),
  ('Skyr et flocons d''avoine', 'breakfast', 360, 26, 6, 48, 280),
  ('Sandwich œufs-bacon', 'breakfast', 440, 24, 24, 32, 230),
  ('Salade César au poulet', 'lunch', 580, 40, 26, 42, 400),
  ('Riz sauté au tofu et légumes', 'lunch', 560, 22, 18, 76, 420),
  ('Poke bowl saumon-avocat', 'lunch', 610, 34, 24, 62, 420),
  ('Sandwich club poulet-bacon', 'lunch', 600, 38, 24, 55, 350),
  ('Pâtes au thon et tomates', 'lunch', 590, 32, 14, 82, 420),
  ('Curry de poulet et riz basmati', 'lunch', 640, 38, 22, 70, 430),
  ('Salade de lentilles et feta', 'lunch', 540, 24, 20, 62, 380),
  ('Burrito bœuf-haricots rouges', 'lunch', 620, 34, 22, 68, 400),
  ('Bol de quinoa aux crevettes', 'lunch', 550, 30, 16, 68, 400),
  ('Sandwich thon-crudités', 'lunch', 520, 30, 16, 60, 320),
  ('Poulet rôti et pommes de terre', 'dinner', 600, 42, 18, 62, 430),
  ('Chili con carne et riz', 'dinner', 650, 36, 20, 78, 420),
  ('Gratin de saumon et brocolis', 'dinner', 580, 38, 26, 42, 400),
  ('Escalope de dinde et purée', 'dinner', 560, 40, 14, 62, 400),
  ('Risotto aux champignons et parmesan', 'dinner', 600, 20, 20, 82, 400),
  ('Curry de crevettes et riz', 'dinner', 580, 32, 18, 70, 420),
  ('Poêlée de bœuf et légumes asiatiques', 'dinner', 590, 38, 20, 60, 400),
  ('Lasagnes à la viande', 'dinner', 680, 36, 26, 70, 450),
  ('Filet de poisson blanc et légumes rôtis', 'dinner', 500, 36, 12, 58, 400),
  ('Chili végétarien et riz complet', 'dinner', 560, 22, 14, 82, 420),
  ('Amandes et fruits secs', 'snack', 240, 8, 18, 14, 50),
  ('Smoothie protéiné banane', 'snack', 250, 22, 4, 32, 300),
  ('Houmous et bâtonnets de légumes', 'snack', 200, 8, 10, 20, 200),
  ('Yaourt et granola', 'snack', 230, 12, 6, 32, 220),
  ('Barre de céréales maison', 'snack', 190, 6, 8, 24, 50),
  ('Fromage cottage et fruits rouges', 'snack', 180, 18, 4, 16, 200),
  ('Toast au beurre de cacahuète et banane', 'snack', 260, 10, 14, 26, 150),
  ('Œuf dur et fruit', 'snack', 170, 12, 10, 10, 150),
  ('Shake protéiné chocolat', 'snack', 220, 24, 4, 20, 300)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Muesli', 80, 'g' from public.recipes where name = 'Muesli maison et lait d''amande'
union all select id, 'Lait d''amande', 200, 'ml' from public.recipes where name = 'Muesli maison et lait d''amande'
union all select id, 'Œufs', 3, 'piece' from public.recipes where name = 'Omelette au fromage et jambon'
union all select id, 'Jambon', 60, 'g' from public.recipes where name = 'Omelette au fromage et jambon'
union all select id, 'Fromage râpé', 30, 'g' from public.recipes where name = 'Omelette au fromage et jambon'
union all select id, 'Banane', 1, 'piece' from public.recipes where name = 'Smoothie bowl banane-myrtille'
union all select id, 'Myrtilles', 100, 'g' from public.recipes where name = 'Smoothie bowl banane-myrtille'
union all select id, 'Yaourt grec', 150, 'g' from public.recipes where name = 'Smoothie bowl banane-myrtille'
union all select id, 'Pain complet', 2, 'piece' from public.recipes where name = 'Toast à l''avocat et œuf poché'
union all select id, 'Avocat', 1, 'piece' from public.recipes where name = 'Toast à l''avocat et œuf poché'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Toast à l''avocat et œuf poché'
union all select id, 'Farine complète', 100, 'g' from public.recipes where name = 'Crêpes à la farine complète et miel'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Crêpes à la farine complète et miel'
union all select id, 'Miel', 20, 'g' from public.recipes where name = 'Crêpes à la farine complète et miel'
union all select id, 'Bagel', 1, 'piece' from public.recipes where name = 'Bagel au saumon fumé et fromage frais'
union all select id, 'Saumon fumé', 80, 'g' from public.recipes where name = 'Bagel au saumon fumé et fromage frais'
union all select id, 'Fromage frais', 40, 'g' from public.recipes where name = 'Bagel au saumon fumé et fromage frais'
union all select id, 'Flocons d''avoine', 70, 'g' from public.recipes where name = 'Porridge protéiné chocolat-noisette'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Porridge protéiné chocolat-noisette'
union all select id, 'Lait', 200, 'ml' from public.recipes where name = 'Porridge protéiné chocolat-noisette'
union all select id, 'Farine', 100, 'g' from public.recipes where name = 'Gaufres maison et fruits'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Gaufres maison et fruits'
union all select id, 'Fruits rouges', 80, 'g' from public.recipes where name = 'Gaufres maison et fruits'
union all select id, 'Skyr', 200, 'g' from public.recipes where name = 'Skyr et flocons d''avoine'
union all select id, 'Flocons d''avoine', 50, 'g' from public.recipes where name = 'Skyr et flocons d''avoine'
union all select id, 'Miel', 15, 'g' from public.recipes where name = 'Skyr et flocons d''avoine'
union all select id, 'Pain complet', 2, 'piece' from public.recipes where name = 'Sandwich œufs-bacon'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Sandwich œufs-bacon'
union all select id, 'Bacon', 40, 'g' from public.recipes where name = 'Sandwich œufs-bacon'
union all select id, 'Blanc de poulet', 180, 'g' from public.recipes where name = 'Salade César au poulet'
union all select id, 'Salade romaine', 100, 'g' from public.recipes where name = 'Salade César au poulet'
union all select id, 'Parmesan', 30, 'g' from public.recipes where name = 'Salade César au poulet'
union all select id, 'Tofu', 180, 'g' from public.recipes where name = 'Riz sauté au tofu et légumes'
union all select id, 'Riz', 150, 'g' from public.recipes where name = 'Riz sauté au tofu et légumes'
union all select id, 'Légumes sautés', 150, 'g' from public.recipes where name = 'Riz sauté au tofu et légumes'
union all select id, 'Saumon', 150, 'g' from public.recipes where name = 'Poke bowl saumon-avocat'
union all select id, 'Avocat', 1, 'piece' from public.recipes where name = 'Poke bowl saumon-avocat'
union all select id, 'Riz', 150, 'g' from public.recipes where name = 'Poke bowl saumon-avocat'
union all select id, 'Pain complet', 3, 'piece' from public.recipes where name = 'Sandwich club poulet-bacon'
union all select id, 'Blanc de poulet', 120, 'g' from public.recipes where name = 'Sandwich club poulet-bacon'
union all select id, 'Bacon', 30, 'g' from public.recipes where name = 'Sandwich club poulet-bacon'
union all select id, 'Pâtes', 100, 'g' from public.recipes where name = 'Pâtes au thon et tomates'
union all select id, 'Thon', 150, 'g' from public.recipes where name = 'Pâtes au thon et tomates'
union all select id, 'Sauce tomate', 150, 'g' from public.recipes where name = 'Pâtes au thon et tomates'
union all select id, 'Blanc de poulet', 180, 'g' from public.recipes where name = 'Curry de poulet et riz basmati'
union all select id, 'Riz basmati', 150, 'g' from public.recipes where name = 'Curry de poulet et riz basmati'
union all select id, 'Lait de coco', 100, 'ml' from public.recipes where name = 'Curry de poulet et riz basmati'
union all select id, 'Lentilles', 180, 'g' from public.recipes where name = 'Salade de lentilles et feta'
union all select id, 'Feta', 50, 'g' from public.recipes where name = 'Salade de lentilles et feta'
union all select id, 'Légumes', 100, 'g' from public.recipes where name = 'Salade de lentilles et feta'
union all select id, 'Bœuf haché 5%', 150, 'g' from public.recipes where name = 'Burrito bœuf-haricots rouges'
union all select id, 'Haricots rouges', 100, 'g' from public.recipes where name = 'Burrito bœuf-haricots rouges'
union all select id, 'Tortilla', 1, 'piece' from public.recipes where name = 'Burrito bœuf-haricots rouges'
union all select id, 'Crevettes', 150, 'g' from public.recipes where name = 'Bol de quinoa aux crevettes'
union all select id, 'Quinoa', 120, 'g' from public.recipes where name = 'Bol de quinoa aux crevettes'
union all select id, 'Légumes vapeur', 120, 'g' from public.recipes where name = 'Bol de quinoa aux crevettes'
union all select id, 'Pain complet', 2, 'piece' from public.recipes where name = 'Sandwich thon-crudités'
union all select id, 'Thon', 120, 'g' from public.recipes where name = 'Sandwich thon-crudités'
union all select id, 'Crudités', 80, 'g' from public.recipes where name = 'Sandwich thon-crudités'
union all select id, 'Cuisse de poulet', 200, 'g' from public.recipes where name = 'Poulet rôti et pommes de terre'
union all select id, 'Pommes de terre', 250, 'g' from public.recipes where name = 'Poulet rôti et pommes de terre'
union all select id, 'Haricots verts', 100, 'g' from public.recipes where name = 'Poulet rôti et pommes de terre'
union all select id, 'Bœuf haché 5%', 180, 'g' from public.recipes where name = 'Chili con carne et riz'
union all select id, 'Haricots rouges', 150, 'g' from public.recipes where name = 'Chili con carne et riz'
union all select id, 'Riz', 100, 'g' from public.recipes where name = 'Chili con carne et riz'
union all select id, 'Saumon', 180, 'g' from public.recipes where name = 'Gratin de saumon et brocolis'
union all select id, 'Brocolis', 150, 'g' from public.recipes where name = 'Gratin de saumon et brocolis'
union all select id, 'Crème légère', 60, 'g' from public.recipes where name = 'Gratin de saumon et brocolis'
union all select id, 'Escalope de dinde', 180, 'g' from public.recipes where name = 'Escalope de dinde et purée'
union all select id, 'Pommes de terre', 250, 'g' from public.recipes where name = 'Escalope de dinde et purée'
union all select id, 'Beurre', 15, 'g' from public.recipes where name = 'Escalope de dinde et purée'
union all select id, 'Riz arborio', 120, 'g' from public.recipes where name = 'Risotto aux champignons et parmesan'
union all select id, 'Champignons', 150, 'g' from public.recipes where name = 'Risotto aux champignons et parmesan'
union all select id, 'Parmesan', 40, 'g' from public.recipes where name = 'Risotto aux champignons et parmesan'
union all select id, 'Crevettes', 180, 'g' from public.recipes where name = 'Curry de crevettes et riz'
union all select id, 'Riz', 150, 'g' from public.recipes where name = 'Curry de crevettes et riz'
union all select id, 'Lait de coco', 100, 'ml' from public.recipes where name = 'Curry de crevettes et riz'
union all select id, 'Bœuf émincé', 180, 'g' from public.recipes where name = 'Poêlée de bœuf et légumes asiatiques'
union all select id, 'Légumes sautés', 150, 'g' from public.recipes where name = 'Poêlée de bœuf et légumes asiatiques'
union all select id, 'Sauce soja', 20, 'ml' from public.recipes where name = 'Poêlée de bœuf et légumes asiatiques'
union all select id, 'Bœuf haché 5%', 180, 'g' from public.recipes where name = 'Lasagnes à la viande'
union all select id, 'Pâtes à lasagne', 100, 'g' from public.recipes where name = 'Lasagnes à la viande'
union all select id, 'Sauce tomate', 150, 'g' from public.recipes where name = 'Lasagnes à la viande'
union all select id, 'Filet de poisson blanc', 180, 'g' from public.recipes where name = 'Filet de poisson blanc et légumes rôtis'
union all select id, 'Légumes rôtis', 200, 'g' from public.recipes where name = 'Filet de poisson blanc et légumes rôtis'
union all select id, 'Huile d''olive', 10, 'ml' from public.recipes where name = 'Filet de poisson blanc et légumes rôtis'
union all select id, 'Haricots rouges', 200, 'g' from public.recipes where name = 'Chili végétarien et riz complet'
union all select id, 'Riz complet', 120, 'g' from public.recipes where name = 'Chili végétarien et riz complet'
union all select id, 'Sauce tomate', 100, 'g' from public.recipes where name = 'Chili végétarien et riz complet'
union all select id, 'Amandes', 30, 'g' from public.recipes where name = 'Amandes et fruits secs'
union all select id, 'Fruits secs', 20, 'g' from public.recipes where name = 'Amandes et fruits secs'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Smoothie protéiné banane'
union all select id, 'Banane', 1, 'piece' from public.recipes where name = 'Smoothie protéiné banane'
union all select id, 'Lait', 200, 'ml' from public.recipes where name = 'Smoothie protéiné banane'
union all select id, 'Houmous', 80, 'g' from public.recipes where name = 'Houmous et bâtonnets de légumes'
union all select id, 'Carottes', 100, 'g' from public.recipes where name = 'Houmous et bâtonnets de légumes'
union all select id, 'Concombre', 100, 'g' from public.recipes where name = 'Houmous et bâtonnets de légumes'
union all select id, 'Yaourt grec', 150, 'g' from public.recipes where name = 'Yaourt et granola'
union all select id, 'Granola', 40, 'g' from public.recipes where name = 'Yaourt et granola'
union all select id, 'Flocons d''avoine', 30, 'g' from public.recipes where name = 'Barre de céréales maison'
union all select id, 'Miel', 15, 'g' from public.recipes where name = 'Barre de céréales maison'
union all select id, 'Fruits secs', 15, 'g' from public.recipes where name = 'Barre de céréales maison'
union all select id, 'Fromage cottage', 150, 'g' from public.recipes where name = 'Fromage cottage et fruits rouges'
union all select id, 'Fruits rouges', 60, 'g' from public.recipes where name = 'Fromage cottage et fruits rouges'
union all select id, 'Pain complet', 1, 'piece' from public.recipes where name = 'Toast au beurre de cacahuète et banane'
union all select id, 'Beurre de cacahuète', 20, 'g' from public.recipes where name = 'Toast au beurre de cacahuète et banane'
union all select id, 'Banane', 1, 'piece' from public.recipes where name = 'Toast au beurre de cacahuète et banane'
union all select id, 'Œufs', 2, 'piece' from public.recipes where name = 'Œuf dur et fruit'
union all select id, 'Pomme', 1, 'piece' from public.recipes where name = 'Œuf dur et fruit'
union all select id, 'Whey protéine', 30, 'g' from public.recipes where name = 'Shake protéiné chocolat'
union all select id, 'Lait', 250, 'ml' from public.recipes where name = 'Shake protéiné chocolat'
;
