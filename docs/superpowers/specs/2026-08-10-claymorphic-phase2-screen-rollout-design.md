# FitPro — claymorphic Phase 2: screen rollout, mascot placements, custom icons, app identity

**Date**: 2026-08-10
**Statut**: Spec validée, en attente d'implémentation

## Contexte et motivation

Phase 1 (`docs/superpowers/specs/2026-08-09-claymorphic-mascot-design-system-design.md`,
mergée) a livré les fondations : tokens (couleurs de domaine, radius généreux,
ombres à deux couches, `clayOverlay`, Fredoka, motion plus rebondissante), les
composants partagés `Card`/`Button`/`PressableScale` re-skinnés, et un
composant `Mascot` de base (poses `idle`/`celebrating`) — mais **aucun écran
n'a été migré individuellement**. Après avoir vu un build APK réel, le
constat était : le changement de fondations propage bien (radius, ombre,
couleur par défaut sur les boutons), mais rien ne rend le nouveau système
*visible* — pas de mascotte à l'écran, pas de couleur contextuelle par
domaine, toujours les icônes Ionicons génériques. Deux maquettes de
validation (Accueil, Muscu) ont confirmé la direction : mascotte en header
avec une pose contextuelle, couleur de domaine appliquée aux accents de
l'écran, et un set d'icônes claymorphic sur-mesure remplaçant les icônes de
librairie.

Cette spec couvre la Phase 2 : la migration d'un premier lot de 5 écrans, les
emplacements de la mascotte, le set d'icônes, et — nouvelle demande apparue
pendant ce brainstorming — remplacer l'icône/logo de l'app par la mascotte.

## Écrans dans le périmètre — 5

Accueil (`(tabs)/home.tsx`), Plan (`(tabs)/plan.tsx`), Recettes
(`(tabs)/recipes.tsx`), Muscu (`(tabs)/workout.tsx`), Progression
(`progression.tsx`). Chaque écran migré reçoit :

1. La mascotte au bon emplacement (voir section suivante).
2. Chaque `Button` de l'écran passe la prop `domain` correcte au lieu du
   défaut `'neutral'`/`'progress'` hérité de Phase 1.
