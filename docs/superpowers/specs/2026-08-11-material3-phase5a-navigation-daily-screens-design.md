# FitFork — Phase 5a : navigation et écrans du quotidien

**Date** : 2026-08-11
**Statut** : Spec validée, en attente d'implémentation

## Contexte et motivation

La Phase 4 (`docs/superpowers/specs/2026-08-11-material3-foundation-design.md`,
mergée) a livré les fondations Material 3 : tokens de couleur clair+sombre
vérifiés WCAG, et la reconstruction de 6 composants partagés (`Button`,
`Card`, `ChoiceGroup`, `TagFilterGroup`, `EmptyState`, `TabIcon`) — mais
aucun écran n'a été touché. Le reste du chantier "20/20 à l'audit" se
découpe en 3 sous-phases séquentielles, chacune avec son propre cycle
spec→plan→implémentation :

1. **Phase 5a (cette spec)** — Navigation et les 6 écrans du quotidien
   (les anciens onglets).
2. **Phase 5b (plus tard)** — Écrans de contenu/détail
   (`workout-session.tsx`, `generate-plan.tsx`, `recipe/[id].tsx`,
   `exercise/[id].tsx`, `progression.tsx`), retrait de `PressableScale`/
   `BackLink` legacy une fois leurs derniers consommateurs migrés.
3. **Phase 5c (plus tard)** — Flux auth + onboarding, puis activation de
   `userInterfaceStyle: "automatic"` une fois le dernier écran migré —
   c'est le seul verrou restant, le système clair+sombre est déjà
   construit et vérifié WCAG depuis la Phase 4.

Décisions déjà actées par l'utilisateur (à ne pas re-demander) :
- La mascotte ne survit que comme icône d'app/splash — elle disparaît de
  toute l'UI fonctionnelle.
- Le mode sombre s'active à la toute fin de la Phase 5c, pas avant.
- `PressableScale`/`motion.spring.snappy` restent en place jusqu'à ce que
  leurs derniers consommateurs (Phase 5b) migrent.
- `MacroIcon` reste tel quel — hors périmètre de conformité plateforme.

## Périmètre de cette spec

Six écrans + le layout de la tab bar :
`src/app/(tabs)/_layout.tsx`, `home.tsx`, `plan.tsx`, `recipes.tsx`,
`workout.tsx`, `grocery-list.tsx`, et `weight-log.tsx` (qui déménage hors
du groupe `(tabs)`, voir ci-dessous). Chaque écran passe de
`useThemeColors()`/`typography`/`shadow` (tokens claymorphic) à
`useMaterialColors()`/`useMaterialTertiary()`/`materialTypography`
(tokens Material construits en Phase 4), et consomme les composants déjà
Material-isés (`Button`, `Card`, `EmptyState`) sans changer leur API — ces
composants n'ont pas besoin d'être retouchés, seulement leurs points
d'appel dans ces 6 écrans.

## Retrait de la mascotte — deux patterns identiques sur les 6 écrans

### Header (`home.tsx`, `workout.tsx`)
Mascotte `pose="idle"` `size={64}` à droite du titre → **supprimée sans
remplacement**. Le header ne garde que le texte (salutation/titre).

### Empty state (`plan.tsx`, `recipes.tsx`, `grocery-list.tsx`,
`weight-log.tsx`)
`<EmptyState icon={<Mascot pose="idle" size={120} />}>` → remplacé par une
icône `MaterialIcons`, en réutilisant les mêmes glyphes déjà choisis pour
`TabIcon` en Phase 4 (cohérence visuelle entre tab bar et empty states) :

| Écran | Glyphe `MaterialIcons` |
| --- | --- |
| `plan.tsx` | `event` |
| `recipes.tsx` | `restaurant-menu` |
| `grocery-list.tsx` | `shopping-cart` |
| `weight-log.tsx` | `monitor-weight` |

Taille et couleur à trancher pendant le plan (probablement `size={64}` en
`colors.onSurfaceVariant`, cohérent avec la taille utilisée ailleurs pour
une icône "vide" plutôt que les 120px qu'occupait la mascotte —
`MaterialIcons` n'a pas besoin du même espace visuel qu'une illustration).

