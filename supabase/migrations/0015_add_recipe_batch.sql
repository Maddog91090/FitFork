-- Seed data: 19 new recipes (1 breakfast, 5 lunch, 4 snack, 9 dinner)
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Bowl burrito au bœuf', 'lunch', 510, 40, 16, 48, 425),
  ('Tacos de poisson & slaw citron vert', 'lunch', 400, 34, 11, 38, 380),
  ('Dip haricots-fromage blanc & crudités', 'snack', 180, 18, 2, 20, 290),
  ('Fajitas de poulet, poivrons & oignons', 'dinner', 430, 44, 13, 30, 400),
  ('Crevettes à la diabla, riz coco-coriandre', 'dinner', 440, 33, 8, 50, 360),
  ('Burger maison patate douce', 'lunch', 560, 42, 18, 52, 560),
  ('Buffalo chicken bowl', 'lunch', 430, 45, 12, 32, 360),
  ('Cottage cheese « ranch » & crudités', 'snack', 160, 21, 5, 8, 240),
  ('Meatloaf de dinde & purée légère', 'dinner', 410, 44, 18, 18, 440),
  ('Cajun shrimp & maïs poêlé', 'dinner', 350, 32, 8, 34, 330),
  ('Papillote de cabillaud à la provençale', 'lunch', 320, 33, 13, 14, 350),
  ('Tartine chèvre frais & concombre', 'snack', 200, 14, 8, 18, 130),
  ('Blanquette de dinde allégée', 'dinner', 430, 44, 12, 32, 440),
  ('Poulet basquaise express', 'dinner', 420, 43, 9, 34, 460),
  ('Ricotta battue, miel & amandes façon colazione', 'breakfast', 300, 18, 14, 24, 210),
  ('Pâtes thon-citron-roquette', 'lunch', 470, 38, 11, 55, 330),
  ('Caprese express au thon (ou classique)', 'snack', 210, 22, 11, 6, 250),
  ('Escalope milanaise revisitée au four', 'dinner', 400, 46, 14, 20, 350),
  ('Boulettes de bœuf à la sauce arrabbiata', 'dinner', 440, 42, 18, 28, 420)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Bœuf haché 5%', 150, 'g' from public.recipes where name = 'Bowl burrito au bœuf'
