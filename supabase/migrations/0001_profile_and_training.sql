create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  sex text not null check (sex in ('male', 'female')),
  age integer not null check (age > 0 and age < 120),
  height_cm numeric not null check (height_cm > 0),
  weight_kg numeric not null check (weight_kg > 0),
  activity_level text not null check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text not null check (goal in ('cut', 'bulk', 'maintain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can select own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists public.training_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  days_per_week integer not null check (days_per_week >= 0 and days_per_week <= 7),
  experience_level text not null check (experience_level in ('beginner', 'intermediate', 'advanced')),
  equipment text not null check (equipment in ('full_gym', 'home_limited', 'bodyweight')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_profile enable row level security;

create policy "Users can select own training profile"
  on public.training_profile for select
  using (auth.uid() = user_id);

create policy "Users can insert own training profile"
  on public.training_profile for insert
  with check (auth.uid() = user_id);

create policy "Users can update own training profile"
  on public.training_profile for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
