-- supabase/migrations/0020_friend_system_hardening.sql

-- Retire une amitié via une RPC plutôt qu'une suppression directe côté
-- client filtrée uniquement par RLS — cohérent avec le reste de
-- l'écriture sur ces tables, qui passe déjà uniquement par des RPC.
create or replace function public.remove_friendship(friend_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.friendships
  where user_id_a = least(v_me, friend_user_id)
    and user_id_b = greatest(v_me, friend_user_id);
end;
$$;

grant execute on function public.remove_friendship(uuid) to authenticated;
revoke execute on function public.remove_friendship(uuid) from public, anon;

-- Le code d'invitation est le seul secret qui donne accès à l'email et à
-- l'activité sportive d'un autre utilisateur : il doit venir d'un CSPRNG
-- (extensions.gen_random_bytes de pgcrypto) et non de random(), qui n'est
-- pas cryptographiquement sûr.
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
  v_bytes bytea;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  loop
    v_bytes := extensions.gen_random_bytes(8);
    select string_agg(substr(v_alphabet, (get_byte(v_bytes, i - 1) % length(v_alphabet)) + 1, 1), '')
    into v_code
    from generate_series(1, 8) as i;

    begin
      insert into public.friend_invites (code, created_by, expires_at)
      values (v_code, auth.uid(), v_expires);
      exit;
    exception when unique_violation then
      -- Collision, on retire un nouveau tirage.
    end;
  end loop;

  return query select v_code, v_expires;
end;
$$;
