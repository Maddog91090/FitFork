# Workout Day Variety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every day in a user's weekly training program gets distinct exercises (no repeat within the same week), chosen by a muscle-group-based rule instead of a fixed, cycling day-type template.

**Architecture:** Replace the fixed `template_exercises` join table with a `template_day_slots` table that says "this day-type needs N exercises from muscle group X". A new pure function `generateWorkoutProgram` cycles through a split's day-archetypes to fill `daysPerWeek` days, drawing distinct (shuffled, non-repeating) exercises per slot from an equipment-scoped pool, with a same-pool-exhaustion fallback. The concrete result is persisted in a new `user_program_exercises` table (mirroring how `meal_plan_entries` persists concrete recipe picks) and regenerated on assignment or "Régénérer".

**Tech Stack:** Expo (React Native, TypeScript), Supabase (Postgres, RLS, PostgREST), Jest (`jest-expo` preset) with mocked `supabase` client for `*Data.ts` files.

## Global Constraints

- Expo SDK 57 uses `src/app/` (not root `app/`), `src/lib/`, `src/__tests__/` — this project already follows that layout.
- Pure business logic lives in a `src/lib/<name>.ts` file with no Supabase import; I/O lives in a paired `src/lib/<name>Data.ts` file that imports `supabase` from `./supabase` and is tested via `jest.mock('../lib/supabase', () => ({ supabase: { from: jest.fn() } }))`.
- Migrations are applied manually via the Supabase SQL Editor (no CLI access in this project). After writing a migration file, the plan's steps describe running it in the numbered-piece style established in prior plans (paste one piece, run, confirm, next piece) to avoid the RLS-confirmation-dialog and whole-transaction-rollback friction seen before. Verify each piece with a `curl` call against the REST API before moving to the next.
- `exercises.muscle_group` values after this plan: `legs`, `chest`, `shoulders`, `back`, `biceps`, `triceps`, `core` (the old generic `arms` value is fully replaced — no row should have `muscle_group = 'arms'` after Task 1).
- No exercise may repeat within a single generated week while the equipment-tier pool for its muscle group has an unused option; only fall back to repeats when the pool is exhausted for that slot.
- This plan does not touch meal-plan/recipe code (`src/lib/mealPlan.ts`, `mealPlanData.ts`, `src/app/generate-plan.tsx`, `plan.tsx`, `grocery-list.tsx`) — that is a separate design or `selectTemplate`'s template-picking rules in `src/lib/workoutTemplate.ts`.

---

### Task 1: Schema migration — slots table, catalog expansion, arms split

**Files:**
- Create: `supabase/migrations/0006_workout_day_variety.sql`

**Interfaces:**
- Produces: `exercises` table gains `default_sets`, `default_reps_min`, `default_reps_max` (all `integer not null`); `muscle_group` values are now one of `legs, chest, shoulders, back, biceps, triceps, core` (no more `arms`); catalog grows from 36 to 71 rows. New `template_day_slots` table (`template_day_id`, `muscle_group`, `slot_count`, `order_index`) replaces `template_exercises` (dropped). New `user_program_exercises` table (`user_id`, `day_number`, `day_name`, `exercise_id`, `order_index`, RLS-owned: select/insert/delete for `auth.uid() = user_id`). Task 3's `workoutProgramData.ts` queries these exact table/column names.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0006_workout_day_variety.sql`:

```sql
-- Part A: add prescription columns to exercises (nullable first, backfilled below)
alter table public.exercises add column if not exists default_sets integer;
alter table public.exercises add column if not exists default_reps_min integer;
alter table public.exercises add column if not exists default_reps_max integer;

-- Part B: backfill existing 36 rows + split 'arms' into 'biceps'/'triceps'
update public.exercises e set
  muscle_group = v.muscle_group,
  default_sets = v.sets,
  default_reps_min = v.reps_min,
  default_reps_max = v.reps_max
from (values
  ('Squat barre', 'legs', 4, 8, 10),
  ('Développé couché', 'chest', 4, 8, 10),
  ('Soulevé de terre', 'back', 4, 6, 8),
  ('Développé militaire', 'shoulders', 3, 8, 10),
  ('Rowing barre', 'back', 4, 8, 10),
  ('Tractions lestées', 'back', 3, 8, 10),
  ('Dips lestés', 'chest', 3, 10, 12),
  ('Presse à cuisses', 'legs', 3, 10, 12),
  ('Tirage vertical', 'back', 3, 10, 12),
  ('Leg curl', 'legs', 3, 10, 12),
  ('Extension des jambes', 'legs', 3, 10, 12),
  ('Curl biceps barre', 'biceps', 3, 10, 12),
  ('Extension triceps poulie', 'triceps', 3, 10, 12),
  ('Hip thrust barre', 'legs', 3, 10, 12),
  ('Soulevé de terre roumain', 'legs', 3, 8, 10),
  ('Développé incliné', 'chest', 3, 8, 10),
  ('Squat haltères', 'legs', 4, 10, 12),
  ('Développé couché haltères', 'chest', 4, 10, 12),
  ('Rowing haltère', 'back', 4, 10, 12),
  ('Développé épaules haltères', 'shoulders', 3, 10, 12),
  ('Soulevé de terre roumain haltères', 'legs', 3, 10, 12),
  ('Fentes haltères', 'legs', 3, 10, 12),
  ('Curl biceps haltères', 'biceps', 3, 10, 12),
  ('Extension triceps haltère', 'triceps', 3, 10, 12),
  ('Squat gobelet', 'legs', 3, 10, 12),
  ('Hip thrust haltère', 'legs', 3, 10, 12),
  ('Pompes', 'chest', 4, 12, 15),
  ('Pompes pike', 'shoulders', 3, 8, 12),
  ('Squat au poids du corps', 'legs', 4, 15, 20),
  ('Fentes avant', 'legs', 4, 12, 15),
  ('Pont fessier', 'legs', 3, 15, 20),
  ('Superman', 'back', 3, 12, 15),
  ('Tractions', 'back', 4, 6, 10),
  ('Dips sur chaises', 'chest', 3, 10, 15),
  ('Mountain climbers', 'core', 3, 20, 30),
  ('Burpees', 'core', 3, 10, 15)
) as v(name, muscle_group, sets, reps_min, reps_max)
where e.name = v.name;

alter table public.exercises alter column default_sets set not null;
alter table public.exercises alter column default_reps_min set not null;
alter table public.exercises alter column default_reps_max set not null;

-- Part C: insert 35 new exercises (13 full_gym, 13 home_limited, 9 bodyweight)
insert into public.exercises (name, muscle_group, equipment_needed, default_sets, default_reps_min, default_reps_max) values
  ('Fentes marchées barre', 'legs', 'full_gym', 3, 10, 12),
  ('Presse à cuisses unilatérale', 'legs', 'full_gym', 3, 10, 12),
  ('Squat sumo barre', 'legs', 'full_gym', 4, 8, 10),
  ('Extension mollets debout', 'legs', 'full_gym', 4, 12, 15),
  ('Écarté couché haltères', 'chest', 'full_gym', 3, 10, 12),
  ('Développé couché prise serrée', 'chest', 'full_gym', 3, 8, 10),
  ('Pull-over haltère', 'chest', 'full_gym', 3, 10, 12),
  ('Élévations latérales haltères', 'shoulders', 'full_gym', 3, 12, 15),
  ('Oiseau haltères', 'shoulders', 'full_gym', 3, 12, 15),
  ('Rowing T-bar', 'back', 'full_gym', 4, 8, 10),
  ('Tirage horizontal poulie basse', 'back', 'full_gym', 3, 10, 12),
  ('Curl marteau haltères', 'biceps', 'full_gym', 3, 10, 12),
  ('Barre au front', 'triceps', 'full_gym', 3, 10, 12),
  ('Fentes bulgares haltères', 'legs', 'home_limited', 3, 10, 12),
  ('Squat sumo haltères', 'legs', 'home_limited', 3, 10, 12),
  ('Step-up haltères', 'legs', 'home_limited', 3, 10, 12),
  ('Pont fessier unilatéral haltère', 'legs', 'home_limited', 3, 12, 15),
  ('Soulevé de terre jambes tendues haltères', 'legs', 'home_limited', 3, 10, 12),
  ('Écarté incliné haltères', 'chest', 'home_limited', 3, 10, 12),
  ('Développé couché incliné haltères', 'chest', 'home_limited', 3, 10, 12),
  ('Rowing unilatéral haltère', 'back', 'home_limited', 3, 10, 12),
  ('Tirage bûcheron haltère', 'back', 'home_limited', 3, 10, 12),
  ('Élévations latérales haltères assis', 'shoulders', 'home_limited', 3, 12, 15),
  ('Développé Arnold haltères', 'shoulders', 'home_limited', 3, 10, 12),
  ('Curl marteau alterné haltères', 'biceps', 'home_limited', 3, 10, 12),
  ('Extension triceps nuque haltère', 'triceps', 'home_limited', 3, 10, 12),
  ('Pompes surélevées pieds', 'chest', 'bodyweight', 3, 12, 15),
  ('Pompes diamant', 'chest', 'bodyweight', 3, 10, 15),
  ('Squat bulgare chaise', 'legs', 'bodyweight', 3, 10, 12),
  ('Fentes sautées', 'legs', 'bodyweight', 3, 12, 15),
  ('Squat sauté', 'legs', 'bodyweight', 3, 12, 15),
  ('Rowing inversé table', 'back', 'bodyweight', 3, 10, 12),
  ('Superman alterné', 'back', 'bodyweight', 3, 12, 15),
  ('Abdos crunch', 'core', 'bodyweight', 3, 15, 20),
  ('Pike push-up surélevé', 'shoulders', 'bodyweight', 3, 8, 12)
;

-- Part D: template_day_slots table (replaces template_exercises)
create table if not exists public.template_day_slots (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.template_days(id) on delete cascade,
  muscle_group text not null,
  slot_count integer not null check (slot_count > 0),
  order_index integer not null check (order_index >= 0)
);

alter table public.template_day_slots enable row level security;

create policy "Anyone can read template day slots"
  on public.template_day_slots for select
  using (true);

drop table if exists public.template_exercises;

-- Part E: seed template_day_slots
with days as (
  select wt.name as template_name, td.name as day_name, td.id as day_id
  from public.template_days td
  join public.workout_templates wt on wt.id = td.template_id
)
insert into public.template_day_slots (template_day_id, muscle_group, slot_count, order_index)
select d.day_id, v.muscle_group, v.slot_count, v.order_index
from (values
  ('Full Body - Salle complète', 'Full Body', 'legs', 1, 1),
  ('Full Body - Salle complète', 'Full Body', 'chest', 1, 2),
  ('Full Body - Salle complète', 'Full Body', 'shoulders', 1, 3),
  ('Full Body - Salle complète', 'Full Body', 'back', 2, 4),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'chest', 1, 1),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'shoulders', 1, 2),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'back', 2, 3),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'biceps', 1, 4),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'triceps', 1, 5),
  ('Upper/Lower - Salle complète', 'Bas du corps', 'legs', 5, 1),
  ('Push/Pull/Legs - Salle complète', 'Push', 'chest', 3, 1),
  ('Push/Pull/Legs - Salle complète', 'Push', 'shoulders', 1, 2),
  ('Push/Pull/Legs - Salle complète', 'Pull', 'back', 3, 1),
  ('Push/Pull/Legs - Salle complète', 'Pull', 'biceps', 1, 2),
  ('Push/Pull/Legs - Salle complète', 'Legs', 'legs', 4, 1),
  ('Full Body - Maison', 'Full Body', 'legs', 2, 1),
  ('Full Body - Maison', 'Full Body', 'chest', 1, 2),
  ('Full Body - Maison', 'Full Body', 'back', 1, 3),
  ('Full Body - Maison', 'Full Body', 'shoulders', 1, 4),
  ('Upper/Lower - Maison', 'Haut du corps', 'chest', 1, 1),
  ('Upper/Lower - Maison', 'Haut du corps', 'back', 1, 2),
  ('Upper/Lower - Maison', 'Haut du corps', 'shoulders', 1, 3),
  ('Upper/Lower - Maison', 'Haut du corps', 'biceps', 1, 4),
  ('Upper/Lower - Maison', 'Haut du corps', 'triceps', 1, 5),
  ('Upper/Lower - Maison', 'Bas du corps', 'legs', 5, 1),
  ('Push/Pull/Legs - Maison', 'Push', 'chest', 1, 1),
  ('Push/Pull/Legs - Maison', 'Push', 'shoulders', 1, 2),
  ('Push/Pull/Legs - Maison', 'Push', 'triceps', 1, 3),
  ('Push/Pull/Legs - Maison', 'Pull', 'back', 1, 1),
  ('Push/Pull/Legs - Maison', 'Pull', 'biceps', 1, 2),
  ('Push/Pull/Legs - Maison', 'Legs', 'legs', 4, 1),
  ('Full Body - Poids du corps', 'Full Body', 'chest', 1, 1),
  ('Full Body - Poids du corps', 'Full Body', 'legs', 2, 2),
  ('Full Body - Poids du corps', 'Full Body', 'back', 1, 3),
  ('Full Body - Poids du corps', 'Full Body', 'core', 1, 4),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'chest', 2, 1),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'back', 2, 2),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'shoulders', 1, 3),
  ('Upper/Lower - Poids du corps', 'Bas du corps', 'legs', 3, 1),
  ('Upper/Lower - Poids du corps', 'Bas du corps', 'core', 1, 2),
  ('Push/Pull/Legs - Poids du corps', 'Push', 'chest', 2, 1),
  ('Push/Pull/Legs - Poids du corps', 'Push', 'shoulders', 1, 2),
  ('Push/Pull/Legs - Poids du corps', 'Pull', 'back', 2, 1),
  ('Push/Pull/Legs - Poids du corps', 'Legs', 'legs', 3, 1),
  ('Push/Pull/Legs - Poids du corps', 'Legs', 'core', 1, 2)
) as v(template_name, day_name, muscle_group, slot_count, order_index)
join days d on d.template_name = v.template_name and d.day_name = v.day_name;

-- Part F: user_program_exercises — persists the concrete generated program per user
create table if not exists public.user_program_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number integer not null check (day_number >= 1),
  day_name text not null,
  exercise_id uuid not null references public.exercises(id),
  order_index integer not null check (order_index >= 0)
);

alter table public.user_program_exercises enable row level security;

create policy "Users can select own program exercises"
  on public.user_program_exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert own program exercises"
  on public.user_program_exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own program exercises"
  on public.user_program_exercises for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply the migration (manual — needs Supabase dashboard access)**

Apply in the Supabase SQL Editor in 6 numbered pieces (matching the pattern used in prior plans to avoid RLS-confirmation-dialog and whole-transaction-rollback issues):
1. Part A + B + the two `alter column ... set not null` statements (clear the box, paste, run, confirm no error).
2. Part C (the 35-row insert).
3. Part D (`template_day_slots` creation + RLS policy + `drop table template_exercises`) — a confirmation dialog will likely appear for the RLS-enabling statement; accept it.
4. Part E (the slot seed insert).
5. Part F (`user_program_exercises` creation + its 3 RLS policies) — another RLS confirmation dialog is likely; accept it.

After each piece, confirm no error banner appears in the SQL Editor before pasting the next piece.

- [ ] **Step 3: Verify via the REST API**

```bash
curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/exercises?select=id&muscle_group=eq.arms" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
# Expected: [] (no rows left with the old 'arms' tag)

curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/exercises?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" | grep -o '"id"' | wc -l
# Expected: 71

curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/template_day_slots?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" | grep -o '"id"' | wc -l
# Expected: 45

curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/template_exercises?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
# Expected: 404 (table dropped)

curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/user_program_exercises?select=*" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
# Expected: 200 (empty array — RLS-protected, table exists)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0006_workout_day_variety.sql
git commit -m "Expand exercise catalog and add template_day_slots"
```

---

### Task 2: Pure generation algorithm

**Files:**
- Create: `src/lib/workoutProgram.ts`
- Test: `src/__tests__/workoutProgram.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure function, no I/O).
- Produces: `ExercisePoolItem { id: string; muscleGroup: string }`, `DaySlot { muscleGroup: string; count: number }`, `DayArchetype { name: string; slots: DaySlot[] }`, `GeneratedProgramDay { dayNumber: number; dayName: string; exerciseIds: string[] }`, `generateWorkoutProgram(daysPerWeek: number, dayArchetypes: DayArchetype[], exercisePool: ExercisePoolItem[]): GeneratedProgramDay[]`. Task 3's `workoutProgramData.ts` imports these exact names and types.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/workoutProgram.test.ts`:

```ts
import { generateWorkoutProgram, type DayArchetype, type ExercisePoolItem } from '../lib/workoutProgram';

describe('generateWorkoutProgram', () => {
  const archetypes: DayArchetype[] = [
    { name: 'Push', slots: [{ muscleGroup: 'chest', count: 2 }] },
    { name: 'Pull', slots: [{ muscleGroup: 'back', count: 2 }] },
    { name: 'Legs', slots: [{ muscleGroup: 'legs', count: 2 }] },
  ];

  const pool: ExercisePoolItem[] = [
    { id: 'chest-1', muscleGroup: 'chest' },
    { id: 'chest-2', muscleGroup: 'chest' },
    { id: 'chest-3', muscleGroup: 'chest' },
    { id: 'chest-4', muscleGroup: 'chest' },
    { id: 'back-1', muscleGroup: 'back' },
    { id: 'back-2', muscleGroup: 'back' },
    { id: 'back-3', muscleGroup: 'back' },
    { id: 'back-4', muscleGroup: 'back' },
    { id: 'legs-1', muscleGroup: 'legs' },
    { id: 'legs-2', muscleGroup: 'legs' },
  ];

  it('cycles through archetypes in order, repeating to fill daysPerWeek', () => {
    const days = generateWorkoutProgram(5, archetypes, pool);
    expect(days.map((d) => d.dayName)).toEqual(['Push', 'Pull', 'Legs', 'Push', 'Pull']);
    expect(days.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4, 5]);
  });

  it('produces the correct number of exercises per day', () => {
    const days = generateWorkoutProgram(5, archetypes, pool);
    for (const day of days) {
      expect(day.exerciseIds).toHaveLength(2);
    }
  });

  it('never repeats an exercise within the week when the pool is large enough', () => {
    const days = generateWorkoutProgram(5, archetypes, pool);
    const allIds = days.flatMap((d) => d.exerciseIds);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('falls back to repeating an exercise when the pool cannot cover every occurrence', () => {
    const tinyPool: ExercisePoolItem[] = [{ id: 'chest-1', muscleGroup: 'chest' }];
    const singleSlotArchetypes: DayArchetype[] = [
      { name: 'Push', slots: [{ muscleGroup: 'chest', count: 1 }] },
    ];

    const days = generateWorkoutProgram(2, singleSlotArchetypes, tinyPool);

    expect(days).toHaveLength(2);
    expect(days[0].exerciseIds).toEqual(['chest-1']);
    expect(days[1].exerciseIds).toEqual(['chest-1']);
  });

  it('returns an empty exercise list for a slot with no matching exercises in the pool', () => {
    const noMatchArchetypes: DayArchetype[] = [
      { name: 'Push', slots: [{ muscleGroup: 'shoulders', count: 1 }] },
    ];
    const days = generateWorkoutProgram(1, noMatchArchetypes, pool);
    expect(days[0].exerciseIds).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest workoutProgram.test.ts`
