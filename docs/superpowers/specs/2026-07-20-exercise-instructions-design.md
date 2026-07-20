# Exercise Instructions — Design

## Scope

This spec covers adding step-by-step execution instructions to every exercise in the catalog (71 rows as of the `workout-day-variety` branch). The recipe/meal-plan logic improvements the user also asked for are a separate design, to be brainstormed next — this spec does not touch `src/lib/mealPlan.ts`, `mealPlanData.ts`, or any meal-plan screen.

**Goal:** A user viewing their generated workout program can tap any exercise to see how to perform it correctly, without leaving the screen or waiting on a network request.

**Out of scope:** video links, images/diagrams, per-user progress notes on an exercise, editing instructions from the app (content is authored once via migration, like the rest of the exercise catalog).

## Data Model

New table, RLS-matched to the existing public-read catalog tables (`exercises`, `recipe_ingredients`):

```sql
create table public.exercise_instructions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  step_number integer not null check (step_number >= 1),
  text text not null
);

alter table public.exercise_instructions enable row level security;

create policy "Anyone can read exercise instructions"
  on public.exercise_instructions for select
  using (true);
```

Every one of the 71 existing exercises gets 2-5 ordered steps (in French, matching the rest of the app's copy), authored directly in the migration's seed data — the same way `recipe_ingredients` was seeded for the 54 recipes.

## Data Flow

`fetchProgramDetails` in `src/lib/workoutProgramData.ts` (already reads `user_program_exercises` joined to `exercises`) is extended to also join `exercise_instructions` in the same query — one query per screen load, no additional round-trip when a user taps to expand. The `ProgramExercise` type gains one field:

```ts
export type ProgramExercise = {
  name: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  instructions: string[]; // ordered by step_number
};
```

The mapping code sorts each exercise's joined `exercise_instructions` rows by `step_number` and flattens them to `instructions: string[]`.

## UI

In `src/app/workout.tsx`, each exercise line becomes a pressable row. Tapping toggles a per-exercise expanded/collapsed state held in local screen state (e.g. a `Set<string>` of expanded keys, keyed by `${dayNumber}-${exerciseIndex}` since the same exercise name could appear more than once across different days). When expanded, the row renders its `instructions` array as a numbered list directly beneath it. No network request happens on tap — everything needed is already in `program` from the initial load.

## Testing

- `workoutProgramData.test.ts`: extend the existing `fetchProgramDetails` tests with a case asserting instructions are correctly joined, sorted by `step_number`, and mapped into the `instructions: string[]` field (mirroring how the existing tests already verify exercises are sorted by `order_index`).
- No new pure-logic file is introduced by this feature (no `src/lib/exerciseInstructions.ts` — sorting is a one-line array operation inline in the existing data-layer function, not complex enough to warrant its own module).
- No dedicated test for `workout.tsx`'s tap-to-expand interaction, consistent with the rest of the app (no screen file in this project has dedicated UI tests) — verified manually instead, same as prior UI-facing tasks in this project.
