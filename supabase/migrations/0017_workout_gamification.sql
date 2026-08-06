-- supabase/migrations/0017_workout_gamification.sql

-- Journal brut des séances terminées, base du système de gamification
-- sportive (streak, points, niveau, badges, bonus d'équipe coopératif).
-- Streak/points/niveau/badges sont tous calculés côté client à partir de
-- ce journal (voir src/lib/workoutGamification.ts) — pas d'agrégat stocké,
-- même approche que weight_logs + progressTracking.ts pour la tendance de
-- poids.
create table public.workout_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_index int not null check (session_index in (0, 1, 2)),
  completed_at timestamptz not null default now(),
  completed_date date generated always as ((completed_at at time zone 'utc')::date) stored,
  unique (user_id, session_index, completed_date)
);

alter table public.workout_completions enable row level security;

create policy "Users can select own workout completions"
  on public.workout_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout completions"
  on public.workout_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own workout completions"
  on public.workout_completions for delete
  using (auth.uid() = user_id);

-- Expose uniquement un agrégat (jours distincts entraînés, par semaine,
-- par utilisateur) sur une fenêtre glissante — jamais les lignes brutes —
-- pour permettre au bonus d'équipe et à son streak de se calculer sans
-- exposer au binôme les horaires ou quelle séance précise l'autre a faite.
create or replace function public.team_week_progress(weeks_back int default 26)
returns table(user_id uuid, week_start date, days_that_week int)
language sql
security definer
set search_path = public
as $$
  select
    user_id,
    (date_trunc('week', completed_date))::date as week_start,
    count(distinct completed_date)::int as days_that_week
  from public.workout_completions
  where completed_date >= (current_date - (weeks_back * 7))
  group by user_id, (date_trunc('week', completed_date))::date;
$$;

grant execute on function public.team_week_progress(int) to authenticated;
