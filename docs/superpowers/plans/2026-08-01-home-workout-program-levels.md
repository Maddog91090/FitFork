# Home Workout Program with Selectable Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the randomly-generated gym/dumbbell/bodyweight workout system with a fixed, no-equipment, 3-level (Débutant/Intermédiaire/Avancé) weight-loss program, and let the user pick/change their level directly on the workout screen.

**Architecture:** The whole program (warm-up, 3 levels × 3 sessions each, cool-down, coach notes) is transcribed into one static TypeScript data module. `workout.tsx` is rewritten to read the current level from the existing `training_profile.experience_level` column, render that level's sessions, and let the user change level via a `ChoiceGroup` that writes straight back to `training_profile`. The old random-generation code, its tests, and the now-unused Supabase tables are deleted.

**Tech Stack:** React Native + Expo Router, TypeScript (strict), Jest (`jest-expo` preset), Supabase (Postgres + RLS), no new dependencies.

## Global Constraints

- Read the exact versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing any Expo-specific code (per `AGENTS.md`) — this plan does not introduce any new Expo APIs, so this is unlikely to matter, but check if a task's implementer reaches for one.
- All UI copy and program content must be transcribed verbatim from the source program text embedded in this plan — no rewording, no invented exercises, no changed timings/sets/reps.
- `training_profile.equipment` and `training_profile.days_per_week` are not touched by this feature (equipment stays collected-but-unused; days_per_week still feeds `src/lib/targets.ts` TDEE calculation).
- TypeScript strict mode is on (`tsconfig.json`) — every new file must type-check with no `any` beyond what already exists in the codebase's Supabase row-mapping style.

---

### Task 1: Static home workout program data module

**Files:**
- Create: `src/lib/homeWorkoutProgram.ts`
- Test: `src/__tests__/homeWorkoutProgram.test.ts`

**Interfaces:**
- Consumes: `ExperienceLevel` type from `src/lib/profile.ts` (`'beginner' | 'intermediate' | 'advanced'`).
- Produces: `CircuitSession`, `SeriesExercise`, `SeriesSession`, `Session`, `LevelProgram`, `RoutineBlock`, `HomeWorkoutProgram` types; `homeWorkoutProgram: HomeWorkoutProgram` constant; `getLevelProgram(level: ExperienceLevel): LevelProgram` function (throws if not found — cannot happen given the 3 levels are always present, but keeps the return type non-nullable for callers). Task 2 imports `homeWorkoutProgram` and `getLevelProgram` from this file.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/homeWorkoutProgram.test.ts`:

```ts
import { homeWorkoutProgram, getLevelProgram } from '../lib/homeWorkoutProgram';
import type { ExperienceLevel } from '../lib/profile';

describe('homeWorkoutProgram', () => {
  it('has a warm-up and cool-down block with non-empty descriptions', () => {
    expect(homeWorkoutProgram.warmup.description.length).toBeGreaterThan(0);
    expect(homeWorkoutProgram.cooldown.description.length).toBeGreaterThan(0);
  });

  it('has exactly 3 levels covering beginner, intermediate, and advanced', () => {
    const levels = homeWorkoutProgram.levels.map((l) => l.level).slice().sort();
    expect(levels).toEqual(['advanced', 'beginner', 'intermediate']);
  });

  it('has at least one coach note', () => {
    expect(homeWorkoutProgram.coachNotes.length).toBeGreaterThan(0);
  });
});

