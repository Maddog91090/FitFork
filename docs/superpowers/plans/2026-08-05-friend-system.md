# Friend System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user invite another user by a shareable code, and once
accepted, correctly scope the workout-gamification "team bonus" to real,
mutually-accepted friends instead of any other authenticated account —
supporting any number of independent friendships, each tracked and
rewarded separately.

**Architecture:** Two new Supabase tables (`friend_invites`,
`friendships`) plus three `security definer` RPCs
(`create_friend_invite`, `redeem_friend_invite`, `list_my_friends`), all
mutation paths funneled through RPCs rather than direct table
writes/reads so the invite-code exchange is atomic and no client ever
reads another user's raw invite row. The already-shipped
`team_week_progress` RPC is re-scoped from "any authenticated user" to
"me and my accepted friends." Client-side, per-friendship bonus math
reuses the existing `computeTeamBonusWeeks`/`weeksStreak` primitives
unchanged (one call per friendship), and a new shared loader
(`loadGamificationStats`) replaces the duplicated fetch-and-compute logic
that previously lived separately in `home.tsx` and `progression.tsx`.

**Tech Stack:** Expo Router, React Native, Supabase (Postgres + RLS +
`security definer` RPCs), Jest (`jest-expo` preset), TypeScript,
`expo-clipboard` (new dependency, for the "Copier" invite action).

## Global Constraints

- Visual values (color, spacing, radius, typography, shadow) come only
  from `src/theme/tokens.ts` — zero hex codes, zero raw
  `fontSize`/`fontWeight` in any new or edited screen.
- Every tappable element gets a pressed state (`Button` or
  `PressableScale`, never a bare `Pressable`), a 44pt minimum touch
  target (use `state.minTouchSize` for anything not already a full-width
  `Button`), and an `accessibilityRole`.
- All new UI copy is in French and tutoies ("tu"/"ton"), matching every
  existing screen.
- Every Postgres table/policy uses the project's existing convention:
  `auth.uid() = user_id`-style scoping, `references auth.users(id) on
  delete cascade`, policy names in the form `"Users can <verb> own
  <table>"`.
- Every `security definer` function explicitly `revoke`s `execute` from
  `public, anon` and grants only to `authenticated` — Postgres grants
  `EXECUTE` to `PUBLIC` by default at function creation, which is exactly
  the gap the previous feature had to patch after shipping.
- `npx tsc --noEmit` and `npx jest "meal-workout-planner/src/__tests__"`
  must be clean before any task is considered done. (The anchored jest
  invocation excludes stray `.claude/worktrees/*` checkouts that a bare
  `npx jest` also picks up — unrelated, pre-existing, not this plan's
  concern.)
- Do not queue an EAS/APK build as part of this work — verify UI tasks
  with `npx expo start --web`. On-device/logged-in manual verification is
  not possible in this environment (reaching authenticated screens
  requires entering the user's real password, which is never done) — every
  UI task's manual-verification step is scoped to what's checkable
  without logging in, and each task's report must say so explicitly
  rather than imply a real device pass happened.

## Deviations from the design doc, resolved here

The design doc left one implementation detail unresolved: it showed an
`insert` RLS policy on `friend_invites` implying a direct client insert,
but didn't specify how the invite `code` value itself gets generated or
guaranteed unique. This plan resolves it: code generation moves into a
new `create_friend_invite()` RPC (server-side random code + collision
retry, atomic with the row insert), and the direct `insert` policy on
`friend_invites` is dropped — the RPC is the only sanctioned write path,
matching how the design already required `redeem_friend_invite` to be a
RPC rather than a direct client write to `friendships`. Nothing
user-facing changes; this only affects which SQL object performs the
insert.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `supabase/migrations/0019_friend_system.sql` | `friend_invites`/`friendships` tables, 3 new RPCs, `team_week_progress` re-scoped |
| `src/lib/workoutGamification.ts` | Modified: `computeStats` takes `teamBonusStreak` as a parameter instead of deriving it; `partnerWeeks` removed and replaced by `weeksForFriend`; `weeksStreak` exported |
| `src/lib/friendGamification.ts` | New: pure multi-friend bonus math (`computeFriendBonuses`, `flattenTeamBonusWeeks`, `maxTeamBonusStreak`) |
| `src/lib/friendsData.ts` | New: Supabase I/O for invites/friendships |
| `src/lib/loadGamificationStats.ts` | New: the one shared fetch-and-compute orchestration both screens call |
| `src/app/friends.tsx` | New: friend list, generate/share/copy invite code, redeem a code |
| `src/app/(tabs)/home.tsx` | Modified: uses `loadGamificationStats` instead of its own inline fetch+compute |
| `src/app/progression.tsx` | Modified: uses `loadGamificationStats`; renders a per-friend bonus section; links to `/friends` |
| `src/__tests__/workoutGamification.test.ts` | Modified: updated for the new `computeStats` signature and removed `partnerWeeks` |
| `src/__tests__/friendGamification.test.ts` | New |
| `src/__tests__/friendsData.test.ts` | New |
| `src/__tests__/loadGamificationStats.test.ts` | New |
| `src/__tests__/friends-screen.test.tsx` | New |
| `src/__tests__/home-progression-card.test.tsx` | Modified: updated for the shared loader |
| `src/__tests__/progression-screen.test.tsx` | Modified: updated for the shared loader and the returning friend section |

`loadGamificationStats.ts` exists specifically to close a gap the
previous feature's final review flagged and deferred: `home.tsx` and
`progression.tsx` each independently fetched and computed
`GamificationStats`, which could show different numbers for the same
underlying data the moment either one's logic drifted. Introducing the
friend system was going to make each screen's fetch-and-compute
noticeably more involved (fetch friends, fetch team rows, compute
per-friend bonuses, flatten/max them) — exactly the moment to stop
duplicating it a second time.

---

### Task 1: Database migration — friend tables, invite/redeem/list RPCs, re-scoped `team_week_progress`

**Files:**
- Create: `supabase/migrations/0019_friend_system.sql`

**Interfaces:**
- Produces: tables `public.friend_invites`, `public.friendships`; RPCs
  `public.create_friend_invite()`, `public.redeem_friend_invite(text)`,
  `public.list_my_friends()`; and the updated
  `public.team_week_progress(int)`. Task 3 (`friendsData.ts`) calls all
  four RPC names and both table names by these exact names.

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration to the live project**

Use the Supabase MCP `apply_migration` tool with `project_id
xewpbovlhoxovaydpuzh`, `name: "friend_system"`, and the SQL from Step 1
as `query`.

- [ ] **Step 3: Verify the invite/redeem flow with a rolled-back transaction**

Run via `execute_sql` (this creates two fake, throwaway auth-user rows
scoped entirely inside the transaction — nothing persists after
`rollback`):

```sql
begin;

-- Deux faux comptes juste pour ce test, dans la transaction seulement.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'test-a@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'test-b@example.com');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001"}';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

select * from public.create_friend_invite();
```

Note the returned `code`, then continue in the same transaction as the
second user:

```sql
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select * from public.redeem_friend_invite('<code from above>');

select * from public.list_my_friends(); -- as user 2, should show user 1's email

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select * from public.list_my_friends(); -- as user 1, should show user 2's email

rollback;
```

Expected: `create_friend_invite` returns an 8-character code and a
future `expires_at`; `redeem_friend_invite` returns user 1's id;
`list_my_friends` shows the correct counterpart's email from each side.
`rollback` leaves the database exactly as it was — confirm with `select
count(*) from public.friendships;` afterward and expect `0`.

If setting `request.jwt.claim.sub` this way isn't honored by `auth.uid()`
in this Supabase project's Postgres version, fall back to testing each
RPC's SQL body logic by hand-tracing it against the Step 1 SQL rather
than a live role-switch simulation, and note this in the report.

- [ ] **Step 4: Verify a friend cannot redeem their own code, and an expired/already-used code is rejected**

```sql
begin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000003', 'test-c@example.com');
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select * from public.create_friend_invite(); -- note the code
select * from public.redeem_friend_invite('<that same code>'); -- expect: exception "Tu ne peux pas utiliser ton propre code"
rollback;
```

- [ ] **Step 5: Verify RLS policies and RPC grants are exactly as intended**

```sql
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('friend_invites', 'friendships')
order by tablename, cmd;

select has_function_privilege('anon', 'public.create_friend_invite()', 'EXECUTE') as anon_create;
select has_function_privilege('anon', 'public.redeem_friend_invite(text)', 'EXECUTE') as anon_redeem;
select has_function_privilege('anon', 'public.list_my_friends()', 'EXECUTE') as anon_list;
select has_function_privilege('authenticated', 'public.create_friend_invite()', 'EXECUTE') as auth_create;
select has_function_privilege('authenticated', 'public.redeem_friend_invite(text)', 'EXECUTE') as auth_redeem;
select has_function_privilege('authenticated', 'public.list_my_friends()', 'EXECUTE') as auth_list;
```

Expected: `friend_invites` has exactly one policy (`"Users can select own
invites"` / SELECT); `friendships` has exactly two (`"Users can select
own friendships"` / SELECT, `"Users can delete own friendships"` /
DELETE); every `anon_*` value is `false`; every `auth_*` value is `true`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0019_friend_system.sql
git commit -m "$(cat <<'EOF'
Add the friend system's tables and RPCs, re-scope team_week_progress

friend_invites (server-generated codes, single-use, 7-day expiry) and
friendships (canonically-ordered pairs) back a shareable invite-code
flow — no user search or directory needed. All writes go through
security-definer RPCs (create_friend_invite, redeem_friend_invite) so
no client ever needs direct table-write access or reads another
user's raw invite row. team_week_progress, previously scoped to any
authenticated user, is now filtered to accepted friendships only —
closing the gap flagged after the gamification feature's final review.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 2: Update `workoutGamification.ts` for multi-friend support

**Files:**
- Modify: `src/lib/workoutGamification.ts`
- Modify: `src/__tests__/workoutGamification.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces (consumed by Task 3, Task 4):
  - `weeksStreak(qualifyingWeekStarts: Set<string>, todayStr: string): number` — now exported (was private).
  - `weeksForFriend(teamRows: TeamWeekRow[], friendUserId: string): WeekDayCount[]` — new, replaces `partnerWeeks`.
  - `computeStats(completions: WorkoutCompletion[], teamBonusWeekStarts: string[], teamBonusStreak: number, todayStr: string): GamificationStats` — signature changed, now takes `teamBonusStreak` as a parameter instead of deriving it internally.
  - `partnerWeeks` — **removed**. It answered "everyone who isn't me," which has no correct use once a user can have more than one friend; every caller needs one specific friend's weeks instead, which `weeksForFriend` provides.

- [ ] **Step 1: Update the test file to cover the new/changed/removed functions**

Replace the entire `partnerWeeks` describe block and the `computeStats`
describe block in `src/__tests__/workoutGamification.test.ts` (leave
every other describe block in that file untouched):

```typescript
// Replace this:
//   describe('partnerWeeks', () => { ... });
// with:
describe('weeksForFriend', () => {
  it('returns only the given friend’s rows, mapped to WeekDayCount', () => {
    const teamRows: TeamWeekRow[] = [
      { userId: 'friend-a', weekStart: '2026-07-27', days: 3 },
      { userId: 'friend-b', weekStart: '2026-07-27', days: 1 },
      { userId: 'friend-a', weekStart: '2026-08-03', days: 2 },
    ];
    expect(weeksForFriend(teamRows, 'friend-a')).toEqual([
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 2 },
    ]);
  });

  it('returns an empty list when the friend has no rows', () => {
    expect(weeksForFriend([], 'friend-a')).toEqual([]);
  });
});

