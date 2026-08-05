# Workout Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a streak/points/level/badges gamification layer to workout
consistency, with a cooperative team bonus between the app's two profiles,
built on a single raw completion log computed client-side.

**Architecture:** One new Supabase table (`workout_completions`) plus a
`security definer` RPC that exposes only a weekly aggregate (never raw rows)
for the other profile. All streak/points/level/badge/team-bonus logic is
pure TypeScript operating on the raw log — no stored aggregates, no SQL
triggers — mirroring the existing `weight_logs` → `progressTracking.ts`
pattern already in this codebase.

**Tech Stack:** Expo Router, React Native, Supabase (Postgres + RLS +
`security definer` RPC), Jest (`jest-expo` preset), TypeScript.

## Global Constraints

- Visual values (color, spacing, radius, typography, shadow) come only from
  `src/theme/tokens.ts` — zero hex codes, zero raw `fontSize`/`fontWeight`
  in any new or edited screen.
- Every tappable element gets a pressed state, a 44pt minimum touch target
  (`state.minTouchSize` / existing `Button`/`PressableScale` components
  already satisfy this), and an `accessibilityRole`.
- All new UI copy is in French and tutoies ("tu"/"ton"), matching every
  existing screen.
- The team bonus and badge copy stay strictly cooperative — no ranking, no
  "vs", no naming who is ahead.
- Every Postgres table/policy uses the project's existing convention:
  `auth.uid() = user_id` scoping, `references auth.users(id) on delete
  cascade`, policy names in the form `"Users can <verb> own <table>"`.
- `npx tsc --noEmit` and `npx jest` must be clean before any task is
  considered done.
- Do not queue an EAS/APK build as part of this work — verify UI tasks with
  `npx expo start --web` or Expo Go, per standing preference.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `supabase/migrations/0017_workout_gamification.sql` | New table, RLS policies, aggregate RPC |
| `src/lib/workoutGamification.ts` | Pure math: week grouping, streak, points, level, team-bonus weeks |
| `src/lib/workoutBadges.ts` | Badge config (label, description, medal image, unlock rule) + evaluator |
| `assets/images/badges/*.png` (×7) + `README.md` | Medal illustrations, one per badge |
| `src/lib/workoutCompletionsData.ts` | Supabase I/O: log/undo a completion, fetch history, fetch team aggregate |
| `src/app/(tabs)/workout.tsx` | Modified: completion button on the active session card |
| `src/app/(tabs)/home.tsx` | Modified: compact "Progression" card |
| `src/app/progression.tsx` | New: streak/level/points, this week, team bonus, badge grid |
| `src/__tests__/workoutGamification.test.ts` | Tests for the pure math module |
| `src/__tests__/workoutBadges.test.ts` | Tests for badge unlock rules |

This splits pure calculation from Supabase I/O into two files (rather than
the single file sketched in the design doc) to match this codebase's own
established convention for the sibling weight-tracking domain: I/O lives in
`weightLogData.ts`, pure math lives in `progressTracking.ts`. Same reasoning
applies here — no behavior change from the approved design, just a file
boundary that matches how the rest of `src/lib/` is already organized.

The design doc's `team_week_progress()` RPC is also widened from "current
week only" to "last N weeks, grouped," because the team-bonus **streak**
and the "Duo en or" badge both need multi-week history for the *other*
profile, and the whole point of this architecture is computing that
history client-side rather than storing a second aggregate table. The
function still returns counts only — never a raw completion row, never a
timestamp, never which session — so the minimal-disclosure principle from
the design doc is unchanged.

---

### Task 1: Database migration — `workout_completions` table + aggregate RPC

**Files:**
- Create: `supabase/migrations/0017_workout_gamification.sql`
- Test: manual verification via Supabase SQL (see Step 3), no jest test (schema-only change)

**Interfaces:**
- Produces: table `public.workout_completions(id, user_id, session_index, completed_at, completed_date)` with a `unique (user_id, session_index, completed_date)` constraint, and RPC `public.team_week_progress(weeks_back int default 26) returns table(user_id uuid, week_start date, days_that_week int)`, both of which Task 5 (`workoutCompletionsData.ts`) calls by exact name.

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration to the live project**

Use the Supabase MCP `apply_migration` tool with `project_id
xewpbovlhoxovaydpuzh`, `name: "workout_gamification"`, and the SQL from
Step 1 as `query`.

- [ ] **Step 3: Verify with a rolled-back transaction (no persisted side effects)**

Run via `execute_sql`:

```sql
begin;
insert into public.workout_completions (user_id, session_index, completed_at) values
  ((select id from auth.users limit 1), 0, now()),
  ((select id from auth.users limit 1), 1, now() - interval '1 day');
select * from public.team_week_progress();
select id, session_index, completed_date from public.workout_completions
  where user_id = (select id from auth.users limit 1);
rollback;
```

Expected: the `team_week_progress()` result contains one row for that
user's id with `days_that_week` matching the number of distinct days just
inserted (2), and the final `select` shows both inserted rows with a
correctly computed `completed_date`. Because the whole block is wrapped in
`begin`/`rollback`, nothing is left in the table afterward — confirm with
`select count(*) from public.workout_completions;` and expect `0`.

- [ ] **Step 4: Verify the unique constraint**

```sql
begin;
insert into public.workout_completions (user_id, session_index, completed_at) values
  ((select id from auth.users limit 1), 0, now());
insert into public.workout_completions (user_id, session_index, completed_at) values
  ((select id from auth.users limit 1), 0, now());
rollback;
```

Expected: the second insert fails with a unique-violation error (`23505`).
Rollback leaves the table untouched either way.

- [ ] **Step 5: Verify RLS policies are exactly as intended**

```sql
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'workout_completions'
order by cmd;
```

Expected: three rows — `"Users can delete own workout completions"` /
DELETE, `"Users can insert own workout completions"` / INSERT, `"Users can
select own workout completions"` / SELECT.

- [ ] **Step 6: Commit the migration file**

