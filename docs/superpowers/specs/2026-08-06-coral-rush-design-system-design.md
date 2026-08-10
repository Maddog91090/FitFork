# FitPro Coral Rush — nouvelle direction artistique

**Date**: 2026-08-06
**Statut**: **Remplacée, jamais implémentée.** Voir
`docs/superpowers/specs/2026-08-09-claymorphic-mascot-design-system-design.md`
pour la direction retenue (claymorphic, couleur multi-domaine, mascotte
générique) — ce document est conservé pour historique uniquement.

## Contexte et motivation

La DA actuelle ("Soft Neutral" — papier blanc cassé, serif Fraunces, rouge
unique, documentée dans `.claude/skills/fitfork-design/SKILL.md`) manque de
personnalité, en particulier sur le motion : les interactions sont propres
mais plates, sans détail qui donne envie de s'attarder ou de revenir.

Décision : **remplacement complet** de la DA, sur le visuel et le motion à la
fois (pas une simple passe d'animation sur l'existant). Référence
d'inspiration : Duolingo — mascotte expressive, palette saturée, motion
rebondissant et "récompensant" — adaptée à un contexte fitness + nutrition
plutôt que langues.

## Identité — "Coral Rush"

### Palette

| Rôle | Valeur indicative | Notes |
| --- | --- | --- |
| Fond écran (`bgBase`) | `#FFF5F2` | pêche très clair |
| Cartes/surfaces (`bgSurface`) | blanc | |
| Accent primaire (`accentPrimary`) | `#FF6B5B` | corail — un seul par écran, même règle de rareté que le rouge actuel |
| Accent secondaire (`accentSecondary`) | `#4ECDC4` | turquoise — badges, éléments secondaires, jamais l'action primaire |
| Texte fort / encre (`textPrimary`) | `#3A3A5C` | encre marine, remplace le noir/gris actuel |

La structure des tokens (`bgBase`, `bgSurface`, `bgSunken`, `textPrimary`,
`textSecondary`, `accentPrimary`, `accentPrimaryDeep`, `accentPrimarySoft`,
`divider`, `border`...) reste celle de `tokens.ts` aujourd'hui — seules les
valeurs changent, pour que le remplacement soit mécanique côté composants.
Les teintes de texte dérivées (`textSecondary`, `accentPrimaryDeep`, etc.)
devront être vérifiées au ratio AA 4.5:1 pendant l'implémentation (script
WCAG ponctuel, comme c'est déjà la pratique sur ce repo) — pas figées ici.

L'app reste **light-only** : aucune raison de revisiter le dark mode dans ce
chantier (voir l'historique dans `fitfork-design/SKILL.md` — décision
délibérée, indépendante de la DA).

### Typographie & formes — "Chunky Sport"

- Le serif Fraunces est retiré (trop éditorial/calme pour la nouvelle
  direction).
- **Space Grotesk** (Bold/SemiBold) remplace Fraunces pour titres, chiffres et
  hero — géométrique, légèrement décalé, disponible via
  `@expo-google-fonts/space-grotesk` au même titre que Fraunces l'était.
- **Plus Jakarta Sans reste en place** pour le corps, les labels et les
  boutons (déjà chargée, déjà en ExtraBold) — pas de nouveau chargement de
  police pour le texte courant.
- Coins moyens (10–16px) partout, pas de pilule systématique ni de coins
  carrés stricts. Boutons pleins et impactants. Majuscules fréquentes sur les
  eyebrows et CTA courts.

## Mascotte — le Guépard

- Espèce choisie : **guépard** (vitesse, dynamisme), après exploration de
  blob abstrait / hybride fourchette-haltère / animal générique / spark
  géométrique.
- Présence **complète** dans l'app, pas un simple logo : onboarding, écran
  d'accueil, fin de séance, streaks, états vides, badges de succès.
- Style : vecteur plat, formes simples et arrondies, teinte corail
  dominante — pas de rendu 3D ni détaillé, pour rester rapide à décliner en
  poses et en motion.
- **Poses V1** (minimum à couvrir) :
  1. Idle / accueil
  2. En train de courir (chargement, transitions)
  3. Célébration (bras levés / saut) — jalons, fin de séance, objectif atteint
  4. Motivant-après-échec (déçu mais encourageant) — jamais culpabilisant

C'est le chantier le plus lourd de la DA ; il sera découpé en tâche dédiée
dans le plan d'implémentation plutôt que traité en passant sur un écran.

## Motion

- Le rebond (`spring.snappy`) devient la base des interactions courantes
  (chips, boutons, cartes), pas l'exception comme aujourd'hui.
- Les transitions d'écran restent fluides, sans rebond systématique — le
  rebond marqué est réservé aux moments de récompense pour ne pas fatiguer.
- Célébrations dédiées avec la mascotte + micro-confetti sur les jalons : fin
  de séance, objectif atteint, streak.

## Ton — copy "franchement hypé"

- Rupture avec la règle actuelle ("pas d'exclamations, pas de hype") : le ton
  enjoué et encourageant ("Bravo !", "Tu gères !") devient la norme sur
  l'ensemble des écrans, pas réservé aux moments de succès.
- Exception maintenue : les **erreurs restent factuelles** — dire ce qui
  s'est passé puis quoi faire, sans intervention de la mascotte, pour ne
  jamais paraître se moquer de l'utilisateur en cas d'échec.
- Toujours tutoiement, toujours en français.

## Portée & phasage de l'implémentation

Remplacement complet, pas de coexistence avec Soft Neutral à maintenir. La
palette `darkColors` déjà supprimée du repo reste indépendante de ce chantier
(récupérable en historique git si le dark mode revient un jour).

Phasage recommandé :

1. **Tokens** — palette, typo (chargement Space Grotesk), formes/radius,
   motion (springs plus rebondissants) dans `src/theme/tokens.ts`.
2. **Composants partagés** — `Button`, `Card`, `PressableScale`, etc.
   re-stylés sur les nouveaux tokens ; pas de nouveau composant, ceux qui
   existent absorbent le changement.
3. **Mascotte Guépard** — 4 poses V1, intégrées aux emplacements validés
   ci-dessus.
4. **Copy pass** — ton hypé sur les écrans, règle "erreurs factuelles"
   inchangée.
5. **Écrans un par un**, du plus visible (accueil, onboarding) vers le reste
   — chaque écran migré doit rester testable isolément pendant la
   transition.

### Contraintes héritées (ne pas casser)

- Zéro hex code, zéro `fontSize`/`fontWeight` inline — tout passe par
  `tokens.ts`.
- Chaque élément tappable : état pressé visible, 44pt minimum,
  `accessibilityRole`.
- Contraste AA 4.5:1 vérifié sur toutes les nouvelles couleurs, dans le seul
  palette (light-only).
- `npx tsc --noEmit` et `npx jest` clean avant de considérer un écran fini.

## Hors périmètre de cette spec

- Le choix définitif du nom de la mascotte.
- Les valeurs de tokens finales pixel/hex-perfect (affinées et vérifiées AA
  pendant l'implémentation, pas figées ici).
- La génération des assets illustrés du guépard (poses, formats) — sujet du
  plan d'implémentation, pas de cette spec.
