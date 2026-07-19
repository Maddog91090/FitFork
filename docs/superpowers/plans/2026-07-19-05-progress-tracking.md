# Progress Tracking (Plan 5 of 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user log their weight over time, and have the next meal plan generation automatically nudge their calorie target up or down based on whether their actual weight trend matches what their goal expects — closing the loop the design spec describes: log weight → compare trend to expectation → adjust next week's target.

**Architecture:** A pure calculation module (`src/lib/progressTracking.ts`) computes a weekly percent weight-change trend from raw log points, compares it to the goal's expected trend, and returns a calorie adjustment (`-150`, `0`, or `+150` kcal) plus a recomputed `MacroTargets` (reusing Plan 2's `calculateMacroTargets`). A persistence layer (`src/lib/weightLogData.ts`) reads/writes a new `weight_logs` table. One screen lets the user log a new weight and see their history. The last task wires this into Plan 3's existing `generate-plan.tsx`, so `computeAdjustedTargets` runs right after `computeTargetsFromProfile` and before the meal-generation algorithm sees a calorie number — this is the final integration point tying all five plans together.

**Tech Stack:** Same as Plans 1-4 (Expo/React Native/TypeScript, Expo Router, Supabase JS client, Jest). No new dependencies.

## Global Constraints

- Backend is Supabase (Postgres + Auth + RLS) — no custom backend server.
- Expected weekly weight-change trend per goal (per spec, exact values already fixed during Plan 2): cut = **-0.75%/week**, bulk = **+0.375%/week**, maintain = **0%/week**.
- Deviation significance threshold: **half the goal's expected magnitude** (i.e. `|expected| * 0.5`) — for `maintain`, where expected is 0 and that formula degenerates, use a fixed threshold of **0.375%/week** (reusing the bulk rate as the "significant drift" reference) instead.
- Calorie adjustment step: **±150 kcal** (per spec) applied to the *daily* calorie target used for the next generation; when applied, macros (protein/fat/carbs) must be recomputed from the adjusted calorie total via Plan 2's `calculateMacroTargets`, not left stale from the pre-adjustment numbers.
- Insufficient data: **fewer than 2 weight log entries** (or entries that don't span at least 1 day) means no adjustment — return the original targets unchanged (per spec).
- Reuse Plan 2's `Goal` and `MacroTargets` types from `src/lib/nutrition.ts` — do not redefine them. Reuse `calculateMacroTargets` — do not reimplement macro math.
- This plan's adjustment applies only at the point Plan 3's `generate-plan.tsx` computes its calorie target for a new generation — it does not retroactively change an already-generated week's saved plan (matches the design spec's "before generating the next week's meal plan" framing).
- Out of scope for V1: editing/deleting a weight log entry once created (append-only history is sufficient); a dedicated "your trend" dashboard/chart (the adjustment happens silently at generation time, matching the spec's description of the mechanism, not a new UI surface).
- Routes/lib live under `src/app/`, `src/lib/`, `src/__tests__/` (established in Plan 1).

---

## File Structure

```
supabase/migrations/
  0005_weight_logs.sql   # weight_logs table (RLS-owned, append-only: select + insert only)
src/lib/
  progressTracking.ts      # Pure functions: calculateWeeklyTrendPercent, calculateCalorieAdjustment, computeAdjustedTargets
  weightLogData.ts          # Supabase data access: logWeight, fetchRecentWeightLogs
src/app/
  weight-log.tsx             # Log a new weight entry + view history
  home.tsx                    # MODIFIED: add a navigation link to /weight-log
  generate-plan.tsx           # MODIFIED (from Plan 3): fetch recent weight logs and apply computeAdjustedTargets before generating
src/__tests__/
  progressTracking.test.ts   # Unit tests for the trend/adjustment algorithm (synthetic fixtures, no I/O)
  weightLogData.test.ts       # Unit tests for the data access layer against a mocked Supabase client
```

---

### Task 1: Weight logs schema

**Files:**
- Create: `supabase/migrations/0005_weight_logs.sql`

**Interfaces:**
- Produces: Postgres table `weight_logs` (id, user_id, logged_at, weight_kg, created_at — RLS-owned, append-only: select + insert policies only, no update/delete). Task 3's `weightLogData.ts` reads/writes these exact column names.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0005_weight_logs.sql`:

```sql
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
```

- [ ] **Step 2: Apply the migration (manual — needs Supabase dashboard access)**

Same process as prior plans: open the Supabase SQL Editor, clear the query box completely, paste the full contents of `supabase/migrations/0005_weight_logs.sql`, and run it as a single execution. Confirm no errors and that `weight_logs` appears under **Table Editor**.

- [ ] **Step 3: Verify via the REST API**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/weight_logs?select=*" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: `200` (empty array — RLS-protected, no rows visible to an unauthenticated anon request, but the table exists and is exposed).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0005_weight_logs.sql
git commit -m "Add weight_logs schema"
```

---

### Task 2: Progress tracking algorithm (TDD)

**Files:**
- Create: `src/lib/progressTracking.ts`
- Test: `src/__tests__/progressTracking.test.ts`

**Interfaces:**
- Consumes: `Goal`, `MacroTargets`, `calculateMacroTargets` from `src/lib/nutrition.ts` (Plan 2) — do not redefine `Goal`/`MacroTargets`, do not reimplement macro math.
- Produces:
  ```ts
  export type WeightLogPoint = {
    loggedAt: string; // ISO date string, e.g. '2026-01-15'
    weightKg: number;
  };

  export function calculateWeeklyTrendPercent(logs: WeightLogPoint[]): number | null;
  export function calculateCalorieAdjustment(goal: Goal, actualWeeklyPercentChange: number): number;
  export function computeAdjustedTargets(
    baseTargets: MacroTargets,
    goal: Goal,
    weightKg: number,
    logs: WeightLogPoint[]
  ): MacroTargets;
  ```
  Task 5 (wiring into `generate-plan.tsx`) calls `computeAdjustedTargets`. `WeightLogPoint` is intentionally minimal (just the two fields the trend math needs) — Task 3's `WeightLogEntry` (with an added `id` field) structurally satisfies it, so no mapping is needed when passing fetched logs straight into `computeAdjustedTargets`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/progressTracking.test.ts`:

```ts
import {
  calculateWeeklyTrendPercent,
  calculateCalorieAdjustment,
  computeAdjustedTargets,
  type WeightLogPoint,
} from '../lib/progressTracking';

describe('calculateWeeklyTrendPercent', () => {
  it('returns null with fewer than 2 log entries', () => {
    expect(calculateWeeklyTrendPercent([])).toBeNull();
    expect(calculateWeeklyTrendPercent([{ loggedAt: '2026-01-01', weightKg: 80 }])).toBeNull();
  });

  it('computes the weekly percent change between the earliest and latest entries', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-15', weightKg: 79 },
    ];
    // 14 days = 2 weeks; (79-80)/80*100 = -1.25% over 2 weeks = -0.625%/week
    expect(calculateWeeklyTrendPercent(logs)).toBeCloseTo(-0.625, 5);
  });

  it('sorts entries by date before computing (order-independent input)', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-15', weightKg: 79 },
      { loggedAt: '2026-01-01', weightKg: 80 },
    ];
    expect(calculateWeeklyTrendPercent(logs)).toBeCloseTo(-0.625, 5);
  });

  it('returns null when the earliest and latest entries share the same date', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-01', weightKg: 79 },
    ];
    expect(calculateWeeklyTrendPercent(logs)).toBeNull();
  });
});

describe('calculateCalorieAdjustment', () => {
  it('cuts harder when losing weight slower than expected', () => {
    // expected -0.75%/week, actual -0.1%/week (much less negative) -> deviation exceeds threshold
    expect(calculateCalorieAdjustment('cut', -0.1)).toBe(-150);
  });

  it('eases up when losing weight faster than expected', () => {
    expect(calculateCalorieAdjustment('cut', -2)).toBe(150);
  });

  it('makes no adjustment when cutting trend is within tolerance', () => {
    expect(calculateCalorieAdjustment('cut', -0.75)).toBe(0);
  });

  it('increases surplus when gaining weight slower than expected', () => {
    expect(calculateCalorieAdjustment('bulk', 0.05)).toBe(150);
  });

  it('eases up when gaining weight faster than expected', () => {
    expect(calculateCalorieAdjustment('bulk', 1)).toBe(-150);
  });

  it('makes no adjustment when bulking trend is within tolerance', () => {
    expect(calculateCalorieAdjustment('bulk', 0.375)).toBe(0);
  });

  it('reduces calories when maintaining but actually gaining', () => {
    expect(calculateCalorieAdjustment('maintain', 0.5)).toBe(-150);
  });

  it('increases calories when maintaining but actually losing', () => {
    expect(calculateCalorieAdjustment('maintain', -0.5)).toBe(150);
  });

  it('makes no adjustment when maintaining within tolerance', () => {
    expect(calculateCalorieAdjustment('maintain', 0.1)).toBe(0);
  });
});

describe('computeAdjustedTargets', () => {
  const baseTargets = { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 };

  it('returns the base targets unchanged when there is insufficient weight data', () => {
    expect(computeAdjustedTargets(baseTargets, 'cut', 80, [])).toEqual(baseTargets);
  });

  it('returns the base targets unchanged when the trend is within tolerance', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-08', weightKg: 79.4 }, // -0.75%/week, exactly on target for a cut
    ];
    expect(computeAdjustedTargets(baseTargets, 'cut', 80, logs)).toEqual(baseTargets);
  });

  it('recomputes macros from the adjusted calorie total when a deviation is found', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-08', weightKg: 79.9 }, // losing much slower than expected -> -150 kcal
    ];
    const result = computeAdjustedTargets(baseTargets, 'cut', 80, logs);
    expect(result.calories).toBe(1850);
    expect(result).not.toEqual(baseTargets);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/progressTracking.test.ts
```

Expected: FAIL — `Cannot find module '../lib/progressTracking'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the progress tracking algorithm**

Create `src/lib/progressTracking.ts`:

```ts
import { calculateMacroTargets, type Goal, type MacroTargets } from './nutrition';

export type WeightLogPoint = {
  loggedAt: string;
  weightKg: number;
};

const EXPECTED_WEEKLY_PERCENT: Record<Goal, number> = {
  cut: -0.75,
  maintain: 0,
  bulk: 0.375,
};

const CALORIE_ADJUSTMENT_STEP = 150;
const MAINTAIN_DEVIATION_THRESHOLD_PERCENT = 0.375;

export function calculateWeeklyTrendPercent(logs: WeightLogPoint[]): number | null {
  if (logs.length < 2) return null;

  const sorted = [...logs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  const daysBetween =
    (new Date(latest.loggedAt).getTime() - new Date(earliest.loggedAt).getTime()) /
    (1000 * 60 * 60 * 24);
  if (daysBetween <= 0) return null;

  const weeksBetween = daysBetween / 7;
  const percentChange = ((latest.weightKg - earliest.weightKg) / earliest.weightKg) * 100;
  return percentChange / weeksBetween;
}

export function calculateCalorieAdjustment(goal: Goal, actualWeeklyPercentChange: number): number {
  if (goal === 'maintain') {
    if (actualWeeklyPercentChange > MAINTAIN_DEVIATION_THRESHOLD_PERCENT) return -CALORIE_ADJUSTMENT_STEP;
    if (actualWeeklyPercentChange < -MAINTAIN_DEVIATION_THRESHOLD_PERCENT) return CALORIE_ADJUSTMENT_STEP;
    return 0;
  }

  const expected = EXPECTED_WEEKLY_PERCENT[goal];
  const deviation = actualWeeklyPercentChange - expected;
  const threshold = Math.abs(expected) * 0.5;

  if (goal === 'cut') {
    if (deviation > threshold) return -CALORIE_ADJUSTMENT_STEP;
    if (deviation < -threshold) return CALORIE_ADJUSTMENT_STEP;
    return 0;
  }

  // bulk
  if (deviation < -threshold) return CALORIE_ADJUSTMENT_STEP;
  if (deviation > threshold) return -CALORIE_ADJUSTMENT_STEP;
  return 0;
}

export function computeAdjustedTargets(
  baseTargets: MacroTargets,
  goal: Goal,
  weightKg: number,
  logs: WeightLogPoint[]
): MacroTargets {
  const trend = calculateWeeklyTrendPercent(logs);
  if (trend === null) return baseTargets;

  const adjustment = calculateCalorieAdjustment(goal, trend);
  if (adjustment === 0) return baseTargets;

  return calculateMacroTargets(baseTargets.calories + adjustment, weightKg);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/progressTracking.test.ts
```

Expected: `16 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progressTracking.ts src/__tests__/progressTracking.test.ts
git commit -m "Add progress tracking algorithm"
```

---

### Task 3: Weight log persistence layer (TDD, mocked Supabase client)

**Files:**
- Create: `src/lib/weightLogData.ts`
- Test: `src/__tests__/weightLogData.test.ts`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts` (Plan 1).
- Produces:
  ```ts
  export type WeightLogEntry = {
    id: string;
    loggedAt: string;
    weightKg: number;
  };

  export function logWeight(userId: string, weightKg: number, loggedAt?: string): Promise<void>;
  export function fetchRecentWeightLogs(userId: string, limit?: number): Promise<WeightLogEntry[]>;
  ```
  `WeightLogEntry` structurally satisfies Task 2's `WeightLogPoint` (superset: adds `id`), so `fetchRecentWeightLogs`'s result can be passed directly into `computeAdjustedTargets` with no mapping. Task 4's `weight-log.tsx` calls both functions; Task 5's `generate-plan.tsx` calls `fetchRecentWeightLogs`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/weightLogData.test.ts`:

```ts
import { logWeight, fetchRecentWeightLogs } from '../lib/weightLogData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('logWeight', () => {
  it('inserts a weight log row for the user with the given date', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await logWeight('user-1', 79.5, '2026-01-15');

    expect(supabase.from).toHaveBeenCalledWith('weight_logs');
    expect(insert).toHaveBeenCalledWith({ user_id: 'user-1', weight_kg: 79.5, logged_at: '2026-01-15' });
  });

  it('throws on a Supabase error', async () => {
    const insert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await expect(logWeight('user-1', 79.5, '2026-01-15')).rejects.toThrow('boom');
  });
});

