---
name: fitfork-recipe
description: >
  Crée des recettes pour le catalogue FitFork : rédige d'abord une fiche recette lisible
  (ingrédients, étapes, macros) que l'utilisateur valide, puis génère la migration SQL Supabase
  correspondante (recipes / recipe_ingredients / recipe_instructions), vérifiée automatiquement.
  Utilise ce skill dès que l'utilisateur parle de recette, de plat, de repas, de petit-déjeuner,
  de déjeuner, de dîner, de collation, d'idée de menu, veut enrichir le catalogue, ajouter de la
  variété au plan alimentaire, ou demande une migration qui touche la table recipes — même s'il
  ne prononce jamais les mots « SQL » ou « migration ». Also use for any request to add, edit or
  seed recipes / meals in this app.
---

# Recettes FitFork

Dans FitFork, une recette n'est pas juste un texte : c'est une ligne de base de données qui
alimente trois écrans à la fois — le générateur de plan hebdomadaire (`src/lib/mealPlan.ts`),
la liste de courses (`src/app/(tabs)/grocery-list.tsx`) et la fiche recette
(`src/app/recipe/[id].tsx`). Une recette mal calibrée ne casse rien visiblement : elle produit
juste des plans incohérents ou une liste de courses avec « Brocoli » et « Brocolis » sur deux
lignes séparées. C'est pour ça que ce skill impose une fiche validée avant le SQL, et un script
de vérification après.

## Étape 1 — Cadrer la demande

Avant d'écrire quoi que ce soit, détermine :

- **Le type de repas** (`breakfast`, `lunch`, `dinner`, `snack`). Si l'utilisateur dit juste
  « une recette de poulet », demande — le type de repas change complètement la cible calorique.
- **Les contraintes** : ingrédients imposés ou interdits, végétarien, sans lactose, temps de
  préparation, cuisine (italienne, mexicaine…), objectif (riche en protéines, léger…).
- **Le nombre de recettes** : une seule, ou un lot ? Un lot va dans une seule migration.

Vérifie ensuite qu'elle n'existe pas déjà. Le nom sert de clé de jointure dans le SQL, donc un
doublon casse l'insertion :

```bash
python3 .claude/skills/fitfork-recipe/scripts/check_recipe_migration.py --list-recipes
```

Si une recette très proche existe, dis-le à l'utilisateur et propose soit une variante nettement
différenciée, soit de modifier l'existante.

## Étape 2 — La fiche recette (à faire valider)

Écris la fiche en markdown directement dans ta réponse, puis **arrête-toi et demande validation**.
C'est le moment où l'utilisateur peut corriger le poids d'une portion ou remplacer un ingrédient,
et c'est infiniment moins cher que de refaire une migration.

Format :

```markdown
### <Nom de la recette>
**Type** : dîner · **Portion** : 420 g · **~15 min**
**Macros** : 440 kcal · 45 g protéines · 14 g lipides · 30 g glucides

**Ingrédients**
| Ingrédient | Quantité |
|---|---|
| Escalope de poulet | 150 g |
| Moutarde | 15 ml |

**Préparation**
1. Fais poêler l'escalope de poulet jusqu'à ce qu'elle soit bien cuite.
2. Déglace avec la moutarde et le fromage blanc pour une sauce crémeuse sans crème.
```

Les règles de calibrage (fourchettes caloriques par type de repas, densité protéique, poids de
portion, vocabulaire des ingrédients, style des étapes) sont dans
`references/conventions.md` — **lis-le avant de chiffrer les macros**, c'est là que se joue la
qualité de la recette.

Deux points à ne pas rater dès la fiche, parce qu'ils sont coûteux à corriger après :

- **Les macros doivent être cohérentes entre elles** : `4×protéines + 9×lipides + 4×glucides`
  doit tomber à moins de 5 % des calories annoncées. Le script le vérifie, mais autant viser
  juste du premier coup.
- **Réutilise le vocabulaire d'ingrédients existant** au mot près. La liste de courses agrège sur
  la chaîne exacte `nom|unité` : « Blanc de poulet » et « Filet de poulet » deviennent deux
  lignes. Consulte le vocabulaire réel du catalogue :

  ```bash
  python3 .claude/skills/fitfork-recipe/scripts/check_recipe_migration.py --list-ingredients
  ```

  N'introduis un nouveau nom que si aucun existant ne convient vraiment.

## Étape 3 — La migration SQL

