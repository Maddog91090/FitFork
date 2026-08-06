# Page de découverte des recettes

Date : 2026-08-06
Statut : approuvé pour planification

## Contexte

Aujourd'hui, les recettes de l'application ne sont visibles qu'intégrées
au plan de repas (`src/app/(tabs)/plan.tsx`, une carte par entrée du plan)
et via leur écran de détail (`src/app/recipe/[id].tsx`). Il n'existe aucun
écran pour parcourir librement le catalogue complet (86 recettes
aujourd'hui, stockées dans Supabase — table `recipes`), ni aucun moyen de
les filtrer.

Objectif : un nouvel onglet "Recettes" listant toutes les recettes
disponibles, avec des filtres en haut de page pour en trouver une
rapidement (catégorie de protéine, type de repas, temps de préparation).

## Constat sur les données existantes

Le type `Recipe` (`src/lib/mealPlanData.ts:4-14`) n'a aujourd'hui ni champ
de catégorie/protéine, ni temps de préparation — un champ texte
`preparation` avait existé puis a été supprimé (migration `0009`) au
profit de la table `recipe_instructions` (étapes numérotées). Seul
`mealType` (`breakfast` / `lunch` / `dinner` / `snack`) est disponible
comme champ catégoriel, et il est déjà exploitable tel quel pour un filtre
"type de repas".

Les filtres "catégorie" et "temps de préparation" demandent donc de
nouvelles données, pas seulement un nouvel écran.

## Modèle de données

Deux ajouts en base, dans une nouvelle migration Supabase :

- **`recipes.prep_time_minutes integer null`** — temps de préparation en
  minutes.
- **Table `recipe_tags`** (`recipe_id uuid references recipes(id)`,
  `tag text`) — une ligne par tag associé à une recette ; une recette peut
  porter plusieurs tags. Le vocabulaire des tags reste une liste fixe
  côté application (pas de table de référence séparée, vu qu'elle est
  courte et stable) :

  `poulet`, `boeuf`, `porc`, `dinde`, `poisson_fruits_de_mer`, `oeuf`,
  `vegetarien`

  Une recette peut porter plusieurs tags (ex. "Sandwich club
  poulet-bacon" → `poulet` + `porc`).

La même migration contient les `INSERT` assignant tags et
`prep_time_minutes` aux 86 recettes existantes, déterminés à partir de
leur nom et de leurs ingrédients (analyse manuelle faite lors de
l'écriture du plan d'implémentation, pas laissée en suspens).

`src/lib/mealPlanData.ts` : le type `Recipe` gagne
`prepTimeMinutes: number | null` et `tags: string[]` ;
`fetchRecipes()` fait une jointure vers `recipe_tags` pour les inclure
dans son résultat existant (un seul appel réseau, pas de fonction
séparée).

## Écran et filtres

**Nouvel onglet "Recettes"** — 6ᵉ onglet dans
`src/app/(tabs)/_layout.tsx`, nouvel écran `src/app/(tabs)/recipes.tsx`.
Toutes les recettes (+ tags + temps) sont chargées une seule fois au
montage de l'écran ; le filtrage est ensuite entièrement côté app,
recalculé instantanément à chaque changement de filtre (pas de nouvel
appel réseau) — largement suffisant pour l'échelle actuelle (86 recettes,
catalogue qui grandit par migrations manuelles, pas par import massif).

Trois lignes de filtres en haut de page, indépendantes et cumulables
(ET global) :

1. **Type de repas** — sélection simple, réutilise `ChoiceGroup`
   (`src/components/ChoiceGroup.tsx`) tel quel : Tous / Petit déjeuner /
   Déjeuner / Dîner / Collation.
2. **Catégorie** — sélection multiple : Poulet / Bœuf / Porc / Dinde /
   Poisson & fruits de mer / Œuf / Végétarien. `ChoiceGroup` ne supporte
   que le single-select ; une variante multi-sélection est ajoutée (même
   habillage visuel que `ChoiceGroup` — chips togglables), pour ne pas
   dupliquer le style pill existant.
3. **Temps de préparation** — sélection simple, réutilise `ChoiceGroup` :
   Tous / ≤ 15 min / ≤ 30 min / ≤ 45 min.

Sous les filtres, la liste des recettes correspondantes : même carte
visuelle que celle déjà utilisée pour les recettes dans l'onglet Plan
(image, nom, calories), chaque carte tapable vers l'écran de détail
existant `/recipe/[id]` (aucun changement à cet écran).

Pas de barre de recherche texte dans cette version — hors périmètre
explicitement (voir plus bas).

## Logique de filtrage

Une recette est affichée si, simultanément :

- `mealType` correspond au filtre sélectionné, ou "Tous" est sélectionné ;
- **tous** les tags catégorie sélectionnés sont présents parmi les tags de
  la recette (aucun tag sélectionné → pas de restriction sur cet axe) ;
- `prepTimeMinutes` est inférieur ou égal à la borne choisie, ou "Tous"
  est sélectionné. Une recette sans `prepTimeMinutes` renseigné (ne
  devrait pas arriver après le backfill des 86 recettes existantes, mais
  reste possible pour une recette ajoutée plus tard sans temps précisé)
  est exclue des tranches strictes mais reste visible sur "Tous".

Cette logique est une fonction pure (recette + filtres actifs → booléen),
testable indépendamment de l'écran.

## Gestion d'erreurs

- Échec du chargement réseau au montage de l'écran : message d'erreur
  simple (`setError` + texte), même convention que le reste de l'app,
  avec un `ActivityIndicator` pendant le chargement.
- Aucune recette ne correspond aux filtres actifs : `EmptyState`
  existant (`src/components/ui/EmptyState.tsx`) avec un message dédié
  invitant à assouplir les filtres.

## Tests

- La fonction de filtrage pure : testée avec des recettes fictives
  couvrant chaque axe de filtre seul et en combinaison (type de repas +
  catégorie(s) + temps), y compris le cas "aucun tag sélectionné" et le
  cas "recette sans `prepTimeMinutes`".
- Le nouvel écran `recipes.tsx` : testé avec
  `@testing-library/react-native` (fetch mocké), vérifiant qu'un
  changement de filtre réduit bien la liste affichée et que
  l'état vide s'affiche quand aucune recette ne correspond.

## Hors périmètre (explicitement)

- Barre de recherche par nom de recette.
- Filtre OU sur la catégorie (uniquement ET dans cette version).
- Tri des résultats (ordre de retour de la requête, tel quel).
- Ajout ou édition de tags/temps de préparation depuis l'application
  (l'assignation aux recettes existantes se fait par migration SQL,
  pas d'interface d'administration).
- Pagination / chargement progressif (86 recettes, chargées en une fois).