Expected: FAIL with "Cannot find module '../lib/workoutProgram'"

- [ ] **Step 3: Write the implementation**

Create `src/lib/workoutProgram.ts`:

```ts
export type ExercisePoolItem = {
  id: string;
  muscleGroup: string;
};

export type DaySlot = {
  muscleGroup: string;
  count: number;
};

export type DayArchetype = {
  name: string;
  slots: DaySlot[];
};

export type GeneratedProgramDay = {
  dayNumber: number;
  dayName: string;
  exerciseIds: string[];
};

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateWorkoutProgram(
  daysPerWeek: number,
  dayArchetypes: DayArchetype[],
  exercisePool: ExercisePoolItem[]
): GeneratedProgramDay[] {
  const usedThisWeek = new Set<string>();
  const days: GeneratedProgramDay[] = [];

  for (let i = 0; i < daysPerWeek; i++) {
    const archetype = dayArchetypes[i % dayArchetypes.length];
    const exerciseIds: string[] = [];

    for (const slot of archetype.slots) {
      const candidates = exercisePool.filter((e) => e.muscleGroup === slot.muscleGroup);
      const unused = candidates.filter((e) => !usedThisWeek.has(e.id));
      const pool = unused.length >= slot.count ? unused : candidates;
      const picked = shuffle(pool).slice(0, slot.count);

      for (const exercise of picked) {
        usedThisWeek.add(exercise.id);
        exerciseIds.push(exercise.id);
      }
    }

    days.push({ dayNumber: i + 1, dayName: archetype.name, exerciseIds });
  }

  return days;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest workoutProgram.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutProgram.ts src/__tests__/workoutProgram.test.ts
git commit -m "Add generateWorkoutProgram algorithm"
```