Une fois la fiche validée, crée `supabase/migrations/00NN_add_<slug>_recipe.sql` (ou
`00NN_add_recipe_batch.sql` pour un lot). Prends le numéro suivant le plus élevé du dossier —
la numérotation est séquentielle et sans trou.

Le fichier suit exactement cette structure en trois inserts :

```sql
-- Seed data: 1 new dinner recipe
insert into public.recipes (name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g) values
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 'dinner', 440, 45, 14, 30, 420)
;

insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
select id, 'Escalope de poulet', 150, 'g' from public.recipes where name = 'Escalope de poulet, sauce moutarde légère & haricots verts'
union all select id, 'Moutarde', 15, 'ml' from public.recipes where name = 'Escalope de poulet, sauce moutarde légère & haricots verts'
;

insert into public.recipe_instructions (recipe_id, step_number, text)
select r.id, v.step_number, v.text
from (values
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 1, 'Fais poêler l''escalope de poulet jusqu''à ce qu''elle soit bien cuite.'),
  ('Escalope de poulet, sauce moutarde légère & haricots verts', 2, 'Déglace avec la moutarde et le fromage blanc pour obtenir une sauce crémeuse sans crème.')
) as v(name, step_number, text)
join public.recipes r on r.name = v.name;
```

Trois pièges, tous silencieux — ils ne lèvent aucune erreur SQL, ils insèrent simplement zéro
ligne, et tu ne t'en aperçois qu'une fois l'app lancée :

1. **Le nom de la recette est la clé de jointure.** Il est répété dans chaque ligne des trois
   inserts et doit être identique au caractère près. Un accent ou une esperluette qui diffère
   entre les blocs, et les ingrédients ne sont jamais rattachés.
2. **Les apostrophes se doublent** : `l''escalope`, `d''olive`, `jusqu''à`. Le catalogue est en
   français, il y en a partout. N'utilise jamais l'apostrophe typographique `’` — ni dans le
   texte, ni dans les noms.
3. **`unit` n'accepte que `'g'`, `'ml'` ou `'piece'`**, et `meal_type` que `'breakfast'`,
   `'lunch'`, `'dinner'`, `'snack'`. Toute autre valeur est rejetée par une contrainte CHECK.

## Étape 4 — Vérifier

Lance systématiquement le script sur le fichier que tu viens d'écrire :

```bash
python3 .claude/skills/fitfork-recipe/scripts/check_recipe_migration.py supabase/migrations/00NN_add_<slug>_recipe.sql
```

Il relit tout le catalogue existant et contrôle la cohérence des macros, les valeurs d'énumération,
la numérotation des étapes, les jointures par nom, les doublons, et il signale les ingrédients qui
ressemblent à un nom déjà utilisé sans lui être identique.

Corrige toutes les **ERREUR** avant de continuer. Les **ATTENTION** sont des signaux à évaluer :
une recette volontairement très légère ou très protéinée peut légitimement sortir des fourchettes
habituelles — dans ce cas explique-le à l'utilisateur plutôt que de déformer la recette pour faire
taire le script.

Puis, si la suite de tests existe encore, un `npm test` rapide ne coûte rien.

## Étape 5 — Livrer

Résume à l'utilisateur : le nom de la recette, ses macros, le chemin de la migration, et le
résultat du script. Précise que la migration n'est pas appliquée — elle le sera par le workflow
habituel du projet (Supabase CLI ou MCP Supabase). Ne l'applique jamais de ta propre initiative :
c'est une écriture en base de production.

Commit avec un message du type `feat(recipes): add <nom de la recette>`.

## Modifier une recette existante

Même logique, mais ne réécris jamais une migration déjà appliquée — elle fait partie de
l'historique. Crée une nouvelle migration avec des `update` ciblés :

```sql
update public.recipes set base_calories = 420, base_protein_g = 46
where name = 'Escalope de poulet, sauce moutarde légère & haricots verts';
```

Pour changer les ingrédients ou les étapes, supprime puis réinsère (`delete from
public.recipe_ingredients where recipe_id in (select id from public.recipes where name = '…')`).
Renommer une recette est à éviter : le nom est la clé de jointure de toutes les migrations
passées.

## Références

- `references/conventions.md` — calibrage des macros par type de repas, comment le générateur de
  plan choisit les recettes, style de rédaction des étapes, exemple complet fiche → SQL.
- `scripts/check_recipe_migration.py` — vérificateur ; `--list-ingredients` et `--list-recipes`
  exposent le vocabulaire réel du catalogue.
