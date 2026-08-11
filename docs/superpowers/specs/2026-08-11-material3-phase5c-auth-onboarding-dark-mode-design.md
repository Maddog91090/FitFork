# FitFork — Phase 5c : flux auth/onboarding, écrans orphelins, et activation du mode sombre

**Date** : 2026-08-11
**Statut** : Spec validée, en attente d'implémentation

## Contexte et motivation

Les Phases 5a (`docs/superpowers/specs/2026-08-11-material3-phase5a-navigation-daily-screens-design.md`)
et 5b (`docs/superpowers/specs/2026-08-11-material3-phase5b-content-screens-design.md`),
toutes deux mergées, ont migré les 11 écrans d'usage quotidien vers
Material 3 et retiré `PressableScale`/la mascotte de toute l'UI
fonctionnelle. Cette spec ferme le chantier "20/20 à l'audit" :

1. **Phase 5a (fait)** — navigation + 6 écrans du quotidien.
2. **Phase 5b (fait)** — écrans de contenu/détail + retrait PressableScale.
3. **Phase 5c (cette spec)** — flux auth + onboarding, 3 composants
   partagés jamais migrés, suppression d'un composant mort, puis
   activation du mode sombre.

Le système de couleurs clair+sombre est construit et vérifié WCAG depuis
la Phase 4 (`useMaterialColors()`/`useMaterialTertiary()` lisent déjà
`useColorScheme()`) — cette phase ne construit rien de nouveau côté
tokens, elle termine la migration des derniers fichiers puis lève le
dernier verrou.

## Découverte pendant le brainstorming — fichiers jamais migrés

Trois composants partagés sont encore sur `useThemeColors()`/`typography`
et sont directement rendus par des écrans déjà Material-isés depuis les
Phases 5a/5b, où l'écart est actuellement invisible (les valeurs claires
sont identiques entre les deux systèmes) mais deviendrait un vrai défaut
visuel dès l'activation du mode sombre :

- `src/components/ui/ErrorNotice.tsx` — rendu sur 8 écrans déjà migrés
  (Accueil, Plan, Recettes, Muscu, Courses, Poids, Progression, détail
  recette) plus 4 écrans auth/onboarding de cette phase.
- `src/components/ui/TextField.tsx` — rendu sur `weight-log.tsx` (déjà
  migré) plus tous les écrans du flux auth/onboarding de cette phase.
- `src/components/ui/Sparkline.tsx` — rendu uniquement sur `weight-log.tsx`
  (déjà migré).

Un quatrième fichier, `src/components/icons/KgIcon.tsx`, a été identifié
comme du **code mort** : recherche exhaustive confirmant zéro
consommateur nulle part dans `src/app/` ou ailleurs — probablement
l'ancienne icône de l'onglet "Poids" avant que `TabIcon` soit reconstruit
sur `MaterialIcons` en Phase 4. Il est supprimé plutôt que migré (voir
"Hors périmètre" pour ce que ça implique côté test).

Enfin, `src/app/_layout.tsx` (le layout racine) est structurellement
nécessaire à l'activation du mode sombre elle-même : il fixe
`<StatusBar style="dark" />` en dur et calcule le fond du `Stack` via
`useThemeColors()`. Sans le migrer, activer `userInterfaceStyle:
"automatic"` produirait une barre de statut et un fond d'écran figés en
clair pendant que le contenu bascule en sombre.

## Périmètre de cette spec

**Sept écrans** : `src/app/index.tsx`, `login.tsx`, `signup.tsx`,
`forgot-password.tsx`, `onboarding.tsx`, `auth/callback.tsx`,
`auth/reset-password.tsx`. Chacun passe de `useThemeColors()`/
`typography` à `useMaterialColors()`/`useMaterialTertiary()`/
`materialTypography`, avec la même table de correspondance couleur que
les Phases 5a/5b (reproduite ci-dessous). `index.tsx` n'a aucun token à
migrer (juste un `ActivityIndicator` de redirection) — vérifié en le
lisant, pas supposé ; il n'a donc pas de tâche dédiée dans le plan au-delà
d'une confirmation qu'il n'y a rien à faire.

**Domaine des écrans auth** : aucun de ces écrans n'utilise le système de
couleur par domaine (nutrition/sport/neutre) — ils sont tous sur les
tokens hérités `accentRed`/`accentRedDeep`, la couche la plus ancienne du
projet, déjà repointée vers `domainProgress` dans `tokens.ts`. Cohérent
avec cette correspondance déjà établie : `accentRed` →
`useMaterialTertiary('progress').tertiary`, `accentRedDeep` →
`.tertiaryContainer`.