## Tab bar 6→5 : `weight-log.tsx` sort du groupe `(tabs)`

`weight-log.tsx` déménage physiquement de `src/app/(tabs)/weight-log.tsx`
vers `src/app/weight-log.tsx` — une route top-level, au même niveau que
`workout-session.tsx`/`generate-plan.tsx` déjà. Plus propre sémantiquement
qu'un hack `options={{ href: null }}` qui garderait le fichier dans le
groupe `(tabs)` tout en le cachant de la barre. L'URL `/weight-log` ne
change pas : le segment `(tabs)` n'apparaît jamais dans l'URL avec Expo
Router, donc tout `router.push('/weight-log')` existant continue de
fonctionner sans modification.

Conséquences :
- `(tabs)/_layout.tsx` perd son `<Tabs.Screen name="weight-log">` —
  passe de 6 à 5 destinations (Accueil/Plan/Recettes/Muscu/Courses).
- Les imports relatifs de `weight-log.tsx` passent de `../../` à `../`
  (un niveau de dossier en moins).
- `(tabs)/_layout.tsx`'s `tabBarStyle`/`tabBarLabelStyle` (actuellement
  `colors.bgSurface`/`colors.border`/`colors.textPrimary`/
  `colors.textSecondary`) passent aux rôles Material équivalents
  (`surface`/`outlineVariant`/`primary` ou `onSurface`/`onSurfaceVariant`
  — exact mapping décidé pendant le plan). `TabIcon` se teinte déjà
  lui-même depuis la Phase 4, donc seul le style du conteneur et le label
  texte ont besoin d'un changement de tokens ici.

## Accès à "Poids" depuis Accueil

Un 3ᵉ bouton dans la rangée "Actions rapides" de `home.tsx`, à côté des
deux boutons existants (`Voir mon plan` / `Générer`) :
**`Suivre mon poids`** → `router.push('/weight-log')`, `domain="neutral"`
(même domaine que `weight-log.tsx` utilise déjà pour son propre bouton
"Enregistrer"). Décision confirmée par l'utilisateur : pas de carte dédiée
avec tendance/dernier poids, un simple bouton suffit — cohérent avec le
pattern déjà là, coût d'implémentation minimal. La rangée passe de 2 à 3
boutons ; l'agencement exact (3 en ligne vs. 2+1) est décidé pendant le
plan selon ce qui reste lisible sur un écran de téléphone étroit.

## Hors périmètre de cette spec

- Tout écran de contenu/détail (`workout-session.tsx`, `generate-plan.tsx`,
  `recipe/[id].tsx`, `exercise/[id].tsx`, `progression.tsx`) — Phase 5b.
- Le flux auth + onboarding — Phase 5c.
- L'activation du mode sombre (`userInterfaceStyle: "automatic"`) — fin de
  Phase 5c, une fois tous les écrans migrés.
- Le retrait de `PressableScale`/`BackLink` — reste en place, encore
  consommé par `workout.tsx` (cellules de séance) et hors du périmètre de
  cette phase qui ne fait que migrer les tokens/composants visuels des 6
  écrans, pas retirer leurs animations de pression existantes.
- `MacroIcon` — conservé tel quel.

## Contraintes héritées (ne pas casser)

- `npx tsc --noEmit` et `npx jest` clean avant de considérer une tâche
  finie (le repo a ~1225-1245 erreurs `tsc` préexistantes confinées aux
  fichiers `*.test.ts(x)`, sans rapport avec ce chantier — ne pas les
  traiter comme une régression de cette phase).
- Aucun build EAS déclenché automatiquement.
- 48dp minimum sur toute cible tactile, `accessibilityRole` sur tout
  élément interactif.
- Le hook `useReducedMotion` continue de fonctionner normalement pour tout
  ce qui reste animé (`PressableScale` sur `workout.tsx`).
- Les routes existantes (`router.push('/weight-log')`, etc.) ne changent
  pas d'URL malgré le déménagement de fichier.
