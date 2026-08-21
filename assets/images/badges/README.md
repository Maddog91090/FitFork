# Badges

Médailles illustrant chaque badge de la gamification sportive. Fond
transparent, générées avant que le système de design ne soit remis à
plat — ne pas les traiter comme une référence de direction visuelle pour
de nouveaux assets.

| File | Size | Badge |
| --- | --- | --- |
| `premiere-seance.png` | 192×192 | Première séance |
| `habitue.png` | 192×192 | Habitué |
| `veteran.png` | 192×192 | Vétéran |
| `mois-sans-faute.png` | 192×192 | Un mois sans faute |
| `sur-la-duree.png` | 192×192 | Sur la durée |
| `esprit-equipe.png` | 192×192 | Esprit d'équipe |
| `duo-en-or.png` | 192×192 | Duo en or |

Fond transparent (background retiré après génération). Rendu par
`src/lib/workoutBadges.ts` via `require()` ; un badge verrouillé affiche sa
médaille à `state.disabledOpacity`, un badge débloqué l'affiche pleine
opacité.