```bash
git add supabase/migrations/0017_workout_gamification.sql
git commit -m "$(cat <<'EOF'
Add workout_completions table and team_week_progress RPC

Raw completion log for the workout gamification system — streak,
points, level and badges are all computed client-side from this
table, matching the weight_logs + progressTracking.ts pattern already
used for weight trend. The RPC exposes only a per-week distinct-day
count per user, never raw rows, so the team bonus can compare the two
profiles without either seeing the other's session-level history.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 2: Pure gamification math — `src/lib/workoutGamification.ts`

**Files:**
- Create: `src/lib/workoutGamification.ts`
- Create: `src/__tests__/workoutGamification.test.ts`

**Interfaces:**
- Consumes: nothing (zero dependencies beyond plain JS `Date`).
- Produces (consumed by Task 4, Task 5, Task 6, Task 7, Task 8):
  - `type WorkoutCompletion = { sessionIndex: number; completedDate: string }`
  - `type WeekDayCount = { weekStart: string; days: number }`
  - `type TeamWeekRow = { userId: string; weekStart: string; days: number }`
  - `type GamificationStats = { totalCompletions: number; streak: number; thisWeekDays: number; totalPoints: number; level: number; teamBonusCount: number; teamBonusStreak: number }`
  - `getWeekStart(dateStr: string): string`
  - `groupByWeek(completions: WorkoutCompletion[]): WeekDayCount[]`
  - `calculateStreak(completions: WorkoutCompletion[], todayStr: string): { streak: number; thisWeekDays: number }`
  - `calculatePoints(completions: WorkoutCompletion[], teamBonusWeekStarts: string[]): number`
  - `calculateLevel(points: number): number`
  - `computeTeamBonusWeeks(myWeeks: WeekDayCount[], partnerWeeksList: WeekDayCount[]): string[]`
  - `partnerWeeks(teamRows: TeamWeekRow[], myUserId: string): WeekDayCount[]`
  - `computeStats(completions: WorkoutCompletion[], teamBonusWeekStarts: string[], todayStr: string): GamificationStats`

- [ ] **Step 1: Write the failing test file**

```typescript
// src/__tests__/workoutGamification.test.ts
import {
  getWeekStart,
  groupByWeek,
  calculateStreak,
  calculatePoints,
  calculateLevel,
  computeTeamBonusWeeks,
  partnerWeeks,
  computeStats,
  type WorkoutCompletion,
  type TeamWeekRow,
} from '../lib/workoutGamification';

describe('getWeekStart', () => {
  it('returns the Monday of the week containing the date', () => {
    expect(getWeekStart('2026-08-05')).toBe('2026-08-03'); // Wednesday -> Monday
    expect(getWeekStart('2026-08-03')).toBe('2026-08-03'); // Monday -> itself
    expect(getWeekStart('2026-08-09')).toBe('2026-08-03'); // Sunday -> previous Monday
  });
});

describe('groupByWeek', () => {
  it('counts distinct days per week, not distinct completions', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-03' }, // same day, different session
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    const weeks = groupByWeek(completions);
    expect(weeks).toEqual([{ weekStart: '2026-08-03', days: 2 }]);
  });

  it('splits completions across weeks', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 0, completedDate: '2026-08-03' },
    ];
    const weeks = groupByWeek(completions);
    expect(weeks).toEqual([
      { weekStart: '2026-07-27', days: 1 },
      { weekStart: '2026-08-03', days: 1 },
    ]);
  });
});

describe('calculateStreak', () => {
  it('breaks the streak on a week with fewer than 3 distinct days, counts only the elapsed run after the gap', () => {
    const completions: WorkoutCompletion[] = [
      // week 2026-07-06: 3 days (qualifies)
      { sessionIndex: 0, completedDate: '2026-07-06' },
      { sessionIndex: 1, completedDate: '2026-07-08' },
      { sessionIndex: 2, completedDate: '2026-07-10' },
      // week 2026-07-13: 3 days (qualifies)
      { sessionIndex: 0, completedDate: '2026-07-13' },
      { sessionIndex: 1, completedDate: '2026-07-15' },
      { sessionIndex: 2, completedDate: '2026-07-17' },
      // week 2026-07-20: only 1 day (gap)
      { sessionIndex: 0, completedDate: '2026-07-20' },
      // week 2026-07-27: 3 days (qualifies, most recent elapsed week)
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 1, completedDate: '2026-07-29' },
      { sessionIndex: 2, completedDate: '2026-07-31' },
      // current week 2026-08-03 (today = 2026-08-05): 2 days so far, in progress
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
    ];
    const result = calculateStreak(completions, '2026-08-05');
    expect(result).toEqual({ streak: 1, thisWeekDays: 2 });
  });

  it('counts the current in-progress week provisionally once it reaches 3/3', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 1, completedDate: '2026-07-29' },
      { sessionIndex: 2, completedDate: '2026-07-31' },
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    const result = calculateStreak(completions, '2026-08-05');
    expect(result).toEqual({ streak: 2, thisWeekDays: 3 });
  });

  it('returns zero streak and zero thisWeekDays with no history', () => {
    expect(calculateStreak([], '2026-08-05')).toEqual({ streak: 0, thisWeekDays: 0 });
  });
});

describe('calculatePoints', () => {
  it('awards 10 per completion, 20 per week reaching 3/3, 15 per team bonus week', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    // 3 completions * 10 = 30, one qualifying week * 20 = 20, that week is
    // also a team bonus week * 15 = 15 -> 65
    expect(calculatePoints(completions, ['2026-08-03'])).toBe(65);
  });

  it('awards points for a same-day double session without double-counting the weekly bonus', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-03' },
    ];
    // 2 completions * 10 = 20, week has only 1 distinct day -> no weekly bonus
    expect(calculatePoints(completions, [])).toBe(20);
  });
});

describe('calculateLevel', () => {
  it('levels up every 100 points, starting at level 1', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(199)).toBe(2);
    expect(calculateLevel(200)).toBe(3);
  });
});

describe('computeTeamBonusWeeks', () => {
  it('only returns weeks where both profiles reached 3/3', () => {
    const myWeeks = [
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 2 },
    ];
    const otherWeeks = [
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 3 },
    ];
    expect(computeTeamBonusWeeks(myWeeks, otherWeeks)).toEqual(['2026-07-27']);
  });

  it('returns an empty list when the partner has no matching weeks', () => {
    const myWeeks = [{ weekStart: '2026-07-27', days: 3 }];
    expect(computeTeamBonusWeeks(myWeeks, [])).toEqual([]);
  });
});

describe('partnerWeeks', () => {
  it('filters out my own rows and maps the rest to WeekDayCount', () => {
    const teamRows: TeamWeekRow[] = [
      { userId: 'me', weekStart: '2026-07-27', days: 3 },
      { userId: 'partner', weekStart: '2026-07-27', days: 2 },
    ];
    expect(partnerWeeks(teamRows, 'me')).toEqual([{ weekStart: '2026-07-27', days: 2 }]);
  });
});

