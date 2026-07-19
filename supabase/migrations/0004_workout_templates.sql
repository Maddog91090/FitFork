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
