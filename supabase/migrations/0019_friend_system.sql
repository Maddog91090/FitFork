-- supabase/migrations/0019_friend_system.sql

-- Invitations à devenir ami d'entraînement. Le code est généré côté
-- serveur (voir create_friend_invite ci-dessous) ; aucune politique
-- d'insert directe n'existe ici, la RPC est le seul chemin d'écriture.
create table public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz
);

create index friend_invites_created_by_idx on public.friend_invites (created_by);

alter table public.friend_invites enable row level security;

create policy "Users can select own invites"
  on public.friend_invites for select
  using (auth.uid() = created_by);

-- Relations d'amitié acceptées. La paire est toujours rangée dans le
-- même ordre (comparaison uuid standard) pour empêcher un doublon en
-- sens inverse.
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id_a uuid not null references auth.users(id) on delete cascade,
  user_id_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_ordered check (user_id_a < user_id_b),
  constraint friendships_unique unique (user_id_a, user_id_b)
);

create index friendships_user_id_a_idx on public.friendships (user_id_a);
create index friendships_user_id_b_idx on public.friendships (user_id_b);

alter table public.friendships enable row level security;

create policy "Users can select own friendships"
  on public.friendships for select
  using (auth.uid() = user_id_a or auth.uid() = user_id_b);

create policy "Users can delete own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id_a or auth.uid() = user_id_b);

-- Génère un code d'invitation à 8 caractères (alphabet sans caractères
-- ambigus : pas de 0/O/1/I/L), réessaie en cas de collision improbable,
-- insère la ligne et renvoie le code + son expiration en une seule
-- opération atomique.
create or replace function public.create_friend_invite()
returns table(code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_expires timestamptz := now() + interval '7 days';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  loop
    select string_agg(substr(v_alphabet, (floor(random() * length(v_alphabet)) + 1)::int, 1), '')
    into v_code
    from generate_series(1, 8);

    begin
      insert into public.friend_invites (code, created_by, expires_at)
      values (v_code, auth.uid(), v_expires);
      exit;
    exception when unique_violation then
      -- Collision sur le code, on retire une nouvelle valeur.
    end;
  end loop;

  return query select v_code, v_expires;
end;
$$;

grant execute on function public.create_friend_invite() to authenticated;
revoke execute on function public.create_friend_invite() from public, anon;

-- Valide un code : verrouille la ligne (empêche une double rédemption
-- simultanée), vérifie qu'il n'est ni expiré ni déjà utilisé ni son
-- propre code, crée la relation d'amitié et marque le code consommé —
-- tout en une seule transaction atomique.
create or replace function public.redeem_friend_invite(invite_code text)
returns table(friend_user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from public.friend_invites
  where code = invite_code
    and redeemed_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Code invalide ou expiré';
  end if;

  if v_invite.created_by = v_me then
    raise exception 'Tu ne peux pas utiliser ton propre code';
  end if;

  v_a := least(v_invite.created_by, v_me);
  v_b := greatest(v_invite.created_by, v_me);

  insert into public.friendships (user_id_a, user_id_b)
  values (v_a, v_b)
  on conflict (user_id_a, user_id_b) do nothing;

  update public.friend_invites
  set redeemed_by = v_me, redeemed_at = now()
  where id = v_invite.id;

  return query select v_invite.created_by;
end;
$$;

grant execute on function public.redeem_friend_invite(text) to authenticated;
revoke execute on function public.redeem_friend_invite(text) from public, anon;

-- Liste mes amis avec leur email — jamais un annuaire de recherche,
-- uniquement les relations déjà acceptées où je suis une des deux
-- parties. auth.users n'est pas lisible directement par les clients ;
-- cette RPC security definer est le seul moyen d'obtenir l'email d'un
-- ami, et seulement pour un ami confirmé.
create or replace function public.list_my_friends()
returns table(friend_user_id uuid, friend_email text, friended_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select
    case when f.user_id_a = auth.uid() then f.user_id_b else f.user_id_a end,
    u.email,
    f.created_at
  from public.friendships f
  join auth.users u
    on u.id = case when f.user_id_a = auth.uid() then f.user_id_b else f.user_id_a end
  where f.user_id_a = auth.uid() or f.user_id_b = auth.uid();
$$;

grant execute on function public.list_my_friends() to authenticated;
revoke execute on function public.list_my_friends() from public, anon;

-- team_week_progress existait déjà (gamification sportive) mais
-- traitait tout utilisateur authentifié comme "le binôme". Elle est
-- maintenant filtrée sur mes amis acceptés uniquement.
create or replace function public.team_week_progress(weeks_back int default 26)
returns table(user_id uuid, week_start date, days_that_week int)
language sql
security definer
set search_path = public
as $$
  select
    wc.user_id,
    (date_trunc('week', wc.completed_date))::date as week_start,
    count(distinct wc.completed_date)::int as days_that_week
  from public.workout_completions wc
  where wc.completed_date >= (current_date - (weeks_back * 7))
    and (
      wc.user_id = auth.uid()
      or exists (
        select 1 from public.friendships f
        where (f.user_id_a = auth.uid() and f.user_id_b = wc.user_id)
           or (f.user_id_b = auth.uid() and f.user_id_a = wc.user_id)
      )
    )
  group by wc.user_id, (date_trunc('week', wc.completed_date))::date;
$$;

grant execute on function public.team_week_progress(int) to authenticated;
revoke execute on function public.team_week_progress(int) from public, anon;
