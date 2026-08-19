-- Shared cache of barcode-scanned products (Open Food Facts), keyed by
-- barcode so any user who has already scanned a product lets everyone else
-- skip the network round-trip.
create table public.scanned_products (
  barcode text primary key,
  name text not null,
  brand text,
  calories_per_100g numeric not null check (calories_per_100g >= 0),
  protein_g_per_100g numeric not null check (protein_g_per_100g >= 0),
  fat_g_per_100g numeric not null check (fat_g_per_100g >= 0),
  carbs_g_per_100g numeric not null check (carbs_g_per_100g >= 0),
  image_url text,
  fetched_at timestamptz not null default now()
);

alter table public.scanned_products enable row level security;

create policy "Anyone can read scanned products"
  on public.scanned_products for select
  using (true);

create policy "Authenticated users can cache scanned products"
  on public.scanned_products for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can refresh cached scanned products"
  on public.scanned_products for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- What the user actually ate today, as opposed to weekly_meal_plans/
-- meal_plan_entries which describe what they're *planned* to eat. Macros are
-- snapshotted at log time (not re-derived from recipes/scanned_products on
-- read) so editing a recipe or refreshing a cached product later never
-- changes a day's already-logged totals.
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null default current_date,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  source text not null check (source in ('plan_entry', 'product', 'manual')),
  plan_entry_id uuid references public.meal_plan_entries(id) on delete cascade,
  product_barcode text references public.scanned_products(barcode),
  name text not null,
  calories numeric not null check (calories >= 0),
  protein_g numeric not null check (protein_g >= 0),
  fat_g numeric not null check (fat_g >= 0),
  carbs_g numeric not null check (carbs_g >= 0),
  created_at timestamptz not null default now()
);

-- A planned meal can only be checked off as eaten once; unchecking it
-- deletes the row rather than leaving a duplicate to reconcile.
create unique index food_logs_plan_entry_unique
  on public.food_logs (plan_entry_id)
  where plan_entry_id is not null;

alter table public.food_logs enable row level security;

create policy "Users can select own food logs"
  on public.food_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own food logs"
  on public.food_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own food logs"
  on public.food_logs for delete
  using (auth.uid() = user_id);
