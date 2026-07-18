# Profile & Nutrition Calculation (Plan 2 of 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user complete a one-time onboarding form (physical stats, goal, training availability), persist it to Supabase, and see their computed daily calorie/macro targets — the nutrition engine every later plan (meal generation, progress recalculation) will call.

**Architecture:** A pure, dependency-free calculation module (`src/lib/nutrition.ts`) implements the BMR → TDEE → target-calories → macros pipeline exactly as specified. A thin data-access module (`src/lib/profile.ts`) maps between that module's camelCase types and Supabase's snake_case columns for two new tables (`profiles`, `training_profile`), both protected by Row Level Security. A single onboarding screen collects all fields at once (no multi-step wizard — YAGNI) and writes both tables; the home screen becomes profile-aware, redirecting to onboarding when no profile exists yet and otherwise showing the computed targets.

**Tech Stack:** Same as Plan 1 (Expo/React Native/TypeScript, Expo Router, Supabase JS client, Jest). No new dependencies — enum-style fields use a small custom pill-selector component instead of adding a picker library.

## Global Constraints

- Client is React Native via Expo, targeting iOS and Android from one codebase.
- Backend is Supabase (Postgres + Auth + auto-generated API + Row Level Security) — no custom backend server.
- Generation/business logic runs client-side in the Expo app for V1.
- BMR via Mifflin-St Jeor: male = `10×weightKg + 6.25×heightCm − 5×age + 5`; female = `10×weightKg + 6.25×heightCm − 5×age − 161` (per spec's Meal Plan Generation section).
- TDEE = `BMR × activityMultiplier + trainingDaysPerWeek × 200` (per spec: "plus a flat +200 kcal per training day" — training days come from `training_profile`, not asked for twice).
- Goal adjustment: cut = TDEE × (1 − 0.175); bulk = TDEE × (1 + 0.125); maintain = TDEE unchanged (per spec's exact percentages).
- Macros: protein = 2.0 g/kg bodyweight; fat = 28% of target calories; carbs fill the remainder (per spec's exact values).
- `activity_level` has 5 categories (sedentary/light/moderate/active/very_active) with standard Mifflin-compatible multipliers (1.2 / 1.375 / 1.55 / 1.725 / 1.9) — the spec calls for "daily-activity multiplier" without naming the categories or values; this plan fixes them to the widely-used standard scale.
- `training_profile` fields: `days_per_week` (0–7), `experience_level` (beginner/intermediate/advanced), `equipment` (full_gym/home_limited/bodyweight) — per spec's Data Model section.
- All user-owned tables are protected by Postgres Row Level Security so a user can only read/write their own rows (per spec's Security section).
- Project root: `C:\Users\shark\projects\meal-workout-planner`. Routes/lib/tests live under `src/app/`, `src/lib/`, `src/__tests__/` (established in Plan 1). `src/lib/supabase.ts` exports `supabase`; `src/lib/auth-context.tsx` exports `useAuth()` returning `{ session, loading, signUp, signIn, signOut }` (do not change these — Plan 1's interface, already relied upon).

---

## File Structure

```
supabase/
  migrations/
    0001_profile_and_training.sql   # profiles + training_profile tables, RLS policies (applied manually via Supabase SQL Editor)
src/lib/
  nutrition.ts                       # Pure functions: calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacroTargets
  profile.ts                         # Supabase data access: getProfile, upsertProfile, getTrainingProfile, upsertTrainingProfile
src/components/
  ChoiceGroup.tsx                    # Reusable pill-style single-choice selector (used by onboarding for every enum field)
src/app/
  onboarding.tsx                     # One-screen onboarding form; writes profiles + training_profile, then navigates to /home
  home.tsx                           # MODIFIED: redirects to /onboarding if no profile yet; otherwise shows computed targets
src/__tests__/
  nutrition.test.ts                  # Unit tests for the calculation pipeline (known reference values)
  profile.test.ts                    # Unit tests for profile.ts against a mocked Supabase client
```

---

### Task 1: Supabase schema for profiles and training_profile

**Files:**
- Create: `supabase/migrations/0001_profile_and_training.sql`

**Interfaces:**
- Produces: Postgres tables `profiles` (columns: `id uuid PK/FK→auth.users`, `sex`, `age`, `height_cm`, `weight_kg`, `activity_level`, `goal`, `created_at`, `updated_at`) and `training_profile` (columns: `user_id uuid PK/FK→auth.users`, `days_per_week`, `experience_level`, `equipment`, `created_at`, `updated_at`), both RLS-protected. Task 3's `profile.ts` reads/writes these exact column names.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0001_profile_and_training.sql`:

```sql
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
```

- [ ] **Step 2: Apply the migration (manual — needs Supabase dashboard access)**

This step needs the human partner's Supabase account and can't be scripted:

1. Open the Supabase dashboard for this project, go to the **SQL Editor**.
2. Paste the full contents of `supabase/migrations/0001_profile_and_training.sql` and run it.
3. Confirm no errors were reported, and that `profiles` and `training_profile` now appear under **Table Editor**.

- [ ] **Step 3: Verify the tables are exposed via the REST API**

Run (substituting your actual `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env`):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=*" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"

curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/training_profile?select=*" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: both print `200` (an unauthenticated anon request against an RLS-protected table returns an empty array with 200, not an error — this confirms the tables exist and are exposed, not that RLS is bypassed). A `404` means the migration wasn't applied; a `401`/`403` means the anon key or RLS grant is misconfigured.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_profile_and_training.sql
git commit -m "Add profiles and training_profile schema with RLS"
```

---

### Task 2: Nutrition calculation engine (TDD)

**Files:**
- Create: `src/lib/nutrition.ts`
- Test: `src/__tests__/nutrition.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no I/O).
- Produces:
  ```ts
  export type Sex = 'male' | 'female';
  export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  export type Goal = 'cut' | 'bulk' | 'maintain';

  export type MacroTargets = {
    calories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
  };

  export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number;
  export function calculateTDEE(bmr: number, activityLevel: ActivityLevel, trainingDaysPerWeek: number): number;
  export function calculateTargetCalories(tdee: number, goal: Goal): number;
  export function calculateMacroTargets(targetCalories: number, weightKg: number): MacroTargets;
  ```
  Task 4 and Task 5 import `Sex`, `ActivityLevel`, `Goal` for form typing, and Task 5 calls all four functions in sequence to compute and display the summary.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/nutrition.test.ts`:

```ts
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacroTargets,
} from '../lib/nutrition';

describe('calculateBMR', () => {
  it('computes male BMR via Mifflin-St Jeor', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR('male', 80, 180, 30)).toBeCloseTo(1780, 5);
  });

  it('computes female BMR via Mifflin-St Jeor', () => {
    // 10*65 + 6.25*165 - 5*25 - 161 = 650 + 1031.25 - 125 - 161 = 1395.25
    expect(calculateBMR('female', 65, 165, 25)).toBeCloseTo(1395.25, 5);
  });
});

describe('calculateTDEE', () => {
  it('applies the activity multiplier and adds 200 kcal per training day', () => {
    // 1780 * 1.55 + 4*200 = 2759 + 800 = 3559
    expect(calculateTDEE(1780, 'moderate', 4)).toBeCloseTo(3559, 5);
  });

  it('adds nothing extra with zero training days', () => {
    // 1395.25 * 1.375 + 0 = 1918.46875
    expect(calculateTDEE(1395.25, 'light', 0)).toBeCloseTo(1918.46875, 5);
  });

  it('uses the sedentary multiplier (1.2)', () => {
    expect(calculateTDEE(1000, 'sedentary', 0)).toBeCloseTo(1200, 5);
  });

  it('uses the very_active multiplier (1.9)', () => {
    expect(calculateTDEE(1000, 'very_active', 0)).toBeCloseTo(1900, 5);
  });
});

describe('calculateTargetCalories', () => {
  it('reduces calories by 17.5% for a cut goal', () => {
    expect(calculateTargetCalories(3559, 'cut')).toBeCloseTo(3559 * 0.825, 5);
  });

  it('increases calories by 12.5% for a bulk goal', () => {
    expect(calculateTargetCalories(3559, 'bulk')).toBeCloseTo(3559 * 1.125, 5);
  });

  it('leaves calories unchanged for a maintain goal', () => {
    expect(calculateTargetCalories(3559, 'maintain')).toBeCloseTo(3559, 5);
  });
});

describe('calculateMacroTargets', () => {
  it('computes protein at 2.0 g/kg, fat at 28% of calories, carbs filling the remainder', () => {
    // weight 80kg -> protein 160g -> 640 kcal
    // fat: 0.28 * 3559 = 996.52 kcal -> 110.7244 g -> rounds to 111
    // carbs: 3559 - 640 - 996.52 = 1922.48 kcal -> 480.62 g -> rounds to 481
    const result = calculateMacroTargets(3559, 80);
    expect(result).toEqual({
      calories: 3559,
      proteinG: 160,
      fatG: 111,
      carbsG: 481,
    });
  });

  it('never returns negative carbs even for an extreme low-calorie/high-weight input', () => {
    // protein 2*150=300g=1200kcal, fat 0.28*1000=280kcal -> already exceeds 1000 kcal target
    const result = calculateMacroTargets(1000, 150);
    expect(result.carbsG).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/nutrition.test.ts
```

Expected: FAIL — `Cannot find module '../lib/nutrition'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the calculation engine**

Create `src/lib/nutrition.ts`:

```ts
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'cut' | 'bulk' | 'maintain';

export type MacroTargets = {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  cut: -0.175,
  bulk: 0.125,
  maintain: 0,
};

const KCAL_PER_TRAINING_DAY = 200;
const PROTEIN_G_PER_KG = 2.0;
const FAT_PERCENT_OF_CALORIES = 0.28;

export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
  trainingDaysPerWeek: number
): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel] + trainingDaysPerWeek * KCAL_PER_TRAINING_DAY;
}

export function calculateTargetCalories(tdee: number, goal: Goal): number {
  return tdee * (1 + GOAL_ADJUSTMENTS[goal]);
}

export function calculateMacroTargets(targetCalories: number, weightKg: number): MacroTargets {
  const proteinG = PROTEIN_G_PER_KG * weightKg;
  const proteinKcal = proteinG * 4;
  const fatKcal = FAT_PERCENT_OF_CALORIES * targetCalories;
  const fatG = fatKcal / 9;
  const carbsKcal = Math.max(0, targetCalories - proteinKcal - fatKcal);
  const carbsG = carbsKcal / 4;

  return {
    calories: Math.round(targetCalories),
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/nutrition.test.ts
```

Expected: `11 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/nutrition.ts src/__tests__/nutrition.test.ts
git commit -m "Add nutrition calculation engine"
```

---

### Task 3: Profile data access layer (TDD, mocked Supabase client)

**Files:**
- Create: `src/lib/profile.ts`
- Test: `src/__tests__/profile.test.ts`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts` (Plan 1); `Sex`, `ActivityLevel`, `Goal` from `src/lib/nutrition.ts` (Task 2).
- Produces:
  ```ts
  export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
  export type Equipment = 'full_gym' | 'home_limited' | 'bodyweight';

  export type Profile = {
    sex: Sex;
    age: number;
    heightCm: number;
    weightKg: number;
    activityLevel: ActivityLevel;
    goal: Goal;
  };

  export type TrainingProfile = {
    daysPerWeek: number;
    experienceLevel: ExperienceLevel;
    equipment: Equipment;
  };

  export function getProfile(userId: string): Promise<Profile | null>;
  export function upsertProfile(userId: string, profile: Profile): Promise<void>;
  export function getTrainingProfile(userId: string): Promise<TrainingProfile | null>;
  export function upsertTrainingProfile(userId: string, trainingProfile: TrainingProfile): Promise<void>;
  ```
  Task 4 (onboarding form) calls `upsertProfile`/`upsertTrainingProfile`; Task 5 (home screen) calls `getProfile`/`getTrainingProfile`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/profile.test.ts`:

```ts
import { getProfile, upsertProfile, getTrainingProfile, upsertTrainingProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function mockSelectChain(result: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select, eq, maybeSingle };
}

describe('profile data access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProfile returns null when no row exists', async () => {
    const chain = mockSelectChain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getProfile('user-1');

    expect(result).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('getProfile maps a row to the Profile shape', async () => {
    const chain = mockSelectChain({
      data: {
        sex: 'male',
        age: 30,
        height_cm: 180,
        weight_kg: 80,
        activity_level: 'moderate',
        goal: 'cut',
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getProfile('user-1');

    expect(result).toEqual({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderate',
      goal: 'cut',
    });
  });

  it('getProfile throws on a Supabase error', async () => {
    const chain = mockSelectChain({ data: null, error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    await expect(getProfile('user-1')).rejects.toThrow('boom');
  });

  it('upsertProfile calls upsert with snake_case columns', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await upsertProfile('user-1', {
      sex: 'female',
      age: 25,
      heightCm: 165,
      weightKg: 60,
      activityLevel: 'light',
      goal: 'maintain',
    });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(upsert).toHaveBeenCalledWith({
      id: 'user-1',
      sex: 'female',
      age: 25,
      height_cm: 165,
      weight_kg: 60,
      activity_level: 'light',
      goal: 'maintain',
    });
  });

  it('upsertProfile throws on a Supabase error', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await expect(
      upsertProfile('user-1', {
        sex: 'female',
        age: 25,
        heightCm: 165,
        weightKg: 60,
        activityLevel: 'light',
        goal: 'maintain',
      })
    ).rejects.toThrow('boom');
  });

  it('getTrainingProfile maps a row to the TrainingProfile shape', async () => {
    const chain = mockSelectChain({
      data: { days_per_week: 4, experience_level: 'intermediate', equipment: 'full_gym' },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getTrainingProfile('user-1');

    expect(result).toEqual({ daysPerWeek: 4, experienceLevel: 'intermediate', equipment: 'full_gym' });
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('getTrainingProfile returns null when no row exists', async () => {
    const chain = mockSelectChain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getTrainingProfile('user-1');

    expect(result).toBeNull();
  });

  it('upsertTrainingProfile calls upsert with snake_case columns', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await upsertTrainingProfile('user-1', {
      daysPerWeek: 3,
      experienceLevel: 'beginner',
      equipment: 'bodyweight',
    });

    expect(supabase.from).toHaveBeenCalledWith('training_profile');
    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      days_per_week: 3,
      experience_level: 'beginner',
      equipment: 'bodyweight',
    });
  });

  it('upsertTrainingProfile throws on a Supabase error', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await expect(
      upsertTrainingProfile('user-1', {
        daysPerWeek: 3,
        experienceLevel: 'beginner',
        equipment: 'bodyweight',
      })
    ).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest src/__tests__/profile.test.ts
```

Expected: FAIL — `Cannot find module '../lib/profile'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the data access layer**

Create `src/lib/profile.ts`:

```ts
import { supabase } from './supabase';
import type { Sex, ActivityLevel, Goal } from './nutrition';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'full_gym' | 'home_limited' | 'bodyweight';

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export type TrainingProfile = {
  daysPerWeek: number;
  experienceLevel: ExperienceLevel;
  equipment: Equipment;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('sex, age, height_cm, weight_kg, activity_level, goal')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    sex: data.sex,
    age: data.age,
    heightCm: data.height_cm,
    weightKg: data.weight_kg,
    activityLevel: data.activity_level,
    goal: data.goal,
  };
}

export async function upsertProfile(userId: string, profile: Profile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    sex: profile.sex,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    activity_level: profile.activityLevel,
    goal: profile.goal,
  });
  if (error) throw error;
}

export async function getTrainingProfile(userId: string): Promise<TrainingProfile | null> {
  const { data, error } = await supabase
    .from('training_profile')
    .select('days_per_week, experience_level, equipment')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    daysPerWeek: data.days_per_week,
    experienceLevel: data.experience_level,
    equipment: data.equipment,
  };
}

export async function upsertTrainingProfile(userId: string, trainingProfile: TrainingProfile): Promise<void> {
  const { error } = await supabase.from('training_profile').upsert({
    user_id: userId,
    days_per_week: trainingProfile.daysPerWeek,
    experience_level: trainingProfile.experienceLevel,
    equipment: trainingProfile.equipment,
  });
  if (error) throw error;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/profile.test.ts
```

Expected: `9 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/profile.ts src/__tests__/profile.test.ts
git commit -m "Add profile data access layer"
```

---

### Task 4: ChoiceGroup component and onboarding screen

**Files:**
- Create: `src/components/ChoiceGroup.tsx`
- Create: `src/app/onboarding.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/lib/auth-context.tsx` (Plan 1); `upsertProfile`, `upsertTrainingProfile` from `src/lib/profile.ts` (Task 3); `Sex`, `ActivityLevel`, `Goal` from `src/lib/nutrition.ts` (Task 2); `ExperienceLevel`, `Equipment` from `src/lib/profile.ts` (Task 3).
- Produces: route `/onboarding`; `ChoiceGroup` component reusable by any future screen needing a single-choice pill selector. Task 5 links to `/onboarding` via redirect.

- [ ] **Step 1: Create the ChoiceGroup component**

Create `src/components/ChoiceGroup.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function ChoiceGroup<T extends string>({ options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.pill, value === option.value && styles.pillSelected]}
        >
          <Text style={value === option.value ? styles.labelSelected : styles.label}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: { borderWidth: 1, borderColor: '#888', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  pillSelected: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  label: { color: '#333' },
  labelSelected: { color: '#fff' },
});
```

- [ ] **Step 2: Create the onboarding screen**

Create `src/app/onboarding.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';
import type { ExperienceLevel, Equipment } from '../lib/profile';
import { ChoiceGroup } from '../components/ChoiceGroup';
import type { Sex, ActivityLevel, Goal } from '../lib/nutrition';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light', label: 'Légère' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Très active' },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'cut', label: 'Sèche' },
  { value: 'maintain', label: 'Maintien' },
  { value: 'bulk', label: 'Prise de masse' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'full_gym', label: 'Salle complète' },
  { value: 'home_limited', label: 'Maison (matériel limité)' },
  { value: 'bodyweight', label: 'Poids du corps' },
];