3. Tout accent codé en dur sur le token legacy `colors.accentRed*` est
   remplacé par le token de domaine explicite correspondant
   (`colors.domainNutrition*` / `domainSport*` / `domainProgress*`) —
   conformément à la règle déjà posée dans `fitfork-design/SKILL.md` ("ne pas
   utiliser `accentRed*` dans du code touché, utiliser les tokens de domaine
   directement").
4. Les nouvelles icônes, là où applicable (voir plus bas).

**Domaine par défaut de chaque écran** (pour ses boutons/accents qui n'ont
pas de raison plus spécifique) :

| Écran | Domaine |
| --- | --- |
| Accueil | Mixte — le bouton "Générer" (génération de plan) est `nutrition`, le reste suit le contenu de chaque carte (carte Progression = `progress`) |
| Plan | `nutrition` |
| Recettes | `nutrition` |
| Muscu | `sport` |
| Progression | `progress` |

Hors des 5 écrans : `workout-session.tsx` (fin de séance) reçoit aussi un
changement ciblé — voir "Mascotte" ci-dessous — mais n'est pas migré dans son
ensemble (pas de nouvelles icônes, pas de refonte du reste de l'écran). Tout
le reste (auth, détail recette/exercice, génération de plan, courses, poids)
est explicitement hors périmètre — voir "Hors périmètre".

## Mascotte — 5 emplacements

| Emplacement | Écran | Pose | Déclencheur |
| --- | --- | --- | --- |
| Header | Accueil | `idle` | Toujours visible |
| Header | Muscu | `idle` | Toujours visible |
| État vide | Plan (aucun plan) | `idle` | Remplace l'icône générique de `EmptyState` |
| État vide | Recettes (aucune recette ne correspond aux filtres) | `idle` | Idem |
| Fin de séance | `workout-session.tsx` | `celebrating` | Toujours, au moment où l'écran affiche "séance terminée" |
| Jalon de streak | Progression | `celebrating` sinon `idle` | `celebrating` quand `stats.streak > 0 && stats.streak % 7 === 0`, sinon `idle` — pas de suivi persistant d'un jalon "déjà vu", une visite un jour où le streak est multiple de 7 montre la célébration, ce qui est cohérent (le streak ne change qu'une fois par jour) |

`workout-session.tsx` : le texte actuel `"Séance terminée 🎉"` est remplacé
par la mascotte en pose `celebrating` plus un texte sobre sans emoji
(`"Séance terminée"` ou équivalent) — l'emoji contournait déjà la règle
anti-hype du ton fonctionnel ; avec la mascotte présente, l'énergie vient
d'elle, pas du texte.

Les 2 poses restantes du système (mouvement/transition, encourageant-après-
échec) sont **explicitement reportées** — aucun emplacement de cette phase
n'en a besoin, les générer maintenant serait du travail non consommé.

## Icônes claymorphic sur-mesure — 12 icônes

- **6 icônes de tab bar** (`(tabs)/_layout.tsx`) : Accueil, Plan, Recettes,
  Muscu, Courses, Poids. Produites ensemble car la tab bar est un composant
  partagé unique — même si Courses et Poids restent des écrans non migrés
  visuellement par ailleurs dans cette phase, leur icône de tab change avec
  les 4 autres pour éviter un mélange d'icônes dans une même barre.
  Remplacent les icônes Ionicons actuelles (`home`/`calendar`/`restaurant`/
  `barbell`/`cart`, chacune avec sa variante `-outline`) et l'icône `KgIcon`
  faite main. Chaque icône a un état actif et inactif (opacité ou saturation
  réduite pour l'inactif, cohérent avec le traitement actuel).
- **3 icônes de niveau d'effort** (Muscu) : modéré / élevé / intense —
  remplacent les puces textuelles actuelles dans la liste d'exercices.
- **3 icônes de macro** (Accueil, Recettes) : protéines / lipides / glucides
  — viennent en complément du texte coloré existant (`macroProtein`/
  `macroFat`/`macroCarbs`, inchangés), pas en remplacement des couleurs.

Toutes rendues dans le même langage claymorphic que la mascotte et les
composants (formes gonflées, ombre douce, pas de contour dur), à une échelle
cohérente entre elles.

## Identité de l'app — la mascotte devient le logo

Remplace, avec des rendus de la mascotte :

- `assets/images/icon.png` (1024×1024, opaque — pas de transparence, iOS
  compose son propre masque)
- `assets/images/splash-icon.png` (1024×1024, transparent — repose sur
  `splash.backgroundColor`, déjà `#FFFBF5`)
- `assets/images/android-icon-foreground.png` (1024×1024, transparent —
  couche de premier plan de l'icône adaptive Android)
- `assets/images/android-icon-background.png` (1024×1024, opaque — couche de
  fond de l'icône adaptive Android)
- `assets/images/android-icon-monochrome.png` (1024×1024, transparent,
  silhouette en une seule couleur — utilisée par les icônes thématisées
  Android 13+)

**Cadrage** : gros plan sur la tête/visage de la mascotte plutôt que le corps
entier — à la taille d'une icône d'accueil de téléphone (aussi petit que
48×48px selon la densité d'écran), les détails du corps/jambes/chaussures ne
se distingueraient pas et la reconnaissance doit reposer sur le visage
(grands yeux expressifs, déjà l'élément le plus caractéristique du
personnage).

**Icône adaptive Android — zone de sécurité** : le foreground doit garder le
sujet dans la zone centrale sûre (~66 % du canevas) car les launchers Android
rognent l'icône selon des formes variables (cercle, squircle, carré arrondi).

## Hors périmètre de cette spec

- Tout écran non listé ci-dessus (auth, détail recette/exercice, génération
  de plan, courses, poids) — Phase 3 explicite, séparée.
- Les poses mascotte "mouvement" et "encourageant-après-échec".
- Toute icône au-delà des 12 listées (empty states génériques hors Plan/
  Recettes, badges de progression, etc.).
- Le passage en ton "hypé" du texte fonctionnel — reste sobre partout sauf
  la mascotte/célébration, conformément à la règle déjà posée en Phase 1.

## Contraintes héritées (ne pas casser)

- Zéro hex code, zéro `fontSize`/`fontWeight` inline — tout passe par
  `src/theme/tokens.ts`.
- Chaque élément tappable : état pressé visible, 44pt minimum,
  `accessibilityRole`.
- Contraste AA 4.5:1 vérifié sur tout nouveau texte (les tokens de domaine
  sont déjà vérifiés en Phase 1 — pas de nouvelle couleur de texte introduite
  par cette phase).
- `npx tsc --noEmit` et `npx jest` clean avant de considérer un écran fini.
- Pas de build EAS déclenché automatiquement — un build n'est lancé que sur
  demande explicite.
- Copie fonctionnelle sobre, tutoiement, français — la mascotte/célébration
  peut avoir de l'énergie, le reste non.