**Trois composants partagés migrés** : `ErrorNotice.tsx`, `TextField.tsx`,
`Sparkline.tsx` — même table de correspondance, aucun changement d'API
publique (props inchangées, tous leurs appelants existants continuent de
fonctionner sans modification).

**`KgIcon.tsx` supprimé** avec son fichier de test
(`src/__tests__/KgIcon.test.tsx`).

**`src/app/_layout.tsx` rendu sensible au thème système** :
`<StatusBar style="dark" />` → `<StatusBar style="auto" />` (bascule
automatiquement selon `useColorScheme()`) ; `contentStyle.backgroundColor`
passe de `useThemeColors().bgBase` à `useMaterialColors().background`.

**`app.json`** : `userInterfaceStyle` passe de `"light"` à `"automatic"`
— le seul verrou restant. La variante sombre du splash screen (ajoutée en
Phase 4, restée inerte jusqu'ici) devient effective.

## Table de correspondance couleur (identique aux Phases 5a/5b)

| Ancien (`useThemeColors()` champ) | Nouveau | Note |
| --- | --- | --- |
| `bgBase` | `useMaterialColors().background` | |
| `bgSurface` | `useMaterialColors().surface` | |
| `bgSunken` | `useMaterialColors().surfaceVariant` | |
| `textPrimary` | `useMaterialColors().onSurface` | |
| `textSecondary` | `useMaterialColors().onSurfaceVariant` | |
| `textOnAccent` | `useMaterialTertiary('progress').onTertiary` | pour ces écrans, domaine fixe |
| `divider` / `border` | `useMaterialColors().outlineVariant` | |
| `borderStrong` | `useMaterialColors().outline` | |
| `error` | `useMaterialColors().error` | |
| `accentRed` (fills) | `useMaterialTertiary('progress').tertiary` | |
| `accentRedDeep` (texte coloré taille body) | `useMaterialTertiary('progress').tertiaryContainer` | même valeur hex qu'avant |
| `shadow.card` (sur une `View` brute) | `materialElevation` | |

`typography.*` → `materialTypography.*` suit le même renommage que les
phases précédentes.

## Activation du mode sombre et vérification

Une fois les 13 fichiers migrés (7 écrans + 3 composants + `_layout.tsx`,
plus `app.json`), le mode sombre est activé pour la première fois dans
toute l'application. Contrairement aux phases précédentes — qui migraient
des tokens vers des valeurs claires identiques, donc invisibles à l'œil —
cette phase rend quelque chose de **réellement nouveau** visible pour la
première fois.

**Vérification manuelle obligatoire avant de proposer la fusion de la
PR** : `npx expo start`, test des écrans principaux (Accueil, Plan, un
écran auth) en mode clair ET en forçant le mode sombre du système — pas
seulement `npx tsc --noEmit`/`npx jest` au vert. Ce n'est pas une phase
que l'on peut clore sur la seule base des tests automatisés.

## Hors périmètre de cette spec

- Tout écran déjà migré en Phase 5a/5b — non retouché ici.
- `MacroIcon` — conservé tel quel (déjà acté en Phase 4).
- `Mascot.tsx` — composant non touché (déjà orphelin de tout écran depuis
  la Phase 5b, reste l'identité icône d'app/splash).
- Tout nettoyage plus large des tokens legacy (`shadow.subtle`/`.raised`,
  `clayOverlay`, `expo-linear-gradient` non utilisé) — hors périmètre,
  signalé comme candidat de nettoyage futur mais pas traité ici.

## Contraintes héritées (ne pas casser)

- `npx tsc --noEmit` et `npx jest` clean avant de considérer une tâche
  finie (revérifier le compte exact d'erreurs préexistantes au début de
  l'exécution plutôt que de réutiliser un chiffre d'une phase précédente).
- Aucun build EAS déclenché automatiquement.
- 48dp minimum sur toute cible tactile, `accessibilityRole` sur tout
  élément interactif.
- Les routes existantes ne changent pas d'URL.
- La vérification manuelle sur appareil/émulateur (clair + sombre) est
  une exigence de cette spec, pas une simple recommandation — voir
  "Activation du mode sombre et vérification" ci-dessus.