export default function OnboardingScreen() {
  const { session, loading } = useAuth();
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const handleSubmit = async () => {
    setError(null);

    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);
    const daysNum = Number(daysPerWeek);

    if (!sex || !activityLevel || !goal || !experienceLevel || !equipment) {
      setError('Merci de remplir tous les champs.');
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum >= 120) {
      setError('Âge invalide.');
      return;
    }
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      setError('Taille invalide.');
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setError('Poids invalide.');
      return;
    }
    if (!Number.isInteger(daysNum) || daysNum < 0 || daysNum > 7) {
      setError("Jours d'entraînement invalides (0 à 7).");
      return;
    }
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertProfile(session.user.id, {
        sex,
        age: ageNum,
        heightCm: heightNum,
        weightKg: weightNum,
        activityLevel,
        goal,
      });
      await upsertTrainingProfile(session.user.id, {
        daysPerWeek: daysNum,
        experienceLevel,
        equipment,
      });
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Sexe</Text>
      <ChoiceGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />

      <Text style={styles.label}>Âge</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />

      <Text style={styles.label}>Taille (cm)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />

      <Text style={styles.label}>Poids (kg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />

      <Text style={styles.label}>Niveau d'activité quotidienne</Text>
      <ChoiceGroup options={ACTIVITY_OPTIONS} value={activityLevel} onChange={setActivityLevel} />

      <Text style={styles.label}>Objectif</Text>
      <ChoiceGroup options={GOAL_OPTIONS} value={goal} onChange={setGoal} />

      <Text style={styles.label}>Jours d'entraînement / semaine</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={daysPerWeek} onChangeText={setDaysPerWeek} />

      <Text style={styles.label}>Niveau</Text>
      <ChoiceGroup options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={setExperienceLevel} />

      <Text style={styles.label}>Matériel disponible</Text>
      <ChoiceGroup options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title={submitting ? 'Enregistrement...' : 'Valider'} onPress={handleSubmit} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  label: { marginTop: 16, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 8, marginBottom: 8 },
  error: { color: 'red', marginTop: 16 },
});
```

- [ ] **Step 3: Verify the screen renders without a server-side crash**

```bash
npx expo start --web
```

In another terminal (or after backgrounding), request the route:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/onboarding
```

