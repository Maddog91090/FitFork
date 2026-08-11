# FitFork — Phase 4 : fondations Material 3

**Date** : 2026-08-11
**Statut** : Spec validée, en attente d'implémentation

**Correction post-brainstorming (pendant l'écriture du plan) :** la version
initiale de cette spec disait que `PressableScale` serait retiré en Phase
4. Un grep complet de ses usages a montré qu'il est aussi consommé par
`BackLink.tsx` et par 4 écrans hors périmètre de cette phase (`home.tsx`,
`workout.tsx`, `workout-session.tsx`, `generate-plan.tsx`) — le supprimer
casserait ces consommateurs que la spec interdit par ailleurs de toucher.
`PressableScale.tsx` reste donc en place ; seuls les composants
effectivement reconstruits ici (`Button`, `ChoiceGroup`,
`TagFilterGroup`) cessent de le consommer. Son retrait complet est
repoussé en Phase 5, une fois `BackLink` et les écrans restants migrés.
Voir le tableau des composants et la section Motion, mis à jour en
conséquence.

## Contexte et motivation

`/impeccable audit` (variante native Android) score l'app à 15-16/20 après
une première vague de correctifs mécaniques (predictive back, Reduce
Motion, cache image, label d'accessibilité, insets de zone de sécurité,
cibles tactiles 48dp). Les trois dimensions encore plafonnées —
**Apparence & Theming** (pas de dark mode, pas de rôles de couleur
Material), **Conformité plateforme** (composants custom au lieu de
Material 3, tab bar à 6 destinations), **Adaptabilité** (pas de support
tablette/paysage) — ne sont pas des bugs mais des écarts délibérés du
système claymorphic construit sur les Phases 1–3
(`docs/superpowers/specs/2026-08-09-claymorphic-mascot-design-system-design.md`,
`2026-08-10-claymorphic-phase2-screen-rollout-design.md`,
`2026-08-11-claymorphic-phase3-content-screens-design.md`, toutes
mergées, plus `DESIGN.md` qui documente le système actuel "Le Brocoli
Vivant").

L'utilisateur a explicitement demandé et confirmé cette refonte après
avoir été informé qu'elle défait la majorité de cette identité visuelle :
la mascotte quitte toute l'UI fonctionnelle (ne reste que comme icône
d'app/splash), les composants pâteux/rebondissants deviennent des
composants Material 3 standards, et une palette sombre est réintroduite —
sur une base entièrement nouvelle, pas une résurrection de l'ancienne
palette "Soft Neutral" révoquée après test on-device (accessible dans
l'historique git au commit `228667e` si besoin de référence, mais pas la
source de vérité ici).

Étant donné l'ampleur (~20 fichiers de composants, ~15 écrans, tokens,
config), le chantier est découpé en trois phases séquentielles, à
l'image du découpage Phase 1 → Phase 2/3 déjà utilisé pour le système
claymorphic :

1. **Phase 4 (cette spec)** — Fondations : tokens de couleur clair+sombre
   au format Material 3, reconstruction des composants partagés. Aucun
   écran touché.
2. **Phase 5 (plus tard, spec séparée)** — Déploiement écran par écran :
   chaque écran migre vers les nouveaux composants, la mascotte est
   retirée au passage, la tab bar passe de 6 à 5 destinations.
3. **Phase 6 (plus tard, spec séparée)** — Passe défensive tablette/
   paysage une fois le système Material en place partout.

## Périmètre de cette spec — fondations uniquement

- Nouveau système de tokens Material 3 (clair + sombre).
- Reconstruction des composants partagés : `Button`, `Card`,
  `ChoiceGroup`, `TagFilterGroup`, `EmptyState`, `TabIcon`. `Button`,
  `ChoiceGroup` et `TagFilterGroup` cessent chacun de consommer
  `PressableScale` en se reconstruisant sur `Pressable` + ripple — voir la
  correction ci-dessous sur le sort du fichier lui-même.
- Changements `app.json`.
- Remplacement de `DESIGN.md`.
- **Aucun écran sous `src/app/` n'est modifié.** Les écrans continuent de
  consommer les anciens composants/tokens jusqu'à la Phase 5 — c'est
  intentionnel, pas un oubli, exactement comme la Phase 1 claymorphic
  n'avait touché aucun écran non plus.
- La mascotte (`Mascot.tsx`, les 3 poses) **n'est pas supprimée** dans
  cette phase — elle reste utilisée par les écrans actuels jusqu'à ce
  qu'ils migrent en Phase 5. Seuls les assets d'identité de l'app (icône,
  splash, adaptive icon Android) restent inchangés dans tous les cas —
  ils continuent d'utiliser la mascotte après la Phase 5 aussi.