union all select id, 'Riz', 100, 'g' from public.recipes where name = 'Bowl burrito au bœuf'
union all select id, 'Haricots rouges', 80, 'g' from public.recipes where name = 'Bowl burrito au bœuf'
union all select id, 'Maïs', 50, 'g' from public.recipes where name = 'Bowl burrito au bœuf'
union all select id, 'Salsa', 40, 'g' from public.recipes where name = 'Bowl burrito au bœuf'
union all select id, 'Coriandre', 5, 'g' from public.recipes where name = 'Bowl burrito au bœuf'
union all select id, 'Cabillaud', 150, 'g' from public.recipes where name = 'Tacos de poisson & slaw citron vert'
union all select id, 'Tortillas de maïs', 2, 'piece' from public.recipes where name = 'Tacos de poisson & slaw citron vert'
union all select id, 'Chou', 80, 'g' from public.recipes where name = 'Tacos de poisson & slaw citron vert'
union all select id, 'Carotte', 50, 'g' from public.recipes where name = 'Tacos de poisson & slaw citron vert'
union all select id, 'Citron vert', 0.5, 'piece' from public.recipes where name = 'Tacos de poisson & slaw citron vert'
union all select id, 'Yaourt nature', 30, 'g' from public.recipes where name = 'Tacos de poisson & slaw citron vert'
union all select id, 'Haricots noirs', 80, 'g' from public.recipes where name = 'Dip haricots-fromage blanc & crudités'
union all select id, 'Fromage blanc 0%', 100, 'g' from public.recipes where name = 'Dip haricots-fromage blanc & crudités'
union all select id, 'Cumin', 1, 'g' from public.recipes where name = 'Dip haricots-fromage blanc & crudités'
union all select id, 'Citron vert', 0.5, 'piece' from public.recipes where name = 'Dip haricots-fromage blanc & crudités'
union all select id, 'Poivron', 50, 'g' from public.recipes where name = 'Dip haricots-fromage blanc & crudités'
union all select id, 'Concombre', 50, 'g' from public.recipes where name = 'Dip haricots-fromage blanc & crudités'
union all select id, 'Blanc de poulet', 150, 'g' from public.recipes where name = 'Fajitas de poulet, poivrons & oignons'
union all select id, 'Poivrons', 150, 'g' from public.recipes where name = 'Fajitas de poulet, poivrons & oignons'
union all select id, 'Oignon', 50, 'g' from public.recipes where name = 'Fajitas de poulet, poivrons & oignons'
union all select id, 'Épices fajitas', 5, 'g' from public.recipes where name = 'Fajitas de poulet, poivrons & oignons'
union all select id, 'Tortillas', 2, 'piece' from public.recipes where name = 'Fajitas de poulet, poivrons & oignons'
union all select id, 'Crevettes', 150, 'g' from public.recipes where name = 'Crevettes à la diabla, riz coco-coriandre'
union all select id, 'Sauce tomate', 100, 'g' from public.recipes where name = 'Crevettes à la diabla, riz coco-coriandre'
union all select id, 'Piment chipotle (ou paprika fumé)', 2, 'g' from public.recipes where name = 'Crevettes à la diabla, riz coco-coriandre'
union all select id, 'Ail', 1, 'piece' from public.recipes where name = 'Crevettes à la diabla, riz coco-coriandre'
union all select id, 'Riz', 100, 'g' from public.recipes where name = 'Crevettes à la diabla, riz coco-coriandre'
union all select id, 'Coriandre', 5, 'g' from public.recipes where name = 'Crevettes à la diabla, riz coco-coriandre'
union all select id, 'Steak haché 5%', 150, 'g' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Pain complet (burger)', 1, 'piece' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Salade', 20, 'g' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Tomate', 1, 'piece' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Oignon', 20, 'g' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Yaourt', 15, 'g' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Moutarde', 15, 'ml' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Patate douce', 150, 'g' from public.recipes where name = 'Burger maison patate douce'
union all select id, 'Blanc de poulet', 150, 'g' from public.recipes where name = 'Buffalo chicken bowl'
union all select id, 'Sauce buffalo (sauce piquante)', 20, 'ml' from public.recipes where name = 'Buffalo chicken bowl'
union all select id, 'Yaourt nature', 15, 'g' from public.recipes where name = 'Buffalo chicken bowl'
union all select id, 'Salade', 30, 'g' from public.recipes where name = 'Buffalo chicken bowl'
union all select id, 'Céleri', 30, 'g' from public.recipes where name = 'Buffalo chicken bowl'
union all select id, 'Carotte', 30, 'g' from public.recipes where name = 'Buffalo chicken bowl'
union all select id, 'Riz', 80, 'g' from public.recipes where name = 'Buffalo chicken bowl'
union all select id, 'Cottage cheese', 150, 'g' from public.recipes where name = 'Cottage cheese « ranch » & crudités'
union all select id, 'Ail en poudre', 1, 'g' from public.recipes where name = 'Cottage cheese « ranch » & crudités'
union all select id, 'Ciboulette', 2, 'g' from public.recipes where name = 'Cottage cheese « ranch » & crudités'
union all select id, 'Oignon', 10, 'g' from public.recipes where name = 'Cottage cheese « ranch » & crudités'
union all select id, 'Citron', 0.25, 'piece' from public.recipes where name = 'Cottage cheese « ranch » & crudités'
union all select id, 'Carotte', 40, 'g' from public.recipes where name = 'Cottage cheese « ranch » & crudités'
union all select id, 'Céleri', 40, 'g' from public.recipes where name = 'Cottage cheese « ranch » & crudités'
union all select id, 'Dinde hachée', 180, 'g' from public.recipes where name = 'Meatloaf de dinde & purée légère'
union all select id, 'Oignon', 30, 'g' from public.recipes where name = 'Meatloaf de dinde & purée légère'
union all select id, 'Œuf', 1, 'piece' from public.recipes where name = 'Meatloaf de dinde & purée légère'
union all select id, 'Herbes de Provence', 2, 'g' from public.recipes where name = 'Meatloaf de dinde & purée légère'
union all select id, 'Sauce tomate', 30, 'g' from public.recipes where name = 'Meatloaf de dinde & purée légère'
union all select id, 'Chou-fleur', 150, 'g' from public.recipes where name = 'Meatloaf de dinde & purée légère'
union all select id, 'Pommes de terre', 75, 'g' from public.recipes where name = 'Meatloaf de dinde & purée légère'
union all select id, 'Crevettes', 150, 'g' from public.recipes where name = 'Cajun shrimp & maïs poêlé'
union all select id, 'Épices cajun', 5, 'g' from public.recipes where name = 'Cajun shrimp & maïs poêlé'
union all select id, 'Maïs', 100, 'g' from public.recipes where name = 'Cajun shrimp & maïs poêlé'
union all select id, 'Poivron rouge', 80, 'g' from public.recipes where name = 'Cajun shrimp & maïs poêlé'
union all select id, 'Citron vert', 0.5, 'piece' from public.recipes where name = 'Cajun shrimp & maïs poêlé'
union all select id, 'Cabillaud', 150, 'g' from public.recipes where name = 'Papillote de cabillaud à la provençale'
union all select id, 'Tomate', 1, 'piece' from public.recipes where name = 'Papillote de cabillaud à la provençale'
union all select id, 'Courgette', 100, 'g' from public.recipes where name = 'Papillote de cabillaud à la provençale'
union all select id, 'Oignon', 30, 'g' from public.recipes where name = 'Papillote de cabillaud à la provençale'
union all select id, 'Thym', 1, 'g' from public.recipes where name = 'Papillote de cabillaud à la provençale'
union all select id, 'Huile d''olive', 10, 'ml' from public.recipes where name = 'Papillote de cabillaud à la provençale'
union all select id, 'Pain complet', 1, 'piece' from public.recipes where name = 'Tartine chèvre frais & concombre'
union all select id, 'Chèvre frais allégé', 40, 'g' from public.recipes where name = 'Tartine chèvre frais & concombre'
union all select id, 'Concombre', 50, 'g' from public.recipes where name = 'Tartine chèvre frais & concombre'
union all select id, 'Ciboulette', 2, 'g' from public.recipes where name = 'Tartine chèvre frais & concombre'
union all select id, 'Dinde (dés)', 150, 'g' from public.recipes where name = 'Blanquette de dinde allégée'
union all select id, 'Carotte', 80, 'g' from public.recipes where name = 'Blanquette de dinde allégée'
union all select id, 'Champignons', 80, 'g' from public.recipes where name = 'Blanquette de dinde allégée'
union all select id, 'Oignon', 30, 'g' from public.recipes where name = 'Blanquette de dinde allégée'
union all select id, 'Fromage blanc', 50, 'g' from public.recipes where name = 'Blanquette de dinde allégée'
union all select id, 'Riz', 80, 'g' from public.recipes where name = 'Blanquette de dinde allégée'
union all select id, 'Blanc de poulet', 150, 'g' from public.recipes where name = 'Poulet basquaise express'
union all select id, 'Poivrons', 150, 'g' from public.recipes where name = 'Poulet basquaise express'
union all select id, 'Tomate', 1, 'piece' from public.recipes where name = 'Poulet basquaise express'
union all select id, 'Oignon', 40, 'g' from public.recipes where name = 'Poulet basquaise express'
union all select id, 'Ail', 1, 'piece' from public.recipes where name = 'Poulet basquaise express'
union all select id, 'Piment d''Espelette', 1, 'g' from public.recipes where name = 'Poulet basquaise express'
union all select id, 'Riz', 80, 'g' from public.recipes where name = 'Poulet basquaise express'
union all select id, 'Ricotta allégée', 150, 'g' from public.recipes where name = 'Ricotta battue, miel & amandes façon colazione'
union all select id, 'Miel', 5, 'g' from public.recipes where name = 'Ricotta battue, miel & amandes façon colazione'
union all select id, 'Amandes concassées', 10, 'g' from public.recipes where name = 'Ricotta battue, miel & amandes façon colazione'
union all select id, 'Citron', 0.25, 'piece' from public.recipes where name = 'Ricotta battue, miel & amandes façon colazione'
union all select id, 'Pain complet', 1, 'piece' from public.recipes where name = 'Ricotta battue, miel & amandes façon colazione'
union all select id, 'Pâtes complètes (poids sec)', 80, 'g' from public.recipes where name = 'Pâtes thon-citron-roquette'
union all select id, 'Thon au naturel (boîte)', 140, 'g' from public.recipes where name = 'Pâtes thon-citron-roquette'
union all select id, 'Citron', 0.5, 'piece' from public.recipes where name = 'Pâtes thon-citron-roquette'
union all select id, 'Roquette', 30, 'g' from public.recipes where name = 'Pâtes thon-citron-roquette'
union all select id, 'Huile d''olive', 10, 'ml' from public.recipes where name = 'Pâtes thon-citron-roquette'
union all select id, 'Tomate', 1, 'piece' from public.recipes where name = 'Caprese express au thon (ou classique)'
union all select id, 'Mozzarella light', 60, 'g' from public.recipes where name = 'Caprese express au thon (ou classique)'
union all select id, 'Basilic', 3, 'g' from public.recipes where name = 'Caprese express au thon (ou classique)'
union all select id, 'Huile d''olive', 5, 'ml' from public.recipes where name = 'Caprese express au thon (ou classique)'
union all select id, 'Thon (boîte, égoutté)', 70, 'g' from public.recipes where name = 'Caprese express au thon (ou classique)'
union all select id, 'Escalope de poulet', 150, 'g' from public.recipes where name = 'Escalope milanaise revisitée au four'
union all select id, 'Chapelure', 30, 'g' from public.recipes where name = 'Escalope milanaise revisitée au four'
union all select id, 'Parmesan', 15, 'g' from public.recipes where name = 'Escalope milanaise revisitée au four'
union all select id, 'Tomate', 1, 'piece' from public.recipes where name = 'Escalope milanaise revisitée au four'
union all select id, 'Roquette', 30, 'g' from public.recipes where name = 'Escalope milanaise revisitée au four'
union all select id, 'Bœuf haché 5%', 180, 'g' from public.recipes where name = 'Boulettes de bœuf à la sauce arrabbiata'
union all select id, 'Origan', 2, 'g' from public.recipes where name = 'Boulettes de bœuf à la sauce arrabbiata'
union all select id, 'Sauce tomate', 120, 'g' from public.recipes where name = 'Boulettes de bœuf à la sauce arrabbiata'
union all select id, 'Piment', 1, 'g' from public.recipes where name = 'Boulettes de bœuf à la sauce arrabbiata'
union all select id, 'Ail', 1, 'piece' from public.recipes where name = 'Boulettes de bœuf à la sauce arrabbiata'
union all select id, 'Courgette', 100, 'g' from public.recipes where name = 'Boulettes de bœuf à la sauce arrabbiata'
union all select id, 'Pâtes', 60, 'g' from public.recipes where name = 'Boulettes de bœuf à la sauce arrabbiata'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Bowl burrito au bœuf', 1, 'Fais revenir le bœuf haché assaisonné de cumin, paprika et ail dans une poêle.'),
  ('Bowl burrito au bœuf', 2, 'Fais cuire le riz selon les instructions du paquet.'),
  ('Bowl burrito au bœuf', 3, 'Dresse en bowl avec les haricots rouges, le maïs, la salsa et la coriandre.'),
  ('Tacos de poisson & slaw citron vert', 1, 'Fais poêler le cabillaud avec les épices cajun jusqu''à ce qu''il soit cuit, puis émiette-le.'),
  ('Tacos de poisson & slaw citron vert', 2, 'Prépare le slaw en mélangeant le chou, la carotte, le jus de citron vert et le yaourt nature.'),
  ('Tacos de poisson & slaw citron vert', 3, 'Garnis les tortillas de maïs avec le poisson émietté et le slaw.'),
  ('Dip haricots-fromage blanc & crudités', 1, 'Écrase les haricots noirs avec le fromage blanc, le cumin et le jus de citron vert.'),
  ('Dip haricots-fromage blanc & crudités', 2, 'Coupe le poivron et le concombre en bâtonnets et sers-les avec le dip.'),
  ('Fajitas de poulet, poivrons & oignons', 1, 'Fais sauter le poulet émincé avec les épices fajitas.'),
  ('Fajitas de poulet, poivrons & oignons', 2, 'Ajoute les poivrons et l''oignon émincés, fais cuire jusqu''à ce qu''ils soient tendres et légèrement grillés.'),
  ('Fajitas de poulet, poivrons & oignons', 3, 'Sers dans les tortillas, ou en bowl pour alléger.'),
  ('Crevettes à la diabla, riz coco-coriandre', 1, 'Prépare une sauce tomate relevée avec le piment chipotle (ou paprika fumé) et l''ail.'),
  ('Crevettes à la diabla, riz coco-coriandre', 2, 'Fais mijoter les crevettes 5 minutes dans cette sauce.'),
  ('Crevettes à la diabla, riz coco-coriandre', 3, 'Fais cuire le riz et parfume-le de coriandre ciselée, sers les crevettes par-dessus.'),
  ('Burger maison patate douce', 1, 'Grille le steak haché à la poêle ou au grill selon la cuisson désirée.'),
  ('Burger maison patate douce', 2, 'Prépare la sauce en mélangeant le yaourt et la moutarde.'),
  ('Burger maison patate douce', 3, 'Assemble le burger avec le pain complet, la salade, la tomate, l''oignon et la sauce, sers avec les frites de patate douce cuites au four.'),
  ('Buffalo chicken bowl', 1, 'Fais poêler le poulet jusqu''à ce qu''il soit bien cuit.'),
  ('Buffalo chicken bowl', 2, 'Mélange la sauce piquante avec un peu de yaourt nature et enrobe le poulet.'),
  ('Buffalo chicken bowl', 3, 'Dresse sur un lit de salade, céleri et carotte, avec le riz cuit.'),
  ('Cottage cheese « ranch » & crudités', 1, 'Assaisonne le cottage cheese avec l''ail en poudre, la ciboulette, l''oignon et un filet de citron.'),
  ('Cottage cheese « ranch » & crudités', 2, 'Coupe la carotte et le céleri en bâtonnets et sers-les avec le dip.'),
  ('Meatloaf de dinde & purée légère', 1, 'Mélange la dinde hachée avec l''oignon, l''œuf et les herbes, forme un mini pain de viande.'),
  ('Meatloaf de dinde & purée légère', 2, 'Nappe de sauce tomate et fais cuire au four 20 minutes.'),
  ('Meatloaf de dinde & purée légère', 3, 'Fais bouillir le chou-fleur et les pommes de terre puis écrase-les en purée pour accompagner.'),
  ('Cajun shrimp & maïs poêlé', 1, 'Fais sauter les crevettes avec les épices cajun.'),
  ('Cajun shrimp & maïs poêlé', 2, 'Ajoute le maïs et le poivron rouge, poêle quelques minutes.'),
  ('Cajun shrimp & maïs poêlé', 3, 'Termine avec un filet de citron vert avant de servir.'),
  ('Papillote de cabillaud à la provençale', 1, 'Dispose le cabillaud sur une feuille de papillote avec la tomate, la courgette et l''oignon coupés en morceaux.'),
  ('Papillote de cabillaud à la provençale', 2, 'Ajoute le thym et un filet d''huile d''olive, ferme la papillote.'),
  ('Papillote de cabillaud à la provençale', 3, 'Fais cuire au four 15 minutes.'),
  ('Tartine chèvre frais & concombre', 1, 'Tartine la tranche de pain complet avec le chèvre frais allégé.'),
  ('Tartine chèvre frais & concombre', 2, 'Ajoute les rondelles de concombre et la ciboulette, poivre généreusement.'),
  ('Blanquette de dinde allégée', 1, 'Fais mijoter la dinde en dés avec les carottes, les champignons et l''oignon dans un bouillon.'),
  ('Blanquette de dinde allégée', 2, 'Lie la sauce avec le fromage blanc en fin de cuisson au lieu de la crème.'),
  ('Blanquette de dinde allégée', 3, 'Sers avec un peu de riz.'),
  ('Poulet basquaise express', 1, 'Fais mijoter le poulet émincé avec les poivrons, la tomate, l''oignon et l''ail.'),
  ('Poulet basquaise express', 2, 'Assaisonne d''une pointe de piment d''Espelette et laisse mijoter jusqu''à cuisson complète.'),
  ('Poulet basquaise express', 3, 'Sers sur le riz ou tel quel.'),
  ('Ricotta battue, miel & amandes façon colazione', 1, 'Fouette la ricotta allégée jusqu''à obtenir une texture lisse et crémeuse.'),
  ('Ricotta battue, miel & amandes façon colazione', 2, 'Arrose d''un filet de miel, parsème d''amandes concassées et de zeste de citron.'),
  ('Ricotta battue, miel & amandes façon colazione', 3, 'Sers sur une tranche de pain complet grillé.'),
  ('Pâtes thon-citron-roquette', 1, 'Fais cuire les pâtes complètes selon les instructions du paquet.'),
  ('Pâtes thon-citron-roquette', 2, 'Égoutte le thon et mélange-le aux pâtes avec le zeste et le jus de citron.'),
  ('Pâtes thon-citron-roquette', 3, 'Ajoute la roquette et un filet d''huile d''olive juste avant de servir.'),
  ('Caprese express au thon (ou classique)', 1, 'Coupe la tomate en tranches et dispose-les avec la mozzarella light.'),
  ('Caprese express au thon (ou classique)', 2, 'Ajoute le basilic et un filet d''huile d''olive.'),
  ('Caprese express au thon (ou classique)', 3, 'Ajoute le thon égoutté par-dessus pour muscler les protéines.'),
  ('Escalope milanaise revisitée au four', 1, 'Pane l''escalope de poulet dans la chapelure mélangée au parmesan.'),
  ('Escalope milanaise revisitée au four', 2, 'Fais cuire au four jusqu''à ce qu''elle soit dorée et croustillante.'),
  ('Escalope milanaise revisitée au four', 3, 'Sers avec une salade tomate-roquette.'),
  ('Boulettes de bœuf à la sauce arrabbiata', 1, 'Façonne des boulettes avec le bœuf haché et l''origan.'),
  ('Boulettes de bœuf à la sauce arrabbiata', 2, 'Prépare une sauce tomate relevée au piment et à l''ail, puis fais-y mijoter les boulettes.'),
  ('Boulettes de bœuf à la sauce arrabbiata', 3, 'Sers sur de la courgette en spaghettis ou des pâtes cuites.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