describe('computeStats', () => {
  it('combines streak, points, level and team-bonus streak', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 1, completedDate: '2026-07-29' },
      { sessionIndex: 2, completedDate: '2026-07-31' },
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    const teamBonusWeekStarts = ['2026-07-27', '2026-08-03'];
    const stats = computeStats(completions, teamBonusWeekStarts, '2026-08-05');
    expect(stats.totalCompletions).toBe(6);
    expect(stats.streak).toBe(2);
    expect(stats.thisWeekDays).toBe(3);
    expect(stats.teamBonusCount).toBe(2);
    expect(stats.teamBonusStreak).toBe(2);
    // 6*10 + 2*20 (both weeks qualify) + 2*15 (both team bonus weeks) = 130
    expect(stats.totalPoints).toBe(130);
    expect(stats.level).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/workoutGamification.test.ts`
Expected: FAIL — `Cannot find module '../lib/workoutGamification'`.

- [ ] **Step 3: Implement the module**

```typescript
// src/lib/workoutGamification.ts

export type WorkoutCompletion = {
  sessionIndex: number;
  completedDate: string; // 'YYYY-MM-DD'
};

export type WeekDayCount = {
  weekStart: string; // 'YYYY-MM-DD', Monday
  days: number; // distinct completed_date values that week, uncapped
};

export type TeamWeekRow = {
  userId: string;
  weekStart: string;
  days: number;
};

export type GamificationStats = {
  totalCompletions: number;
  streak: number;
  thisWeekDays: number;
  totalPoints: number;
  level: number;
  teamBonusCount: number;
  teamBonusStreak: number;
};

const WEEKLY_TARGET_DAYS = 3;
const POINTS_PER_COMPLETION = 10;
const POINTS_PER_WEEKLY_TARGET = 20;
const POINTS_PER_TEAM_BONUS = 15;
const POINTS_PER_LEVEL = 100;

/** Monday (ISO week start) of the week containing `dateStr`. */
export function getWeekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

function addWeeks(weekStartStr: string, weeks: number): string {
  const d = new Date(`${weekStartStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function groupByWeek(completions: WorkoutCompletion[]): WeekDayCount[] {
  const byWeek = new Map<string, Set<string>>();
  for (const c of completions) {
    const weekStart = getWeekStart(c.completedDate);
    if (!byWeek.has(weekStart)) byWeek.set(weekStart, new Set());
    byWeek.get(weekStart)!.add(c.completedDate);
  }
  return Array.from(byWeek.entries())
    .map(([weekStart, days]) => ({ weekStart, days: days.size }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Consecutive-week streak from a set of "qualifying" week-starts, walking
 * backward from the current week if it already qualifies, otherwise from
 * the most recent fully-elapsed week. Shared by the personal streak and
 * the team-bonus streak — same rule, different qualifying set.
 */
function weeksStreak(qualifyingWeekStarts: Set<string>, todayStr: string): number {
  const currentWeekStart = getWeekStart(todayStr);
  let cursor = qualifyingWeekStarts.has(currentWeekStart)
    ? currentWeekStart
    : addWeeks(currentWeekStart, -1);
  let streak = 0;
  while (qualifyingWeekStarts.has(cursor)) {
    streak += 1;
    cursor = addWeeks(cursor, -1);
  }
  return streak;
}

export function calculateStreak(
  completions: WorkoutCompletion[],
  todayStr: string
): { streak: number; thisWeekDays: number } {
  const weeks = groupByWeek(completions);
  const qualifying = new Set(weeks.filter((w) => w.days >= WEEKLY_TARGET_DAYS).map((w) => w.weekStart));
  const currentWeekStart = getWeekStart(todayStr);
  const thisWeek = weeks.find((w) => w.weekStart === currentWeekStart);
  return {
    streak: weeksStreak(qualifying, todayStr),
    thisWeekDays: Math.min(thisWeek?.days ?? 0, WEEKLY_TARGET_DAYS),
  };
}

export function calculatePoints(completions: WorkoutCompletion[], teamBonusWeekStarts: string[]): number {
  const weeks = groupByWeek(completions);
  const weeklyBonusCount = weeks.filter((w) => w.days >= WEEKLY_TARGET_DAYS).length;
  return (
    completions.length * POINTS_PER_COMPLETION +
    weeklyBonusCount * POINTS_PER_WEEKLY_TARGET +
    teamBonusWeekStarts.length * POINTS_PER_TEAM_BONUS
  );
}

export function calculateLevel(points: number): number {
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

export function computeTeamBonusWeeks(myWeeks: WeekDayCount[], partnerWeeksList: WeekDayCount[]): string[] {
  const myQualifying = new Set(myWeeks.filter((w) => w.days >= WEEKLY_TARGET_DAYS).map((w) => w.weekStart));
  const partnerQualifying = new Set(
    partnerWeeksList.filter((w) => w.days >= WEEKLY_TARGET_DAYS).map((w) => w.weekStart)
  );
  return Array.from(myQualifying)
    .filter((weekStart) => partnerQualifying.has(weekStart))
    .sort();
}

export function partnerWeeks(teamRows: TeamWeekRow[], myUserId: string): WeekDayCount[] {
  return teamRows
    .filter((row) => row.userId !== myUserId)
    .map((row) => ({ weekStart: row.weekStart, days: row.days }));
}

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

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/__tests__/workoutGamification.test.ts`
Expected: PASS, all `it` blocks green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutGamification.ts src/__tests__/workoutGamification.test.ts
git commit -m "$(cat <<'EOF'
Add pure workout gamification math (streak, points, level, team bonus)

Zero Supabase dependency: takes a raw completion log and today's date
in, returns derived stats out. Weekly progress counts distinct days,
not distinct completions, so a same-day double session doesn't inflate
the streak. The personal streak and the team-bonus streak share one
"consecutive qualifying weeks" walk, parameterized by which set of
week-starts counts as qualifying.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 3: Generate the 7 medal illustrations

**Files:**
- Create: `assets/images/badges/premiere-seance.png`
- Create: `assets/images/badges/habitue.png`
- Create: `assets/images/badges/veteran.png`
- Create: `assets/images/badges/mois-sans-faute.png`
- Create: `assets/images/badges/sur-la-duree.png`
- Create: `assets/images/badges/esprit-equipe.png`
- Create: `assets/images/badges/duo-en-or.png`
- Create: `assets/images/badges/README.md`

**Interfaces:**
- Produces: 7 PNG files at the exact paths above, each a transparent-background medal illustration, which Task 4's `require()` calls target by exact path.

No test framework applies to static assets; verification is visual
approval plus a file-existence/size check.

- [ ] **Step 1: Generate each medal via Higgsfield**

Use `mcp__claude_ai_Higgsfield__generate_image_batch` (model
`nano_banana_pro`, `aspect_ratio: "1:1"`, `resolution: "2k"`), one request
per badge, each prompt following the same brand illustration language
already used for the app's three shipped illustrations (minimalist base,
targeted 3D relief, red/white/navy palette, generated on solid white
`#FFFFFF` so it can be cleanly background-removed after):

1. **Première séance** — "A single circular medal, minimalist flat bronze-toned disc with one small five-point star in raised 3D relief at its center, red ribbon in flat 2D style. Brand palette: red #DC2626, white, navy. Generated on a solid white background, centered, no other elements, no text."
2. **Habitué** — "A single circular medal, minimalist flat silver-toned disc with the number '10' in raised 3D relief at its center, red ribbon in flat 2D style. Brand palette: red #DC2626, white, navy. Generated on a solid white background, centered, no other elements, no text besides the embossed number."
3. **Vétéran** — "A single circular medal, minimalist flat gold-toned disc with a laurel wreath in raised 3D relief circling its center, red ribbon in flat 2D style. Brand palette: red #DC2626, white, navy. Generated on a solid white background, centered, no other elements, no text."
4. **Un mois sans faute** — "A single circular medal, minimalist flat bronze-toned disc with a small flame shape in raised 3D relief at its center, red ribbon in flat 2D style. Brand palette: red #DC2626, white, navy. Generated on a solid white background, centered, no other elements, no text."
5. **Sur la durée** — "A single circular medal, minimalist flat gold-toned disc with a small mountain-peak shape in raised 3D relief at its center, double-layered red ribbon in flat 2D style. Brand palette: red #DC2626, white, navy. Generated on a solid white background, centered, no other elements, no text."
6. **Esprit d'équipe** — "A single circular medal, minimalist flat silver-toned disc with two small clasped-hands shapes in raised 3D relief at its center, red ribbon in flat 2D style. Brand palette: red #DC2626, white, navy. Generated on a solid white background, centered, no other elements, no text."
7. **Duo en or** — "A single circular medal, minimalist flat gold-toned disc with two overlapping running-figure silhouettes in raised 3D relief at its center, echoing a runner logo mark, red ribbon in flat 2D style. Brand palette: red #DC2626, white, navy. Generated on a solid white background, centered, no other elements, no text."

- [ ] **Step 2: Wait for the batch, download each result**

Use `jobs_wait` on the returned job ids, then download each finished PNG to
a scratch temp directory via `curl`.

- [ ] **Step 3: Remove the background on each**

Run each downloaded PNG through `mcp__claude_ai_Higgsfield__remove_background`
so every medal ships fully transparent — matching how the app's three
existing illustrations and the logo are shipped (no baked background, so
no seam against `bgBase` or `bgSurface`, and no dark-mode-specific rework
needed if that's ever revisited).

- [ ] **Step 4: Resize and place**

Resize each background-removed PNG to 192×192 (crisp at the 64×64 render
size used in `progression.tsx` at up to @3x) using the same Pillow
resize-and-save approach used for recipe/workout photos elsewhere in this
project, and save to the exact paths listed under **Files** above.

- [ ] **Step 5: Write the README**

```markdown
# Badges

Médailles illustrant chaque badge de la gamification sportive. Direction
et palette : voir `.claude/skills/fitfork-design/SKILL.md` (rouge/blanc/
marine, relief 3D ciblé, fond transparent — même traitement que les trois
illustrations de marque et le logo).

| File | Size | Badge |
| --- | --- | --- |
| `premiere-seance.png` | 192×192 | Première séance |
| `habitue.png` | 192×192 | Habitué |
| `veteran.png` | 192×192 | Vétéran |
| `mois-sans-faute.png` | 192×192 | Un mois sans faute |
| `sur-la-duree.png` | 192×192 | Sur la durée |
| `esprit-equipe.png` | 192×192 | Esprit d'équipe |
| `duo-en-or.png` | 192×192 | Duo en or |

Fond transparent (background retiré après génération). Rendu par
`src/lib/workoutBadges.ts` via `require()` ; un badge verrouillé affiche sa
médaille à `state.disabledOpacity`, un badge débloqué l'affiche pleine
opacité.
```

Save to `assets/images/badges/README.md`.

- [ ] **Step 6: Commit**

```bash
git add assets/images/badges/
git commit -m "$(cat <<'EOF'
Add the 7 badge medal illustrations

One transparent-background medal per gamification badge, generated in
the same brand style (minimalist, targeted 3D relief, red/white/navy)
as the app's three existing illustrations, background-removed the
same way so there's no seam against bgBase or bgSurface.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 4: Badge config and evaluator — `src/lib/workoutBadges.ts`

**Files:**
- Create: `src/lib/workoutBadges.ts`
- Create: `src/__tests__/workoutBadges.test.ts`

**Interfaces:**
- Consumes: `GamificationStats` from `src/lib/workoutGamification.ts` (Task 2); the 7 PNG files from `assets/images/badges/` (Task 3).
- Produces (consumed by Task 8's `progression.tsx`):
  - `type BadgeId = 'premiere-seance' | 'habitue' | 'veteran' | 'mois-sans-faute' | 'sur-la-duree' | 'esprit-equipe' | 'duo-en-or'`
  - `type Badge = { id: BadgeId; label: string; description: string; medalImage: ImageSourcePropType; check: (stats: GamificationStats) => boolean }`
  - `BADGES: Badge[]`
  - `unlockedBadgeIds(stats: GamificationStats): BadgeId[]`

- [ ] **Step 1: Write the failing test file**

```typescript
// src/__tests__/workoutBadges.test.ts
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import type { GamificationStats } from '../lib/workoutGamification';

const BASE_STATS: GamificationStats = {
  totalCompletions: 0,
  streak: 0,
  thisWeekDays: 0,
  totalPoints: 0,
  level: 1,
  teamBonusCount: 0,
  teamBonusStreak: 0,
};

describe('BADGES', () => {
  it('has exactly the 7 designed badges', () => {
    expect(BADGES.map((b) => b.id).sort()).toEqual(
      [
        'duo-en-or',
        'esprit-equipe',
        'habitue',
        'mois-sans-faute',
        'premiere-seance',
        'sur-la-duree',
        'veteran',
      ].sort()
    );
  });
});

describe('unlockedBadgeIds', () => {
  it('unlocks nothing for a brand-new profile', () => {
    expect(unlockedBadgeIds(BASE_STATS)).toEqual([]);
  });

  it('unlocks "premiere-seance" at 1 completion, not before', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 0 })).not.toContain('premiere-seance');
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 1 })).toContain('premiere-seance');
  });

  it('unlocks "habitue" at 10 completions, not at 9', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 9 })).not.toContain('habitue');
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 10 })).toContain('habitue');
  });

  it('unlocks "veteran" at 50 completions, not at 49', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 49 })).not.toContain('veteran');
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 50 })).toContain('veteran');
  });

  it('unlocks "mois-sans-faute" at streak 4, not at 3', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 3 })).not.toContain('mois-sans-faute');
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 4 })).toContain('mois-sans-faute');
  });

  it('unlocks "sur-la-duree" at streak 12, not at 11', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 11 })).not.toContain('sur-la-duree');
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 12 })).toContain('sur-la-duree');
  });

  it('unlocks "esprit-equipe" at teamBonusCount 1, not at 0', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusCount: 0 })).not.toContain('esprit-equipe');
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusCount: 1 })).toContain('esprit-equipe');
  });

  it('unlocks "duo-en-or" at teamBonusStreak 4, not at 3', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusStreak: 3 })).not.toContain('duo-en-or');
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusStreak: 4 })).toContain('duo-en-or');
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/__tests__/workoutBadges.test.ts`
Expected: FAIL — `Cannot find module '../lib/workoutBadges'`.

- [ ] **Step 3: Implement the module**

```typescript
// src/lib/workoutBadges.ts
import type { ImageSourcePropType } from 'react-native';
import type { GamificationStats } from './workoutGamification';