Expected: `200`. Stop the dev server once confirmed. (Full interactive verification — filling the form, submitting, seeing the redirect — requires a human with a real browser or Expo Go, same limitation as Plan 1.)

- [ ] **Step 4: Commit**

```bash
git add src/components/ChoiceGroup.tsx src/app/onboarding.tsx
git commit -m "Add onboarding screen"
```

---

### Task 5: Home screen — profile gate and target summary

**Files:**
- Modify: `src/app/home.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Plan 1); `getProfile`, `getTrainingProfile` from `src/lib/profile.ts` (Task 3); `calculateBMR`, `calculateTDEE`, `calculateTargetCalories`, `calculateMacroTargets` from `src/lib/nutrition.ts` (Task 2).
- Produces: the complete Plan 2 user flow — this is the deliverable this plan builds toward.

- [ ] **Step 1: Replace home.tsx with the profile-aware version**

Replace the contents of `src/app/home.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacroTargets,
  type MacroTargets,
} from '../lib/nutrition';

export default function HomeScreen() {
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    let cancelled = false;

    (async () => {
      try {
        const [profile, trainingProfile] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
        ]);

        if (cancelled) return;

        if (!profile || !trainingProfile) {
          router.replace('/onboarding');
          return;
        }

        const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, profile.age);
        const tdee = calculateTDEE(bmr, profile.activityLevel, trainingProfile.daysPerWeek);
        const targetCalories = calculateTargetCalories(tdee, profile.goal);
        setMacros(calculateMacroTargets(targetCalories, profile.weightKg));
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
        }
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, session]);

  if (loading || !session || checkingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Connecté : {session.user.email}</Text>
      {loadError && <Text style={{ color: 'red' }}>{loadError}</Text>}
      {macros && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text>Calories cibles : {macros.calories} kcal</Text>
          <Text>Protéines : {macros.proteinG} g</Text>
          <Text>Lipides : {macros.fatG} g</Text>
          <Text>Glucides : {macros.carbsG} g</Text>
        </View>
      )}
      <View style={{ marginTop: 16 }}>
        <Button title="Se déconnecter" onPress={signOut} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Run the full automated test suite**

```bash
npx jest
```

Expected: all tests pass (smoke, auth-context, nutrition, profile — 5 test files, no regressions from Plan 1).

- [ ] **Step 3: Verify no server-side crash**

```bash
npx expo start --web
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/home
```

Expected: `200`. Stop the dev server once confirmed. (Seeing the actual redirect-to-onboarding and the computed macro numbers on screen requires a human with a real browser or Expo Go, completing the onboarding form from Task 4 first.)

- [ ] **Step 4: Commit**

```bash
git add src/app/home.tsx
git commit -m "Wire home screen to profile gate and nutrition summary"
```

---

## Plan Complete

At the end of this plan: a signed-in user with no profile is redirected to `/onboarding`, fills in their physical stats/goal/training availability once, and lands on `/home` seeing their computed daily calorie and macro targets — with `src/lib/nutrition.ts`'s pure functions and `src/lib/profile.ts`'s typed accessors as the stable interfaces Plan 3 (meal generation) will build its calorie-matching algorithm on top of.
