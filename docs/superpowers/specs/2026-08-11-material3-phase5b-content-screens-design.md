# FitFork — Phase 5b : écrans de contenu/détail et retrait de PressableScale

**Date** : 2026-08-11
**Statut** : Spec validée, en attente d'implémentation

## Contexte et motivation

La Phase 5a (`docs/superpowers/specs/2026-08-11-material3-phase5a-navigation-daily-screens-design.md`,
mergée) a migré les 6 écrans du quotidien et la tab bar vers Material 3, en
laissant `PressableScale` volontairement en place : `home.tsx` et
`workout.tsx` en gardaient encore des usages directs (carte progression,
cellules d'exercice, lien "Annuler"), et 5 écrans de contenu/détail plus
`BackLink.tsx` n'étaient pas encore migrés. Cette phase termine le travail :

1. **Phase 5a (fait)** — navigation + 6 écrans du quotidien.
2. **Phase 5b (cette spec)** — écrans de contenu/détail, reconstruction de
   `BackLink.tsx`, et retrait complet de `PressableScale`/
   `motion.spring.snappy`.
3. **Phase 5c (plus tard)** — flux auth + onboarding, puis activation du
   mode sombre (`userInterfaceStyle: "automatic"`) une fois tous les écrans
   migrés — c'est le seul verrou restant, le système clair+sombre est déjà
   construit et vérifié WCAG depuis la Phase 4.

## Périmètre de cette spec

**Cinq écrans** : `src/app/workout-session.tsx`, `generate-plan.tsx`,
`recipe/[id].tsx`, `exercise/[id].tsx`, `progression.tsx`. Chacun passe de
`useThemeColors()`/`typography` (tokens claymorphic) à
`useMaterialColors()`/`useMaterialTertiary()`/`materialTypography`
(tokens Material de la Phase 4), avec la même table de correspondance
couleur que la Phase 5a (reproduite ci-dessous pour référence).

**`BackLink.tsx` reconstruit** en composant Material (`Pressable` +
`android_ripple`), API publique inchangée (`<BackLink />`, aucun prop,
toujours `router.back()`). Actuellement basé sur `PressableScale` +
`useThemeColors()`/`typography.caption` — les deux disparaissent de ce
fichier.

**Quatre points ponctuels dans les écrans déjà Material-isés** (Phase 5a) :
- `home.tsx` : la carte "Progression" (actuellement enveloppée dans
  `<PressableScale onPress={() => router.push('/progression')}>`) passe à
  `Pressable` + `android_ripple`.
- `workout.tsx` : le lien "Annuler" (`completionUndoTouchable`) et les deux
  cellules d'exercice dans `SessionDetail` (branches circuit et séries)
  passent à `Pressable` + `android_ripple`.

Ces quatre points ne sont **pas** une remigration de `home.tsx`/
`workout.tsx` — ces fichiers restent par ailleurs inchangés depuis la
Phase 5a. Seuls ces éléments interactifs précis changent de mécanisme de
retour tactile.

**Retrait de `PressableScale.tsx` et `motion.spring.snappy`** — une fois
les cinq écrans, `BackLink.tsx`, et les quatre points ci-dessus migrés,
plus aucun fichier ne les consomme (vérifié par grep exhaustif pendant le
brainstorming). Le fichier `PressableScale.tsx` et le token
`motion.spring.snappy` (dans `src/theme/tokens.ts`) sont supprimés.

## Retrait de la mascotte — 3 placements restants

| Écran | Placement actuel | Remplacement |
| --- | --- | --- |
| `progression.tsx` | Header, `pose` conditionnel (`celebrating` si série%7==0, sinon `idle`), `size={64}` — même pattern que Accueil/Muscu | Supprimé sans remplacement |
| `workout-session.tsx` | Écran de célébration fin de séance, `pose="celebrating"`, `size={140}` | Icône `MaterialIcons` `celebration` (glyphe vérifié présent dans le glyph map installé) |
| `generate-plan.tsx` | Encouragement après échec de génération, `pose="encouraging"`, `size={100}` | Icône `MaterialIcons` `refresh` (suggère l'action "réessayer" plutôt qu'une icône d'erreur alarmante ; glyphe vérifié présent) |

`recipe/[id].tsx` et `exercise/[id].tsx` n'ont jamais eu de mascotte
(décision de la Phase 3 : écrans de contenu dense, mascotte jugée
superflue) — aucun changement à faire sur ce point pour ces deux écrans.

Après cette phase, `Mascot.tsx` n'est plus référencé par aucun écran sous
`src/app/` — le composant lui-même reste intact (toujours utilisé comme
identité d'icône d'app/splash screen, hors périmètre de tout ce chantier
Material).

## Table de correspondance couleur (identique à la Phase 5a)

| Ancien (`useThemeColors()`) | Nouveau | Note |
| --- | --- | --- |
| `bgBase` | `useMaterialColors().background` | |
| `bgSurface` | `useMaterialColors().surface` | |
| `bgSunken` | `useMaterialColors().surfaceVariant` | |
| `textPrimary` | `useMaterialColors().onSurface` | |
| `textSecondary` | `useMaterialColors().onSurfaceVariant` | |
| `textTertiary` | `lightColors.textTertiary` (statique) | pas de rôle Material |
| `divider` / `border` | `useMaterialColors().outlineVariant` | |
| `borderStrong` | `useMaterialColors().outline` | |
| `error` | `useMaterialColors().error` | |
| `success` / `successSoft` | `lightColors.success` / `lightColors.successSoft` (statique) | pas de rôle Material |
| `domainX` (fills, spinners) | `useMaterialTertiary('X').tertiary` | |
| `domainXDeep` (texte coloré taille body) | `useMaterialTertiary('X').tertiaryContainer` | même valeur hex qu'avant |
| `macroProtein`/`macroFat`/`macroCarbs` | `lightColors.macroX` (statique) | pas de rôle Material |

`typography.*` → `materialTypography.*` suit le même renommage de rôles
que les phases précédentes (`hero→displayLarge`, `title→titleLarge`,
`caption→labelMedium`, etc.).

## Hors périmètre de cette spec

- Le flux auth + onboarding — Phase 5c.
- L'activation du mode sombre — fin de Phase 5c.
- `MacroIcon` — conservé tel quel (déjà acté en Phase 4).
- `Mascot.tsx` — composant non touché, seul son usage dans les écrans
  disparaît.

## Contraintes héritées (ne pas casser)

- `npx tsc --noEmit` et `npx jest` clean avant de considérer une tâche
  finie (le repo a un socle d'erreurs `tsc` préexistantes confinées aux
  fichiers `*.test.ts(x)`, sans rapport avec ce chantier — vérifier le
  compte exact au début de l'exécution du plan plutôt que de supposer un
  chiffre figé, puisqu'il évolue légèrement à chaque phase).
- Aucun build EAS déclenché automatiquement.
- 48dp minimum sur toute cible tactile, `accessibilityRole` sur tout
  élément interactif.
- Le hook `useReducedMotion` n'a plus besoin d'être vérifié pour
  `PressableScale` une fois ce dernier retiré (le ripple Material respecte
  nativement Remove Animations, comme déjà établi en Phase 4).
- Les routes existantes ne changent pas d'URL.
