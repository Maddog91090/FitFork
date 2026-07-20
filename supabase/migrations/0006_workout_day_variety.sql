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