describe('weeksStreak', () => {
  it('is exported and computes a consecutive-week streak from a qualifying set', () => {
    const qualifying = new Set(['2026-07-27', '2026-08-03']);
    expect(weeksStreak(qualifying, '2026-08-05')).toBe(2);
  });

  it('returns 0 for an empty qualifying set', () => {
    expect(weeksStreak(new Set(), '2026-08-05')).toBe(0);
  });
});

// Replace the existing `describe('computeStats', ...)` block with:
describe('computeStats', () => {
  it('combines streak, points, level, and the team-bonus streak it is given', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 1, completedDate: '2026-07-29' },
      { sessionIndex: 2, completedDate: '2026-07-31' },
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    const teamBonusWeekStarts = ['2026-07-27', '2026-08-03'];
    const stats = computeStats(completions, teamBonusWeekStarts, 2, '2026-08-05');
    expect(stats.totalCompletions).toBe(6);
    expect(stats.streak).toBe(2);
    expect(stats.thisWeekDays).toBe(3);
    expect(stats.teamBonusCount).toBe(2);
    expect(stats.teamBonusStreak).toBe(2);
    // 6*10 + 2*20 (both weeks qualify) + 2*15 (both team bonus weeks) = 130
    expect(stats.totalPoints).toBe(130);
    expect(stats.level).toBe(2);
  });

  it('uses the supplied teamBonusStreak verbatim, independent of teamBonusWeekStarts', () => {
    // A caller can legitimately pass a teamBonusStreak that doesn't match a
    // naive re-derivation from teamBonusWeekStarts — e.g. when the streak
    // is the max across several independent friendships, not a single
    // consecutive-week walk over the flattened, duplicate-containing list.
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
    ];
    const stats = computeStats(completions, ['2026-08-03', '2026-08-03'], 5, '2026-08-05');
    expect(stats.teamBonusStreak).toBe(5);
    expect(stats.teamBonusCount).toBe(2);
  });
});
```

Also update the top-of-file import list to match the new exports:

```typescript
import {
  getWeekStart,
  groupByWeek,
  calculateStreak,
  calculatePoints,
  calculateLevel,
  computeTeamBonusWeeks,
  weeksForFriend,
  weeksStreak,
  computeStats,
  type WorkoutCompletion,
  type TeamWeekRow,
} from '../lib/workoutGamification';
```

(This drops `partnerWeeks` from the import list and adds `weeksForFriend`
and `weeksStreak`.)

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/workoutGamification.test.ts`
Expected: FAIL — `weeksForFriend`/`weeksStreak` are not exported yet, and
the `computeStats` calls now pass 4 arguments where the current
implementation only accepts 3.

- [ ] **Step 3: Update the implementation**

In `src/lib/workoutGamification.ts`, change:

```typescript
function weeksStreak(qualifyingWeekStarts: Set<string>, todayStr: string): number {
```

to:

```typescript
export function weeksStreak(qualifyingWeekStarts: Set<string>, todayStr: string): number {
```

Change:

```typescript
export function partnerWeeks(teamRows: TeamWeekRow[], myUserId: string): WeekDayCount[] {
  return teamRows
    .filter((row) => row.userId !== myUserId)
    .map((row) => ({ weekStart: row.weekStart, days: row.days }));
}
```

to:

```typescript
export function weeksForFriend(teamRows: TeamWeekRow[], friendUserId: string): WeekDayCount[] {
  return teamRows
    .filter((row) => row.userId === friendUserId)
    .map((row) => ({ weekStart: row.weekStart, days: row.days }));
}
```

Change:

```typescript
export function computeStats(
  completions: WorkoutCompletion[],
  teamBonusWeekStarts: string[],
  todayStr: string
): GamificationStats {
  const { streak, thisWeekDays } = calculateStreak(completions, todayStr);
  const totalPoints = calculatePoints(completions, teamBonusWeekStarts);
  return {
    totalCompletions: completions.length,
    streak,
    thisWeekDays,
    totalPoints,
    level: calculateLevel(totalPoints),
    teamBonusCount: teamBonusWeekStarts.length,
    teamBonusStreak: weeksStreak(new Set(teamBonusWeekStarts), todayStr),
  };
}
```

to:

```typescript
export function computeStats(
  completions: WorkoutCompletion[],
  teamBonusWeekStarts: string[],
  teamBonusStreak: number,
  todayStr: string
): GamificationStats {
  const { streak, thisWeekDays } = calculateStreak(completions, todayStr);
  const totalPoints = calculatePoints(completions, teamBonusWeekStarts);
  return {
    totalCompletions: completions.length,
    streak,
    thisWeekDays,
    totalPoints,
    level: calculateLevel(totalPoints),
    teamBonusCount: teamBonusWeekStarts.length,
    teamBonusStreak,
  };
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/__tests__/workoutGamification.test.ts`
Expected: PASS, every `it` block green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutGamification.ts src/__tests__/workoutGamification.test.ts
git commit -m "$(cat <<'EOF'
Support multiple independent friendships in the gamification math

partnerWeeks answered "everyone who isn't me," which has no correct
meaning once a user can have more than one friend — replaced by
weeksForFriend, which isolates one specific friend's weekly rows.
computeStats no longer derives teamBonusStreak internally from a flat
week list; it takes the value as a parameter instead, because with
independent per-friendship bonuses the correct streak is the best
single friendship's consecutive-week run, not a walk over the
(duplicate-containing) union of every friendship's bonus weeks.
weeksStreak is exported so the new per-friendship math in
friendGamification.ts can reuse it directly.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 3: Multi-friend bonus math — `src/lib/friendGamification.ts`

**Files:**
- Create: `src/lib/friendGamification.ts`
- Create: `src/__tests__/friendGamification.test.ts`

**Interfaces:**
- Consumes: `WeekDayCount`, `computeTeamBonusWeeks`, `weeksStreak`,
  `getWeekStart` from `src/lib/workoutGamification.ts` (Task 2).
