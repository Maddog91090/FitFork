# Workout Program Generation (Plan 4 of 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user with a completed training profile get a strength-training program (a template matched to their days/week, level, and equipment), see it broken down by day and exercise, and regenerate it on demand — persisting across weeks until they explicitly ask for a new one.

**Architecture:** A pure, deterministic template-selection algorithm (`src/lib/workoutTemplate.ts`) scores a shared, seeded catalog of `workout_templates` by day-count closeness first (the spec's stated priority — days/week determines split type), then level match, then a stable name tie-break; equipment acts as a hard filter (a user's equipment tier can use any template at or below its own tier — `bodyweight ⊆ home_limited ⊆ full_gym`). A persistence layer (`src/lib/workoutProgramData.ts`) reads the template catalog, assigns one to `user_workout_programs` (a single upserted row per user — unlike the meal plan's weekly rows, the program is meant to persist), and fetches the assigned program's full day/exercise breakdown for display. One screen shows the program, auto-assigning on first visit and offering a manual "regenerate" action.

**Tech Stack:** Same as Plans 1-3 (Expo/React Native/TypeScript, Expo Router, Supabase JS client, Jest). No new dependencies.

## Global Constraints

- Backend is Supabase (Postgres + Auth + RLS) — no custom backend server.
- Template selection priority (per spec): **days/week first** (determines split type: 2-3 days → Full Body, 4 days → Upper/Lower, 5-6 days → Push/Pull/Legs), then **level** (adjusts volume/complexity), then **equipment** (excludes templates requiring gear the user doesn't have). If no exact match exists, use the closest available template rather than failing (per spec).
- Equipment compatibility is hierarchical, not exact-match: `bodyweight` (rank 0) ⊂ `home_limited` (rank 1) ⊂ `full_gym` (rank 2) — a user can use any template whose required tier is at or below their own (a full-gym user can still do a bodyweight template if it's otherwise the best match; a bodyweight-only user cannot use a full-gym template).
- Reuse Plan 2's existing types — do not redefine `ExperienceLevel` (`'beginner' | 'intermediate' | 'advanced'`) or `Equipment` (`'full_gym' | 'home_limited' | 'bodyweight'`); import both from `src/lib/profile.ts`.
- Persistence model: unlike the meal plan (a new row generated every week), the workout program is a **single row per user** in `user_workout_programs`, upserted — it stays assigned until the user explicitly regenerates it or their `training_profile` changes (per spec's "Persistence" note). This plan implements explicit regeneration only; automatic re-assignment on profile change is out of scope for V1 (a user can always tap "Regenerate" manually).
- Out of scope for V1 (per spec): logging sets/reps/weight performed, automatic progression based on logged performance.
- Routes/lib live under `src/app/`, `src/lib/`, `src/__tests__/` (established in Plan 1).

---

## File Structure

```
supabase/migrations/
  0004_workout_templates.sql   # exercises, workout_templates, template_days, template_exercises (all public read-only) + user_workout_programs (RLS) + seed data (36 exercises, 9 templates covering 3 split types × 3 equipment tiers)
src/lib/
  workoutTemplate.ts             # Pure function: selectTemplate() — day-diff-first, level-second, name-tiebreak scoring over equipment-compatible candidates
  workoutProgramData.ts          # Supabase data access: fetchWorkoutTemplates, saveWorkoutProgram, getAssignedTemplateId, fetchProgramDetails
src/app/
  workout.tsx                    # Displays the assigned program (auto-assigns on first visit); "Regenerate" button
  home.tsx                       # MODIFIED: add a navigation link to /workout
src/__tests__/
  workoutTemplate.test.ts        # Unit tests for the selection algorithm (synthetic fixtures, no I/O)
  workoutProgramData.test.ts     # Unit tests for the data access layer against a mocked Supabase client
```

---

### Task 1: Exercise and workout template schema, with seed data

**Files:**
- Create: `supabase/migrations/0004_workout_templates.sql`

**Interfaces:**
- Produces: Postgres tables `exercises` (id, name, muscle_group, equipment_needed — public read-only), `workout_templates` (id, name, split_type, days_per_week, level, equipment — public read-only), `template_days` (id, template_id, day_number, name — public read-only), `template_exercises` (id, template_day_id, exercise_id, sets, reps_min, reps_max, order_index — public read-only), `user_workout_programs` (user_id, template_id, assigned_at — RLS-owned, single row per user). Seeded with 36 exercises and 9 templates (3 split types × 3 equipment tiers, all tagged `level = 'intermediate'` — see note below). Task 2's `workoutTemplate.ts` and Task 3's `workoutProgramData.ts` read/write these exact column names.

- [ ] **Step 1: Write the migration and seed SQL**

Note on seed scope: the selection algorithm (Task 2) is unit-tested against synthetic multi-level fixtures covering beginner/intermediate/advanced — the algorithm's level-matching logic is fully verified independent of what's actually seeded. For V1, seeding a single `'intermediate'` level per split×equipment combination (9 templates total) is enough for the app to be genuinely usable today; adding `beginner`/`advanced` variants later is pure content addition, no code change, since the schema and algorithm already support the `level` column and score by it.

Create `supabase/migrations/0004_workout_templates.sql`:

```sql
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment_needed text not null check (equipment_needed in ('full_gym', 'home_limited', 'bodyweight'))
);

alter table public.exercises enable row level security;

create policy "Anyone can read exercises"
  on public.exercises for select
  using (true);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  split_type text not null check (split_type in ('full_body', 'upper_lower', 'push_pull_legs')),
  days_per_week integer not null check (days_per_week between 1 and 7),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  equipment text not null check (equipment in ('full_gym', 'home_limited', 'bodyweight'))
);

alter table public.workout_templates enable row level security;

create policy "Anyone can read workout templates"
  on public.workout_templates for select
  using (true);

create table if not exists public.template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  day_number integer not null check (day_number >= 1),
  name text not null
);

alter table public.template_days enable row level security;

create policy "Anyone can read template days"
  on public.template_days for select
  using (true);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.template_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sets integer not null check (sets > 0),
  reps_min integer not null check (reps_min > 0),
  reps_max integer not null check (reps_max >= reps_min),
  order_index integer not null check (order_index >= 0)
);

alter table public.template_exercises enable row level security;

create policy "Anyone can read template exercises"
  on public.template_exercises for select
  using (true);

create table if not exists public.user_workout_programs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id),
  assigned_at timestamptz not null default now()
);

alter table public.user_workout_programs enable row level security;

create policy "Users can select own workout program"
  on public.user_workout_programs for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout program"
  on public.user_workout_programs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout program"
  on public.user_workout_programs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed data: 36 exercises across 3 equipment tiers
insert into public.exercises (name, muscle_group, equipment_needed) values
  ('Squat barre', 'legs', 'full_gym'),
  ('Développé couché', 'chest', 'full_gym'),
  ('Soulevé de terre', 'back', 'full_gym'),
  ('Développé militaire', 'shoulders', 'full_gym'),
  ('Rowing barre', 'back', 'full_gym'),
  ('Tractions lestées', 'back', 'full_gym'),
  ('Dips lestés', 'chest', 'full_gym'),
  ('Presse à cuisses', 'legs', 'full_gym'),
  ('Tirage vertical', 'back', 'full_gym'),
  ('Leg curl', 'legs', 'full_gym'),
  ('Extension des jambes', 'legs', 'full_gym'),
  ('Curl biceps barre', 'arms', 'full_gym'),
  ('Extension triceps poulie', 'arms', 'full_gym'),
  ('Hip thrust barre', 'legs', 'full_gym'),
  ('Soulevé de terre roumain', 'legs', 'full_gym'),
  ('Développé incliné', 'chest', 'full_gym'),
  ('Squat haltères', 'legs', 'home_limited'),
  ('Développé couché haltères', 'chest', 'home_limited'),
  ('Rowing haltère', 'back', 'home_limited'),
  ('Développé épaules haltères', 'shoulders', 'home_limited'),
  ('Soulevé de terre roumain haltères', 'legs', 'home_limited'),
  ('Fentes haltères', 'legs', 'home_limited'),
  ('Curl biceps haltères', 'arms', 'home_limited'),
  ('Extension triceps haltère', 'arms', 'home_limited'),
  ('Squat gobelet', 'legs', 'home_limited'),
  ('Hip thrust haltère', 'legs', 'home_limited'),
  ('Pompes', 'chest', 'bodyweight'),
  ('Pompes pike', 'shoulders', 'bodyweight'),
  ('Squat au poids du corps', 'legs', 'bodyweight'),
  ('Fentes avant', 'legs', 'bodyweight'),
  ('Pont fessier', 'legs', 'bodyweight'),
  ('Superman', 'back', 'bodyweight'),
  ('Tractions', 'back', 'bodyweight'),
  ('Dips sur chaises', 'chest', 'bodyweight'),
  ('Mountain climbers', 'core', 'bodyweight'),
  ('Burpees', 'core', 'bodyweight')
;

-- Seed data: 9 templates (3 split types × 3 equipment tiers)
insert into public.workout_templates (name, split_type, days_per_week, level, equipment) values
  ('Full Body - Salle complète', 'full_body', 3, 'intermediate', 'full_gym'),
  ('Upper/Lower - Salle complète', 'upper_lower', 4, 'intermediate', 'full_gym'),
  ('Push/Pull/Legs - Salle complète', 'push_pull_legs', 5, 'intermediate', 'full_gym'),
  ('Full Body - Maison', 'full_body', 3, 'intermediate', 'home_limited'),
  ('Upper/Lower - Maison', 'upper_lower', 4, 'intermediate', 'home_limited'),
  ('Push/Pull/Legs - Maison', 'push_pull_legs', 5, 'intermediate', 'home_limited'),
  ('Full Body - Poids du corps', 'full_body', 3, 'intermediate', 'bodyweight'),
  ('Upper/Lower - Poids du corps', 'upper_lower', 4, 'intermediate', 'bodyweight'),
  ('Push/Pull/Legs - Poids du corps', 'push_pull_legs', 5, 'intermediate', 'bodyweight')
;

-- Seed data: template days (1 for full_body, 2 for upper_lower, 3 for push_pull_legs — per template)
insert into public.template_days (template_id, day_number, name)
select id, 1, 'Full Body' from public.workout_templates where name = 'Full Body - Salle complète'
union all select id, 1, 'Haut du corps' from public.workout_templates where name = 'Upper/Lower - Salle complète'
union all select id, 2, 'Bas du corps' from public.workout_templates where name = 'Upper/Lower - Salle complète'
union all select id, 1, 'Push' from public.workout_templates where name = 'Push/Pull/Legs - Salle complète'
union all select id, 2, 'Pull' from public.workout_templates where name = 'Push/Pull/Legs - Salle complète'
union all select id, 3, 'Legs' from public.workout_templates where name = 'Push/Pull/Legs - Salle complète'
union all select id, 1, 'Full Body' from public.workout_templates where name = 'Full Body - Maison'
union all select id, 1, 'Haut du corps' from public.workout_templates where name = 'Upper/Lower - Maison'
union all select id, 2, 'Bas du corps' from public.workout_templates where name = 'Upper/Lower - Maison'
union all select id, 1, 'Push' from public.workout_templates where name = 'Push/Pull/Legs - Maison'
union all select id, 2, 'Pull' from public.workout_templates where name = 'Push/Pull/Legs - Maison'
union all select id, 3, 'Legs' from public.workout_templates where name = 'Push/Pull/Legs - Maison'
union all select id, 1, 'Full Body' from public.workout_templates where name = 'Full Body - Poids du corps'
union all select id, 1, 'Haut du corps' from public.workout_templates where name = 'Upper/Lower - Poids du corps'
union all select id, 2, 'Bas du corps' from public.workout_templates where name = 'Upper/Lower - Poids du corps'
union all select id, 1, 'Push' from public.workout_templates where name = 'Push/Pull/Legs - Poids du corps'
union all select id, 2, 'Pull' from public.workout_templates where name = 'Push/Pull/Legs - Poids du corps'
union all select id, 3, 'Legs' from public.workout_templates where name = 'Push/Pull/Legs - Poids du corps'
;

-- Seed data: template exercises, joined via (template name, day name) + exercise name
with days as (
  select wt.name as template_name, td.name as day_name, td.id as day_id
  from public.template_days td
  join public.workout_templates wt on wt.id = td.template_id
)
insert into public.template_exercises (template_day_id, exercise_id, sets, reps_min, reps_max, order_index)
select d.day_id, e.id, v.sets, v.reps_min, v.reps_max, v.order_index
from (values
  ('Full Body - Salle complète', 'Full Body', 'Squat barre', 4, 8, 10, 1),
  ('Full Body - Salle complète', 'Full Body', 'Développé couché', 4, 8, 10, 2),
  ('Full Body - Salle complète', 'Full Body', 'Rowing barre', 3, 10, 12, 3),
  ('Full Body - Salle complète', 'Full Body', 'Développé militaire', 3, 8, 10, 4),
  ('Full Body - Salle complète', 'Full Body', 'Tractions lestées', 3, 8, 10, 5),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'Développé couché', 4, 8, 10, 1),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'Rowing barre', 4, 8, 10, 2),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'Développé militaire', 3, 8, 10, 3),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'Tirage vertical', 3, 10, 12, 4),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'Curl biceps barre', 3, 10, 12, 5),
  ('Upper/Lower - Salle complète', 'Haut du corps', 'Extension triceps poulie', 3, 10, 12, 6),
  ('Upper/Lower - Salle complète', 'Bas du corps', 'Squat barre', 4, 8, 10, 1),
  ('Upper/Lower - Salle complète', 'Bas du corps', 'Soulevé de terre roumain', 3, 8, 10, 2),
  ('Upper/Lower - Salle complète', 'Bas du corps', 'Presse à cuisses', 3, 10, 12, 3),
  ('Upper/Lower - Salle complète', 'Bas du corps', 'Leg curl', 3, 10, 12, 4),
  ('Upper/Lower - Salle complète', 'Bas du corps', 'Extension des jambes', 3, 10, 12, 5),
  ('Push/Pull/Legs - Salle complète', 'Push', 'Développé couché', 4, 8, 10, 1),
  ('Push/Pull/Legs - Salle complète', 'Push', 'Développé incliné', 3, 8, 10, 2),
  ('Push/Pull/Legs - Salle complète', 'Push', 'Développé militaire', 3, 8, 10, 3),
  ('Push/Pull/Legs - Salle complète', 'Push', 'Dips lestés', 3, 10, 12, 4),
  ('Push/Pull/Legs - Salle complète', 'Pull', 'Rowing barre', 4, 8, 10, 1),
  ('Push/Pull/Legs - Salle complète', 'Pull', 'Tirage vertical', 3, 10, 12, 2),
  ('Push/Pull/Legs - Salle complète', 'Pull', 'Tractions lestées', 3, 8, 10, 3),
  ('Push/Pull/Legs - Salle complète', 'Pull', 'Curl biceps barre', 3, 10, 12, 4),
  ('Push/Pull/Legs - Salle complète', 'Legs', 'Squat barre', 4, 8, 10, 1),
  ('Push/Pull/Legs - Salle complète', 'Legs', 'Soulevé de terre roumain', 3, 8, 10, 2),
  ('Push/Pull/Legs - Salle complète', 'Legs', 'Presse à cuisses', 3, 10, 12, 3),
  ('Push/Pull/Legs - Salle complète', 'Legs', 'Hip thrust barre', 3, 10, 12, 4),
  ('Full Body - Maison', 'Full Body', 'Squat haltères', 4, 10, 12, 1),
  ('Full Body - Maison', 'Full Body', 'Développé couché haltères', 4, 10, 12, 2),
  ('Full Body - Maison', 'Full Body', 'Rowing haltère', 3, 10, 12, 3),
  ('Full Body - Maison', 'Full Body', 'Développé épaules haltères', 3, 10, 12, 4),
  ('Full Body - Maison', 'Full Body', 'Fentes haltères', 3, 10, 12, 5),
  ('Upper/Lower - Maison', 'Haut du corps', 'Développé couché haltères', 4, 10, 12, 1),
  ('Upper/Lower - Maison', 'Haut du corps', 'Rowing haltère', 4, 10, 12, 2),
  ('Upper/Lower - Maison', 'Haut du corps', 'Développé épaules haltères', 3, 10, 12, 3),
  ('Upper/Lower - Maison', 'Haut du corps', 'Curl biceps haltères', 3, 10, 12, 4),
  ('Upper/Lower - Maison', 'Haut du corps', 'Extension triceps haltère', 3, 10, 12, 5),
  ('Upper/Lower - Maison', 'Bas du corps', 'Squat haltères', 4, 10, 12, 1),
  ('Upper/Lower - Maison', 'Bas du corps', 'Soulevé de terre roumain haltères', 3, 10, 12, 2),
  ('Upper/Lower - Maison', 'Bas du corps', 'Fentes haltères', 3, 10, 12, 3),
  ('Upper/Lower - Maison', 'Bas du corps', 'Hip thrust haltère', 3, 10, 12, 4),
  ('Upper/Lower - Maison', 'Bas du corps', 'Squat gobelet', 3, 10, 12, 5),
  ('Push/Pull/Legs - Maison', 'Push', 'Développé couché haltères', 4, 10, 12, 1),
  ('Push/Pull/Legs - Maison', 'Push', 'Développé épaules haltères', 3, 10, 12, 2),
  ('Push/Pull/Legs - Maison', 'Push', 'Extension triceps haltère', 3, 10, 12, 3),
  ('Push/Pull/Legs - Maison', 'Pull', 'Rowing haltère', 4, 10, 12, 1),
  ('Push/Pull/Legs - Maison', 'Pull', 'Curl biceps haltères', 3, 10, 12, 2),
  ('Push/Pull/Legs - Maison', 'Legs', 'Squat haltères', 4, 10, 12, 1),
  ('Push/Pull/Legs - Maison', 'Legs', 'Soulevé de terre roumain haltères', 3, 10, 12, 2),
  ('Push/Pull/Legs - Maison', 'Legs', 'Fentes haltères', 3, 10, 12, 3),
  ('Push/Pull/Legs - Maison', 'Legs', 'Hip thrust haltère', 3, 10, 12, 4),
  ('Full Body - Poids du corps', 'Full Body', 'Pompes', 4, 12, 15, 1),
  ('Full Body - Poids du corps', 'Full Body', 'Squat au poids du corps', 4, 15, 20, 2),
  ('Full Body - Poids du corps', 'Full Body', 'Tractions', 3, 6, 10, 3),
  ('Full Body - Poids du corps', 'Full Body', 'Pont fessier', 3, 15, 20, 4),
  ('Full Body - Poids du corps', 'Full Body', 'Mountain climbers', 3, 20, 30, 5),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'Pompes', 4, 12, 15, 1),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'Tractions', 4, 6, 10, 2),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'Pompes pike', 3, 8, 12, 3),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'Dips sur chaises', 3, 10, 15, 4),
  ('Upper/Lower - Poids du corps', 'Haut du corps', 'Superman', 3, 12, 15, 5),
  ('Upper/Lower - Poids du corps', 'Bas du corps', 'Squat au poids du corps', 4, 15, 20, 1),
  ('Upper/Lower - Poids du corps', 'Bas du corps', 'Fentes avant', 4, 12, 15, 2),
  ('Upper/Lower - Poids du corps', 'Bas du corps', 'Pont fessier', 3, 15, 20, 3),
  ('Upper/Lower - Poids du corps', 'Bas du corps', 'Mountain climbers', 3, 20, 30, 4),
  ('Push/Pull/Legs - Poids du corps', 'Push', 'Pompes', 4, 12, 15, 1),
  ('Push/Pull/Legs - Poids du corps', 'Push', 'Pompes pike', 3, 8, 12, 2),
  ('Push/Pull/Legs - Poids du corps', 'Push', 'Dips sur chaises', 3, 10, 15, 3),
  ('Push/Pull/Legs - Poids du corps', 'Pull', 'Tractions', 4, 6, 10, 1),
  ('Push/Pull/Legs - Poids du corps', 'Pull', 'Superman', 3, 12, 15, 2),
  ('Push/Pull/Legs - Poids du corps', 'Legs', 'Squat au poids du corps', 4, 15, 20, 1),
  ('Push/Pull/Legs - Poids du corps', 'Legs', 'Fentes avant', 4, 12, 15, 2),
  ('Push/Pull/Legs - Poids du corps', 'Legs', 'Pont fessier', 3, 15, 20, 3),
  ('Push/Pull/Legs - Poids du corps', 'Legs', 'Burpees', 3, 10, 15, 4)
) as v(template_name, day_name, exercise_name, sets, reps_min, reps_max, order_index)
join days d on d.template_name = v.template_name and d.day_name = v.day_name
join public.exercises e on e.name = v.exercise_name;
```

- [ ] **Step 2: Apply the migration (manual — needs Supabase dashboard access)**

Same process as Plans 2-3: open the Supabase SQL Editor for this project, clear the query box completely first (select all, delete) before pasting, then paste the full contents of `supabase/migrations/0004_workout_templates.sql` and run it. Confirm no errors, and that `exercises` (36 rows), `workout_templates` (9 rows), `template_days` (18 rows), and `template_exercises` (75 rows) all appear correctly under **Table Editor**.

- [ ] **Step 3: Verify via the REST API**

```bash
curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/exercises?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: a JSON array of 36 objects.

```bash
curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/workout_templates?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: a JSON array of 9 objects.

```bash
curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/template_exercises?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: a JSON array of 75 objects. Then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/user_workout_programs?select=*" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: `200` (empty array — RLS-protected).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0004_workout_templates.sql
git commit -m "Add workout template schema with seed data (36 exercises, 9 templates)"
```

---

### Task 2: Template selection algorithm (TDD)

**Files:**
- Create: `src/lib/workoutTemplate.ts`
- Test: `src/__tests__/workoutTemplate.test.ts`

**Interfaces:**
- Consumes: `ExperienceLevel`, `Equipment` types from `src/lib/profile.ts` (Plan 2) — do not redefine these.
- Produces:
  ```ts
  export type WorkoutTemplateOption = {
    id: string;
    name: string;
    daysPerWeek: number;
    level: ExperienceLevel;
    equipment: Equipment;
  };

  export type TrainingProfileInput = {
    daysPerWeek: number;
    experienceLevel: ExperienceLevel;
    equipment: Equipment;
  };

  export function selectTemplate(
    trainingProfile: TrainingProfileInput,
    templates: WorkoutTemplateOption[]
  ): WorkoutTemplateOption | null;
  ```
  Task 3's `workoutProgramData.ts` and Task 4's `workout.tsx` both call `selectTemplate`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/workoutTemplate.test.ts`:

```ts
import { selectTemplate, type WorkoutTemplateOption, type TrainingProfileInput } from '../lib/workoutTemplate';

const TEMPLATES: WorkoutTemplateOption[] = [
  { id: 't1', name: 'A - Full Gym 3d Intermediate', daysPerWeek: 3, level: 'intermediate', equipment: 'full_gym' },
  { id: 't2', name: 'B - Full Gym 4d Intermediate', daysPerWeek: 4, level: 'intermediate', equipment: 'full_gym' },
  { id: 't3', name: 'C - Full Gym 5d Intermediate', daysPerWeek: 5, level: 'intermediate', equipment: 'full_gym' },
  { id: 't4', name: 'D - Bodyweight 3d Beginner', daysPerWeek: 3, level: 'beginner', equipment: 'bodyweight' },
  { id: 't5', name: 'E - Full Gym 3d Beginner', daysPerWeek: 3, level: 'beginner', equipment: 'full_gym' },
  { id: 't6', name: 'F - Full Gym 3d Intermediate B', daysPerWeek: 3, level: 'intermediate', equipment: 'full_gym' },
];

describe('selectTemplate', () => {
  it('picks the exact day/level/equipment match', () => {
    const profile: TrainingProfileInput = { daysPerWeek: 5, experienceLevel: 'intermediate', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t3');
  });

  it('prioritizes day-count closeness over level match', () => {
    // t2 (4 days) has the smallest day-diff (0) even though its level (intermediate) doesn't match beginner
    const profile: TrainingProfileInput = { daysPerWeek: 4, experienceLevel: 'beginner', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t2');
  });

  it('falls back to level match when day-diff ties', () => {
    // t1 and t5 both have daysPerWeek 3 (diff 0); t5's level (beginner) matches, t1's doesn't
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t5');
  });

  it('excludes templates requiring more equipment than the user has', () => {
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'bodyweight' };
    // Only t4 is bodyweight-tier; all full_gym templates must be excluded
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t4');
  });

  it('allows a higher-equipment user to select a lower-equipment template when it is the best match', () => {
    // t4 (bodyweight) and t5 (full_gym) both have daysPerWeek 3 + level beginner (tie);
    // a full_gym user is compatible with both, and 'D...' sorts before 'E...' alphabetically
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t4');
  });

  it('returns null when no equipment-compatible template exists', () => {
    const fullGymOnly = TEMPLATES.filter((t) => t.equipment === 'full_gym');
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'intermediate', equipment: 'bodyweight' };
    expect(selectTemplate(profile, fullGymOnly)).toBeNull();
  });

  it('breaks ties stably by name when day-diff and level match are both equal', () => {
    // t1 and t6 are identical in daysPerWeek/level/equipment; 'A...' sorts before 'F...'
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'intermediate', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t1');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/workoutTemplate.test.ts
```

Expected: FAIL — `Cannot find module '../lib/workoutTemplate'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the selection algorithm**

Create `src/lib/workoutTemplate.ts`:

```ts
import type { ExperienceLevel, Equipment } from './profile';

const EQUIPMENT_RANK: Record<Equipment, number> = {
  bodyweight: 0,
  home_limited: 1,
  full_gym: 2,
};

export type WorkoutTemplateOption = {
  id: string;
  name: string;
  daysPerWeek: number;
  level: ExperienceLevel;
  equipment: Equipment;
};

export type TrainingProfileInput = {
  daysPerWeek: number;
  experienceLevel: ExperienceLevel;
  equipment: Equipment;
};

export function selectTemplate(
  trainingProfile: TrainingProfileInput,
  templates: WorkoutTemplateOption[]
): WorkoutTemplateOption | null {
  const userRank = EQUIPMENT_RANK[trainingProfile.equipment];
  const compatible = templates.filter((t) => EQUIPMENT_RANK[t.equipment] <= userRank);
  if (compatible.length === 0) return null;

  const sorted = [...compatible].sort((a, b) => {
    const dayDiffA = Math.abs(a.daysPerWeek - trainingProfile.daysPerWeek);
    const dayDiffB = Math.abs(b.daysPerWeek - trainingProfile.daysPerWeek);
    if (dayDiffA !== dayDiffB) return dayDiffA - dayDiffB;

    const levelMatchA = a.level === trainingProfile.experienceLevel ? 0 : 1;
    const levelMatchB = b.level === trainingProfile.experienceLevel ? 0 : 1;
    if (levelMatchA !== levelMatchB) return levelMatchA - levelMatchB;

    return a.name.localeCompare(b.name);
  });

  return sorted[0];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/workoutTemplate.test.ts
```

Expected: `7 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutTemplate.ts src/__tests__/workoutTemplate.test.ts
git commit -m "Add workout template selection algorithm"
```

---

### Task 3: Workout program persistence layer (TDD, mocked Supabase client)

**Files:**
- Create: `src/lib/workoutProgramData.ts`
- Test: `src/__tests__/workoutProgramData.test.ts`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts` (Plan 1); `WorkoutTemplateOption` type from `src/lib/workoutTemplate.ts` (Task 2).
- Produces:
  ```ts
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

  export function fetchWorkoutTemplates(): Promise<WorkoutTemplateOption[]>;
  export function saveWorkoutProgram(userId: string, templateId: string): Promise<void>;
  export function getAssignedTemplateId(userId: string): Promise<string | null>;
  export function fetchProgramDetails(templateId: string): Promise<WorkoutProgram>;
  ```
  Task 4's `workout.tsx` calls all four functions.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/workoutProgramData.test.ts`:

```ts
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchProgramDetails,
} from '../lib/workoutProgramData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchWorkoutTemplates', () => {
  it('maps rows to the WorkoutTemplateOption shape', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ id: 't1', name: 'Full Body', days_per_week: 3, level: 'intermediate', equipment: 'full_gym' }],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchWorkoutTemplates();

    expect(result).toEqual([
      { id: 't1', name: 'Full Body', daysPerWeek: 3, level: 'intermediate', equipment: 'full_gym' },
    ]);
    expect(order).toHaveBeenCalledWith('id');
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchWorkoutTemplates()).rejects.toThrow('boom');
  });
});

describe('saveWorkoutProgram', () => {
  it('upserts the user_workout_programs row', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await saveWorkoutProgram('user-1', 'template-1');

    expect(supabase.from).toHaveBeenCalledWith('user_workout_programs');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', template_id: 'template-1' })
    );
  });

  it('throws on a Supabase error', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await expect(saveWorkoutProgram('user-1', 'template-1')).rejects.toThrow('boom');
  });
});

describe('getAssignedTemplateId', () => {
  it('returns null when the user has no assigned program', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getAssignedTemplateId('user-1');

    expect(result).toBeNull();
  });

  it('returns the assigned template id', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { template_id: 'template-1' }, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getAssignedTemplateId('user-1');

    expect(result).toBe('template-1');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});

describe('fetchProgramDetails', () => {
  it('assembles the template name, days, and exercises sorted by order_index', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: { name: 'Full Body' }, error: null });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });

    const daysOrder = jest.fn().mockResolvedValue({
      data: [
        {
          day_number: 1,
          name: 'Full Body',
          template_exercises: [
            { sets: 3, reps_min: 10, reps_max: 12, order_index: 2, exercises: { name: 'Rowing', muscle_group: 'back' } },
            { sets: 4, reps_min: 8, reps_max: 10, order_index: 1, exercises: { name: 'Squat', muscle_group: 'legs' } },
          ],
        },
      ],
      error: null,
    });
    const daysEq = jest.fn().mockReturnValue({ order: daysOrder });
    const daysSelect = jest.fn().mockReturnValue({ eq: daysEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: templateSelect })
      .mockReturnValueOnce({ select: daysSelect });

    const result = await fetchProgramDetails('template-1');

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

    await expect(fetchProgramDetails('template-1')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/workoutProgramData.test.ts
```

Expected: FAIL — `Cannot find module '../lib/workoutProgramData'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the persistence layer**

Create `src/lib/workoutProgramData.ts`:

```ts
import { supabase } from './supabase';
import type { WorkoutTemplateOption } from './workoutTemplate';

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

export async function fetchProgramDetails(templateId: string): Promise<WorkoutProgram> {
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select('name')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: days, error: daysError } = await supabase
    .from('template_days')
    .select(
      'day_number, name, template_exercises(sets, reps_min, reps_max, order_index, exercises(name, muscle_group))'
    )
    .eq('template_id', templateId)
    .order('day_number');

  if (daysError) throw daysError;

  return {
    templateId,
    templateName: template.name,
    days: (days ?? []).map((day: any) => ({
      dayNumber: day.day_number,
      name: day.name,
      exercises: (day.template_exercises ?? [])
        .slice()
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((te: any) => ({
          name: te.exercises.name,
          muscleGroup: te.exercises.muscle_group,
          sets: te.sets,
          repsMin: te.reps_min,
          repsMax: te.reps_max,
        })),
    })),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/workoutProgramData.test.ts
```

Expected: `8 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutProgramData.ts src/__tests__/workoutProgramData.test.ts
git commit -m "Add workout program persistence layer"
```

---

### Task 4: Workout program screen

**Files:**
- Create: `src/app/workout.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Plan 1); `getTrainingProfile` (Plan 2, `src/lib/profile.ts`) — returns `Promise<TrainingProfile | null>` where `TrainingProfile = { daysPerWeek, experienceLevel, equipment }`, structurally identical to Task 2's `TrainingProfileInput`, so it can be passed to `selectTemplate` directly with no remapping; `selectTemplate` (Task 2); `fetchWorkoutTemplates`, `saveWorkoutProgram`, `getAssignedTemplateId`, `fetchProgramDetails` (Task 3).
- Produces: route `/workout`. Task 5 links here from `/home`.

- [ ] **Step 1: Create the workout program screen**

Create `src/app/workout.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getTrainingProfile } from '../lib/profile';
import { selectTemplate } from '../lib/workoutTemplate';
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchProgramDetails,
  type WorkoutProgram,
} from '../lib/workoutProgramData';

export default function WorkoutScreen() {
  const { session, loading } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [checking, setChecking] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignAndLoad = useCallback(async (userId: string, forceRegenerate: boolean) => {
    const trainingProfile = await getTrainingProfile(userId);
    if (!trainingProfile) {
      router.replace('/onboarding');
      return;
    }

    let templateId = forceRegenerate ? null : await getAssignedTemplateId(userId);

    if (!templateId) {
      const templates = await fetchWorkoutTemplates();
      const selected = selectTemplate(trainingProfile, templates);
      if (!selected) {
        setError('Aucun programme disponible pour ton profil.');
        return;
      }
      await saveWorkoutProgram(userId, selected.id);
      templateId = selected.id;
    }

    const details = await fetchProgramDetails(templateId);
    setProgram(details);
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      await assignAndLoad(session.user.id, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du programme.');
    } finally {
      setChecking(false);
    }
  }, [session, assignAndLoad]);

  const handleRegenerate = async () => {
    if (!session) return;
    setRegenerating(true);
    setError(null);
    try {
      await assignAndLoad(session.user.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la régénération.');
    } finally {
      setRegenerating(false);
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

  if (loading || !session || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {program && (
        <>
          <Text style={styles.title}>{program.templateName}</Text>
          {program.days.map((day) => (
            <View key={day.dayNumber} style={styles.dayBlock}>
              <Text style={styles.dayLabel}>{day.name}</Text>
              {day.exercises.map((exercise, index) => (
                <Text key={index} style={styles.exerciseLine}>
                  {exercise.name} — {exercise.sets} x {exercise.repsMin}-{exercise.repsMax} ({exercise.muscleGroup})
                </Text>
              ))}
            </View>
          ))}
        </>
      )}
      <View style={{ marginTop: 16 }}>
        <Button
          title={regenerating ? 'Régénération...' : 'Régénérer le programme'}
          onPress={handleRegenerate}
          disabled={regenerating}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  dayBlock: { marginBottom: 20 },
  dayLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  exerciseLine: { marginBottom: 4 },
  error: { color: 'red', marginBottom: 16 },
});
```

- [ ] **Step 2: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/workout
```

Expected: `200`. Stop the server once confirmed. (Seeing the actual auto-assigned program, the day/exercise breakdown, and the regenerate button's effect requires a human with a real browser or Expo Go, and a completed training profile.)

- [ ] **Step 3: Commit**

```bash
git add src/app/workout.tsx
git commit -m "Add workout program screen"
```

---

### Task 5: Home screen navigation

**Files:**
- Modify: `src/app/home.tsx`

**Interfaces:**
- Consumes: nothing new — just adds a `Link` to the existing nav block.
- Produces: a link from `/home` to `/workout`. This is the last piece this plan builds.

- [ ] **Step 1: Add the navigation link**

In `src/app/home.tsx`, the nav block currently reads (added in Plan 3):

```tsx
      <View style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
        <Link href="/generate-plan">Générer le plan de la semaine</Link>
        <Link href="/plan">Voir mon plan</Link>
      </View>
```

Replace it with:

```tsx
      <View style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
        <Link href="/generate-plan">Générer le plan de la semaine</Link>
        <Link href="/plan">Voir mon plan</Link>
        <Link href="/workout">Mon programme de musculation</Link>
      </View>
```

- [ ] **Step 2: Run the full automated test suite**

```bash
npx jest
```

Expected: all tests pass (smoke, auth-context, nutrition, targets, profile, mealPlan, mealPlanData, workoutTemplate, workoutProgramData — 9 test files, no regressions).

- [ ] **Step 3: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/home
```

Expected: `200`. Stop the server once confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/app/home.tsx
git commit -m "Add workout program navigation link to home screen"
```

---

## Plan Complete

At the end of this plan: a signed-in user with a completed training profile visiting `/workout` for the first time gets a strength program automatically matched to their days/week, level, and equipment (closest available match if no exact one exists), sees it broken down by day and exercise with sets/reps, and can tap "Régénérer" to get a fresh match at any time — with `src/lib/workoutTemplate.ts`'s `selectTemplate` and `src/lib/workoutProgramData.ts`'s persistence functions as the stable interfaces available for Plan 5 (progress tracking) to build on, alongside Plan 3's meal-plan equivalents.