---

### Task 3: Data layer — fetch slots/pool, persist and read generated program

**Files:**
- Modify: `src/lib/workoutProgramData.ts`
- Test: `src/__tests__/workoutProgramData.test.ts`

**Interfaces:**
- Consumes: `DayArchetype`, `ExercisePoolItem`, `GeneratedProgramDay` from `../lib/workoutProgram` (Task 2).
- Produces: `fetchTemplateDaySlots(templateId: string): Promise<DayArchetype[]>`, `fetchExercisePool(equipment: string): Promise<ExercisePoolItem[]>`, `saveGeneratedProgram(userId: string, days: GeneratedProgramDay[]): Promise<void>`, and a rewritten `fetchProgramDetails(userId: string, templateId: string): Promise<WorkoutProgram>` (signature changed — now takes `userId` first). Task 4's `workout.tsx` calls these exact names/signatures. `fetchWorkoutTemplates`, `saveWorkoutProgram`, `getAssignedTemplateId`, and the `ProgramExercise`/`ProgramDay`/`WorkoutProgram` types are unchanged.

- [ ] **Step 1: Write the failing tests**

Replace the `fetchProgramDetails` describe block and add three new describe blocks in `src/__tests__/workoutProgramData.test.ts`. First, update the import at the top of the file:

```ts
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchProgramDetails,
  fetchTemplateDaySlots,
  fetchExercisePool,
  saveGeneratedProgram,
} from '../lib/workoutProgramData';
```

