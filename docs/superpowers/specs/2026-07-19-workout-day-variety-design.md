# Workout Day Variety — Design

## Scope

This spec covers **strength training program generation only**. A separate design will address richer recipe/meal-plan logic afterward — the two subsystems share no code (different tables, different `src/lib/*Data.ts` files, different screens).

**Problem:** Workout templates currently define 1–3 distinct day-types per split (`full_body`=1, `upper_lower`=2, `push_pull_legs`=3), but `days_per_week` can be up to 5. The app has no notion of filling a full week from these day-types — `workout.tsx` just renders the day-types once, so a 5-day PPL user's days 4–5 are, in practice, identical repeats of days 1–2 (same exercises, same sets/reps). There's also no variation from one "Régénérer" to the next: the content is entirely static, defined by hardcoded rows in `template_exercises`.

**Goal:** Every day in the user's training week has distinct exercise content — no exercise repeated within the same week — chosen by a documented, logical rule (target muscle group), not just randomly reshuffled labels. Regenerating produces a genuinely different result.

**Out of scope:** variation from week to week (a regenerate-free week can look the same next week — no requirement to track history across weeks), progressive overload / weight tracking, exercise substitution UI (already covered by existing screens), and any change to `selectTemplate`'s template-picking logic.

## Data Model Changes

### `exercises` table
- Split the `arms` muscle group value into `biceps` and `triceps`. Rationale: the current generic `arms` tag would let the generator pick a triceps-extension exercise for a "Pull" day (which should target biceps) or vice versa for "Push" — defeating the muscle-group-based logic this feature exists to add.
- Add columns: `default_sets integer not null`, `default_reps_min integer not null`, `default_reps_max integer not null`. The prescription (sets/reps) becomes an attribute of the exercise itself rather than varying by which day it's slotted into (today's data has minor, non-intentional inconsistencies here — e.g. "Rowing barre" is 3×10-12 in one template and 4×8-10 in another — this change removes that incidental variance).
- Catalog is expanded with additional rows per (`muscle_group`, `equipment_needed`) pair so each pool is large enough to cover the maximum within-week repetition of any archetype without needing the fallback below. Concrete counts are worked out at plan-writing time from the slot config (see below), not fixed in this spec.

### `template_exercises` → replaced by `template_day_slots`
```
template_day_slots (
  id uuid primary key,
  template_day_id uuid references template_days(id),
  muscle_group text not null,
  slot_count integer not null check (slot_count > 0),
  order_index integer not null
)
```
Each row says "this day-type needs `slot_count` exercises from `muscle_group`". This replaces the old fixed exercise-per-day mapping. Per-equipment-tier volume (e.g. full_gym Push having more exercises than bodyweight Push) is preserved exactly as it exists today — only the *specific* exercise becomes dynamic, not the *count* per day-type/equipment combination.

### New table: `user_program_exercises`
```
user_program_exercises (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  day_number integer not null,   -- 1..daysPerWeek, the actual calendar-order position in the week
  day_name text not null,        -- e.g. "Push", "Pull" — repeats across day_number when an archetype recurs
  exercise_id uuid references exercises(id),
  order_index integer not null
)
```
RLS: user-owned (`auth.uid() = user_id`), select/insert/delete policies (mirrors `meal_plan_entries`'s ownership pattern, adapted since this isn't a child of a separate "plan" row — it hangs directly off `user_workout_programs.user_id`, which is already the PK there).

This stores the concrete, already-generated program — analogous to how `meal_plan_entries` stores concrete recipe picks rather than re-deriving them from `recipes` on every read. `fetchProgramDetails` reads from here (joined to `exercises` for name/muscle_group/sets/reps) instead of from `template_exercises`.

## Algorithm

New pure function in `src/lib/workoutProgram.ts` (mirrors `mealPlan.ts`'s separation of pure generation logic from `mealPlanData.ts`'s I/O):

```ts
function generateWorkoutProgram(
  daysPerWeek: number,
  dayArchetypes: { name: string; slots: { muscleGroup: string; count: number }[] }[],
  exercisePool: { id: string; muscleGroup: string }[]
): GeneratedProgramDay[]
```

1. Cycle through `dayArchetypes` in order to produce exactly `daysPerWeek` day entries (e.g. PPL's 3 archetypes → Push, Pull, Legs, Push, Pull for a 5-day week).
2. Track a single "used this week" exercise-id set across the *entire* generated week (not reset per day) — this is what guarantees no repeats even across two occurrences of the same archetype.
3. For each day, for each slot, shuffle the eligible (matching muscle group, not yet used) exercises and take the first `count` — shuffling is what makes "Régénérer" produce a different result each time.
4. If fewer eligible exercises remain than a slot needs, relax the constraint and allow already-used exercises back in for that slot only (same repeat-limit-relaxation pattern as `mealPlan.ts`'s recipe picker) — a safety net, not the expected path once the catalog is sized correctly.

## Data Flow

- `workoutProgramData.ts` gains: `fetchTemplateDaySlots(templateId)`, `fetchExercisePool(equipment)`, and `saveGeneratedProgram(userId, days)` (delete-then-insert into `user_program_exercises`, with the same cleanup-on-failure approach used for `saveWeeklyPlan` — delete any partial insert before rethrowing, so a failed regenerate never leaves a half-written program mistaken as "current").
- `fetchProgramDetails` is rewritten to read `user_program_exercises` (joined to `exercises`) instead of `template_exercises`.
- `workout.tsx`'s `assignAndLoad` calls `generateWorkoutProgram` + `saveGeneratedProgram` right after a template is (re)selected — on first assignment and on every explicit "Régénérer" — same trigger points as today, now actually producing varied content.

## UI Changes

`workout.tsx` renders one block per **generated day** (`daysPerWeek` blocks, e.g. 5 for a 5-day PPL program) instead of one block per day-type (previously 3 for the same program) — so the screen now shows the full week's distinct content instead of an implicit repeat-in-your-head cycle.

## Testing

- `workoutProgram.test.ts` (pure function, no Supabase mock needed): asserts no exercise id repeats across the generated week while the pool allows it, correct exercise count per day matching slot config, and that the fallback relaxation triggers (and produces a valid, non-throwing result) when a pool is deliberately made too small in a test fixture.
- `workoutProgramData.test.ts`: extended with mocked-Supabase tests for `fetchTemplateDaySlots`, `fetchExercisePool`, `saveGeneratedProgram` (including the delete-then-insert cleanup-on-failure path), and the rewritten `fetchProgramDetails`.
