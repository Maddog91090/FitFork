# Conventions du catalogue FitFork

Ce document explique comment calibrer une recette pour qu'elle s'intègre bien au catalogue.
Lis-le avant de chiffrer les macros d'une nouvelle recette.

## Sommaire

- [Comment le générateur choisit les recettes](#comment-le-générateur-choisit-les-recettes)
- [Fourchettes par type de repas](#fourchettes-par-type-de-repas)
- [Poids de portion](#poids-de-portion)
- [Vocabulaire des ingrédients](#vocabulaire-des-ingrédients)
- [Style de rédaction](#style-de-rédaction)
- [Exemple complet : de la fiche au SQL](#exemple-complet--de-la-fiche-au-sql)

## Comment le générateur choisit les recettes

`src/lib/mealPlan.ts` construit le plan de la semaine ainsi :

1. Il répartit les calories quotidiennes par repas selon des ratios fixes —
   **petit-déjeuner 25 %, déjeuner 35 %, dîner 30 %, collation 10 %**.
2. Pour chaque créneau, il ne considère que les recettes du bon `meal_type`, et choisit celle dont
   la **répartition des macros** (part des calories venant des protéines, lipides, glucides) est
   la plus proche de la répartition cible de l'utilisateur. À égalité, il prend la moins utilisée
   de la semaine.
3. Il ajuste ensuite la quantité via un **multiplicateur de portion borné entre 0,5 et 2**, et
   aucune recette n'apparaît plus de deux fois par semaine.

Trois conséquences pratiques pour toi :

- **Ce sont les proportions de macros qui comptent, pas les valeurs absolues.** Une recette à
  40 % de calories protéiques sera choisie pour les profils prise de masse, une à 55 % de glucides
  pour les profils endurance. Une recette bien équilibrée est utilisable par tout le monde ; une
  recette extrême sera soit ignorée, soit servie deux fois par semaine aux mêmes personnes.
- **Le bornage à 0,5–2 crée des trous.** Si une recette de dîner est calibrée à 900 kcal, elle ne
  pourra jamais descendre sous 450 kcal, donc elle sera inutilisable pour un objectif à
  1500 kcal/jour (dont 30 % = 450 kcal pile). Vise le milieu de la fourchette ci-dessous.
- **Le catalogue manque surtout de variété là où il est déjà dense.** Avant d'ajouter un énième
  bowl au poulet, regarde ce qui existe (`--list-recipes`) : une cuisine ou un profil macro
  absent apporte bien plus au générateur qu'un doublon de plus.

## Fourchettes par type de repas

Fourchettes observées dans le catalogue existant, et cible recommandée pour une nouvelle recette :

| Type | `meal_type` | Calories observées | Cible recommandée | Protéines typiques |
|---|---|---|---|---|
| Petit-déjeuner | `breakfast` | 300 – 450 | **350 – 430** | 12 – 28 g |
| Déjeuner | `lunch` | 320 – 650 | **430 – 580** | 30 – 45 g |
| Dîner | `dinner` | 350 – 700 | **400 – 580** | 32 – 46 g |
| Collation | `snack` | 160 – 260 | **170 – 250** | 8 – 28 g |

FitFork est une app de sport : les recettes existantes sont franchement protéinées. Sauf demande
contraire, vise **au moins 25 % des calories venant des protéines** pour un déjeuner ou un dîner
(soit ~30 g de protéines pour 480 kcal), et 20 % pour un petit-déjeuner. Les collations grasses de
type oléagineux (« Amandes et fruits secs ») sont l'exception assumée.

**Contrôle de cohérence obligatoire** : `4×protéines + 9×lipides + 4×glucides` doit tomber à moins
de 5 % des calories déclarées. Exemple pour 440 kcal / 45 P / 14 L / 30 G :
`45×4 + 14×9 + 30×4 = 180 + 126 + 120 = 426` → écart de 3,2 %. ✓

Toutes les valeurs sont des **entiers** dans le catalogue existant — garde cette convention.

## Poids de portion

`base_serving_g` est le poids de l'assiette servie, en grammes. En pratique il vaut à peu près la
somme des ingrédients exprimés en `g` et `ml`, ajustée à la louche pour tenir compte des
ingrédients en `piece` et de l'eau perdue ou absorbée à la cuisson (le riz absorbe, la viande
perd). Le catalogue est cohérent à ±30 % près, pas plus — ne cherche pas la précision au gramme,
mais reste dans le même ordre de grandeur que la somme des ingrédients.

Ordres de grandeur du catalogue : collation 50 – 300 g, petit-déjeuner 210 – 350 g, déjeuner et
dîner 320 – 560 g.

## Vocabulaire des ingrédients

La liste de courses agrège les ingrédients sur la clé exacte `nom|unité`. Deux orthographes
différentes du même produit apparaissent donc sur deux lignes distinctes, et l'utilisateur achète
deux fois. Récupère toujours le vocabulaire réel avant d'écrire :

```bash
python3 .claude/skills/fitfork-recipe/scripts/check_recipe_migration.py --list-ingredients
```

Conventions de nommage observées :

- **Singulier ou pluriel selon l'usage courant** : « Courgette » mais « Haricots verts ». Aligne-toi
  sur ce qui existe déjà plutôt que sur une règle abstraite — le catalogue contient déjà quelques
  doublons hérités (« Brocoli » / « Brocolis »), ne les aggrave pas, choisis la forme la plus
  fréquente.
- **Majuscule initiale uniquement** : « Blanc de poulet », pas « Blanc de Poulet ».
- **La précision utile entre parenthèses** : « Thon au naturel (boîte) », « Pâtes complètes
  (poids sec) », « Piment chipotle (ou paprika fumé) ». C'est ce qui rend la liste de courses
  utilisable en magasin.
- **Le taux de matière grasse quand il change tout** : « Bœuf haché 5 % », « Fromage blanc 0 % ».

Unités : `g` pour tout ce qui se pèse, `ml` pour les liquides (huile, sauce soja, lait, moutarde),
`piece` pour les unités entières (œuf, avocat, tortilla, gousse d'ail, pain). Les quantités en
`piece` peuvent être fractionnaires (`0.5` pour un demi-citron) ; le code arrondit à l'entier
supérieur au moment de la mise à l'échelle, donc reste sur des demis ou des entiers.

Une même denrée peut légitimement exister dans deux unités (« Concombre » en `g` dans une salade,
en `piece` dans un bowl), mais préfère l'unité déjà utilisée par les recettes voisines.

## Style de rédaction

Les étapes s'affichent numérotées sur la fiche recette. Le catalogue tutoie l'utilisateur et
utilise l'impératif : « Fais chauffer », « Mélange », « Sers ».

- **3 à 5 étapes**, une action principale par étape. Les recettes très simples (collations)
  peuvent en avoir 2.
- **Chaque étape est une phrase complète et autonome**, terminée par un point.
- **Les repères de cuisson concrets** valent mieux que les durées seules : « jusqu'à ce que des
  bulles apparaissent en surface », « jusqu'à ce qu'elles soient roses ». Quand une durée est
  donnée, elle est précise : « 5-6 minutes de chaque côté », « 25 minutes à 200 °C ».
- **Pas de quantités dans les étapes** — elles sont déjà dans la liste d'ingrédients, et elles
  seraient fausses dès que l'utilisateur change la portion.

Noms de recettes : descriptifs et appétissants, les composants séparés par des virgules ou `&`
(« Cabillaud rôti, sauce vierge & écrasé de patate douce »). Ils apparaissent tels quels dans
l'app, donc pas de préfixe technique ni de numéro.

## Exemple complet : de la fiche au SQL

**Fiche validée :**

```markdown
### Escalope de poulet, sauce moutarde légère & haricots verts
**Type** : dîner · **Portion** : 420 g · **~20 min**
**Macros** : 440 kcal · 45 g protéines · 14 g lipides · 30 g glucides

**Ingrédients**
| Ingrédient | Quantité |
|---|---|
| Escalope de poulet | 150 g |
| Moutarde | 15 ml |
| Fromage blanc | 45 g |
| Haricots verts | 200 g |
| Pommes de terre | 150 g |

**Préparation**
1. Fais poêler l'escalope de poulet jusqu'à ce qu'elle soit bien cuite.
2. Déglace avec la moutarde, le fromage blanc et un filet d'eau chaude pour obtenir une sauce
   crémeuse sans crème.
3. Fais cuire les haricots verts et les pommes de terre à la vapeur, puis sers le tout ensemble.
```

**Migration correspondante** (`supabase/migrations/0015_add_escalope_poulet_moutarde_recipe.sql`) :

```sql
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
```

Remarque la répétition intégrale du nom à chaque ligne : c'est verbeux, mais c'est la clé de
jointure, et c'est ce qui permet à la migration de fonctionner sans connaître l'UUID généré.

## Lots de recettes

Pour plusieurs recettes dans une même migration (voir `0016_add_recipe_batch.sql`) : un seul
`insert into public.recipes` avec toutes les lignes séparées par des virgules, puis un seul bloc
d'ingrédients enchaînant les `union all` recette après recette, puis un seul bloc d'instructions.
L'en-tête décrit la composition du lot :

```sql
-- Seed data: 19 new recipes (1 breakfast, 5 lunch, 4 snack, 9 dinner)
```

Sur un lot, équilibre les types de repas selon ce qui manque au catalogue plutôt que d'empiler
des dîners.