describe('fetchRecentWeightLogs', () => {
  it('maps rows to the WeightLogEntry shape, most recent first', async () => {
    const limit = jest.fn().mockResolvedValue({
      data: [
        { id: 'w2', logged_at: '2026-01-15', weight_kg: 79 },
        { id: 'w1', logged_at: '2026-01-01', weight_kg: 80 },
      ],
      error: null,
    });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecentWeightLogs('user-1');

    expect(result).toEqual([
      { id: 'w2', loggedAt: '2026-01-15', weightKg: 79 },
      { id: 'w1', loggedAt: '2026-01-01', weightKg: 80 },
    ]);
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(order).toHaveBeenCalledWith('logged_at', { ascending: false });
    expect(limit).toHaveBeenCalledWith(10);
  });

  it('throws on a Supabase error', async () => {
    const limit = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchRecentWeightLogs('user-1')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/weightLogData.test.ts
```

Expected: FAIL — `Cannot find module '../lib/weightLogData'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the persistence layer**

Create `src/lib/weightLogData.ts`:

```ts
import { supabase } from './supabase';

export type WeightLogEntry = {
  id: string;
  loggedAt: string;
  weightKg: number;
};

export async function logWeight(userId: string, weightKg: number, loggedAt?: string): Promise<void> {
  const { error } = await supabase.from('weight_logs').insert({
    user_id: userId,
    weight_kg: weightKg,
    logged_at: loggedAt ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}

export async function fetchRecentWeightLogs(userId: string, limit = 10): Promise<WeightLogEntry[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('id, logged_at, weight_kg')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    loggedAt: row.logged_at,
    weightKg: row.weight_kg,
  }));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/weightLogData.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weightLogData.ts src/__tests__/weightLogData.test.ts
git commit -m "Add weight log persistence layer"
```

---

### Task 4: Weight log screen and home screen navigation

**Files:**
- Create: `src/app/weight-log.tsx`
- Modify: `src/app/home.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Plan 1); `logWeight`, `fetchRecentWeightLogs`, `WeightLogEntry` (Task 3).
- Produces: route `/weight-log`; `home.tsx` gains a link to it. Task 5 doesn't consume anything from this task — it's independent of the generation wiring.

- [ ] **Step 1: Create the weight log screen**

Create `src/app/weight-log.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';

export default function WeightLogScreen() {
  const { session, loading } = useAuth();
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const recent = await fetchRecentWeightLogs(session.user.id);
      setLogs(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSubmit = async () => {
    setError(null);
    const weightNum = Number(weightInput);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setError('Poids invalide.');
      return;
    }
    if (!session) return;

    setSubmitting(true);
    try {
      await logWeight(session.user.id, weightNum);
      setWeightInput('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Suivi de poids</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Poids (kg)"
        value={weightInput}
        onChangeText={setWeightInput}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={submitting ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSubmit} disabled={submitting} />

      <Text style={styles.historyTitle}>Historique</Text>
      {logs.length === 0 && <Text>Aucune pesée enregistrée.</Text>}
      {logs.map((log) => (
        <View key={log.id} style={styles.row}>
          <Text>{log.loggedAt}</Text>
          <Text>{log.weightKg} kg</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 8, marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  error: { color: 'red', marginBottom: 12 },
});
```

- [ ] **Step 2: Add the navigation link**

In `src/app/home.tsx`, the nav block currently reads (added in Plans 3-4):

```tsx
        <Link href="/generate-plan">Générer le plan de la semaine</Link>
        <Link href="/plan">Voir mon plan</Link>
        <Link href="/workout">Mon programme de musculation</Link>
```

Replace it with:

```tsx
        <Link href="/generate-plan">Générer le plan de la semaine</Link>
        <Link href="/plan">Voir mon plan</Link>
        <Link href="/workout">Mon programme de musculation</Link>
        <Link href="/weight-log">Suivi de poids</Link>
```

- [ ] **Step 3: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/weight-log
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/home
```

Expected: both `200`. Stop the server once confirmed. (Logging a real weight entry and seeing it appear in history requires a human with a real browser or Expo Go.)

- [ ] **Step 4: Commit**

```bash
git add src/app/weight-log.tsx src/app/home.tsx
git commit -m "Add weight log screen and home screen navigation"
```

---

### Task 5: Wire progress-based adjustment into meal plan generation

**Files:**
- Modify: `src/app/generate-plan.tsx`

**Interfaces:**
- Consumes: `fetchRecentWeightLogs` (Task 3); `computeAdjustedTargets` (Task 2).
- Produces: the complete Plan 5 user flow — this is the final integration point of the whole project. `generate-plan.tsx`'s calorie target now reflects both the user's profile (Plan 2) and their logged progress (this plan) before Plan 3's generation algorithm ever sees a number.

- [ ] **Step 1: Add the imports**

In `src/app/generate-plan.tsx`, the imports currently read:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Button, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, saveWeeklyPlan } from '../lib/mealPlanData';
import { generateWeeklyPlan, type MealSlot, type MealType } from '../lib/mealPlan';
```

Add two more import lines after the `mealPlanData` import:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Button, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, saveWeeklyPlan } from '../lib/mealPlanData';
import { fetchRecentWeightLogs } from '../lib/weightLogData';
import { computeAdjustedTargets } from '../lib/progressTracking';
import { generateWeeklyPlan, type MealSlot, type MealType } from '../lib/mealPlan';
```

- [ ] **Step 2: Apply the progress-based adjustment**

Inside `handleGenerate`, the current code reads:

```tsx
      const targets = computeTargetsFromProfile(profile, trainingProfile);
      const recipes = await fetchRecipes();
```

Replace it with:

```tsx
      const baseTargets = computeTargetsFromProfile(profile, trainingProfile);
      const weightLogs = await fetchRecentWeightLogs(session.user.id);
      const targets = computeAdjustedTargets(baseTargets, profile.goal, profile.weightKg, weightLogs);
      const recipes = await fetchRecipes();
```

Every line below this in `handleGenerate` (the `recipeOptions` mapping, the `slots` construction, `generateWeeklyPlan(targets.calories, ...)`, `saveWeeklyPlan(session.user.id, targets, entries)`) is unchanged — `targets` still has the same `MacroTargets` shape (`{calories, proteinG, fatG, carbsG}`), just recomputed from the adjusted calorie figure when a deviation was found.

- [ ] **Step 3: Run the full automated test suite**

```bash
npx jest
```

Expected: all tests pass (smoke, auth-context, nutrition, targets, profile, mealPlan, mealPlanData, workoutTemplate, workoutProgramData, progressTracking, weightLogData — 11 test files, no regressions).

- [ ] **Step 4: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/generate-plan
```

Expected: `200`. Stop the server once confirmed. (Confirming the calorie target actually shifts after logging a weight trend requires a human with a real browser or Expo Go, a completed profile, and at least two logged weights spanning more than a day.)

- [ ] **Step 5: Commit**

```bash
git add src/app/generate-plan.tsx
git commit -m "Wire progress-based calorie adjustment into meal plan generation"
```

---

## Plan Complete

At the end of this plan — and the end of the whole 5-plan project — a signed-in user can: sign up and complete their profile (Plan 1-2); generate a weekly meal plan matched to their calorie/macro targets, swap meals, and get a grocery list (Plan 3); get a strength program matched to their training profile (Plan 4); and log their weight over time so that the next meal plan generation automatically nudges their calorie target based on whether their actual progress matches their goal (this plan) — closing the loop the original design spec described from the very first brainstorming session.