- Produces (consumed by Task 5's `loadGamificationStats.ts`):
  - `type FriendInput = { friendUserId: string; weeks: WeekDayCount[] }`
  - `type FriendBonusSummary = { friendUserId: string; bonusWeekStarts: string[]; bonusStreak: number; thisWeekCombinedDays: number }`
  - `computeFriendBonuses(myWeeks: WeekDayCount[], friends: FriendInput[], todayStr: string): FriendBonusSummary[]`
  - `flattenTeamBonusWeeks(summaries: FriendBonusSummary[]): string[]`
  - `maxTeamBonusStreak(summaries: FriendBonusSummary[]): number`

- [ ] **Step 1: Write the failing test file**

```typescript
// src/__tests__/friendGamification.test.ts
import {
  computeFriendBonuses,
  flattenTeamBonusWeeks,
  maxTeamBonusStreak,
  type FriendBonusSummary,
} from '../lib/friendGamification';
import type { WeekDayCount } from '../lib/workoutGamification';

describe('computeFriendBonuses', () => {
  it('computes each friendship independently, including this week’s combined days', () => {
    const myWeeks: WeekDayCount[] = [
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 2 },
    ];
    const friends = [
      {
        friendUserId: 'friend-a',
        weeks: [
          { weekStart: '2026-07-27', days: 3 },
          { weekStart: '2026-08-03', days: 3 },
        ] as WeekDayCount[],
      },
      {
        friendUserId: 'friend-b',
        weeks: [{ weekStart: '2026-07-27', days: 1 }] as WeekDayCount[],
      },
    ];

    const result = computeFriendBonuses(myWeeks, friends, '2026-08-05');

    expect(result).toEqual([
      {
        friendUserId: 'friend-a',
        bonusWeekStarts: ['2026-07-27'],
        bonusStreak: 1,
        thisWeekCombinedDays: 5, // my 2 (capped 3) + friend-a's 3 (capped 3) = 5
      },
      {
        friendUserId: 'friend-b',
        bonusWeekStarts: [],
        bonusStreak: 0,
        thisWeekCombinedDays: 2, // my 2 + friend-b's 0 this week
      },
    ]);
  });

  it('caps each side’s contribution to this week’s combined days at 3', () => {
    const myWeeks: WeekDayCount[] = [{ weekStart: '2026-08-03', days: 4 }];
    const friends = [
      { friendUserId: 'friend-a', weeks: [{ weekStart: '2026-08-03', days: 5 }] as WeekDayCount[] },
    ];
    const result = computeFriendBonuses(myWeeks, friends, '2026-08-05');
    expect(result[0].thisWeekCombinedDays).toBe(6); // min(4,3) + min(5,3)
  });

  it('returns an empty array for a user with no friends', () => {
    expect(computeFriendBonuses([{ weekStart: '2026-08-03', days: 3 }], [], '2026-08-05')).toEqual([]);
  });
});

describe('flattenTeamBonusWeeks', () => {
  it('concatenates every friendship’s bonus weeks, duplicates included', () => {
    const summaries: FriendBonusSummary[] = [
      { friendUserId: 'a', bonusWeekStarts: ['2026-07-27', '2026-08-03'], bonusStreak: 2, thisWeekCombinedDays: 6 },
      { friendUserId: 'b', bonusWeekStarts: ['2026-08-03'], bonusStreak: 1, thisWeekCombinedDays: 6 },
    ];
    // 2026-08-03 appears twice on purpose: matching two friends the same
    // week is two independent bonuses, not one deduplicated bonus.
    expect(flattenTeamBonusWeeks(summaries)).toEqual(['2026-07-27', '2026-08-03', '2026-08-03']);
  });

  it('returns an empty array when there are no friends', () => {
    expect(flattenTeamBonusWeeks([])).toEqual([]);
  });
});

describe('maxTeamBonusStreak', () => {
  it('returns the best single friendship’s streak, not a sum or union', () => {
    const summaries: FriendBonusSummary[] = [
      { friendUserId: 'a', bonusWeekStarts: [], bonusStreak: 1, thisWeekCombinedDays: 0 },
      { friendUserId: 'b', bonusWeekStarts: [], bonusStreak: 4, thisWeekCombinedDays: 0 },
      { friendUserId: 'c', bonusWeekStarts: [], bonusStreak: 2, thisWeekCombinedDays: 0 },
    ];
    expect(maxTeamBonusStreak(summaries)).toBe(4);
  });

  it('returns 0 when there are no friends', () => {
    expect(maxTeamBonusStreak([])).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/friendGamification.test.ts`
Expected: FAIL — `Cannot find module '../lib/friendGamification'`.

- [ ] **Step 3: Implement the module**

```typescript
// src/lib/friendGamification.ts
import { getWeekStart, computeTeamBonusWeeks, weeksStreak, type WeekDayCount } from './workoutGamification';

const WEEKLY_TARGET_DAYS = 3;

export type FriendInput = {
  friendUserId: string;
  weeks: WeekDayCount[];
};

export type FriendBonusSummary = {
  friendUserId: string;
  bonusWeekStarts: string[];
  bonusStreak: number;
  thisWeekCombinedDays: number;
};

export function computeFriendBonuses(
  myWeeks: WeekDayCount[],
  friends: FriendInput[],
  todayStr: string
): FriendBonusSummary[] {
  const currentWeekStart = getWeekStart(todayStr);
  const myThisWeek = Math.min(
    myWeeks.find((w) => w.weekStart === currentWeekStart)?.days ?? 0,
    WEEKLY_TARGET_DAYS
  );

  return friends.map((friend) => {
    const bonusWeekStarts = computeTeamBonusWeeks(myWeeks, friend.weeks);
    const bonusStreak = weeksStreak(new Set(bonusWeekStarts), todayStr);
    const friendThisWeek = Math.min(
      friend.weeks.find((w) => w.weekStart === currentWeekStart)?.days ?? 0,
      WEEKLY_TARGET_DAYS
    );
    return {
      friendUserId: friend.friendUserId,
      bonusWeekStarts,
      bonusStreak,
      thisWeekCombinedDays: myThisWeek + friendThisWeek,
    };
  });
}

export function flattenTeamBonusWeeks(summaries: FriendBonusSummary[]): string[] {
  return summaries.flatMap((s) => s.bonusWeekStarts);
}

export function maxTeamBonusStreak(summaries: FriendBonusSummary[]): number {
  return summaries.reduce((max, s) => Math.max(max, s.bonusStreak), 0);
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/__tests__/friendGamification.test.ts`
Expected: PASS, every `it` block green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/friendGamification.ts src/__tests__/friendGamification.test.ts
git commit -m "$(cat <<'EOF'
Add multi-friend bonus math

Each friendship's bonus weeks/streak is computed independently by
reusing computeTeamBonusWeeks/weeksStreak once per friend — no new
qualifying logic. flattenTeamBonusWeeks intentionally keeps
duplicates (matching two friends the same week is two independent
bonuses), and maxTeamBonusStreak takes the best single friendship's
streak rather than summing or unioning across friends, per the design
decision that each team bonus is independent from the others.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 4: Supabase I/O — `src/lib/friendsData.ts`

**Files:**
- Create: `src/lib/friendsData.ts`
- Create: `src/__tests__/friendsData.test.ts`

**Interfaces:**
- Consumes: `supabase` client from `src/lib/supabase.ts`.
- Produces (consumed by Task 5, Task 6):
  - `type Friend = { friendUserId: string; friendEmail: string; friendedAt: string }`
  - `type FriendInvite = { code: string; expiresAt: string }`
  - `createFriendInvite(): Promise<FriendInvite>`
  - `redeemFriendInvite(code: string): Promise<{ friendUserId: string }>`
  - `fetchMyFriends(): Promise<Friend[]>`
  - `removeFriendship(friendUserId: string): Promise<void>`

- [ ] **Step 1: Write the failing test file**

```typescript
// src/__tests__/friendsData.test.ts
import {
  createFriendInvite,
  redeemFriendInvite,
  fetchMyFriends,
  removeFriendship,
} from '../lib/friendsData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createFriendInvite', () => {
  it('calls the create_friend_invite RPC and maps the result', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ code: 'ABCD2345', expires_at: '2026-08-12T00:00:00Z' }],
      error: null,
    });

    const result = await createFriendInvite();

    expect(supabase.rpc).toHaveBeenCalledWith('create_friend_invite');
    expect(result).toEqual({ code: 'ABCD2345', expiresAt: '2026-08-12T00:00:00Z' });
  });

  it('throws on a Supabase error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('boom') });
    await expect(createFriendInvite()).rejects.toThrow('boom');
  });
});

describe('redeemFriendInvite', () => {
  it('calls the redeem_friend_invite RPC with the code and maps the result', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ friend_user_id: 'user-1' }],
      error: null,
    });

    const result = await redeemFriendInvite('ABCD2345');

    expect(supabase.rpc).toHaveBeenCalledWith('redeem_friend_invite', { invite_code: 'ABCD2345' });
    expect(result).toEqual({ friendUserId: 'user-1' });
  });

  it('throws on a Supabase error (e.g. invalid code)', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('Code invalide ou expiré') });
    await expect(redeemFriendInvite('bad')).rejects.toThrow('Code invalide ou expiré');
  });
});

describe('fetchMyFriends', () => {
  it('calls list_my_friends and maps rows to Friend', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        { friend_user_id: 'user-1', friend_email: 'a@example.com', friended_at: '2026-08-01T00:00:00Z' },
      ],
      error: null,
    });

    const result = await fetchMyFriends();

    expect(supabase.rpc).toHaveBeenCalledWith('list_my_friends');
    expect(result).toEqual([
      { friendUserId: 'user-1', friendEmail: 'a@example.com', friendedAt: '2026-08-01T00:00:00Z' },
    ]);
  });

  it('throws on a Supabase error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('boom') });
    await expect(fetchMyFriends()).rejects.toThrow('boom');
  });
});

describe('removeFriendship', () => {
  it('deletes the friendship row matching the given friend', async () => {
    const or = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ or });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await removeFriendship('user-2');

    expect(supabase.from).toHaveBeenCalledWith('friendships');
    expect(or).toHaveBeenCalledWith('user_id_a.eq.user-2,user_id_b.eq.user-2');
  });

  it('throws on a Supabase error', async () => {
    const or = jest.fn().mockResolvedValue({ error: new Error('boom') });
    const del = jest.fn().mockReturnValue({ or });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await expect(removeFriendship('user-2')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/friendsData.test.ts`
Expected: FAIL — `Cannot find module '../lib/friendsData'`.

- [ ] **Step 3: Implement the module**

```typescript
// src/lib/friendsData.ts
import { supabase } from './supabase';

export type Friend = {
  friendUserId: string;
  friendEmail: string;
  friendedAt: string;
};

export type FriendInvite = {
  code: string;
  expiresAt: string;
};

function firstRow<T>(data: T[] | T | null): T {
  return Array.isArray(data) ? data[0] : (data as T);
}

export async function createFriendInvite(): Promise<FriendInvite> {
  const { data, error } = await supabase.rpc('create_friend_invite');
  if (error) throw error;
  const row = firstRow<any>(data);
  return { code: row.code, expiresAt: row.expires_at };
}

export async function redeemFriendInvite(code: string): Promise<{ friendUserId: string }> {
  const { data, error } = await supabase.rpc('redeem_friend_invite', { invite_code: code });
  if (error) throw error;
  const row = firstRow<any>(data);
  return { friendUserId: row.friend_user_id };
}

export async function fetchMyFriends(): Promise<Friend[]> {
  const { data, error } = await supabase.rpc('list_my_friends');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    friendUserId: row.friend_user_id,
    friendEmail: row.friend_email,
    friendedAt: row.friended_at,
  }));
}

export async function removeFriendship(friendUserId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`user_id_a.eq.${friendUserId},user_id_b.eq.${friendUserId}`);
  if (error) throw error;
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/__tests__/friendsData.test.ts`
Expected: PASS, every `it` block green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/friendsData.ts src/__tests__/friendsData.test.ts
git commit -m "$(cat <<'EOF'
Add Supabase I/O for the friend system

Thin wrappers around the three new RPCs and the friendships table's
delete path — no business logic. removeFriendship relies on RLS
(scoped to rows where the caller is user_id_a or user_id_b) plus an
.or() filter on the target friend's id to uniquely identify the pair
without needing to know its a/b ordering client-side.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 5: Shared loader — `src/lib/loadGamificationStats.ts`

**Files:**
- Create: `src/lib/loadGamificationStats.ts`
- Create: `src/__tests__/loadGamificationStats.test.ts`

**Interfaces:**
- Consumes: `fetchMyCompletions`, `fetchTeamWeekProgress` from
  `src/lib/workoutCompletionsData.ts`; `fetchMyFriends`, `type Friend`
  from `src/lib/friendsData.ts` (Task 4); `groupByWeek`, `computeStats`,
  `weeksForFriend`, `type GamificationStats` from
  `src/lib/workoutGamification.ts` (Task 2); `computeFriendBonuses`,
  `flattenTeamBonusWeeks`, `maxTeamBonusStreak`, `type
  FriendBonusSummary` from `src/lib/friendGamification.ts` (Task 3).
- Produces (consumed by Task 6, Task 7):
  - `type GamificationLoadResult = { stats: GamificationStats; friendBonuses: FriendBonusSummary[]; friends: Friend[]; friendsError: string | null }`
  - `loadGamificationStats(userId: string, todayStr: string): Promise<GamificationLoadResult>`

- [ ] **Step 1: Write the failing test file**

```typescript
// src/__tests__/loadGamificationStats.test.ts
import { loadGamificationStats } from '../lib/loadGamificationStats';
import { fetchMyCompletions, fetchTeamWeekProgress } from '../lib/workoutCompletionsData';
import { fetchMyFriends } from '../lib/friendsData';

jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
  fetchTeamWeekProgress: jest.fn(),
}));

jest.mock('../lib/friendsData', () => ({
  fetchMyFriends: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loadGamificationStats', () => {
  it('combines my completions with each friend’s independent bonus', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
      { id: 'c3', sessionIndex: 2, completedDate: '2026-08-05' },
    ]);
    (fetchMyFriends as jest.Mock).mockResolvedValue([
      { friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' },
    ]);
    (fetchTeamWeekProgress as jest.Mock).mockResolvedValue([
      { userId: 'friend-a', weekStart: '2026-08-03', days: 3 },
    ]);

    const result = await loadGamificationStats('me', '2026-08-05');

    expect(result.friendsError).toBeNull();
    expect(result.friends).toEqual([
      { friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' },
    ]);
    expect(result.friendBonuses).toEqual([
      {
        friendUserId: 'friend-a',
        bonusWeekStarts: ['2026-08-03'],
        bonusStreak: 1,
        thisWeekCombinedDays: 6,
      },
    ]);
    // 3 completions * 10 + 1 weekly target * 20 + 1 team bonus week * 15 = 65
    expect(result.stats.totalPoints).toBe(65);
    expect(result.stats.teamBonusStreak).toBe(1);
  });

  it('still returns personal stats when the friends fetch fails', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
    ]);
    (fetchMyFriends as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await loadGamificationStats('me', '2026-08-05');

    expect(result.friendsError).not.toBeNull();
    expect(result.friends).toEqual([]);
    expect(result.friendBonuses).toEqual([]);
    expect(result.stats.totalCompletions).toBe(1);
    expect(result.stats.totalPoints).toBe(10);
  });

  it('propagates a fetchMyCompletions failure to the caller', async () => {
    (fetchMyCompletions as jest.Mock).mockRejectedValue(new Error('completions down'));
    await expect(loadGamificationStats('me', '2026-08-05')).rejects.toThrow('completions down');
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/loadGamificationStats.test.ts`
Expected: FAIL — `Cannot find module '../lib/loadGamificationStats'`.

- [ ] **Step 3: Implement the module**

```typescript
// src/lib/loadGamificationStats.ts
import { fetchMyCompletions, fetchTeamWeekProgress } from './workoutCompletionsData';
import { fetchMyFriends, type Friend } from './friendsData';
import { groupByWeek, computeStats, weeksForFriend, type GamificationStats } from './workoutGamification';
import {
  computeFriendBonuses,
  flattenTeamBonusWeeks,
  maxTeamBonusStreak,
  type FriendBonusSummary,
} from './friendGamification';

export type GamificationLoadResult = {
  stats: GamificationStats;
  friendBonuses: FriendBonusSummary[];
  friends: Friend[];
  friendsError: string | null;
};

export async function loadGamificationStats(userId: string, todayStr: string): Promise<GamificationLoadResult> {
  const myCompletions = await fetchMyCompletions(userId);
  const myWeeks = groupByWeek(myCompletions);

  let friends: Friend[] = [];
  let friendBonuses: FriendBonusSummary[] = [];
  let friendsError: string | null = null;

  try {
    friends = await fetchMyFriends();
    const teamRows = await fetchTeamWeekProgress();
    friendBonuses = computeFriendBonuses(
      myWeeks,
      friends.map((f) => ({ friendUserId: f.friendUserId, weeks: weeksForFriend(teamRows, f.friendUserId) })),
      todayStr
    );
  } catch {
    friendsError = 'Impossible de charger tes amis.';
  }

  const teamBonusWeekStarts = flattenTeamBonusWeeks(friendBonuses);
  const teamBonusStreak = maxTeamBonusStreak(friendBonuses);
  const stats = computeStats(myCompletions, teamBonusWeekStarts, teamBonusStreak, todayStr);

  return { stats, friendBonuses, friends, friendsError };
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/__tests__/loadGamificationStats.test.ts`
Expected: PASS, every `it` block green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/loadGamificationStats.ts src/__tests__/loadGamificationStats.test.ts
git commit -m "$(cat <<'EOF'
Add the shared gamification loader

home.tsx and progression.tsx previously each fetched completions and
computed GamificationStats independently, which the previous
feature's final review flagged as a risk of the two screens silently
disagreeing. Introducing per-friend data makes that duplication
meaningfully worse, so this is the one place both screens now call:
fetch completions (propagates failure — no gamification card without
it), then friends + team rows in their own try/catch (failure
degrades to personal-only stats, never blocks the rest).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 6: Friends screen — `src/app/friends.tsx`

**Files:**
- Create: `src/app/friends.tsx`
- Create: `src/__tests__/friends-screen.test.tsx`
- Modify: `package.json` (add `expo-clipboard`)

**Interfaces:**
- Consumes: `fetchMyFriends`, `createFriendInvite`, `redeemFriendInvite`,
  `removeFriendship`, `type Friend` from `src/lib/friendsData.ts` (Task
  4).
- Produces: nothing — leaf screen.

- [ ] **Step 1: Add the `expo-clipboard` dependency**

Run: `npx expo install expo-clipboard`

This resolves and installs the version compatible with this project's
Expo SDK (`~57.0.7`) automatically, the same way every other Expo module
in this project's `package.json` was added.

- [ ] **Step 2: Write the failing test file**

```tsx
// src/__tests__/friends-screen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FriendsScreen from '../app/friends';
import { useAuth } from '../lib/auth-context';
import { fetchMyFriends, createFriendInvite, redeemFriendInvite, removeFriendship } from '../lib/friendsData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/friendsData', () => ({
  fetchMyFriends: jest.fn(),
  createFriendInvite: jest.fn(),
  redeemFriendInvite: jest.fn(),
  removeFriendship: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('FriendsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1' } },
      loading: false,
    });
  });

  it('lists existing friends and lets you remove one', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([
      { friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' },
    ]);
    (removeFriendship as jest.Mock).mockResolvedValue(undefined);

    const { findByText, getByText, queryByText } = await render(<FriendsScreen />);

    await findByText('a@example.com');
    await fireEvent.press(getByText('Retirer'));

    await waitFor(() => expect(removeFriendship).toHaveBeenCalledWith('friend-a'));
    expect(queryByText('a@example.com')).toBeNull();
  });

  it('shows an empty state with no friends yet', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([]);
    const { findByText } = await render(<FriendsScreen />);
    expect(await findByText("Tu n'as pas encore d'ami d'entraînement.")).toBeTruthy();
  });

  it('generates an invite code and shows share/copy actions', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([]);
    (createFriendInvite as jest.Mock).mockResolvedValue({ code: 'ABCD2345', expiresAt: '2026-08-12T00:00:00Z' });

    const { findByText, getByText } = await render(<FriendsScreen />);
    await findByText("Tu n'as pas encore d'ami d'entraînement.");

    await fireEvent.press(getByText('Générer un code'));

    expect(await findByText('ABCD2345')).toBeTruthy();
    expect(getByText('Partager')).toBeTruthy();
    expect(getByText('Copier')).toBeTruthy();
  });

  it('redeems a code and refreshes the friend list', async () => {
    (fetchMyFriends as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { friendUserId: 'friend-b', friendEmail: 'b@example.com', friendedAt: '2026-08-05T00:00:00Z' },
      ]);
    (redeemFriendInvite as jest.Mock).mockResolvedValue({ friendUserId: 'friend-b' });

    const { findByText, getByText, getByTestId } = await render(<FriendsScreen />);
    await findByText("Tu n'as pas encore d'ami d'entraînement.");

    fireEvent.changeText(getByTestId('redeem-code-input'), 'WXYZ6789');
    await fireEvent.press(getByText('Valider'));

    await waitFor(() => expect(redeemFriendInvite).toHaveBeenCalledWith('WXYZ6789'));
    expect(await findByText('b@example.com')).toBeTruthy();
  });

  it('shows an inline error when a code is invalid', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([]);
    (redeemFriendInvite as jest.Mock).mockRejectedValue(new Error('Code invalide ou expiré'));

    const { findByText, getByText, getByTestId } = await render(<FriendsScreen />);
    await findByText("Tu n'as pas encore d'ami d'entraînement.");

    fireEvent.changeText(getByTestId('redeem-code-input'), 'BADCODE1');
    await fireEvent.press(getByText('Valider'));

    expect(await findByText('Code invalide ou expiré')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the test file to verify it fails**

Run: `npx jest src/__tests__/friends-screen.test.tsx`
Expected: FAIL — `Cannot find module '../app/friends'`.

- [ ] **Step 4: Implement the screen**

```tsx
// src/app/friends.tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import {
  fetchMyFriends,
  createFriendInvite,
  redeemFriendInvite,
  removeFriendship,
  type Friend,
  type FriendInvite,
} from '../lib/friendsData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PressableScale } from '../components/ui/PressableScale';
import { TextField } from '../components/ui/TextField';
import {
  centeredContent,
  radius,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../theme/tokens';

export default function FriendsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [invite, setInvite] = useState<FriendInvite | null>(null);
  const [generating, setGenerating] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const list = await fetchMyFriends();
      setFriends(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleGenerateInvite = async () => {
    setGenerating(true);
    setInviteError(null);
    try {
      const result = await createFriendInvite();
      setInvite(result);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Erreur lors de la création du code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareInvite = async () => {
    if (!invite) return;
    await Share.share({
      message: `Rejoins-moi sur FitPro ! Utilise ce code pour devenir mon ami d'entraînement : ${invite.code}`,
    });
  };

  const handleCopyInvite = async () => {
    if (!invite) return;
    await Clipboard.setStringAsync(invite.code);
  };

  const handleRedeem = async () => {
    const trimmed = redeemCode.trim();
    if (!trimmed) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      await redeemFriendInvite(trimmed);
      setRedeemCode('');
      await load();
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Erreur lors de la validation du code.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleRemove = async (friendUserId: string) => {
    const previous = friends;
    setFriends(friends.filter((f) => f.friendUserId !== friendUserId));
    setRemovingId(friendUserId);
    setError(null);
    try {
      await removeFriendship(friendUserId);
    } catch (err) {
      setFriends(previous);
      setError(err instanceof Error ? err.message : "Erreur lors du retrait de l'ami.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.title}>Mes amis</Text>

      <Card style={styles.friendsCard}>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>Tu n'as pas encore d'ami d'entraînement.</Text>
        ) : (
          friends.map((friend, index) => (
            <View
              key={friend.friendUserId}
              style={[styles.friendRow, index === friends.length - 1 && styles.friendRowLast]}
            >
              <Text style={styles.friendEmail}>{friend.friendEmail}</Text>
              <PressableScale
                onPress={() => handleRemove(friend.friendUserId)}
                disabled={removingId === friend.friendUserId}
                accessibilityRole="button"
                accessibilityState={{ disabled: removingId === friend.friendUserId }}
                style={styles.removeTouchable}
              >
                <Text style={styles.removeLink}>Retirer</Text>
              </PressableScale>
            </View>
          ))
        )}
      </Card>

      <Text style={styles.sectionLabel}>Inviter quelqu'un</Text>
      <Card style={styles.inviteCard}>
        {invite ? (
          <>
            <Text style={styles.inviteCode}>{invite.code}</Text>
            <View style={styles.inviteActions}>
              <View style={styles.inviteActionButton}>
                <Button title="Partager" onPress={handleShareInvite} />
              </View>
              <View style={styles.inviteActionButton}>
                <Button title="Copier" variant="secondary" onPress={handleCopyInvite} />
              </View>
            </View>
          </>
        ) : (
          <Button title="Générer un code" onPress={handleGenerateInvite} loading={generating} />
        )}
        {inviteError && <Text style={styles.error}>{inviteError}</Text>}
      </Card>

      <Text style={styles.sectionLabel}>J'ai un code</Text>
      <Card style={styles.redeemCard}>
        <TextField
          value={redeemCode}
          onChangeText={setRedeemCode}
          placeholder="Code à 8 caractères"
          autoCapitalize="characters"
          testID="redeem-code-input"
        />
        {redeemError && <Text style={styles.error}>{redeemError}</Text>}
        <Button title="Valider" onPress={handleRedeem} loading={redeeming} />
      </Card>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
    sectionLabel: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    friendsCard: {},
    emptyText: { ...typography.body, color: colors.textSecondary },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    friendRowLast: { borderBottomWidth: 0 },
    friendEmail: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
    removeTouchable: {
      minHeight: state.minTouchSize,
      paddingHorizontal: spacing.sm,
      justifyContent: 'center',
    },
    removeLink: { ...typography.caption, color: colors.accentRedDeep },
    inviteCard: {},
    inviteCode: {
      ...typography.metric,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
      letterSpacing: 2,
    },
    inviteActions: { flexDirection: 'row', gap: spacing.sm },
    inviteActionButton: { flex: 1 },
    redeemCard: {},
  });
}
```

- [ ] **Step 5: Run the test file to verify it passes**

Run: `npx jest src/__tests__/friends-screen.test.tsx`
Expected: PASS, every `it` block green.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from `friends.tsx` (pre-existing Jest-typings
errors on test files are out of scope, already confirmed pre-existing by
prior work on this project).

- [ ] **Step 7: Manual verification (scoped to what's checkable without logging in)**

Run: `npx expo start --web`. Reaching `/friends` requires an authenticated
session, which cannot be verified in this environment (see Global
Constraints). Confirm instead: Metro bundles with zero console errors,
and the file has no unresolved import (a bundling failure would surface
here even without logging in).

- [ ] **Step 8: Commit**

```bash
git add src/app/friends.tsx src/__tests__/friends-screen.test.tsx package.json package-lock.json
git commit -m "$(cat <<'EOF'
Add the friends management screen

List existing friends with a remove action, generate a shareable
invite code (native Share sheet + clipboard copy), and redeem a code
someone else shared. Errors surface inline in French; removing a
friend is optimistic with rollback on failure, matching the pattern
already used for the workout-completion toggle.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 7: Rewire Home to use the shared loader

**Files:**
- Modify: `src/app/(tabs)/home.tsx`
- Modify: `src/__tests__/home-progression-card.test.tsx`

**Interfaces:**
- Consumes: `loadGamificationStats` from
  `src/lib/loadGamificationStats.ts` (Task 5).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Update the test file's mocks and one assertion**

In `src/__tests__/home-progression-card.test.tsx`, change:

```typescript
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
```

to:

```typescript
import { loadGamificationStats } from '../lib/loadGamificationStats';
```

Change:

```typescript
jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
}));
```

to:

```typescript
jest.mock('../lib/loadGamificationStats', () => ({
  loadGamificationStats: jest.fn(),
}));
```

In the first `it` block, change:

```typescript
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
    ]);
```

to:

```typescript
    (loadGamificationStats as jest.Mock).mockResolvedValue({
      stats: {
        totalCompletions: 2,
        streak: 0,
        thisWeekDays: 2,
        totalPoints: 20,
        level: 1,
        teamBonusCount: 0,
        teamBonusStreak: 0,
      },
      friendBonuses: [],
      friends: [],
      friendsError: null,
    });
```

In the second `it` block, change:

```typescript
    (fetchMyCompletions as jest.Mock).mockRejectedValue(new Error('network'));
```

to:

```typescript
    (loadGamificationStats as jest.Mock).mockRejectedValue(new Error('network'));
```

Every other line in this file (the `useAuth`/`profile`/`mealPlanData`
mocks, both test names, `fireEvent.press`/`mockPush` assertions) stays
exactly as-is.

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/home-progression-card.test.tsx`
Expected: FAIL — `home.tsx` still imports `fetchMyCompletions`/
`computeStats` directly, not `loadGamificationStats`, so the mock is
never hit and the real (unmocked) Supabase call fails.

- [ ] **Step 3: Update `home.tsx`**

Change:

```typescript
import { fetchMyCompletions } from '../../lib/workoutCompletionsData';
import { computeStats, type GamificationStats } from '../../lib/workoutGamification';
```

to:

```typescript
import { loadGamificationStats } from '../../lib/loadGamificationStats';
import type { GamificationStats } from '../../lib/workoutGamification';
```

Change:

```typescript
    // La gamification est un bonus par-dessus l'accueil : elle est chargée
    // hors du Promise.all ci-dessus pour qu'un échec ici ne fasse pas
    // disparaître les macros et les repas du jour, qui ne dépendent pas
    // d'elle. En cas d'échec, la carte Progression ne s'affiche simplement pas.
    try {
      const myCompletions = await fetchMyCompletions(userId);
      // Bonus d'équipe volontairement désactivé : sans système de binôme
      // (demande d'ami), on ne sait pas qui est le partenaire, et n'importe
      // quel autre compte serait compté comme tel. Réactivable en repassant
      // les semaines bonus ici une fois ce système en place.
      setGamification(computeStats(myCompletions, [], new Date().toISOString().slice(0, 10)));
    } catch {
      // Pas de carte Progression plutôt qu'un accueil vide.
    }
```

to:

```typescript
    // La gamification est un bonus par-dessus l'accueil : elle est chargée
    // hors du Promise.all ci-dessus pour qu'un échec ici ne fasse pas
    // disparaître les macros et les repas du jour, qui ne dépendent pas
    // d'elle. En cas d'échec, la carte Progression ne s'affiche simplement pas.
    try {
      const { stats } = await loadGamificationStats(userId, new Date().toISOString().slice(0, 10));
      setGamification(stats);
    } catch {
      // Pas de carte Progression plutôt qu'un accueil vide.
    }
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/__tests__/home-progression-card.test.tsx`
Expected: PASS, both `it` blocks green.

- [ ] **Step 5: Run the full suite to check for regressions**

Run: `npx jest "meal-workout-planner/src/__tests__"`
Expected: all suites pass — this task only touches `home.tsx` and its
own test file, so nothing else should be affected.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from `home.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(tabs\)/home.tsx src/__tests__/home-progression-card.test.tsx
git commit -m "$(cat <<'EOF'
Rewire Home to use the shared gamification loader

Same isolation behavior as before (a gamification failure never
blanks macros or today's meals) — just sourced from
loadGamificationStats instead of a second, independent
fetch-and-compute copy, so Home and Progression can no longer drift
apart on the same underlying data.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 8: Rewire Progression to use the shared loader and show the friend bonus list

**Files:**
- Modify: `src/app/progression.tsx`
- Modify: `src/__tests__/progression-screen.test.tsx`

**Interfaces:**
- Consumes: `loadGamificationStats` from
  `src/lib/loadGamificationStats.ts` (Task 5); `type FriendBonusSummary`
  from `src/lib/friendGamification.ts` (Task 3); `PressableScale` from
  `src/components/ui/PressableScale.tsx`; expo-router's `router`.
- Produces: nothing — terminal screen.

- [ ] **Step 1: Update the test file's mocks and add friend-bonus coverage**

In `src/__tests__/progression-screen.test.tsx`, change:

```typescript
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
```

to:

```typescript
import { loadGamificationStats } from '../lib/loadGamificationStats';
```

Change:

```typescript
jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
}));
```

to:

```typescript
jest.mock('../lib/loadGamificationStats', () => ({
  loadGamificationStats: jest.fn(),
}));

const mockPush = jest.fn();
```

Change the existing `jest.mock('expo-router', ...)` block:

```typescript
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));
```

to:

```typescript
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));
```

Replace the first `it` block's mock and assertions:

```typescript
  it('shows streak, level, points, this-week progress and all seven badge labels', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
      { id: 'c3', sessionIndex: 2, completedDate: '2026-08-05' },
    ]);

    const { findByText, getByText, queryByText } = await render(<ProgressionScreen />);

    expect(await findByText('3/3 séances cette semaine')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();
    expect(getByText('🔥 1')).toBeTruthy();
    // 3 séances x 10 pts + 20 pts d'objectif hebdo atteint, sans bonus d'équipe.
    expect(getByText('50')).toBeTruthy();

    // Le bonus d'équipe est désactivé tant qu'il n'y a pas de vrai système de
    // binôme : la section ne doit plus être rendue du tout.
    expect(queryByText("Bonus d'équipe")).toBeNull();

    for (const label of [
      'Première séance',
      'Habitué',
      'Vétéran',
      'Un mois sans faute',
      'Sur la durée',
      "Esprit d'équipe",
      'Duo en or',
    ]) {
      expect(getByText(label)).toBeTruthy();
    }
  });
```

with:

```typescript
  it('shows streak, level, points, this-week progress, per-friend bonuses and all seven badge labels', async () => {
    (loadGamificationStats as jest.Mock).mockResolvedValue({
      stats: {
        totalCompletions: 3,
        streak: 1,
        thisWeekDays: 3,
        totalPoints: 50,
        level: 1,
        teamBonusCount: 0,
        teamBonusStreak: 0,
      },
      friendBonuses: [
        { friendUserId: 'friend-a', bonusWeekStarts: [], bonusStreak: 0, thisWeekCombinedDays: 5 },
      ],
      friends: [{ friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' }],
      friendsError: null,
    });

    const { findByText, getByText } = await render(<ProgressionScreen />);

    expect(await findByText('3/3 séances cette semaine')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();
    expect(getByText('🔥 1')).toBeTruthy();
    expect(getByText('50')).toBeTruthy();

    expect(getByText("Bonus d'équipe")).toBeTruthy();
    expect(getByText('Avec a@example.com : 5/6 cette semaine — bonus à 6/6')).toBeTruthy();

    for (const label of [
      'Première séance',
      'Habitué',
      'Vétéran',
      'Un mois sans faute',
      'Sur la durée',
      "Esprit d'équipe",
      'Duo en or',
    ]) {
      expect(getByText(label)).toBeTruthy();
    }
  });

  it('navigates to /friends when the bonus d’équipe section is pressed', async () => {
    (loadGamificationStats as jest.Mock).mockResolvedValue({
      stats: {
        totalCompletions: 0,
        streak: 0,
        thisWeekDays: 0,
        totalPoints: 0,
        level: 1,
        teamBonusCount: 0,
        teamBonusStreak: 0,
      },
      friendBonuses: [],
      friends: [],
      friendsError: null,
    });

    const { findByText, getByText } = await render(<ProgressionScreen />);
    await findByText('Gérer mes amis');

    await fireEvent.press(getByText('Gérer mes amis'));
    expect(mockPush).toHaveBeenCalledWith('/friends');
  });
```

This second new test needs `fireEvent` imported — change the file's
import line:

```typescript
import { render } from '@testing-library/react-native';
```

to:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
```

Replace the remaining two `it` blocks' mocks (leave their assertions
otherwise untouched):

```typescript
  it('renders an empty-but-valid state when there are no completions yet', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([]);
```

to:

```typescript
  it('renders an empty-but-valid state when there are no completions yet', async () => {
    (loadGamificationStats as jest.Mock).mockResolvedValue({
      stats: {
        totalCompletions: 0,
        streak: 0,
        thisWeekDays: 0,
        totalPoints: 0,
        level: 1,
        teamBonusCount: 0,
        teamBonusStreak: 0,
      },
      friendBonuses: [],
      friends: [],
      friendsError: null,
    });
```

and:

```typescript
  it('surfaces an error when the completions fetch fails', async () => {
    (fetchMyCompletions as jest.Mock).mockRejectedValue(new Error('network'));
```

to:

```typescript
  it('surfaces an error when the completions fetch fails', async () => {
    (loadGamificationStats as jest.Mock).mockRejectedValue(new Error('network'));
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/progression-screen.test.tsx`
Expected: FAIL — `progression.tsx` doesn't call `loadGamificationStats`
or render a friend-bonus section yet.

- [ ] **Step 3: Update `progression.tsx`**

Change:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
import { computeStats, type GamificationStats } from '../lib/workoutGamification';
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import { Card } from '../components/ui/Card';
```

to:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { loadGamificationStats } from '../lib/loadGamificationStats';
import type { GamificationStats } from '../lib/workoutGamification';
import type { FriendBonusSummary } from '../lib/friendGamification';
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import { Card } from '../components/ui/Card';
import { PressableScale } from '../components/ui/PressableScale';
```

Change:

```tsx
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const myCompletions = await fetchMyCompletions(session.user.id);
      const today = new Date().toISOString().slice(0, 10);
      // Bonus d'équipe volontairement désactivé : sans système de binôme
      // (demande d'ami), n'importe quel autre compte serait compté comme
      // partenaire. Les badges « Esprit d'équipe » et « Duo en or » restent
      // donc verrouillés jusqu'à ce que ce système existe.
      setStats(computeStats(myCompletions, [], today));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setChecking(false);
    }
  }, [session]);
```

to:

```tsx
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [friendBonuses, setFriendBonuses] = useState<FriendBonusSummary[]>([]);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await loadGamificationStats(session.user.id, today);
      setStats(result.stats);
      setFriendBonuses(result.friendBonuses);
      setFriendsError(result.friendsError);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setChecking(false);
    }
  }, [session]);
```

Change the JSX, replacing the block between the "Cette semaine" `Card`
and the "Badges" section label:

```tsx
      <Text style={styles.sectionLabel}>Cette semaine</Text>
      <Card style={styles.weekCard}>
        <View style={styles.dayDotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dayDot, i < stats.thisWeekDays && styles.dayDotDone]} />
          ))}
        </View>
        <Text style={styles.weekText}>{stats.thisWeekDays}/3 séances cette semaine</Text>
      </Card>

      <Text style={styles.sectionLabel}>Badges</Text>
```

to:

```tsx
      <Text style={styles.sectionLabel}>Cette semaine</Text>
      <Card style={styles.weekCard}>
        <View style={styles.dayDotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dayDot, i < stats.thisWeekDays && styles.dayDotDone]} />
          ))}
        </View>
        <Text style={styles.weekText}>{stats.thisWeekDays}/3 séances cette semaine</Text>
      </Card>

      <Text style={styles.sectionLabel}>Bonus d'équipe</Text>
      <PressableScale onPress={() => router.push('/friends')} accessibilityRole="button">
        <Card style={styles.teamCard}>
          {friendsError ? (
            <Text style={styles.teamError}>{friendsError}</Text>
          ) : friendBonuses.length === 0 ? (
            <Text style={styles.teamText}>Ajoute un ami pour débloquer le bonus d'équipe.</Text>
          ) : (
            friendBonuses.map((friend) => (
              <Text key={friend.friendUserId} style={styles.teamText}>
                Avec {friendEmailById.get(friend.friendUserId) ?? 'ton ami'} : {friend.thisWeekCombinedDays}/6 cette
                semaine — bonus à 6/6
              </Text>
            ))
          )}
          <Text style={styles.teamManageLink}>Gérer mes amis</Text>
        </Card>
      </PressableScale>

      <Text style={styles.sectionLabel}>Badges</Text>