export type BadgeId =
  | 'premiere-seance'
  | 'habitue'
  | 'veteran'
  | 'mois-sans-faute'
  | 'sur-la-duree'
  | 'esprit-equipe'
  | 'duo-en-or';

export type Badge = {
  id: BadgeId;
  label: string;
  description: string;
  medalImage: ImageSourcePropType;
  check: (stats: GamificationStats) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: 'premiere-seance',
    label: 'Première séance',
    description: 'Valider ta toute première séance.',
    medalImage: require('../../assets/images/badges/premiere-seance.png'),
    check: (stats) => stats.totalCompletions >= 1,
  },
  {
    id: 'habitue',
    label: 'Habitué',
    description: '10 séances validées au total.',
    medalImage: require('../../assets/images/badges/habitue.png'),
    check: (stats) => stats.totalCompletions >= 10,
  },
  {
    id: 'veteran',
    label: 'Vétéran',
    description: '50 séances validées au total.',
    medalImage: require('../../assets/images/badges/veteran.png'),
    check: (stats) => stats.totalCompletions >= 50,
  },
  {
    id: 'mois-sans-faute',
    label: 'Un mois sans faute',
    description: '4 semaines de suite à 3 séances.',
    medalImage: require('../../assets/images/badges/mois-sans-faute.png'),
    check: (stats) => stats.streak >= 4,
  },
  {
    id: 'sur-la-duree',
    label: 'Sur la durée',
    description: '12 semaines de suite à 3 séances.',
    medalImage: require('../../assets/images/badges/sur-la-duree.png'),
    check: (stats) => stats.streak >= 12,
  },
  {
    id: 'esprit-equipe',
    label: "Esprit d'équipe",
    description: "Premier bonus d'équipe déclenché.",
    medalImage: require('../../assets/images/badges/esprit-equipe.png'),
    check: (stats) => stats.teamBonusCount >= 1,
  },
  {
    id: 'duo-en-or',
    label: 'Duo en or',
    description: "Bonus d'équipe 4 semaines de suite.",
    medalImage: require('../../assets/images/badges/duo-en-or.png'),
    check: (stats) => stats.teamBonusStreak >= 4,
  },
];