## Système de couleurs

Pas un seul accent Material fixe partout : les quatre couleurs de domaine
survivent, mais réorganisées dans le système de rôles Material 3 plutôt
qu'en tokens `domainX`/`domainXDeep` indépendants.

### Rôles fixes (toute l'app, ne changent jamais par écran)

| Rôle Material | Source | Usage |
| --- | --- | --- |
| `primary` / `onPrimary` | Dérivé de Cacao Chaud (`#7A5C34`) | Chrome structurel : indicateur d'onglet actif, anneaux de focus, boutons neutres. Partage sa couleur source avec le domaine neutre de `tertiary` ci-dessous par choix, pas par erreur — sur un écran neutre, chrome et contenu s'harmonisent naturellement au lieu d'entrer en conflit. |
| `primaryContainer` / `onPrimaryContainer` | Dérivé de Cacao Chaud, teinte container | Fonds de remplissage neutres (badges, states secondaires) |
| `surface` / `onSurface` | Blanc Surface (`#FFFFFF`) / Encre Chaude (`#2E2418`) | Cartes, inputs, tout élément surélevé |
| `surfaceVariant` / `onSurfaceVariant` | Pêche Creuse (`#FFF3E0`) / Encre Atténuée (`#6B5A46`) | Zones creuses/secondaires |
| `background` / `onBackground` | Crème Chaude (`#FFFBF5`) / Encre Chaude | Fond d'écran |
| `outline` / `outlineVariant` | Trait Renforcé (`#A67F4C`) / Trait Extérieur (`#F0D9B8`) | Bordures, séparateurs |
| `error` / `onError` / `errorContainer` / `onErrorContainer` | Erreur (`#DC2626`) / Erreur Douce (`#FBEAE7`), inchangés | États d'erreur, non touchés par cette refonte |

### Rôle swappable (change selon le domaine de l'écran)

| Rôle Material | Domaine nutrition | Domaine sport | Domaine progression | Domaine neutre |
| --- | --- | --- | --- | --- |
| `tertiary` | Ambre Grillé `#B25900` | Vert Forêt `#187A57` | Rouge Baie `#C2325A` | Cacao Chaud `#7A5C34` |
| `onTertiary` | Blanc | Blanc | Blanc | Blanc |
| `tertiaryContainer` | Ambre Grillé Profond `#8A5200` | Vert Forêt Profond `#0E4F38` | Rouge Baie Profond `#A31C42` | Cacao Chaud Profond `#6B4F26` |

C'est le rôle `tertiary`/`tertiaryContainer` qu'un composant lit pour se
teinter selon le domaine — un `Button` de la Phase 5 passera un domaine
qui sélectionne quelle des quatre paires `tertiary`/`tertiaryContainer`
utiliser, exactement comme l'actuel `Button`'s `domain` prop sélectionne
`domainX`/`domainXDeep` aujourd'hui. La forme de l'API ne change pas,
seulement le nom des rôles sous-jacents.

### Palette sombre — méthode de dérivation

Matérielle 3 inverse l'usage de l'intensité entre clair et sombre : en
clair, une couleur de domaine remplit une grande surface avec du texte
blanc dessus ; en sombre, une version sombre-désaturée de la même teinte
remplit la surface, et la couleur saturée d'origine devient la couleur du
texte/icônes par-dessus (évite les grands aplats saturés qui
"vibrent" sur fond sombre). Concrètement pour chaque couleur de domaine :
la valeur `tertiaryContainer` du mode sombre est une version à ~20-25% de
luminosité de la même teinte (proche du fond), et `onTertiaryContainer`
devient une version claire (~80-85% de luminosité) de la même teinte —
inversion du rapport clair/sombre par rapport au mode clair, pas une
teinte différente.

