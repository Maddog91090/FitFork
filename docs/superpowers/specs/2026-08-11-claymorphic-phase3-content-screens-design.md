# FitPro — claymorphic Phase 3 : écrans de contenu, nouvelle pose mascotte

**Date** : 2026-08-11
**Statut** : Spec validée, en attente d'implémentation

## Contexte et motivation

Phase 2 (`docs/superpowers/specs/2026-08-10-claymorphic-phase2-screen-rollout-design.md`,
mergée, PR #10) a migré 5 écrans principaux (Accueil, Plan, Recettes, Muscu,
Progression) : mascotte contextuelle, couleurs de domaine explicites sur les
`Button`/`ChoiceGroup`/`EmptyState`/`TagFilterGroup`, set d'icônes claymorphic
sur-mesure pour la tab bar et les macros, identité de l'app (icône/splash/
Android adaptive icon) reprenant la mascotte. Le plan Phase 2 listait
explicitement, dans sa section "Follow-up work", les écrans restants hors
périmètre : auth (login/signup/forgot-password/onboarding), détail recette,
détail exercice, generate-plan, grocery-list (Courses), weight-log (Poids).

Ces 10 écrans se répartissent en deux registres de design différents : les
écrans de contenu/utilitaire (même registre que la Phase 2 — couleurs de
domaine claires, mascotte pertinente sur états vides/échecs) et le flux
auth/onboarding (formulaires, contexte pré-marque, moins de place pour la
mascotte). Cette spec couvre uniquement le premier lot ; l'auth/onboarding
est explicitement reporté à une Phase 4 séparée.

## Écrans dans le périmètre — 5

`generate-plan.tsx`, `(tabs)/grocery-list.tsx`, `(tabs)/weight-log.tsx`,
`recipe/[id].tsx`, `exercise/[id].tsx`. Chaque écran migré reçoit :

1. Tout accent codé en dur sur le token legacy `colors.accentRed*` remplacé
   par le token de domaine explicite correspondant, conformément à la règle
   déjà posée en Phase 1/2 (ne pas utiliser `accentRed*` dans du code
   touché, utiliser les tokens de domaine directement).
2. Chaque `Button` de l'écran passe la prop `domain` correcte.
3. La mascotte au bon emplacement, là où applicable (voir plus bas — 3 des
   5 écrans seulement).

**Domaine par écran** :

| Écran | Domaine | Justification |
| --- | --- | --- |
| `generate-plan.tsx` | `nutrition` | génère un plan de repas |
| `(tabs)/grocery-list.tsx` | `nutrition` | liste d'ingrédients, suite directe du plan |
| `(tabs)/weight-log.tsx` | `neutral` | cohérent avec l'icône de tab bar déjà choisie en Phase 2 (icône "Poids" en brun/neutre) plutôt qu'avec l'écran Progression |
| `recipe/[id].tsx` | `nutrition` | contenu nutrition |
| `exercise/[id].tsx` | `sport` | contenu sport |

`generate-plan.tsx` n'utilise pas `ChoiceGroup` — sa grille de sélection
jour × type de repas est un composant maison à deux dimensions
(`cell`/`cellSelected`), structurellement différent d'une rangée de pills
à sélection unique. Pas de nouveau composant partagé : on repointe
directement `colors.accentRed` → `colors.domainNutrition` dans les styles
propres à cet écran.

## Mascotte — 3 emplacements

| Emplacement | Écran | Pose | Déclencheur |
| --- | --- | --- | --- |
| État vide | grocery-list ("Aucun plan pour l'instant") | `idle` | Remplace l'illustration statique existante (`EmptyState`'s `illustration` → `icon`), même patron que Plan/Recettes en Phase 2 |
| État vide | weight-log ("Aucune pesée") | `idle` | `EmptyState` n'a actuellement ni `icon` ni `illustration` sur cet écran — en ajoute une |
| Échec de génération | generate-plan (`catch` de `handleGenerate`) | **`encouraging`** (nouvelle pose) | Remplace le texte d'erreur sobre actuel affiché sous la grille de sélection |

