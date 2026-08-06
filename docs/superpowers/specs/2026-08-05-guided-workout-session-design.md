# Lecteur de séance guidée

Date : 2026-08-05
Statut : approuvé pour planification

## Contexte

L'écran Sport (`src/app/(tabs)/workout.tsx`) affiche aujourd'hui une
séance (circuit ou en séries) comme une liste statique à consulter :
temps d'effort/repos en texte, exercices listés, un bouton "Marquer
comme terminée" à la fin. Rien ne guide l'utilisateur pendant la séance
elle-même — il doit gérer son propre chronomètre.

Objectif : un bouton "Commencer" qui ouvre un lecteur guidé enchaînant
automatiquement les étapes de la séance (exercice → repos → exercice
suivant, etc.) avec un compte à rebours visuel et un bip sonore dans les
5 dernières secondes de chaque étape chronométrée.

## Constat sur les données existantes

Chaque niveau (`homeWorkoutProgram.ts`) a 3 séances, pas toutes du même
type :

- **Circuit** (`CircuitSession`) : `workSeconds`/`restSeconds` par
  exercice, répété `rounds` fois, avec un `recoveryLabel` texte entre
  les tours (ex. "1 min 30 de récup") — chronométrable.
- **En séries** (`SeriesSession`) : basée sur des répétitions, aucune
  durée chiffrée par exercice, juste un `restLabel` texte entre séries
  (ex. "45 s à 1 min de repos") — non chronométrable par nature.

Le lecteur guidé doit gérer les deux, différemment : décompte
automatique pour le circuit, avancée manuelle ("Terminé") pour les
séries, avec un repos chronométré entre les deux dans les deux cas.

## Modèle de données