Then replace the entire `describe('fetchProgramDetails', ...)` block (currently at the bottom of the file) with:

```ts
describe('fetchTemplateDaySlots', () => {
  it('groups slots by day, sorted by order_index, preserving day order', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          day_number: 1,
          name: 'Push',
          template_day_slots: [
            { muscle_group: 'shoulders', slot_count: 1, order_index: 2 },
            { muscle_group: 'chest', slot_count: 3, order_index: 1 },
          ],
        },
        {
          day_number: 2,
          name: 'Pull',
          template_day_slots: [{ muscle_group: 'back', slot_count: 3, order_index: 1 }],
        },
      ],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchTemplateDaySlots('template-1');

    expect(result).toEqual([
      { name: 'Push', slots: [{ muscleGroup: 'chest', count: 3 }, { muscleGroup: 'shoulders', count: 1 }] },
      { name: 'Pull', slots: [{ muscleGroup: 'back', count: 3 }] },
    ]);
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchTemplateDaySlots('template-1')).rejects.toThrow('boom');
  });
});

describe('fetchExercisePool', () => {
  it('maps rows to ExercisePoolItem, filtered by equipment', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ id: 'e1', muscle_group: 'chest' }],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchExercisePool('full_gym');

    expect(result).toEqual([{ id: 'e1', muscleGroup: 'chest' }]);
    expect(eq).toHaveBeenCalledWith('equipment_needed', 'full_gym');
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchExercisePool('full_gym')).rejects.toThrow('boom');
  });
});

describe('saveGeneratedProgram', () => {
  const days = [
    { dayNumber: 1, dayName: 'Push', exerciseIds: ['e1', 'e2'] },
    { dayNumber: 2, dayName: 'Pull', exerciseIds: ['e3'] },
  ];

  it('deletes existing rows then inserts the new generated days', async () => {
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq: deleteEq });
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del, insert });

    await saveGeneratedProgram('user-1', days);

    expect(deleteEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(insert).toHaveBeenCalledWith([
      { user_id: 'user-1', day_number: 1, day_name: 'Push', exercise_id: 'e1', order_index: 0 },
      { user_id: 'user-1', day_number: 1, day_name: 'Push', exercise_id: 'e2', order_index: 1 },
      { user_id: 'user-1', day_number: 2, day_name: 'Pull', exercise_id: 'e3', order_index: 0 },
    ]);
  });

  it('throws if the delete fails, without attempting the insert', async () => {
    const deleteEq = jest.fn().mockResolvedValue({ error: new Error('boom') });
    const del = jest.fn().mockReturnValue({ eq: deleteEq });
    const insert = jest.fn();
    (supabase.from as jest.Mock).mockReturnValue({ delete: del, insert });

    await expect(saveGeneratedProgram('user-1', days)).rejects.toThrow('boom');
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws if the insert fails', async () => {
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq: deleteEq });
    const insert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del, insert });

    await expect(saveGeneratedProgram('user-1', days)).rejects.toThrow('boom');
  });
});

describe('fetchProgramDetails', () => {
  it('assembles the template name and generated days, sorted by day and order_index', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: { name: 'Full Body' }, error: null });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });

    const rowsOrder2 = jest.fn().mockResolvedValue({
      data: [
        {
          day_number: 1,
          day_name: 'Full Body',
          exercises: { name: 'Squat', muscle_group: 'legs', default_sets: 4, default_reps_min: 8, default_reps_max: 10 },
        },
        {
          day_number: 1,
          day_name: 'Full Body',
          exercises: { name: 'Rowing', muscle_group: 'back', default_sets: 3, default_reps_min: 10, default_reps_max: 12 },
        },
      ],
      error: null,
    });
    const rowsOrder1 = jest.fn().mockReturnValue({ order: rowsOrder2 });
    const rowsEq = jest.fn().mockReturnValue({ order: rowsOrder1 });
    const rowsSelect = jest.fn().mockReturnValue({ eq: rowsEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: templateSelect })
      .mockReturnValueOnce({ select: rowsSelect });

    const result = await fetchProgramDetails('user-1', 'template-1');

    expect(result).toEqual({
      templateId: 'template-1',
      templateName: 'Full Body',
      days: [
        {
          dayNumber: 1,
          name: 'Full Body',
          exercises: [
            { name: 'Squat', muscleGroup: 'legs', sets: 4, repsMin: 8, repsMax: 10 },
            { name: 'Rowing', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12 },
          ],
        },
      ],
    });
  });

  it('throws if the template lookup fails', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: templateSelect });

    await expect(fetchProgramDetails('user-1', 'template-1')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest workoutProgramData.test.ts`