`recipe/[id].tsx` et `exercise/[id].tsx` : **pas de mascotte**. Ce sont des
écrans de contenu dense (photo, étapes) consultés fréquemment, pas des
états vides ni des moments de célébration — ajouter la mascotte y serait du
bruit visuel plutôt qu'un signal. Migration couleur de domaine uniquement.

## Nouvelle pose mascotte : `encouraging`

Troisième pose du composant `Mascot` — `MascotPose` passe de
`'idle' | 'celebrating'` à `'idle' | 'celebrating' | 'encouraging'`. C'est
le premier emplacement réel pour la pose "encourageant-après-échec"
mentionnée dans `assets/images/mascot/README.md` depuis la Phase 1 (deux
fois reportée faute d'endroit où l'utiliser) : `generate-plan.tsx` a un
vrai cas d'échec (`try`/`catch` autour de la génération du plan), ce que
les écrans de la Phase 2 n'avaient pas au même degré.

**Génération** : même prompt de base validé en Phase 1
(`assets/images/mascot/README.md`), seule la clause de pose change :

> a gentle, reassuring pose — one hand raised near the chest in a warm
> "it's okay, let's try again" gesture, relaxed shoulders, still smiling
> warmly and making eye contact — encouraging and upbeat, never mocking,
> never sad-looking, never apologetic

Fichier : `assets/images/mascot/mascot-encouraging.png`, transparent,
≥1024×1024, même pipeline de génération que les deux poses existantes
(Higgsfield `generate_image` + `remove_background`, `media-use` n'ayant
pas de provider fonctionnel dans cet environnement).

**Comportement d'animation** : contrairement à `celebrating` (spring-bounce
énergique, `scale` part de 0.5 et rebondit à 1 via `motion.spring.celebrate`),
un rebond triomphant serait discordant sur un moment d'échec. `encouraging`
réutilise donc la respiration continue calme de `idle`
(`withRepeat`/`withSequence` existant) — seule l'image source change, pas
le mouvement. Dans `Mascot.tsx`, le `useEffect` actuel qui distingue
`pose === 'idle'` (respiration) du `else` (rebond) devient une distinction
`pose === 'celebrating'` (rebond) vs. le reste (respiration) — `idle` et
`encouraging` partagent la même branche d'animation.

## Pas de nouvelles icônes sur-mesure

Aucun des 5 écrans n'a besoin d'icône supplémentaire : `recipe/[id].tsx` et
`exercise/[id].tsx` affichent déjà de vraies photos (`recipe.imageUrl`,
`exercise.imageStart`/`imageEnd`) ; `weight-log.tsx` a déjà son graphique
`Sparkline` ; `grocery-list.tsx` est une simple liste de texte. Seul le
nouvel asset mascotte (`mascot-encouraging.png`) est produit dans cette
phase.

## Hors périmètre de cette spec

- Auth + onboarding (login, signup, forgot-password, reset-password,
  onboarding) — Phase 4 explicite, séparée, registre de design différent
  (formulaires, contexte pré-marque).
- La pose "mouvement/transition" — reste reportée, toujours sans
  emplacement identifié.
- Toute icône au-delà de la nouvelle pose mascotte.
- Le passage en ton "hypé" du texte fonctionnel — reste sobre partout sauf
  la mascotte/célébration/encouragement, conformément à la règle déjà
  posée en Phase 1.

## Contraintes héritées (ne pas casser)

- Zéro hex code, zéro `fontSize`/`fontWeight` inline — tout passe par
  `src/theme/tokens.ts`.
- Chaque élément tappable : état pressé visible, 44pt minimum,
  `accessibilityRole`.
- Contraste AA 4.5:1 déjà couvert par les tokens de domaine existants — pas
  de nouvelle couleur de texte introduite par cette phase.
- `npx tsc --noEmit` et `npx jest` clean avant de considérer un écran fini.
- Pas de build EAS déclenché automatiquement.
- Copie fonctionnelle sobre, tutoiement, français — la mascotte/célébration
  /encouragement peut avoir de l'énergie, le reste non. La pose
  `encouraging` en particulier ne doit jamais avoir l'air moqueuse, triste,
  ou dans l'excuse — juste chaleureuse et rassurante.
