# FitPro — nouvelle direction artistique claymorphic & mascotte

**Date**: 2026-08-09
**Statut**: Spec validée, en attente d'implémentation
**Remplace**: `docs/superpowers/specs/2026-08-06-coral-rush-design-system-design.md`
(jamais implémentée — voir note de dépréciation dans ce fichier et dans son
plan associé)

## Contexte et motivation

La DA actuelle ("Soft Neutral" — papier blanc cassé, serif Fraunces, rouge
unique, documentée dans `.claude/skills/fitfork-design/SKILL.md`) manque de
personnalité : propre mais plate, sans rien qui donne envie de s'attarder.

Une première tentative de remplacement ("Coral Rush", 2026-08-06) avait déjà
posé ce constat mais n'a jamais été implémentée. Cette spec la remplace
entièrement avec une direction différente, issue d'un nouveau brainstorming
avec comparaisons visuelles : **claymorphic** (volume gonflé, ombres douces
internes/externes, zéro contour dur) plutôt que vecteur plat, **couleur
multi-domaine** plutôt qu'un accent unique, une **mascotte permanente**
(créature sportive générique, pas un aliment ni une espèce précise imposée).

Décision : **remplacement complet** de la DA — visuel et motion à la fois, pas
une passe d'animation sur l'existant.

## Identité

FitPro devient une app **claymorphic joyeuse à mascotte permanente** : tout
est gonflé, sans contour dur, porté par des ombres douces ; une créature
sportive vit dans l'app en continu et réagit à ce que l'utilisateur fait.
Référence de motion et de chaleur : Duolingo — adapté fitness + nutrition
plutôt que langues, mais en volume plutôt qu'en aplat.

## Couleur — multi-domaine, pas d'ancre unique

Contrairement à la règle actuelle ("un seul rouge, rare"), chaque domaine
fonctionnel porte sa propre teinte claymorphic (dégradé doux + ombre interne
assortie) :

| Domaine | Teinte | Notes |
| --- | --- | --- |
| Nutrition | Jaune/orange chaud | ex. `#FFD873` → `#FFB23C` en dégradé |
| Sport | Vert/teal | ex. `#8FE0C2` → `#4CBE95` en dégradé |
| Progression / streaks | Rose/corail | distinct des deux autres, à affiner en implémentation |
| Fond écran (`bgBase`) | Clair et chaud | continuité avec le papier actuel, juste éclairci pour laisser respirer les couleurs vives |
| Cartes/surfaces (`bgSurface`) | Blanc cassé | porte les ombres claymorphic |
| Texte fort (`textPrimary`) | Encre chaude foncée | pas de noir pur, cohérent avec le reste de la palette |

La structure des tokens (`bgBase`, `bgSurface`, `bgSunken`, `textPrimary`,
`textSecondary`, `divider`, `border`...) reste celle de `tokens.ts`
aujourd'hui dans son principe, mais les tokens d'accent unique
(`accentRed`, `accentRedDeep`, `accentRedSoft`) sont remplacés par un
token par domaine (nomination définitive en implémentation, ex.
`domainNutrition`, `domainSport`, `domainProgress`, chacun avec ses variantes
`Deep`/`Soft`/dégradé). Chaque domaine garde sa règle de rareté propre : dans
un contexte nutrition, le jaune est l'accent ; dans un contexte sport, le
vert — jamais les deux mélangés sur un même écran sans raison.

Toutes les nouvelles paires texte/fond devront être vérifiées au ratio AA
4.5:1 pendant l'implémentation (script WCAG ponctuel, pratique déjà en place
sur ce repo) — valeurs indicatives ci-dessus, pas figées.

L'app reste **light-only** : aucune raison de revisiter le dark mode dans ce
chantier (décision délibérée et indépendante, voir historique dans
`fitfork-design/SKILL.md`).

## Typographie — tout nouveau, rond et chunky

- Fraunces (serif) **et** Plus Jakarta Sans sortent tous les deux — aucune
  des deux familles actuelles ne convient au registre claymorphic.
- Une **famille unique, bien ronde et épaisse** (candidats : Fredoka, Baloo 2,
  Nunito ExtraBold) pour titres, corps, chiffres et boutons — le choix
  définitif se fait en implémentation selon rendu réel sur device et
  disponibilité via `@expo-google-fonts/*`.
- Comme aujourd'hui : React Native ne synthétise pas les graisses pour les
  polices custom, donc le poids reste porté par le nom de la famille chargée,
  jamais par un `fontWeight` inline.

## Forme & élévation — claymorphic pur

- Rayons très généreux partout — pas de petit radius, pas de coin carré.
- Ombre à deux couches sur les surfaces "gonflées" (icônes, chips, boutons,
  mascotte) : une ombre portée douce vers l'extérieur pour la profondeur, plus
  une ombre interne haut-clair / bas-foncé pour l'effet volume/pâte à
  modeler.
- Zéro contour noir — la variante "contour épais façon sticker" explorée en
  brainstorming a été explicitement écartée au profit du volume seul.
- Les cartes photo (recettes, séances, exercices — voir plus bas) gardent un
  cadre gonflé/ombré autour d'une image photoréaliste non retouchée : le
  contraste entre cadre claymorphic et contenu réaliste est assumé, pas subi.

## Mascotte

- **Créature sportive générique** — pas un aliment, pas une espèce animale
  imposée — pour rester libre de décliner tenues/accessoires sans s'enfermer
  dans une identité trop spécifique.
- Nom et espèce/silhouette précise **hors périmètre de cette spec** : 2-3
  options illustrées seront proposées en phase de design détaillé plutôt que
  devinées ici.
