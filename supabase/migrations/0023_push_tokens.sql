create table public.push_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "Users can insert own push token"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push token"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own push token"
  on public.push_tokens for delete
  using (auth.uid() = user_id);
