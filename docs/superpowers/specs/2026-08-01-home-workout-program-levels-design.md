# Home Workout Program with Selectable Levels — Design

## Scope

**Problem:** The current strength program (`src/lib/workoutProgram.ts` + `workoutProgramData.ts` + `workoutTemplate.ts`, backed by the `exercises` / `workout_templates` / `template_days` / `template_day_slots` / `user_workout_programs` / `user_program_exercises` / `exercise_instructions` Supabase tables) randomly assembles a gym/dumbbell/bodyweight split from a muscle-group exercise pool. It is being replaced outright by a fixed, hand-written, no-equipment weight-loss program supplied by the user: 3 levels (Débutant / Intermédiaire / Avancé), each with 3 named sessions, a shared warm-up and cool-down, and coach notes. `training_profile.experience_level` already exists (collected at onboarding, values `beginner`/`intermediate`/`advanced`) but is currently unused by the workout screen in any meaningful way — this feature makes it the actual level selector, editable at any time from the workout screen itself.

**Goal:**
1. Replace all existing exercise/template content with the supplied program.
2. Let the user pick (and change) their level directly on the workout screen; the choice is saved to `training_profile.experience_level` and immediately changes which sessions are displayed.
3. Remove the now-dead random-generation system (code, tests, tables) rather than leaving it unused alongside the new content.

**Out of scope:** `training_profile.equipment` and `days_per_week` are untouched — `equipment` stays in onboarding unused for now (no other program tier exists yet), `days_per_week` still feeds the TDEE calculation in `src/lib/targets.ts` and is unrelated to this program (which is always 3 fixed sessions/week regardless of that value). No workout history/logging, no progression tracking, no change to onboarding screens or flow order.

## Content (static data)

The program is fixed content, not user- or server-generated, so it lives as a plain TypeScript module rather than Supabase rows: `src/lib/homeWorkoutProgram.ts`.

```ts
export type CircuitSession = {
  type: 'circuit';
  name: string;                 // "Full body doux"
  workSeconds: number;          // 30
  restSeconds: number;          // 30
  rounds: number;               // 2
  recoveryLabel: string;        // "2 min de récup entre les tours"
  exercises: string[];          // ordered move names
};

export type SeriesExercise = {
  name: string;                 // "Squats"
  detail: string;               // "3 × 12", "3 × 20 s", "2 × 10 par jambe"
};

export type SeriesSession = {
  type: 'series';
  name: string;                 // "Renforcement de base"
  restLabel: string;            // "45 s à 1 min de repos entre chaque"
  exercises: SeriesExercise[];
};

export type Session = CircuitSession | SeriesSession;

export type LevelProgram = {
  level: ExperienceLevel;       // reuse from './profile'
  label: string;                // "Débutant"
  summary: string;              // "Pour une reprise ou un premier programme..."
  sessionDurationLabel: string; // "environ 30 min"
  sessions: [Session, Session, Session];
};

export type RoutineBlock = {
  title: string;                // "Échauffement"
  durationLabel: string;        // "5 minutes"
  description: string;          // free text, one paragraph
};

export type HomeWorkoutProgram = {
  title: string;                // "Programme sportif perte de poids – à la maison"
  subtitle: string;             // "3 séances par semaine · sans matériel · 3 niveaux"
  guidance: string;             // the "choisis ton niveau / repos entre séances" intro paragraph
  warmup: RoutineBlock;
  cooldown: RoutineBlock;
  coachNotes: string[];         // the 5 bullet points under "Repères de coach"
  levels: [LevelProgram, LevelProgram, LevelProgram];
};

export const homeWorkoutProgram: HomeWorkoutProgram = { /* ... transcribed verbatim from the supplied text ... */ };

export function getLevelProgram(level: ExperienceLevel): LevelProgram {
  const found = homeWorkoutProgram.levels.find((l) => l.level === level);
  if (!found) throw new Error(`No level program for ${level}`);
  return found;
}
```

All exercise names, timings (30s/45s work, 30s/20s/15s rest, round counts, recovery labels), set×rep prescriptions, and the coach notes are transcribed verbatim from the program the user supplied — no invented substitutions. `SeriesExercise.detail` is a free-form label rather than separate `sets`/`reps`/`durationSeconds` fields because the source mixes rep-based ("3 × 12"), time-based ("3 × 20 s"), and per-side ("2 × 10 par jambe" / "3 × 15 par côté") prescriptions — a single string avoids modeling three incompatible shapes for a value that's only ever displayed, never computed on.

## Level selection

No new table or column: `training_profile.experience_level` (`src/lib/profile.ts`) is reused as-is. `getTrainingProfile`/`upsertTrainingProfile` already read/write it — the workout screen calls `upsertTrainingProfile` with the existing profile's `daysPerWeek`/`equipment` unchanged and the newly-picked `experienceLevel`.

Onboarding (`src/app/onboarding.tsx`) keeps asking for the level exactly as today (`EXPERIENCE_OPTIONS`, unchanged) — it sets the initial value. The workout screen is the only other place it can be changed.

## `workout.tsx` rewrite

The screen drops all template/generation/regeneration logic and becomes a straight render of `homeWorkoutProgram` filtered by the current level:

1. On focus, load `training_profile` for the session user; if none exists, `router.replace('/onboarding')` (unchanged behavior).
2. Render a 3-way level picker (`ChoiceGroup`, reused from onboarding) showing Débutant/Intermédiaire/Avancé, initialized to `trainingProfile.experienceLevel`. Selecting a different level calls `upsertTrainingProfile` (fire-and-forget with error surfaced via the existing `error` state) and updates local state immediately — no reload/refetch needed since the content is static.
3. Below the picker, render (via `getLevelProgram(selectedLevel)`):
   - `homeWorkoutProgram.warmup` (title + duration + description).
   - The 3 sessions of the selected level. Circuit sessions show work/rest/rounds/recovery header plus the exercise list; series sessions show the rest label plus each exercise's `name — detail`. Tapping a session expands/collapses it (reuses the existing `expanded`/`toggleExercise` Set pattern, keyed by session index instead of day/exercise index).
   - `homeWorkoutProgram.cooldown`.
   - `homeWorkoutProgram.coachNotes` as a bullet list.
4. The "Régénérer le programme" button is removed — there is nothing to regenerate.

No Supabase reads/writes happen for program *content* anymore, only for `training_profile` (read on load, write on level change).

## Cleanup

Deleted outright (superseded by the static module above):
- `src/lib/workoutProgram.ts`, `src/lib/workoutProgramData.ts`, `src/lib/workoutTemplate.ts`
- `src/__tests__/workoutProgram.test.ts`, `workoutProgramData.test.ts`, `workoutTemplate.test.ts`

New migration `0010_drop_workout_templates.sql` drops the now-unused tables (in FK-safe order): `user_program_exercises`, `exercise_instructions`, `template_day_slots`, `template_days`, `user_workout_programs`, `workout_templates`, `exercises`. `training_profile` and `profiles` are untouched.

## Testing

New `src/__tests__/homeWorkoutProgram.test.ts` (pure data/lookup, no Supabase mock):
- `getLevelProgram` returns the matching level's program for each of the 3 levels.
- Each level has exactly 3 sessions and both warm-up/cool-down blocks are non-empty.
- Structural sanity: every `CircuitSession` has `rounds > 0` and a non-empty `exercises` array; every `SeriesSession` has a non-empty `exercises` array where each entry has a non-empty `detail`.

`profile.test.ts` is unaffected (no change to `upsertTrainingProfile`'s signature or behavior). No test file is needed for `workout.tsx` itself (matches current repo convention — no prior test existed for that screen).