describe('getLevelProgram', () => {
  const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

  it.each(levels)('returns the matching level program for %s', (level) => {
    const program = getLevelProgram(level);
    expect(program.level).toBe(level);
    expect(program.sessions).toHaveLength(3);
  });

  it('gives every circuit session a positive round count and at least one exercise', () => {
    for (const level of levels) {
      const program = getLevelProgram(level);
      for (const session of program.sessions) {
        if (session.type === 'circuit') {
          expect(session.rounds).toBeGreaterThan(0);
          expect(session.exercises.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('gives every series session at least one exercise with a non-empty detail', () => {
    for (const level of levels) {
      const program = getLevelProgram(level);
      for (const session of program.sessions) {
        if (session.type === 'series') {
          expect(session.exercises.length).toBeGreaterThan(0);
          for (const exercise of session.exercises) {
            expect(exercise.detail.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/homeWorkoutProgram.test.ts`
Expected: FAIL — `Cannot find module '../lib/homeWorkoutProgram'`

- [ ] **Step 3: Write the implementation**

Create `src/lib/homeWorkoutProgram.ts`:

```ts
import type { ExperienceLevel } from './profile';

export type CircuitSession = {
  type: 'circuit';
  name: string;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  recoveryLabel: string;
  exercises: string[];
};

export type SeriesExercise = {
  name: string;
  detail: string;
};

export type SeriesSession = {
  type: 'series';
  name: string;
  restLabel: string;
  exercises: SeriesExercise[];
};

export type Session = CircuitSession | SeriesSession;

export type LevelProgram = {
  level: ExperienceLevel;
  label: string;
  summary: string;
  sessionDurationLabel: string;
  sessions: [Session, Session, Session];
};

export type RoutineBlock = {
  title: string;
  durationLabel: string;
  description: string;
};

export type HomeWorkoutProgram = {
  title: string;
  subtitle: string;
  guidance: string;
  warmup: RoutineBlock;
  cooldown: RoutineBlock;
  coachNotes: string[];
  levels: [LevelProgram, LevelProgram, LevelProgram];
};

export const homeWorkoutProgram: HomeWorkoutProgram = {
  title: 'Programme sportif perte de poids – à la maison',
  subtitle: '3 séances par semaine · sans matériel · 3 niveaux',
  guidance:
    "Choisis le niveau qui correspond à ta forme actuelle. Laisse toujours au moins un jour de repos entre deux séances (ex. lundi / mercredi / vendredi ou samedi). Quand un niveau devient facile, passe au suivant — pas avant. Chaque séance suit la même structure : échauffement → corps de séance → retour au calme.",
  warmup: {
    title: 'Échauffement',
    durationLabel: '5 minutes',
    description:
      "5 minutes, chaque mouvement 30 à 45 secondes enchaînés : montées de genoux sur place, rotations épaules et hanches, talons-fesses, squats lents à vide, jumping jacks doux. Objectif : avoir un peu chaud et le cœur qui monte.",
  },
  cooldown: {
    title: 'Retour au calme',
    durationLabel: '5 minutes',
    description:
      "5 minutes d'étirements doux et de respiration : cuisses, mollets, dos, épaules. Chaque étirement 20 à 30 s, sans forcer.",
  },
  coachNotes: [
    "La régularité prime sur l'intensité. Trois séances tenues chaque semaine valent mieux qu'une semaine parfaite suivie d'un abandon.",
    "Progresser : quand c'est facile, ajoute un tour, allonge l'effort, ralentis la descente des mouvements, ou monte d'un niveau.",
    "L'assiette compte au moins autant que l'entraînement dans la perte de poids : l'entraînement seul suffit rarement.",
    "Marche à côté : 7 000 à 10 000 pas par jour ajoutent une vraie dépense sans fatigue supplémentaire.",
    "Écoute ton corps. Une douleur articulaire n'est pas une courbature : en cas de doute (dos, genoux, longue pause, reprise), valide avec un médecin avant de te lancer, surtout sur les exercices avec sauts.",
  ],
  levels: [
    {
      level: 'beginner',
      label: 'Débutant',
      summary:
        "Pour une reprise ou un premier programme. On privilégie les mouvements contrôlés, sans saut.",
      sessionDurationLabel: 'environ 30 min',
      sessions: [
        {
          type: 'circuit',
          name: 'Full body doux',
          workSeconds: 30,
          restSeconds: 30,
          rounds: 2,
          recoveryLabel: '2 min de récup entre les tours',
          exercises: [
            'Squats sur chaise (assis-debout, lent)',
            'Pompes contre un mur',
            "Fentes statiques (une jambe puis l'autre, sans à-coup)",
            'Gainage sur les genoux',
            'Marche rapide sur place, genoux montés',
          ],
        },
        {
          type: 'circuit',
          name: 'Cardio léger',
          workSeconds: 30,
          restSeconds: 30,
          rounds: 3,
          recoveryLabel: '2 min de récup',
          exercises: [
            'Jumping jacks doux (sans saut : un pied écarté à la fois)',
            'Montées de genoux sur place',
            'Squats à vide, rythme tranquille',
            'Talons-fesses',
          ],
        },
        {
          type: 'series',
          name: 'Renforcement de base',
          restLabel: '45 s à 1 min de repos entre chaque',
          exercises: [
            { name: 'Squats', detail: '3 × 12' },
            { name: 'Pont fessier', detail: '3 × 12' },
            { name: 'Fentes statiques', detail: '2 × 10 par jambe' },
            { name: 'Gainage sur les genoux', detail: '3 × 20 s' },
          ],
        },
      ],
    },
    {
      level: 'intermediate',
      label: 'Intermédiaire',
      summary: "Pour quelqu'un déjà un peu actif. On introduit l'intensité et quelques sauts.",
      sessionDurationLabel: 'environ 40 min',
      sessions: [
        {
          type: 'circuit',
          name: 'Full body en circuit',
          workSeconds: 40,
          restSeconds: 20,
          rounds: 3,
          recoveryLabel: '1 min 30 de récup',
          exercises: [
            'Squats complets',
            'Pompes (sur les genoux si besoin)',
            'Fentes alternées',
            'Gainage planche',
            'Mountain climbers',
          ],
        },
        {
          type: 'circuit',
          name: 'Cardio HIIT',
          workSeconds: 30,
          restSeconds: 30,
          rounds: 4,
          recoveryLabel: '2 min de récup',
          exercises: [
            'Jumping jacks',
            'Burpees (version sans saut si trop dur)',
            'Squats sautés ou squats rapides',
            'Genoux hauts (course sur place)',
          ],
        },
        {
          type: 'series',
          name: 'Bas du corps + gainage',
          restLabel: '45 s à 1 min de repos',
          exercises: [
            { name: 'Squats', detail: '4 × 15' },
            { name: 'Fentes arrière', detail: '3 × 12 par jambe' },
            { name: 'Pont fessier', detail: '4 × 15' },
            { name: 'Gainage planche', detail: '3 × 30 à 45 s' },
            { name: 'Gainage latéral', detail: '3 × 20 s de chaque côté' },
          ],
        },
      ],
    },
    {
      level: 'advanced',
      label: 'Avancé',
      summary:
        "Pour un bon niveau de base, à l'aise avec les sauts et le gainage. Densité et intensité élevées.",
      sessionDurationLabel: '45 à 50 min',
      sessions: [
        {
          type: 'circuit',
          name: 'Full body intense',
          workSeconds: 45,
          restSeconds: 15,
          rounds: 4,
          recoveryLabel: '1 min 30 de récup',
          exercises: [
            'Squats sautés',
            'Pompes complètes (pieds surélevés pour durcir)',
            'Fentes sautées alternées',
            "Gainage planche avec touches d'épaules",
            'Burpees',
          ],
        },
        {
          type: 'circuit',
          name: 'HIIT explosif',
          workSeconds: 40,
          restSeconds: 20,
          rounds: 5,
          recoveryLabel: '1 min 30 de récup',
          exercises: [
            'Burpees avec saut',
            'Squats sautés',
            'Mountain climbers rapides',
            'Fentes sautées',
            'Sprint sur place, genoux hauts',
          ],
        },
        {
          type: 'series',
          name: 'Force + gainage',
          restLabel: '30 à 45 s de repos seulement',
          exercises: [
            { name: 'Squats bulgares (pied arrière surélevé)', detail: '4 × 12 par jambe' },
            { name: 'Pompes déclinées', detail: '4 × 12' },
            { name: 'Pont fessier une jambe', detail: '3 × 12 par jambe' },
            { name: 'Gainage planche', detail: '3 × 60 s' },
            { name: 'Gainage latéral dynamique', detail: '3 × 15 par côté' },
          ],
        },
      ],
    },
  ],
};

export function getLevelProgram(level: ExperienceLevel): LevelProgram {
  const found = homeWorkoutProgram.levels.find((entry) => entry.level === level);
  if (!found) {
    throw new Error(`No level program for ${level}`);
  }
  return found;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/homeWorkoutProgram.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/homeWorkoutProgram.ts src/__tests__/homeWorkoutProgram.test.ts
git commit -m "Add static home workout program data (3 levels, no equipment)"
```

---

### Task 2: Rewrite the workout screen with a level selector

**Files:**
- Modify: `src/app/workout.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getTrainingProfile`, `upsertTrainingProfile`, `TrainingProfile`, `ExperienceLevel` from `src/lib/profile.ts` (existing, unchanged signatures — `upsertTrainingProfile(userId: string, trainingProfile: TrainingProfile): Promise<void>`); `ChoiceGroup` from `src/components/ChoiceGroup.tsx` (existing, unchanged); `homeWorkoutProgram`, `getLevelProgram`, `Session` types from `src/lib/homeWorkoutProgram.ts` (Task 1).
- Produces: nothing consumed by later tasks — this is a leaf screen.

- [ ] **Step 1: Replace `src/app/workout.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getTrainingProfile, upsertTrainingProfile } from '../lib/profile';
import type { ExperienceLevel, TrainingProfile } from '../lib/profile';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { homeWorkoutProgram, getLevelProgram } from '../lib/homeWorkoutProgram';
import type { Session } from '../lib/homeWorkoutProgram';

const LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
];

export default function WorkoutScreen() {
  const { session, loading } = useAuth();
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [savingLevel, setSavingLevel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleSession = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const profile = await getTrainingProfile(session.user.id);
      if (!profile) {
        router.replace('/onboarding');
        return;
      }
      setTrainingProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  const handleLevelChange = async (level: ExperienceLevel) => {
    if (!session || !trainingProfile || level === trainingProfile.experienceLevel) return;
    const previous = trainingProfile;
    const next = { ...trainingProfile, experienceLevel: level };
    setTrainingProfile(next);
    setSavingLevel(true);
    setError(null);
    try {
      await upsertTrainingProfile(session.user.id, next);
    } catch (err) {
      setTrainingProfile(previous);
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de niveau.');
    } finally {
      setSavingLevel(false);
    }
  };

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !session || checking || !trainingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const levelProgram = getLevelProgram(trainingProfile.experienceLevel);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.title}>{homeWorkoutProgram.title}</Text>
      <Text style={styles.subtitle}>{homeWorkoutProgram.subtitle}</Text>

      <ChoiceGroup options={LEVEL_OPTIONS} value={trainingProfile.experienceLevel} onChange={handleLevelChange} />
      {savingLevel && <ActivityIndicator size="small" />}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {homeWorkoutProgram.warmup.title} ({homeWorkoutProgram.warmup.durationLabel})
        </Text>
        <Text style={styles.blockText}>{homeWorkoutProgram.warmup.description}</Text>
      </View>

      <Text style={styles.levelSummary}>{levelProgram.summary}</Text>
      <Text style={styles.levelDuration}>Durée par séance : {levelProgram.sessionDurationLabel}</Text>

      {levelProgram.sessions.map((sessionItem, index) => {
        const isExpanded = expanded.has(index);
        return (
          <Pressable key={sessionItem.name} onPress={() => toggleSession(index)} style={styles.sessionBlock}>
            <Text style={styles.sessionTitle}>
              Séance {index + 1} — {sessionItem.name}
            </Text>
            {isExpanded && <SessionDetail session={sessionItem} />}
          </Pressable>
        );
      })}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {homeWorkoutProgram.cooldown.title} ({homeWorkoutProgram.cooldown.durationLabel})
        </Text>
        <Text style={styles.blockText}>{homeWorkoutProgram.cooldown.description}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Repères de coach</Text>
        {homeWorkoutProgram.coachNotes.map((note) => (
          <Text key={note} style={styles.coachNote}>
            • {note}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function SessionDetail({ session }: { session: Session }) {
  if (session.type === 'circuit') {
    return (
      <View style={styles.sessionDetail}>
        <Text style={styles.sessionMeta}>
          Circuit : {session.workSeconds} s d'effort / {session.restSeconds} s de repos. {session.rounds} tours,{' '}
          {session.recoveryLabel}.
        </Text>
        {session.exercises.map((exercise) => (
          <Text key={exercise} style={styles.exerciseLine}>
            • {exercise}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.sessionDetail}>
      <Text style={styles.sessionMeta}>En séries, {session.restLabel}.</Text>
      {session.exercises.map((exercise) => (
        <Text key={exercise.name} style={styles.exerciseLine}>
          • {exercise.name} : {exercise.detail}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  block: { marginVertical: 16 },
  blockTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  blockText: { color: '#444' },
  levelSummary: { marginTop: 8, color: '#444' },
  levelDuration: { marginBottom: 16, color: '#666', fontStyle: 'italic' },
  sessionBlock: { marginBottom: 16 },
  sessionTitle: { fontSize: 16, fontWeight: '600' },
  sessionDetail: { marginTop: 8, marginLeft: 12 },
  sessionMeta: { color: '#666', marginBottom: 6 },
  exerciseLine: { marginBottom: 4 },
  coachNote: { marginBottom: 6, color: '#444' },
  error: { color: 'red', marginBottom: 16 },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. The old `src/lib/workoutProgram.ts`, `workoutProgramData.ts`, `workoutTemplate.ts` still exist and still compile fine on their own at this point — they're just no longer imported by `workout.tsx`. They're removed in Task 3.

- [ ] **Step 3: Run the full test suite**

Run: `npx jest`
Expected: PASS (the Task 1 tests plus all pre-existing tests, including `workoutProgram.test.ts` / `workoutProgramData.test.ts` / `workoutTemplate.test.ts` which are unaffected until Task 3 removes them).

- [ ] **Step 4: Commit**

```bash
git add src/app/workout.tsx
git commit -m "Rewrite workout screen: fixed home program with level selector"
```

---

### Task 3: Remove the obsolete random-generation workout system

**Files:**
- Delete: `src/lib/workoutProgram.ts`
- Delete: `src/lib/workoutProgramData.ts`
- Delete: `src/lib/workoutTemplate.ts`
- Delete: `src/__tests__/workoutProgram.test.ts`
- Delete: `src/__tests__/workoutProgramData.test.ts`
- Delete: `src/__tests__/workoutTemplate.test.ts`

**Interfaces:**
- Consumes: nothing — by this point (`src/app/workout.tsx` was rewritten in Task 2), no remaining file imports from these three modules.
- Produces: nothing — this task only deletes dead code.

- [ ] **Step 1: Confirm nothing still imports the modules being deleted**

Run: `grep -rln "workoutProgramData\|workoutTemplate\|from '../lib/workoutProgram'\|from './workoutProgram'" src --include=*.ts --include=*.tsx`
Expected: only the 3 lib files and 3 test files listed above appear — no other file (in particular, not `src/app/workout.tsx`) references them. If any other file appears, stop and investigate before deleting.

- [ ] **Step 2: Delete the files**

```bash
git rm src/lib/workoutProgram.ts src/lib/workoutProgramData.ts src/lib/workoutTemplate.ts
git rm src/__tests__/workoutProgram.test.ts src/__tests__/workoutProgramData.test.ts src/__tests__/workoutTemplate.test.ts
```

- [ ] **Step 3: Type-check and run the full test suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both succeed with no errors and no failing tests — the deleted files' tests simply disappear from the run.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove obsolete random workout generation system"
```

---

### Task 4: Drop the unused workout-generation tables

**Files:**
- Create: `supabase/migrations/0010_drop_workout_templates.sql`

**Interfaces:**
- Consumes: nothing from prior tasks (pure SQL, independent of the TypeScript changes).
- Produces: nothing consumed by later tasks — this is the final cleanup step.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0010_drop_workout_templates.sql`:

```sql
-- Drop the tables backing the old randomly-generated workout system,
-- superseded by the static program in src/lib/homeWorkoutProgram.ts.
-- Dropped in FK-safe order (children before parents).
drop table if exists public.user_program_exercises;
drop table if exists public.exercise_instructions;
drop table if exists public.template_day_slots;
drop table if exists public.template_days;
drop table if exists public.user_workout_programs;
drop table if exists public.workout_templates;
drop table if exists public.exercises;
```

- [ ] **Step 2: Verify no application code still references the dropped tables**

Run: `grep -rln "from('exercises')\|from('workout_templates')\|from('template_days')\|from('template_day_slots')\|from('user_workout_programs')\|from('user_program_exercises')\|from('exercise_instructions')" src`
Expected: no matches (Task 3 already removed the only files that queried these tables — `workoutProgramData.ts`).

- [ ] **Step 3: Apply the migration (manual — needs Supabase dashboard access)**

This project has no local Supabase CLI access; migrations are applied by pasting into the Supabase SQL Editor (established pattern from prior plans, e.g. `docs/superpowers/plans/2026-07-19-workout-day-variety.md`). This migration is a single block of independent `drop table if exists` statements with no multi-step transaction risk, so it can be pasted and run in one piece:

1. Open the Supabase project's SQL Editor.
2. Paste the full contents of `supabase/migrations/0010_drop_workout_templates.sql`.
3. Run it and confirm no error is returned.
4. Confirm the tables are gone: run `select table_name from information_schema.tables where table_schema = 'public' and table_name in ('exercises', 'workout_templates', 'template_days', 'template_day_slots', 'user_workout_programs', 'user_program_exercises', 'exercise_instructions');` and confirm it returns zero rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0010_drop_workout_templates.sql
git commit -m "Drop unused workout-generation tables"
```
