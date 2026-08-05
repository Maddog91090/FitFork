# Gamification de la régularité sportive

Date : 2026-08-05
Statut : approuvé pour planification

## Contexte

Aujourd'hui, l'écran Sport (`src/app/(tabs)/workout.tsx`) affiche le programme
(3 niveaux × 3 séances) mais ne trace aucune complétion : rien n'indique
qu'une séance a été faite. Le poids (`weight_logs`) et le plan de repas
généré sont les deux seules données réellement journalisées côté serveur.

Objectif : encourager la régularité sportive via un système de jeu —
série (streak) hebdomadaire, points/niveau, badges avec visuel, et un bonus
coopératif entre les deux profils existants de l'app.

Hors périmètre pour cette itération : gamification de la nutrition et du
suivi de poids (pourra être une itération future sur le même modèle).

## Modèle de données

Une seule nouvelle table, cohérente avec le reste du projet où tout est
calculé côté client à partir de journaux bruts (voir `progressTracking.ts`
qui dérive une tendance de poids à partir de `weight_logs`, sans colonne
d'agrégat stockée).

```sql
create table workout_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  session_index int not null check (session_index in (0, 1, 2)),
  completed_at timestamptz not null default now(),
  completed_date date generated always as (completed_at::date) stored,
  unique (user_id, session_index, completed_date)
);

alter table workout_completions enable row level security;

create policy "select own completions"
  on workout_completions for select
  using (auth.uid() = user_id);

create policy "insert own completions"
  on workout_completions for insert
  with check (auth.uid() = user_id);

create policy "delete own completions"
  on workout_completions for delete
  using (auth.uid() = user_id);
```

- La contrainte `unique (user_id, session_index, completed_date)` empêche
  nativement de compter deux fois la même séance le même jour — pas de
  logique anti-triche à maintenir côté app pour ce cas précis.
- RLS restreint chaque utilisateur à ses propres lignes, comme les autres
  tables du projet (`recipes`, `weight_logs`, etc.).

### Fonction pour le bonus d'équipe

Le bonus d'équipe a besoin qu'un profil voie un agrégat de l'autre, sans
ouvrir l'accès à ses lignes brutes (horaires, quelle séance précisément).
Une fonction `security definer` expose uniquement le nombre de jours
distincts entraînés cette semaine, par utilisateur :

```sql
create or replace function team_week_progress()
returns table(user_id uuid, days_this_week int)
language sql
security definer
set search_path = public
as $$
  select user_id, count(distinct completed_date)::int
  from workout_completions
  where completed_date >= date_trunc('week', current_date)::date
  group by user_id;
$$;

grant execute on function team_week_progress() to authenticated;
```

Cette fonction doit retourner une ligne par utilisateur ayant au moins une
complétion cette semaine ; un utilisateur sans complétion n'apparaît pas
dans le résultat (le client traite l'absence comme `0`).

## Règles de calcul

Toutes ces règles sont des fonctions pures en TypeScript, sans état
serveur dérivé — elles prennent l'historique brut des complétions en
entrée et retournent les stats affichées. Aucune table d'agrégat
supplémentaire (pas de trigger SQL), pour rester cohérent avec le style du
reste du projet et garder l'ajout de nouvelles règles (ex. un nouveau
badge) sans migration.

- **Progression hebdomadaire** : nombre de *jours calendaires distincts*
  (lundi–dimanche) avec au moins une complétion, plafonné à 3 pour
  l'affichage "X/3". Faire deux séances le même jour ne compte que pour un
  jour côté progression hebdo (mais chaque complétion rapporte quand même
  ses points, cf. ci-dessous).
- **Points** : +10 par complétion distincte enregistrée ; +20 de bonus dès
  que la progression hebdomadaire atteint 3/3 ; +15 de bonus chacun quand
  le bonus d'équipe se déclenche pour la semaine.
- **Niveau** : `floor(points_total / 100) + 1`. Pas de plafond.
- **Streak** : nombre de semaines calendaires consécutives ayant atteint
  3/3, en remontant depuis la dernière semaine *entièrement écoulée*
  (avant la semaine calendaire courante). Si la semaine en cours a déjà
  atteint 3/3, elle s'ajoute provisoirement à l'affichage du streak ; si
  elle est en dessous de 3/3, elle n'est ni comptée ni cassante — elle est
  simplement "en cours" (affichée comme "X/3 cette semaine"). Une semaine
  entièrement écoulée sans 3/3 remet le streak à 0.
- **Bonus d'équipe** : se déclenche pour une semaine calendaire donnée dès
  que les deux profils ont chacun atteint 3/3 cette semaine-là. Cadre
  strictement coopératif — aucun classement, aucun rang affiché entre les
  deux profils.

## Badges

Liste de règles pures évaluées sur l'historique et les stats dérivées,
sous forme de configuration extensible :

```ts
type Badge = {
  id: string;
  label: string;
  description: string;
  medalImage: ImageSourcePropType;
  check: (stats: GamificationStats) => boolean;
};
```

| Badge | Condition |
|---|---|
| Première séance | 1ère complétion, tous temps |
| Habitué | 10 complétions au total |
| Vétéran | 50 complétions au total |
| Un mois sans faute | streak ≥ 4 semaines |
| Sur la durée | streak ≥ 12 semaines |
| Esprit d'équipe | 1er bonus d'équipe déclenché |
| Duo en or | bonus d'équipe 4 semaines calendaires d'affilée (même logique de comptage que le streak personnel : semaines entièrement écoulées, plus la semaine en cours comptée provisoirement si elle a déjà atteint 3/3 des deux côtés) |

Ajouter un badge plus tard = ajouter une entrée dans ce tableau, sans
migration ni nouvelle table.

### Visuel des badges

Chaque badge a sa propre illustration façon **médaille**, générée dans le
même esprit que les illustrations de marque déjà utilisées dans l'app
(pas d'icône générique de bibliothèque). Sept médailles à produire à
l'implémentation, une par badge listé ci-dessus, en suivant
`.claude/skills/fitfork-design/SKILL.md` pour le style et
`src/theme/tokens.ts` pour toute valeur visuelle environnante (pas de hex
ni de taille de police en dur). Un badge verrouillé affiche sa médaille en
grisé/désaturé ; un badge débloqué l'affiche en couleur.

## Interface

**Écran Sport (`src/app/(tabs)/workout.tsx`)** — sous la carte de la
séance actuellement affichée, un bouton d'action :

- Séance pas encore faite aujourd'hui → **"Marquer comme terminée"**.
  Insertion optimiste dans `workout_completions` ; en cas d'échec réseau,
  rollback de l'état local et message d'erreur inline — même pattern que
  `handleLevelChange` dans ce même fichier aujourd'hui.
- Séance déjà faite aujourd'hui → état coché désactivé **"Fait
  aujourd'hui ✓"** avec un lien secondaire **"Annuler"** qui supprime la
  ligne du jour (protection contre un clic accidentel).

**Accueil (`src/app/(tabs)/home.tsx`)** — nouvelle carte compacte
"Progression", positionnée entre la carte macros et la section "Actions
rapides". Contenu : icône flamme + valeur du streak, niveau actuel, et
"X/3 séances cette semaine". Toute la carte est pressable et navigue vers
l'écran détail.

**Nouvel écran `src/app/progression.tsx`** :

- En-tête : streak, niveau, total de points.
- Bloc "Cette semaine" : 3 pastilles représentant les jours distincts
  entraînés (faite / pas faite), pas liées à un `session_index`
  spécifique.
- Bloc bonus d'équipe : progression combinée des deux profils, formulée de
  façon coopérative (ex. "Vous deux : 2/6 séances cette semaine — bonus à
  6/6"). Si `team_week_progress()` échoue, ce bloc affiche seulement
  "Impossible de charger la progression du binôme" sans bloquer le reste
  de l'écran (même tolérance de panne partielle que le fallback poids
  dans `generate-plan.tsx`).
- Grille de badges : médaille en couleur + libellé pour les badges
  débloqués, médaille grisée pour les badges verrouillés.

## Fichiers

- `src/lib/workoutGamification.ts` (nouveau) : fonctions pures de calcul
  (progression hebdo, points, niveau, streak, badges, statut du bonus
  d'équipe) + fonctions d'accès Supabase (`logSessionCompletion`,
  `undoSessionCompletion`, `getMyCompletions`, `getTeamWeekProgress`).
- `src/app/progression.tsx` (nouveau) : écran détail.
- `src/app/(tabs)/home.tsx` : ajout de la carte "Progression".
- `src/app/(tabs)/workout.tsx` : ajout du bouton de complétion sous la
  carte de séance.
- `src/__tests__/workoutGamification.test.ts` (nouveau).
- Migration Supabase : table `workout_completions` + fonction
  `team_week_progress()`.
- Sept médailles (assets image) pour les badges, produites suivant
  `.claude/skills/fitfork-design/SKILL.md`.

## Tests

`src/__tests__/workoutGamification.test.ts` couvre, avec des fixtures
d'historique construites à la main (pas d'appel Supabase) :

- Calcul du streak avec des trous (semaine ratée au milieu).
- Semaine en cours non terminée (ne casse ni n'incrémente le streak).
- Double séance le même jour (compte pour 1 jour de progression hebdo,
  mais 2× les points).
- Franchissement d'un palier de niveau.
- Déblocage de chacun des sept badges, y compris les cas limites (juste
  en dessous / juste au seuil).
- Déclenchement du bonus d'équipe (les deux à 3/3 la même semaine
  calendaire) et non-déclenchement (un seul des deux à 3/3).

## Gestion d'erreurs

- Échec réseau sur "Marquer comme terminée" ou "Annuler" : rollback de
  l'état optimiste local, message d'erreur inline, pas de blocage de
  l'écran.
- Échec de `team_week_progress()` : le bloc bonus d'équipe affiche un
  message d'erreur localisé, le reste de l'écran `/progression` (streak,
  niveau, badges) reste fonctionnel.

## Hors périmètre (explicitement)

- Gamification de la nutrition (confirmation "repas mangé") et du suivi
  de poids — pourra reprendre le même modèle (journal brut + calcul pur)
  dans une itération séparée.
- Tout classement compétitif entre les deux profils — le design retenu
  est strictement coopératif (bonus d'équipe), sans rang ni comparaison
  individuelle affichée.
- Notifications push pour rappeler de ne pas casser le streak.
