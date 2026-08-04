# Migrations à appliquer à la main

Ce dossier contient des migrations prêtes à coller dans l'éditeur SQL de Supabase. Il ne fait
pas partie de la séquence `supabase/migrations/` : rien ici n'est appliqué automatiquement.

Il existe parce que les deux bases FitFork ont divergé du repo, et pas de la même façon — une
même migration ne peut donc pas être appliquée telle quelle aux deux.

## État constaté le 2026-08-04

| | FitFork (prod) | FitFork Dev |
|---|---|---|
| Ref projet | `xewpbovlhoxovaydpuzh` | `gpvdrcxsjvpzpmcctetg` |
| Recettes | 32 | 86 |
| Ingrédients distincts | 102 | 156 |
| Correspond au repo | non | oui |
| Colonne `image_url` | oui (nullable) | non |

La prod a rejoué un autre historique (`replace_recipe_bank`,
`remove_all_recipes_except_recent_batch`, `add_recipe_image_url`…) et son catalogue n'est plus
celui décrit par `supabase/migrations/`. Dev, lui, est exactement à l'état du repo malgré des
noms de migrations qui s'arrêtent à `0005` — les suivantes y ont été appliquées autrement.

## Les fichiers

### `0017_chicken_batch_DEV.sql`

Identique à `supabase/migrations/0017_add_chicken_recipe_batch.sql`, recopié ici pour que le
dossier soit autonome. À appliquer sur **FitFork Dev**.

### `0017_chicken_batch_PROD.sql`

Même contenu, à deux noms d'ingrédients près, adaptés au vocabulaire réel de la prod :

| Dev / repo | Prod |
|---|---|
| `Œufs` | `Œuf` |
| `Carottes` | `Carotte` |

C'est le seul écart entre les deux fichiers. Il compte : la liste de courses agrège sur la chaîne
exacte `nom + unité`, donc insérer `Carottes` dans une base qui dit `Carotte` afficherait deux
lignes pour la même carotte.

`Houmous` n'existe pas non plus en prod, mais c'est un produit réellement nouveau là-bas — il
entre légitimement au catalogue, aucune adaptation nécessaire.

## Ce que ça ajoute

Trois recettes au poulet, une par type de repas :

| Recette | Type | Macros |
|---|---|---|
| Poulet katsu, riz & salade de chou | dîner | 560 kcal · 49P · 11L · 66G |
| Pâtes au poulet, tomates cerises & basilic | déjeuner | 600 kcal · 46P · 18L · 63G |
| Galettes de riz, poulet & houmous | collation | 190 kcal · 19P · 6L · 16G |

Aucune des trois n'existe déjà, ni en prod ni en dev (vérifié par requête sur les deux bases).
`image_url` étant nullable en prod, l'insert y passe sans la renseigner.

## Après application

Vérifie que les trois recettes ont bien récupéré leurs ingrédients et leurs étapes — les inserts
joignent par le *nom* de la recette, et une jointure qui échoue n'affiche aucune erreur, elle
insère simplement zéro ligne :

```sql
select r.name,
       count(distinct i.id) as ingredients,
       count(distinct s.id) as etapes
from public.recipes r
left join public.recipe_ingredients i on i.recipe_id = r.id
left join public.recipe_instructions s on s.recipe_id = r.id
where r.name in ('Poulet katsu, riz & salade de chou',
                 'Pâtes au poulet, tomates cerises & basilic',
                 'Galettes de riz, poulet & houmous')
group by r.name;
```

Attendu : 7 et 4 pour le katsu, 7 et 4 pour les pâtes, 4 et 2 pour les galettes. Un zéro quelque
part signale une jointure ratée.

## Note sur le vérificateur

`check_recipe_migration.py` compare au catalogue reconstruit depuis `supabase/migrations/`. Les
deux fichiers de ce dossier y sont donc signalés en erreur, pour des raisons différentes et
attendues dans les deux cas :

- **DEV** : son contenu est déjà dans `supabase/migrations/0017_add_chicken_recipe_batch.sql`, donc
  les trois recettes apparaissent comme des doublons. C'est le prix de la copie, pas un défaut.
- **PROD** : le repo dit `Carottes`, la prod dit `Carotte` — le script signale `Carotte` comme une
  variante. Juste pour le repo, faux pour la prod.

Autrement dit : valide la migration versionnée (`supabase/migrations/0017_...`), pas les copies
d'ici. C'est elle qui a été contrôlée avant commit, et elle passe sans erreur ni avertissement.

## Attention à ne pas double-appliquer

Ce dossier est hors de la séquence `supabase/migrations/`. Si tu appliques un jour la migration
`0017` par le CLI Supabase **et** un fichier d'ici, tu insères les recettes deux fois — le nom
devient alors ambigu comme clé de jointure. Choisis une voie ou l'autre par base.