Expected: FAIL (`fetchTemplateDaySlots`, `fetchExercisePool`, `saveGeneratedProgram` not exported; `fetchProgramDetails` called with 2 args but old signature takes 1 and old implementation queries `template_exercises`)

- [ ] **Step 3: Write the implementation**

Replace the full contents of `src/lib/workoutProgramData.ts`:

```ts
import { supabase } from './supabase';
import type { WorkoutTemplateOption } from './workoutTemplate';
import type { DayArchetype, ExercisePoolItem, GeneratedProgramDay } from './workoutProgram';

export type ProgramExercise = {
  name: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
};

export type ProgramDay = {
  dayNumber: number;
  name: string;
  exercises: ProgramExercise[];
};

export type WorkoutProgram = {
  templateId: string;
  templateName: string;
  days: ProgramDay[];
};

export async function fetchWorkoutTemplates(): Promise<WorkoutTemplateOption[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('id, name, days_per_week, level, equipment')
    .order('id');

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    daysPerWeek: row.days_per_week,
    level: row.level,
    equipment: row.equipment,
  }));
}

export async function saveWorkoutProgram(userId: string, templateId: string): Promise<void> {
  const { error } = await supabase.from('user_workout_programs').upsert({
    user_id: userId,
    template_id: templateId,
    assigned_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getAssignedTemplateId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_workout_programs')
    .select('template_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data.template_id;
}

export async function fetchTemplateDaySlots(templateId: string): Promise<DayArchetype[]> {
  const { data, error } = await supabase
    .from('template_days')
    .select('day_number, name, template_day_slots(muscle_group, slot_count, order_index)')
    .eq('template_id', templateId)
    .order('day_number');

  if (error) throw error;

  return (data ?? []).map((day: any) => ({
    name: day.name,
    slots: (day.template_day_slots ?? [])
      .slice()
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((s: any) => ({ muscleGroup: s.muscle_group, count: s.slot_count })),
  }));
}

export async function fetchExercisePool(equipment: string): Promise<ExercisePoolItem[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, muscle_group')
    .eq('equipment_needed', equipment)
    .order('id');

  if (error) throw error;

  return (data ?? []).map((row: any) => ({ id: row.id, muscleGroup: row.muscle_group }));
}

export async function saveGeneratedProgram(userId: string, days: GeneratedProgramDay[]): Promise<void> {
  const { error: deleteError } = await supabase.from('user_program_exercises').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;

  const rows = days.flatMap((day) =>
    day.exerciseIds.map((exerciseId, index) => ({
      user_id: userId,
      day_number: day.dayNumber,
      day_name: day.dayName,
      exercise_id: exerciseId,
      order_index: index,
    }))
  );

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('user_program_exercises').insert(rows);
    if (insertError) throw insertError;
  }
}

export async function fetchProgramDetails(userId: string, templateId: string): Promise<WorkoutProgram> {
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select('name')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: rows, error: rowsError } = await supabase
    .from('user_program_exercises')
    .select(
      'day_number, day_name, exercises(name, muscle_group, default_sets, default_reps_min, default_reps_max)'
    )
    .eq('user_id', userId)
    .order('day_number')
    .order('order_index');

  if (rowsError) throw rowsError;

  const dayMap = new Map<number, ProgramDay>();
  for (const row of (rows ?? []) as any[]) {
    if (!dayMap.has(row.day_number)) {
      dayMap.set(row.day_number, { dayNumber: row.day_number, name: row.day_name, exercises: [] });
    }
    dayMap.get(row.day_number)!.exercises.push({
      name: row.exercises.name,
      muscleGroup: row.exercises.muscle_group,
      sets: row.exercises.default_sets,
      repsMin: row.exercises.default_reps_min,
      repsMax: row.exercises.default_reps_max,
    });
  }

  return {
    templateId,
    templateName: template.name,
    days: Array.from(dayMap.values()).sort((a, b) => a.dayNumber - b.dayNumber),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest workoutProgramData.test.ts`