export function unlockedBadgeIds(stats: GamificationStats): BadgeId[] {
  return BADGES.filter((badge) => badge.check(stats)).map((badge) => badge.id);
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/__tests__/workoutBadges.test.ts`
Expected: PASS, all `it` blocks green. (This requires Task 3's 7 PNG files
to already exist on disk — Jest resolves `require()` targets against the
real filesystem even though `jest-expo`'s asset transformer stubs their
*content*.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutBadges.ts src/__tests__/workoutBadges.test.ts
git commit -m "$(cat <<'EOF'
Add the badge config and unlock evaluator

Seven badges as a plain data array with a pure check(stats) predicate
each — adding a badge later is one array entry, no migration. Each
carries its medal image from assets/images/badges/.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 5: Supabase I/O — `src/lib/workoutCompletionsData.ts`

**Files:**
- Create: `src/lib/workoutCompletionsData.ts`

**Interfaces:**
- Consumes: `supabase` client from `src/lib/supabase.ts`; `WorkoutCompletion`, `TeamWeekRow` types from `src/lib/workoutGamification.ts` (Task 2); the `workout_completions` table and `team_week_progress` RPC from Task 1.
- Produces (consumed by Task 6, Task 7, Task 8):
  - `type WorkoutCompletionRow = WorkoutCompletion & { id: string }`
  - `logSessionCompletion(userId: string, sessionIndex: number): Promise<void>`
  - `undoSessionCompletion(userId: string, sessionIndex: number, completedDate: string): Promise<void>`
  - `fetchCompletionForToday(userId: string, sessionIndex: number, today: string): Promise<WorkoutCompletionRow | null>`
  - `fetchMyCompletions(userId: string): Promise<WorkoutCompletionRow[]>`
  - `fetchTeamWeekProgress(weeksBack?: number): Promise<TeamWeekRow[]>`

No dedicated Jest test file for this task — this codebase has no test
file for its sibling I/O module (`weightLogData.ts` has no
`weightLogData.test.ts`), only pure-logic modules are unit tested here.
Verification is `npx tsc --noEmit` plus a manual smoke check (Step 3).

- [ ] **Step 1: Implement the module**

```typescript
// src/lib/workoutCompletionsData.ts
import { supabase } from './supabase';
import type { WorkoutCompletion, TeamWeekRow } from './workoutGamification';

export type WorkoutCompletionRow = WorkoutCompletion & { id: string };

export async function logSessionCompletion(userId: string, sessionIndex: number): Promise<void> {
  const { error } = await supabase.from('workout_completions').insert({
    user_id: userId,
    session_index: sessionIndex,
  });
  if (error) throw error;
}

export async function undoSessionCompletion(
  userId: string,
  sessionIndex: number,
  completedDate: string
): Promise<void> {
  const { error } = await supabase
    .from('workout_completions')
    .delete()
    .eq('user_id', userId)
    .eq('session_index', sessionIndex)
    .eq('completed_date', completedDate);
  if (error) throw error;
}

export async function fetchCompletionForToday(
  userId: string,
  sessionIndex: number,
  today: string
): Promise<WorkoutCompletionRow | null> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('id, session_index, completed_date')
    .eq('user_id', userId)
    .eq('session_index', sessionIndex)
    .eq('completed_date', today)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    sessionIndex: data.session_index,
    completedDate: data.completed_date,
  };
}