Les valeurs hexadécimales exactes et leur vérification WCAG (4.5:1 texte,
3:1 UI non-textuelle, sur fond clair **et** sombre) sont calculées pendant
le plan d'implémentation, avec le même script de luminance relative que
celui utilisé pour dériver les couleurs de domaine originales en Phase 1
— pas de valeurs inventées à la volée.

### Typographie

Fredoka reste la police unique — `android.md` permet explicitement de
thématiser une police de marque à travers l'échelle de types Material
("Roboto is the system face; theme a brand face in through the type
scale"), donc changer de police n'est pas nécessaire pour la conformité.
Les 12 rôles actuels (`hero`/`display`/`title`/`metric`/`heading`/
`subheading`/`body`/`bodyStrong`/`label`/`caption`/`captionStrong`/
`overline`) sont renommés vers l'échelle Material (`displayLarge`/
`displayMedium`/`titleLarge`/`titleMedium`/`bodyLarge`/`bodyMedium`/
`labelLarge`/`labelSmall`, etc.) sans changer les valeurs de taille/
interligne/tracking sous-jacentes — un renommage de rôles, pas une
refonte typographique.

## Composants

| Composant actuel | Devient | Détail |
| --- | --- | --- |
| `Button` | Bouton Material Filled / Outlined | Remplissage = `tertiary` du domaine (Filled) ou transparent avec bordure `outline` (Outlined, remplace `variant="secondary"`). `android_ripple` sur le `Pressable` au lieu du spring couleur+scale. Pas de `clayOverlay`. |
| `Card` | Material Card élevée | `surface` + ombre tonale standard Material (une seule valeur d'élévation, pas les trois paliers `subtle`/`card`/`raised` actuels ni le `clayOverlay`). |
| `ChoiceGroup` | Material filter chips (sélection unique) | Remplissage sélectionné = `tertiary` du domaine ; ripple au lieu du spring scale-only. |
| `TagFilterGroup` | Material filter chips (sélection multiple) | Même traitement que `ChoiceGroup`, sémantique multi-sélection inchangée. |
| `EmptyState` | Structure identique, restylée | Toujours `illustration`/`icon`/`title`/`message`/`actionLabel`/`onAction`/`domain` — seule l'implémentation interne change de tokens. |
| `PressableScale` | **Conservé, pas retiré** (correction, voir note ci-dessous) | `Button`, `ChoiceGroup`, `TagFilterGroup` cessent de le consommer (ripple `android_ripple` à la place). Le fichier lui-même reste : `BackLink` et 4 écrans hors périmètre (`home.tsx`, `workout.tsx`, `workout-session.tsx`, `generate-plan.tsx`) en dépendent encore et ne sont pas touchés avant la Phase 5. |
| `TabIcon` (raster custom, `assets/images/icons/tab-*.png`) | `MaterialIcons` de `@expo/vector-icons` | Déjà une dépendance du projet, zéro ajout. Tintable via `tabBarActiveTintColor`/`tabBarInactiveTintColor` (retour au mécanisme de teinte, contrairement à l'opacité actuelle nécessaire pour des images raster). Mapping icône-par-icône (Accueil/Plan/Recettes/Muscu/Courses/Poids → noms `MaterialIcons` équivalents) décidé pendant le plan. |
| `MacroIcon` (raster custom) | Conservé tel quel pour l'instant | Aucun équivalent Material direct pour des icônes de macro-nutriments ; hors du périmètre "conformité plateforme" de l'audit (ce ne sont pas des contrôles d'interaction). Réévalué en Phase 5 si besoin. |
| `Mascot` | Inchangé, toujours dans `src/components/ui/` | Le composant lui-même n'est pas modifié ni supprimé — seul son usage dans les écrans disparaît, en Phase 5. |

## Motion

- Le ripple Material (`Pressable`'s prop `android_ripple`) remplace le
  spring couleur+scale de `Button` et le spring scale-only que
  `ChoiceGroup`/`TagFilterGroup` consommaient via `PressableScale` —
  décision déjà confirmée par l'utilisateur, mais seulement pour ces
  composants reconstruits ici (voir correction ci-dessus sur
  `PressableScale`).
- `motion.spring.snappy` reste dans les tokens malgré ça :
  `PressableScale.tsx` (conservé, voir correction ci-dessus) le consomme
  toujours pour `BackLink` et les 4 écrans hors périmètre. Il ne devient
  supprimable qu'en Phase 5, une fois plus aucun consommateur restant.
- `motion.spring.celebrate` (rebond de la mascotte) reste dans les
  tokens : la mascotte elle-même n'est pas touchée en Phase 4, et ses
  poses `celebrating`/`encouraging` restent utilisées par les écrans
  jusqu'à leur migration en Phase 5.
- Les courbes/durées (`motion.duration.*`, `motion.curve.*`) restent
  inchangées — elles ne sont pas spécifiques au système claymorphic.
- Le hook `useReducedMotion` (ajouté lors de la vague de correctifs
  précédente) continue de s'appliquer normalement au ripple (le ripple
  Material respecte nativement Remove Animations sur Android — à
  vérifier pendant le plan qu'aucun wrapper supplémentaire n'est
  nécessaire).

## `app.json`

- `userInterfaceStyle` : `"light"` → `"automatic"` (bascule clair/sombre
  suit le système).
- `orientation` : `"portrait"` → clé retirée (déverrouille le paysage —
  défensif uniquement dans cette phase, la vraie passe d'adaptation
  tablette/paysage est la Phase 6).
- `predictiveBackGestureEnabled` : déjà `true` depuis la vague de
  correctifs précédente, inchangé.
- `splash` : nécessite une vérification qu'un variant sombre existe ou
  est ajouté (`expo-splash-screen` supporte un bloc `dark` distinct) —
  décidé pendant le plan.

## `DESIGN.md`

Remplacé entièrement, pas fusionné avec l'ancien contenu. Nouveau North
Star reflétant l'identité Material, palette documentée avec les deux
schémas clair/sombre côte à côte, plus de mascotte dans le corps du
document — celle-ci reste uniquement mentionnée dans `PRODUCT.md` comme
identité de l'app (icône/splash), pas comme élément du système visuel
fonctionnel. L'historique claymorphic ("Le Brocoli Vivant") reste
accessible dans l'historique git de `DESIGN.md`, pas dans le fichier
courant.

## Hors périmètre de cette spec

- Tout écran sous `src/app/` — Phase 5.
- Le retrait effectif de la mascotte de l'UI fonctionnelle — Phase 5 (le
  composant `Mascot.tsx` n'est pas touché ici, seul son environnement de
  composants change).
- La restructuration de la tab bar de 6 à 5 destinations — Phase 5 (cette
  phase change seulement l'*implémentation* des icônes, pas le *nombre*
  de destinations).
- Le support tablette/paysage réel (mise en page adaptative,
  size-classes) — Phase 6. Le déverrouillage `orientation` dans `app.json`
  ici est uniquement pour ne pas bloquer le paysage à l'avance ; aucune
  mise en page n'est vérifiée pour autant en Phase 4.
- `MacroIcon` — conservé tel quel, pas dans le périmètre de conformité
  plateforme de l'audit.

## Contraintes héritées (ne pas casser)

- `npx tsc --noEmit` et `npx jest` clean avant de considérer une tâche
  finie.
- Aucun build EAS déclenché automatiquement.
- Contraste WCAG AA (4.5:1 texte, 3:1 UI non-textuelle) vérifié sur les
  deux schémas clair et sombre pour chaque nouveau rôle de couleur —
  script de luminance relative, pas d'estimation à l'œil.
- 48dp minimum sur toute cible tactile (déjà en place via
  `state.minTouchSize`), `accessibilityRole` sur tout élément interactif.
- Le hook `useReducedMotion` continue de fonctionner correctement avec le
  nouveau système de motion basé sur le ripple.