```

This JSX references `friendEmailById`, which needs building from the
`friends` list. Add, right after `setFriendsError(result.friendsError);`
in `load`:

```tsx
      setFriendEmailById(new Map(result.friends.map((f) => [f.friendUserId, f.friendEmail])));
```

and add the backing state next to the other `useState` calls:

```tsx
  const [friendEmailById, setFriendEmailById] = useState<Map<string, string>>(new Map());
```

- [ ] **Step 4: Add the new styles**

Inside `createStyles`, right after the existing `weekText` entry, add:

```typescript
    teamCard: {},
    teamText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
    teamError: { ...typography.body, color: colors.textTertiary, marginBottom: spacing.xs },
    teamManageLink: { ...typography.caption, color: colors.accentRedDeep, marginTop: spacing.xs },
```

- [ ] **Step 5: Run the test file to verify it passes**

Run: `npx jest src/__tests__/progression-screen.test.tsx`
Expected: PASS, all four `it` blocks green.

- [ ] **Step 6: Run the full suite to check for regressions**

Run: `npx jest "meal-workout-planner/src/__tests__"`
Expected: all suites pass.

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from `progression.tsx`.

- [ ] **Step 8: Manual verification (scoped to what's checkable without logging in)**

Run: `npx expo start --web`. As with Task 6, reaching this authenticated
screen isn't possible here — confirm Metro bundles cleanly with zero
console errors instead.

- [ ] **Step 9: Commit**

```bash
git add src/app/progression.tsx src/__tests__/progression-screen.test.tsx
git commit -m "$(cat <<'EOF'
Rewire Progression to use the shared loader and show per-friend bonuses