export async function fetchMyCompletions(userId: string): Promise<WorkoutCompletionRow[]> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('id, session_index, completed_date')
    .eq('user_id', userId)
    .order('completed_date', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    sessionIndex: row.session_index,
    completedDate: row.completed_date,
  }));
}

export async function fetchTeamWeekProgress(weeksBack = 26): Promise<TeamWeekRow[]> {
  const { data, error } = await supabase.rpc('team_week_progress', { weeks_back: weeksBack });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    weekStart: row.week_start,
    days: row.days_that_week,
  }));
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors introduced by this file.

- [ ] **Step 3: Manual smoke check against the live schema**

Via the Supabase MCP `execute_sql` tool (not the app), confirm the shapes
this module expects actually match what Task 1 created:

```sql
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'workout_completions'
order by ordinal_position;

select proname, prosecdef from pg_proc where proname = 'team_week_progress';
```

Expected: columns `id (uuid)`, `user_id (uuid)`, `session_index
(integer)`, `completed_at (timestamp with time zone)`, `completed_date
(date)`; and `team_week_progress` present with `prosecdef = true`
(security definer).

- [ ] **Step 4: Commit**

```bash
git add src/lib/workoutCompletionsData.ts
git commit -m "$(cat <<'EOF'
Add Supabase I/O for workout completions

Thin wrapper around workout_completions and team_week_progress — no
business logic here, that all lives in workoutGamification.ts. Mirrors
weightLogData.ts's shape (plain async functions, snake_case-to-camelCase
row mapping, throw on error) for the sibling weight-tracking domain.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 6: "Marquer comme terminée" button — `src/app/(tabs)/workout.tsx`

**Files:**
- Modify: `src/app/(tabs)/workout.tsx`

**Interfaces:**
- Consumes: `logSessionCompletion`, `undoSessionCompletion`,
  `fetchCompletionForToday`, `type WorkoutCompletionRow` from
  `src/lib/workoutCompletionsData.ts` (Task 5).
- Produces: nothing consumed by later tasks — this is a leaf UI change.

No new automated test (this codebase has no test file for any screen
component). Verification is `npx tsc --noEmit` plus a manual pass with
`npx expo start --web`.

- [ ] **Step 1: Add the new imports**

In `src/app/(tabs)/workout.tsx`, change:

```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image } from 'react-native';
```

This file's `Image, Pressable` set does not need to change — the
"Annuler" link below uses `PressableScale` (already imported), not a bare
`Pressable`, so every tappable element on this screen keeps a visible
pressed state per the Global Constraints.

And change:

```typescript
import { centeredContent, radius, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';
```

to:

```typescript
import { centeredContent, radius, spacing, state, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';
```

Then add, right after the `homeWorkoutProgram` import block:

```typescript
import {
  logSessionCompletion,
  undoSessionCompletion,
  fetchCompletionForToday,
  type WorkoutCompletionRow,
} from '../../lib/workoutCompletionsData';
```

And change:

```typescript
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
```

to:

```typescript
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { Button } from '../../components/ui/Button';
```

- [ ] **Step 2: Add the today-date helper**

Right after the `SESSION_TAB_OPTIONS` constant, add:

```typescript
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
```

- [ ] **Step 3: Add completion state and loading logic**

Inside `WorkoutScreen`, right after this existing line:

```typescript
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
```

add:

```typescript
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletionRow | null>(null);
  const [loggingCompletion, setLoggingCompletion] = useState(false);
```

Then, right after the existing `load` callback's closing `}, [session]);`,
add a second callback and its own focus effect:

```typescript
  const loadTodayCompletion = useCallback(async () => {
    if (!session) return;
    try {
      const completion = await fetchCompletionForToday(session.user.id, activeSessionIndex, todayDateString());
      setTodayCompletion(completion);
    } catch {
      // Non-blocking: the button just falls back to its "not completed" state.
      setTodayCompletion(null);
    }
  }, [session, activeSessionIndex]);
```

And right after the existing:

```typescript
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
```

add:

```typescript
  useFocusEffect(
    useCallback(() => {
      loadTodayCompletion();
    }, [loadTodayCompletion])
  );
```

- [ ] **Step 4: Add the toggle handler**

Right after `handleLevelChange`'s closing brace, add:

```typescript
  const handleToggleCompletion = async () => {
    if (!session) return;
    setError(null);

    if (todayCompletion) {
      const previous = todayCompletion;
      setTodayCompletion(null);
      setLoggingCompletion(true);
      try {
        await undoSessionCompletion(session.user.id, activeSessionIndex, previous.completedDate);
      } catch (err) {
        setTodayCompletion(previous);
        setError(err instanceof Error ? err.message : "Erreur lors de l'annulation.");
      } finally {
        setLoggingCompletion(false);
      }
      return;
    }

    const optimistic: WorkoutCompletionRow = {
      id: 'optimistic',
      sessionIndex: activeSessionIndex,
      completedDate: todayDateString(),
    };
    setTodayCompletion(optimistic);
    setLoggingCompletion(true);
    try {
      await logSessionCompletion(session.user.id, activeSessionIndex);
      const completion = await fetchCompletionForToday(session.user.id, activeSessionIndex, todayDateString());
      setTodayCompletion(completion);
    } catch (err) {
      setTodayCompletion(null);
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setLoggingCompletion(false);
    }
  };
```

- [ ] **Step 5: Add the button to the session card**

Change:

```tsx
            <Text style={styles.sessionTitle}>
              Séance {index + 1} — {sessionItem.name}
            </Text>
            <SessionDetail session={sessionItem} styles={styles} />
          </Card>
```

to:

```tsx
            <Text style={styles.sessionTitle}>
              Séance {index + 1} — {sessionItem.name}
            </Text>
            <SessionDetail session={sessionItem} styles={styles} />
            <View style={styles.completionRow}>
              {todayCompletion ? (
                <>
                  <View style={styles.completionDoneBadge}>
                    <Text style={styles.completionDoneText}>Fait aujourd'hui ✓</Text>
                  </View>
                  <PressableScale
                    onPress={handleToggleCompletion}
                    disabled={loggingCompletion}
                    hitSlop={state.hitSlop}
                    accessibilityRole="button"
                  >
                    <Text style={styles.completionUndoLink}>Annuler</Text>
                  </PressableScale>
                </>
              ) : (
                <Button
                  title="Marquer comme terminée"
                  onPress={handleToggleCompletion}
                  loading={loggingCompletion}
                />
              )}
            </View>
          </Card>