- Présence **continue**, pas seulement ponctuelle : idle discret (respire,
  cligne des yeux, réagit au scroll) même quand l'utilisateur ne fait rien de
  notable.
- Réactions fortes aux moments de célébration : séance terminée, repas
  loggé, streak atteint — grande animation mémorable, pas un simple toast.
- Rendu **tout en volume claymorphic**, cohérent avec le reste de l'UI — pas
  de rendu vectoriel plat ni de contour dur.
- Poses V1 minimum à couvrir (repris du travail Coral Rush, toujours valide
  indépendamment de l'espèce choisie) :
  1. Idle / accueil
  2. En mouvement (chargement, transitions)
  3. Célébration (bras levés / saut)
  4. Motivant-après-échec (déçu mais encourageant, jamais culpabilisant)

C'est le chantier le plus lourd de la DA ; il se découpe en tâche dédiée dans
le plan d'implémentation plutôt que traité en passant sur un écran.

## Photos — traitement hybride, contraste assumé

Les 32 photos de recettes, 9 photos de séances et 21 photos d'exercices
(photoréalistes, "vraie personne, vrai plat") **restent inchangées** — aucune
régénération. Elles deviennent l'ancrage réel au centre d'un cadre
claymorphic (radius généreux, ombre à deux couches) plutôt que d'être
remplacées par des illustrations. Le contraste photo-réaliste / UI-gonflée
est une décision assumée, pas une dette visuelle à corriger plus tard.

## Icônes — nouveau set sur-mesure

Les emojis actuels (macros, états vides, catégories) sont remplacés par un
set d'icônes claymorphic dessinées sur-mesure, cohérentes avec la mascotte
(mêmes dégradés, même logique d'ombre à deux couches). C'est un chantier
d'illustration séparé des tokens/composants/mascotte — non bloquant pour la
Phase 1 du rollout (voir plus bas), à chiffrer et planifier à part.

## Mouvement — ambition large, sur quatre fronts

1. **Toucher** — squish/rebond claymorphic prononcé sur boutons, cartes,
   chips. Remplace le `PressableScale` actuel (déjà springy) par une version
   plus marquée : plus d'amplitude sur l'échelle, timing plus rebondissant.
2. **Célébration** — mascotte + confettis/pop sur séance terminée, repas
   loggé, streak atteint.
3. **Transitions d'écran** — au-delà du slide standard : éléments qui
   rebondissent à l'arrivée plutôt qu'un simple fondu/glissement.
4. **Mascotte vivante** — micro-mouvements en continu (idle), pas seulement
   déclenchés par une action utilisateur.

Les valeurs de `motion` (durées, courbes, springs) dans `tokens.ts` sont
revues pour porter ce registre plus rebondissant par défaut, tout en gardant
la distinction actuelle entrée/sortie/standard.

## Ton du texte — deux registres

- Le texte fonctionnel (labels, erreurs, boutons, contenu informatif) **reste
  sobre**, tutoie, sans emphase — la règle actuelle ("pas de 'Boom !', pas
  d'exclamation") continue de s'appliquer ici.
- Les répliques de la mascotte et les messages de célébration ont le droit à
  l'énergie et aux exclamations — une zone dédiée à l'enthousiasme plutôt
  qu'un changement de ton généralisé.
- Exception maintenue, comme avant : les erreurs restent factuelles (ce qui
  s'est passé, puis quoi faire), sans intervention de la mascotte, pour ne
  jamais paraître se moquer de l'utilisateur en cas d'échec.
- Toujours tutoiement, toujours en français.

## Portée & phasage de l'implémentation

Remplacement complet, pas de coexistence avec Soft Neutral à maintenir.

1. **Tokens** — palette multi-domaine, typo (chargement de la nouvelle
   famille), formes/radius généreux, ombres à deux couches, motion (springs
   plus rebondissants) dans `src/theme/tokens.ts`.
2. **Composants partagés** — `Button`, `Card`, `PressableScale`, etc.
   re-stylés sur les nouveaux tokens ; pas de nouveau composant tant que les
   existants peuvent absorber le changement.
3. **Mascotte** — choix de l'espèce/silhouette (2-3 options illustrées),
   4 poses V1, intégrée aux emplacements validés ci-dessus.
4. **Écrans un par un**, du plus visible vers le reste (probablement accueil
   → nutrition → sport → détail recette/exercice, à confirmer en phase de
   plan) — chaque écran migré doit rester testable isolément pendant la
   transition.

Chantiers parallèles, non bloquants pour la Phase 1 :

- Set d'icônes claymorphic sur-mesure (remplace les emojis).
- Extension du répertoire de réactions mascotte au-delà des 4 poses V1.

### Contraintes héritées (ne pas casser)

- Zéro hex code, zéro `fontSize`/`fontWeight` inline — tout passe par
  `tokens.ts`.
- Chaque élément tappable : état pressé visible, 44pt minimum,
  `accessibilityRole`.
- Contraste AA 4.5:1 vérifié sur toutes les nouvelles couleurs (palette
  light-only unique).
- `npx tsc --noEmit` et `npx jest` clean avant de considérer un écran fini.
- Pas de build EAS lancé automatiquement — l'itération visuelle se fait via
  Expo Go ou simulateur, un build n'est déclenché que sur demande explicite.

## Hors périmètre de cette spec

- Le nom et l'espèce/silhouette définitifs de la mascotte.
- Les valeurs de tokens finales pixel/hex-perfect (affinées et vérifiées AA
  pendant l'implémentation, pas figées ici).
- La génération des assets illustrés de la mascotte (poses, formats) et du
  set d'icônes — sujets du plan d'implémentation, pas de cette spec.
- L'ordre exact de migration écran par écran au-delà de la Phase 1
  (composants partagés) — affiné en phase de plan.