The team-bonus section returns, now listing each friend independently
("Avec <email> : X/6 cette semaine") instead of assuming a single
binôme, sourced from the same loadGamificationStats call Home uses.
The whole section links through to /friends for management, matching
the Home-card-links-to-detail-screen pattern already used elsewhere.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

## Self-Review Notes

**Spec coverage:** invite-code tables + RPCs → Task 1. Removing
`partnerWeeks`/adding `weeksForFriend`/`computeStats` signature change →
Task 2. Independent per-friendship bonus math → Task 3. Friend I/O →
Task 4. The shared-loader fix for the Home/Progression duplication risk
→ Task 5. Friends screen (list, generate+share+copy code, redeem code) →
Task 6. Both consuming screens rewired, including the returning
per-friend "Bonus d'équipe" section and its link to `/friends` → Task 7,
Task 8.

**Placeholder scan:** none found — every step carries real code, real
SQL, or a concrete verification command.

**Type consistency:** `Friend`, `FriendInvite` defined once in Task 4;
`FriendInput`, `FriendBonusSummary` defined once in Task 3;
`GamificationLoadResult` defined once in Task 5 — all imported by name
everywhere else, no renamed duplicates. `computeStats`'s new 4-argument
signature is used identically in Task 2's own tests, Task 5's loader,
and (transitively, through the loader) Tasks 7-8.

**A note on manual verification:** every UI task in this plan is
explicit that on-device/logged-in verification did not happen and
structurally cannot happen in this environment. This is not a gap the
plan can close — it's carried forward from the previous feature and
restated here (see Global Constraints) so it isn't silently dropped or
falsely implied as done.