```

- [ ] **Step 6: Add the new styles**

Inside `createStyles`, right after the existing `coachNote` entry, add:

```typescript
    completionRow: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    completionDoneBadge: {
      backgroundColor: colors.successSoft,
      borderRadius: radius.pill,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    completionDoneText: { ...typography.captionStrong, color: colors.success },
    completionUndoLink: { ...typography.caption, color: colors.accentRedDeep },
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Manual verification**

Run: `npx expo start --web`, open the Sport tab, confirm: the button reads
"Marquer comme terminée" for a session not yet done today; tapping it
switches to a green "Fait aujourd'hui ✓" pill with an "Annuler" link next
to it; tapping "Annuler" reverts to the button; switching to a different
session tab shows that session's own independent state (not shared with
the first).

- [ ] **Step 9: Commit**

```bash
git add src/app/\(tabs\)/workout.tsx
git commit -m "$(cat <<'EOF'
Add the session completion button to the workout screen

"Marquer comme terminée" logs today's completion for the currently
viewed session; once logged it becomes a "Fait aujourd'hui" pill with
an undo link. Optimistic update with rollback on failure, same pattern
already used here for the experience-level switch.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 7: "Progression" card on Home — `src/app/(tabs)/home.tsx`

**Files:**
- Modify: `src/app/(tabs)/home.tsx`

**Interfaces:**
- Consumes: `fetchMyCompletions`, `fetchTeamWeekProgress` from
  `src/lib/workoutCompletionsData.ts` (Task 5); `computeStats`,
  `computeTeamBonusWeeks`, `groupByWeek`, `partnerWeeks`, `type
  GamificationStats` from `src/lib/workoutGamification.ts` (Task 2);
  `PressableScale` from `src/components/ui/PressableScale.tsx`.
- Produces: nothing consumed by later tasks.

No new automated test (no test file precedent for screen components).
Verification is `npx tsc --noEmit` plus a manual pass.

- [ ] **Step 1: Add the new imports**

Change:

```typescript
import { getCurrentPlan, fetchRecipes, type Recipe, type SavedPlanEntry } from '../../lib/mealPlanData';
```

to (unchanged) and add right after it:

```typescript
import { fetchMyCompletions, fetchTeamWeekProgress } from '../../lib/workoutCompletionsData';
import {
  computeStats,
  computeTeamBonusWeeks,
  groupByWeek,
  partnerWeeks,
  type GamificationStats,
} from '../../lib/workoutGamification';
```

And change:

```typescript
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
```

to:

```typescript
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
```

- [ ] **Step 2: Add gamification state**

Right after:

```typescript
  const [loadError, setLoadError] = useState<string | null>(null);
```

add:

```typescript
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
```

- [ ] **Step 3: Fetch and compute stats in the load effect**

Change:

```typescript
        const [profile, trainingProfile, plan, recipes] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
          getCurrentPlan(session.user.id),
          fetchRecipes(),
        ]);
```

to:

```typescript
        const [profile, trainingProfile, plan, recipes, myCompletions] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
          getCurrentPlan(session.user.id),
          fetchRecipes(),
          fetchMyCompletions(session.user.id),
        ]);
```

Then, right after the existing block that sets `todayMeals` (right before
the effect's `} catch (err) {`), add:

```typescript
        let teamBonusWeeks: string[] = [];
        try {
          const teamRows = await fetchTeamWeekProgress();
          teamBonusWeeks = computeTeamBonusWeeks(
            groupByWeek(myCompletions),
            partnerWeeks(teamRows, session.user.id)
          );
        } catch {
          // Team progress is a cooperative bonus on top of personal stats —
          // if it fails to load, still show the user's own streak/level below.
        }
        setGamification(computeStats(myCompletions, teamBonusWeeks, new Date().toISOString().slice(0, 10)));
```

- [ ] **Step 4: Add the card, right after the macros Card**

Change:

```tsx
      {macros && (
        <Card style={styles.macroCard}>
          ...
        </Card>
      )}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
```

to (keeping the existing macros Card body untouched, only inserting after
its closing `)}`):

```tsx
      {macros && (
        <Card style={styles.macroCard}>
          ...
        </Card>
      )}

      {gamification && (
        <PressableScale onPress={() => router.push('/progression')} accessibilityRole="button">
          <Card style={styles.gamificationCard}>
            <Text style={styles.sectionLabel}>Progression</Text>
            <View style={styles.gamificationRow}>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>🔥 {gamification.streak}</Text>
                <Text style={styles.macroLabel}>Série</Text>
              </View>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>Niv. {gamification.level}</Text>
                <Text style={styles.macroLabel}>Niveau</Text>
              </View>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>{gamification.thisWeekDays}/3</Text>
                <Text style={styles.macroLabel}>Cette semaine</Text>
              </View>
            </View>
          </Card>
        </PressableScale>
      )}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
```

(The `...` above stands for the macros Card's existing, unmodified body —
do not actually write literal `...` in the file.)

- [ ] **Step 5: Add the new styles**

Inside `createStyles`, right after the existing `macroCard` entry, add:

```typescript
    gamificationCard: { marginBottom: spacing.lg },
    gamificationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    gamificationItem: { alignItems: 'center', flex: 1 },
    gamificationValue: { ...typography.title, color: colors.textPrimary },
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification**

Run: `npx expo start --web`, open Home, confirm the "Progression" card
renders below the macro card with a streak, a level, and "X/3 cette
semaine", and that tapping it navigates to `/progression` (a blank/loading
screen is expected until Task 8 ships it).

- [ ] **Step 8: Commit**

