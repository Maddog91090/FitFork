create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null default current_date,
  weight_kg numeric not null check (weight_kg > 0),
  created_at timestamptz not null default now()
);

alter table public.weight_logs enable row level security;

create policy "Users can select own weight logs"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own weight logs"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);