Expected: PASS (all tests, including the pre-existing `fetchWorkoutTemplates`/`saveWorkoutProgram`/`getAssignedTemplateId` ones which are unchanged)

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutProgramData.ts src/__tests__/workoutProgramData.test.ts
git commit -m "Add generation data layer, rewrite fetchProgramDetails on user_program_exercises"
```

---

### Task 4: Wire generation into the workout screen

**Files:**
- Modify: `src/app/workout.tsx`

**Interfaces:**
- Consumes: `generateWorkoutProgram` from `../lib/workoutProgram` (Task 2); `fetchTemplateDaySlots`, `fetchExercisePool`, `saveGeneratedProgram`, and the new `fetchProgramDetails(userId, templateId)` signature from `../lib/workoutProgramData` (Task 3).
- Produces: nothing consumed by a later task (final task in this plan).

- [ ] **Step 1: Update `assignAndLoad` and imports**

In `src/app/workout.tsx`, replace the imports block:

```ts
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getTrainingProfile } from '../lib/profile';
import { selectTemplate } from '../lib/workoutTemplate';
import { generateWorkoutProgram } from '../lib/workoutProgram';
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchTemplateDaySlots,
  fetchExercisePool,
  saveGeneratedProgram,
  fetchProgramDetails,
  type WorkoutProgram,
} from '../lib/workoutProgramData';
```

Replace the `assignAndLoad` function body:

```ts
  const assignAndLoad = useCallback(async (userId: string, forceRegenerate: boolean) => {
    const trainingProfile = await getTrainingProfile(userId);
    if (!trainingProfile) {
      router.replace('/onboarding');
      return;
    }

    const templates = await fetchWorkoutTemplates();
    let templateId = forceRegenerate ? null : await getAssignedTemplateId(userId);
    let needsGeneration = forceRegenerate;

    if (!templateId) {
      const selected = selectTemplate(trainingProfile, templates);
      if (!selected) {
        setError('Aucun programme disponible pour ton profil.');
        return;
      }
      await saveWorkoutProgram(userId, selected.id);
      templateId = selected.id;
      needsGeneration = true;
    }

    if (needsGeneration) {
      const template = templates.find((t) => t.id === templateId)!;
      const [archetypes, pool] = await Promise.all([
        fetchTemplateDaySlots(templateId),
        fetchExercisePool(template.equipment),
      ]);
      const generatedDays = generateWorkoutProgram(template.daysPerWeek, archetypes, pool);
      await saveGeneratedProgram(userId, generatedDays);
    }

    const details = await fetchProgramDetails(userId, templateId);
    setProgram(details);
  }, []);
```

No other part of `workout.tsx` changes — the rendering JSX (`program.days.map(...)`) already handles an arbitrary number of days, and `ProgramDay`/`ProgramExercise` shapes are unchanged.

- [ ] **Step 2: Run the full test suite**

Run: `npx jest`
Expected: PASS (this file has no dedicated test suite — no other screen file does either — so this step confirms the change didn't break any `*Data.ts`/`*.ts` test relying on these exports)

- [ ] **Step 3: Manually verify in the running app**

Start the app (`npx expo start --web`), log in with a profile that has `daysPerWeek: 5` and `push_pull_legs` assigned (or set one via onboarding), open the Workout tab, and confirm:
- 5 day blocks are rendered (not 3).
- The two "Push" days (and two "Pull" days) show different exercises from each other.
- Tapping "Régénérer" produces a different set of exercises on at least one day.

- [ ] **Step 4: Commit**

```bash
git add src/app/workout.tsx
git commit -m "Generate and persist a full week of varied workout days"
```

---