```bash
git add src/app/\(tabs\)/home.tsx
git commit -m "$(cat <<'EOF'
Add the Progression card to the Home screen

Compact streak/level/this-week summary, tappable through to the new
/progression detail screen. Team-bonus fetch is wrapped in its own
try/catch, same tolerance-for-partial-failure pattern already used for
the weight-log fallback in generate-plan.tsx.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

### Task 8: Progression detail screen — `src/app/progression.tsx`

**Files:**
- Create: `src/app/progression.tsx`

**Interfaces:**
- Consumes: everything from Task 2, Task 4, Task 5 (`computeStats`,
  `computeTeamBonusWeeks`, `groupByWeek`, `partnerWeeks`, `getWeekStart`,
  `type GamificationStats` from `workoutGamification.ts`; `BADGES`,
  `unlockedBadgeIds` from `workoutBadges.ts`; `fetchMyCompletions`,
  `fetchTeamWeekProgress` from `workoutCompletionsData.ts`).
- Produces: nothing — this is the terminal screen for this feature.

No new automated test. Verification is `npx tsc --noEmit` plus a manual
pass.

- [ ] **Step 1: Create the file**

```tsx
// src/app/progression.tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { fetchMyCompletions, fetchTeamWeekProgress } from '../lib/workoutCompletionsData';
import {
  computeStats,
  computeTeamBonusWeeks,
  groupByWeek,
  partnerWeeks,
  getWeekStart,
  type GamificationStats,
} from '../lib/workoutGamification';
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import { Card } from '../components/ui/Card';
import {
  centeredContent,
  radius,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../theme/tokens';

export default function ProgressionScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [partnerThisWeekDays, setPartnerThisWeekDays] = useState(0);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    setTeamError(null);
    try {
      const myCompletions = await fetchMyCompletions(session.user.id);
      const myWeeks = groupByWeek(myCompletions);
      const today = new Date().toISOString().slice(0, 10);
      const currentWeekStart = getWeekStart(today);

      let teamBonusWeeks: string[] = [];
      try {
        const teamRows = await fetchTeamWeekProgress();
        const otherWeeks = partnerWeeks(teamRows, session.user.id);
        teamBonusWeeks = computeTeamBonusWeeks(myWeeks, otherWeeks);
        const partnerThisWeek = otherWeeks.find((w) => w.weekStart === currentWeekStart);
        setPartnerThisWeekDays(Math.min(partnerThisWeek?.days ?? 0, 3));
      } catch {
        setTeamError('Impossible de charger la progression du binôme.');
      }

      setStats(computeStats(myCompletions, teamBonusWeeks, today));
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

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  const unlockedIds = new Set(unlockedBadgeIds(stats));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.title}>Progression</Text>

      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerItem}>
            <Text style={styles.headerValue}>🔥 {stats.streak}</Text>
            <Text style={styles.headerLabel}>Série</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={styles.headerValue}>Niv. {stats.level}</Text>
            <Text style={styles.headerLabel}>Niveau</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={styles.headerValue}>{stats.totalPoints}</Text>
            <Text style={styles.headerLabel}>Points</Text>
          </View>
        </View>
      </Card>

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
      <Card style={styles.teamCard}>
        {teamError ? (
          <Text style={styles.teamError}>{teamError}</Text>
        ) : (
          <Text style={styles.teamText}>
            Vous deux : {stats.thisWeekDays + partnerThisWeekDays}/6 séances cette semaine — bonus à 6/6
          </Text>
        )}
      </Card>

      <Text style={styles.sectionLabel}>Badges</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          return (
            <View key={badge.id} style={styles.badgeItem}>
              <Image
                source={badge.medalImage}
                style={[styles.badgeImage, !unlocked && styles.badgeImageLocked]}
                accessibilityLabel={badge.label}
              />
              <Text style={styles.badgeLabel}>{badge.label}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
            </View>
          );
        })}
      </View>
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
    headerCard: {},
    headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    headerItem: { alignItems: 'center', flex: 1 },
    headerValue: { ...typography.title, color: colors.textPrimary },
    headerLabel: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.xs },
    weekCard: {},
    dayDotsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    dayDot: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.bgSunken,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayDotDone: { backgroundColor: colors.accentRed, borderColor: colors.accentRed },
    weekText: { ...typography.body, color: colors.textSecondary },
    teamCard: {},
    teamText: { ...typography.body, color: colors.textSecondary },
    teamError: { ...typography.body, color: colors.textTertiary },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    badgeItem: { width: '30%', alignItems: 'center' },
    badgeImage: { width: 64, height: 64, marginBottom: spacing.xs },
    badgeImageLocked: { opacity: state.disabledOpacity },
    badgeLabel: { ...typography.captionStrong, color: colors.textPrimary, textAlign: 'center' },
    badgeDescription: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npx expo start --web`, navigate to `/progression` (via the Home
card from Task 7), confirm: header shows streak/level/points; the "Cette
semaine" dots reflect `thisWeekDays`; the team bonus block shows the
combined X/6 text (or the localized error text if the RPC is
unreachable); the badge grid shows all 7 medals, locked ones visibly
dimmed, unlocked ones at full opacity.

- [ ] **Step 4: Commit**

```bash
git add src/app/progression.tsx
git commit -m "$(cat <<'EOF'
Add the Progression detail screen

Streak, level, points, this week's progress, the cooperative team
bonus, and the full badge grid (locked badges dimmed via the existing
disabledOpacity token). Reached from the new Home card.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01A84UXHq4U5d7vWS4RiASmU
EOF
)"
```

---

## Self-Review Notes

**Spec coverage:** table + RLS + RPC → Task 1. Streak/points/level/team-bonus
math → Task 2. Badges + medal visuals → Task 3 + Task 4. I/O functions →
Task 5. Completion button on the workout screen → Task 6. Home card →
Task 7. Progression detail screen (header, this-week, team bonus, badge
grid) → Task 8. Testing section's six scenarios (streak with gaps,
in-progress week, same-day double session, level threshold, all seven
badge unlocks, team bonus trigger/non-trigger) are each an explicit `it`
block across Task 2 and Task 4's test files. Error-handling section
(rollback on network failure, non-blocking team-bonus failure) is built
into Task 6 and Task 7/8 respectively.

**Placeholder scan:** none found — every step carries real code, real SQL,
or a concrete verification command.

**Type consistency:** `WorkoutCompletion`, `WeekDayCount`, `TeamWeekRow`,
`GamificationStats` are defined once in Task 2 and imported by name
everywhere else; `WorkoutCompletionRow` is defined once in Task 5;
`BadgeId`/`Badge` once in Task 4. No renamed duplicates across tasks.

**Deviation from the design doc, called out explicitly:** the design doc
sketched one file (`workoutGamification.ts`) for both pure math and
Supabase I/O, and an RPC returning only the current week. This plan splits
pure math (`workoutGamification.ts`) from I/O (`workoutCompletionsData.ts`)
to match the codebase's existing `progressTracking.ts` /
`weightLogData.ts` split, and widens the RPC to a multi-week window so the
team-bonus streak and "Duo en or" badge — both explicitly designed
features — are actually computable client-side without a second stored
aggregate. Neither change alters any user-facing rule, copy, or approved
decision from the design doc.