Deux champs numériques ajoutés aux types existants dans
`homeWorkoutProgram.ts`, à côté des labels texte déjà présents (qui
restent pour l'affichage) :

- `CircuitSession.recoverySeconds: number` — dérivé des `recoveryLabel`
  existants, qui sont en réalité tous des durées propres : "2 min de
  récup (entre les tours)" → `120`, "1 min 30 de récup" → `90`.
- `SeriesSession.restSeconds: number` (au niveau de la séance, commun à
  tous ses exercices) — les `restLabel` existants sont des fourchettes
  ("45 s à 1 min de repos entre chaque", "45 s à 1 min de repos", "30 à
  45 s de repos seulement") ; la borne haute est retenue pour ne pas
  presser l'utilisateur : `60`, `60`, `45` respectivement pour les 3
  séances en séries existantes.

## File d'étapes

Une fonction pure transforme une séance en liste linéaire d'étapes —
"étape suivante" devient un simple incrément d'index, testable
indépendamment de tout minuteur ou de l'UI :

```ts
export type SessionStep =
  | { kind: 'work'; exerciseName: string; exerciseId: string; seconds: number; roundLabel: string }
  | { kind: 'rest'; seconds: number; nextExerciseName: string }
  | { kind: 'recovery'; seconds: number; label: string; nextRoundLabel: string }
  | { kind: 'manual'; exerciseName: string; exerciseId: string; detail: string };

export function buildSessionSteps(session: Session): SessionStep[];
```

- **Circuit** : pour chaque tour (1..`rounds`), pour chaque exercice,
  une étape `work` puis une étape `rest` (sauf après le dernier exercice
  du tour) ; après chaque tour sauf le dernier, une étape `recovery`.
- **Séries** : pour chaque exercice, une étape `manual` puis une étape
  `rest` (sauf après le dernier exercice).

## Minuteur, contrôles et bip

Un seul minuteur partagé (un hook, ex. `useStepTimer`) piloté par une
heure de fin (`deadline = Date.now() + secondes * 1000`), recalculé à
chaque tick plutôt que décrémenté pas à pas — reste précis même si le JS
est ralenti (app en arrière-plan bref, écran verrouillé un instant).

- **Étapes chronométrées** (`work`/`rest`/`recovery`) : compte à rebours
  affiché en grand ; bouton Pause/Reprendre ; bouton "Passer" qui avance
  immédiatement à l'étape suivante. À 0, avance automatique vers
  l'étape suivante (qui démarre aussitôt si elle est elle-même
  chronométrée).
- **Étapes manuelles** (`manual`) : pas de décompte — le détail de
  l'exercice (ex. "3 séries de 12 reps") et un bouton "Terminé" qui
  avance à l'étape suivante.
- **Bip** : un bip court à chacune des 5 dernières secondes d'une étape
  chronométrée (déclenché à 5, 4, 3, 2 et 1 seconde restante — pas un
  bip unique).
- **Écran maintenu allumé** pendant la lecture, via `expo-keep-awake`
  (nouvelle dépendance légère, standard pour ce type d'écran).
- Le son passe par `expo-audio` (nouvelle dépendance) avec un court bip
  ajouté comme asset du projet (`assets/audio/beep.mp3` ou équivalent).
  Aucune configuration de session audio d'arrière-plan pour cette
  version : en mode sonnerie coupée, le bip peut ne pas jouer sur iOS
  (comportement par défaut d'une app sans ce mode activé) — le visuel
  (chiffres + couleur) reste la source de vérité, le bip est un plus.

## Interface

**Écran des séances (`src/app/(tabs)/workout.tsx`)** — simplifié : la
liste d'exercices reste visible mais devient visuellement secondaire ;
un bouton **"Commencer"** devient l'action principale, bien visible en
haut de la carte de séance. Le bouton "Marquer comme terminée" existant
reste disponible en bas de carte (coche manuelle toujours possible sans
passer par le lecteur).

**Nouvel écran `src/app/workout-session.tsx`** — atteint via
`router.push({ pathname: '/workout-session', params: { level, sessionIndex } })`
depuis `workout.tsx`. Comme `/exercise/[id].tsx` re-dérive son exercice
depuis `getExercise(id)`, ce nouvel écran re-dérive la même séance
depuis `getLevelProgram(level).sessions[sessionIndex]` plutôt que de
faire transiter un objet complexe par les paramètres de navigation.

Affiche, selon l'étape courante : le nom de l'exercice, un repère de
progression ("Exercice 2/3 — Tour 1/3"), le grand chrono (ou le détail
texte pour une étape manuelle), et les contrôles adaptés au type
d'étape.

**Fin de séance** — file d'étapes épuisée → écran de fin avec un bouton
"Marquer la séance comme terminée" qui appelle directement
`logSessionCompletion` (déjà utilisé par `workout.tsx`, depuis
`src/lib/workoutCompletionsData.ts`), puis retour à l'onglet Sport. Cet
écran rafraîchit déjà son état "Fait aujourd'hui ✓" au focus
(`useFocusEffect` déjà en place) — rien de nouveau à câbler pour que le
retour reflète la séance validée.

## Gestion d'erreurs

- Session expirée en plein milieu du lecteur : redirection vers
  `/login`, comme tous les autres écrans protégés de l'app.
- Échec du chargement du son (fichier manquant, permission refusée) :
  le minuteur continue normalement sans bip — dégradation silencieuse,
  le visuel reste la source de vérité, jamais de blocage de l'écran
  pour un problème de son.
- Retour arrière en cours de séance : navigation retour simple, rien
  n'est persisté en base tant que "Marquer comme terminée" n'a pas été
  pressé sur l'écran de fin — pas de reprise de séance interrompue dans
  cette version.

## Tests

- `buildSessionSteps` : fonction pure, testée avec un circuit (plusieurs
  tours, vérification de l'ordre exact effort/repos/récup) et une
  séance en séries (manuel/repos), sans dépendance à un minuteur ou à
  l'UI.
- Le hook de minuteur (`useStepTimer`) : testé avec horloge système
  figée (`jest.useFakeTimers`), vérifie la précision du décompte, le
  déclenchement du bip aux 5 dernières secondes exactement, et le
  comportement pause/reprendre/passer.
- `workout-session.tsx` : testé avec `@testing-library/react-native`,
  son mocké, même convention que le reste des écrans de l'app.
- `workout.tsx` : mise à jour de ses tests existants pour couvrir le
  nouveau bouton "Commencer" et la navigation qu'il déclenche.

## Hors périmètre (explicitement)

- Reprise d'une séance interrompue (fermeture de l'app en plein
  milieu) — repart de zéro si l'utilisateur relance.
- Configuration audio d'arrière-plan / lecture en mode sonnerie coupée.
- Personnalisation des durées (l'utilisateur ne peut pas ajuster
  effort/repos/récup depuis le lecteur — ce sont les valeurs du
  programme).
- Historique ou statistiques par répétition/série effectuée — seule la
  validation finale de la séance (déjà existante) est enregistrée.
