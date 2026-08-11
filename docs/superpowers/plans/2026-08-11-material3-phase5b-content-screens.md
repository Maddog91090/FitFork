# FitFork — Phase 5b: Content Screens and PressableScale Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 5 remaining content/detail screens and `BackLink.tsx` onto Material 3 tokens, remove the mascot from its last 3 placements, and retire `PressableScale`/`motion.spring.snappy` entirely once nothing consumes them anymore.

**Architecture:** Same additive-token, same-mapping-table approach as Phase 5a — each screen swaps `useThemeColors()`/`typography` for `useMaterialColors()`/`useMaterialTertiary()`/`materialTypography`. `BackLink.tsx` is rebuilt onto `Pressable`+`android_ripple` (matching `Button`'s Phase 4 pattern) since it's the last production consumer of `PressableScale` outside the two pinpoint spots in `home.tsx`/`workout.tsx`. Once every consumer (5 screens' own interactive elements, `BackLink.tsx`, and those 2 pinpoint spots) is converted, `PressableScale.tsx` and `motion.spring.snappy` have zero remaining references and are deleted.

**Tech Stack:** Expo Router, `@expo/vector-icons`'s `MaterialIcons` (already used throughout since Phase 4/5a), the global `__mocks__/@expo/vector-icons.js` manual mock (added in Phase 5a's final-review fix wave — auto-applied to every test file, no per-file `jest.mock()` needed for new icon assertions).

## Global Constraints

- `npx tsc --noEmit` and `npx jest` must both be clean before any task is considered done. **Run both once at the very start of Task 1** and record the exact baseline error/test counts — do not assume a number from an earlier phase, since it drifts slightly each phase. Every later task compares against that freshly-recorded baseline, not a guess.
- No EAS build is triggered automatically.
- Every touchable element keeps a 48dp minimum size (`state.minTouchSize`) and an explicit `accessibilityRole`.
- `useReducedMotion` no longer needs verification for anything this plan touches — `android_ripple` is a native OS-level effect that already respects Remove Animations on its own (established in Phase 4), and once `PressableScale` is deleted (Task 8) there is nothing left in this plan's scope that uses Reanimated-driven motion.
- `MacroIcon`, `Mascot.tsx` (the component file itself) are not modified, removed, or renamed by any task in this plan.
- Every route URL stays the same — no file moves in this plan (unlike Phase 5a's `weight-log.tsx` move).

## Color and typography mapping — identical to Phase 5a, apply consistently

| Old (`useThemeColors()` field) | New | Notes |
| --- | --- | --- |
| `bgBase` | `useMaterialColors().background` | |
| `bgSurface` | `useMaterialColors().surface` | |
| `bgSunken` | `useMaterialColors().surfaceVariant` | |
| `textPrimary` | `useMaterialColors().onSurface` | |
| `textSecondary` | `useMaterialColors().onSurfaceVariant` | |
| `textTertiary` | `lightColors.textTertiary` (static) | no Material role |
| `divider` / `border` | `useMaterialColors().outlineVariant` | |
| `borderStrong` | `useMaterialColors().outline` | |
| `error` | `useMaterialColors().error` | |
| `textOnAccent` (text on a domain fill) | `useMaterialTertiary('X').onTertiary` | |
| `domainX` (base tone — fills, badges, spinners) | `useMaterialTertiary('X').tertiary` | same hex, direct role rename |
| `domainXDeep` (body-text-sized colored text) | `useMaterialTertiary('X').tertiaryContainer` | same hex — `tertiaryContainer`'s value IS the old `*Deep` hex |
| `shadow.card` (on a raw View, not wrapped in `<Card>`) | `materialElevation` | single neutral tier, matches how `Card` itself now renders elevation |

`typography.*` → `materialTypography.*`: `hero→displayLarge`, `display→displayMedium`, `title→titleLarge`, `metric→headlineLarge`, `heading→titleMedium`, `subheading→titleSmall`, `body→bodyLarge`, `bodyStrong→bodyMedium`, `label→labelLarge`, `caption→labelMedium`, `captionStrong→labelSmall`, `overline→overline`.

**Ripple convention** (from Phase 4's `withRippleAlpha` helper, `src/theme/tokens.ts`): `android_ripple={{ color: withRippleAlpha(hex) }}` adds ~12% alpha to a hex color. Use the domain's `tertiary` or `tertiaryContainer` (whichever matches that element's own text/fill color) for domain-branded interactive elements; use `colors.onSurfaceVariant` for neutral, non-domain-branded links (`BackLink`, "Quitter"/"Annuler"-style text links).

---

### Task 1: Rebuild `BackLink.tsx` on Material tokens

**Files:**
- Modify: `src/components/ui/BackLink.tsx`
- Test: `src/__tests__/BackLink.test.tsx` (verify unchanged — read it first; no test code changes needed since its one test only checks `router.back()` fires, which doesn't depend on styling)

**Interfaces:**
- Consumes: `useMaterialColors()`, `materialTypography`, `withRippleAlpha`, `type MaterialColorScheme` (Phase 4, `src/theme/tokens.ts`).
- Produces: `BackLink` component — **zero props, same as before** (`<BackLink />`). Every consumer (`generate-plan.tsx`, `recipe/[id].tsx`, `exercise/[id].tsx`, `progression.tsx`, `weight-log.tsx`) needs no changes to its own call sites.

- [ ] **Step 1: Record the baseline**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` and `npx jest 2>&1 | tail -6`
Record both counts (error count and suite/test counts) — write them down, you'll compare against these exact numbers in every later task's verification step, not a number from a previous phase.

- [ ] **Step 2: Run the existing test to confirm it passes against the current component**

Run: `npx jest src/__tests__/BackLink.test.tsx`
Expected: PASS (1 test) — this establishes the pre-migration baseline for this specific file; the test doesn't assert on styling or `PressableScale`-specific behavior, so it should pass both before and after your rewrite. The real verification is Step 4.

- [ ] **Step 3: Rewrite `src/components/ui/BackLink.tsx` in full**

```tsx
import { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  materialTypography,
  state,
  useMaterialColors,
  withRippleAlpha,
  type MaterialColorScheme,
} from '../../theme/tokens';

/** A "go back" link for a pushed screen that has no other way back — same visual pattern as workout-session.tsx's "Quitter". */
export function BackLink() {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      hitSlop={state.hitSlop}
      android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant) }}
      style={styles.touchable}
    >
      <Text style={styles.label}>‹ Retour</Text>
    </Pressable>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    touchable: { minHeight: state.minTouchSize, justifyContent: 'center', alignSelf: 'flex-start' },
    label: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant },
  });
}
```

Note what this drops: the `PressableScale` import, and the `typography`/`useThemeColors`/`ThemeColors` imports from the old system.

- [ ] **Step 4: Run the test again to confirm it still passes**

Run: `npx jest src/__tests__/BackLink.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `BackLink.tsx` or any of its 5 consumers (`generate-plan.tsx`, `recipe/[id].tsx`, `exercise/[id].tsx`, `progression.tsx`, `weight-log.tsx`) — confirms the zero-prop API is preserved exactly.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/BackLink.tsx
git commit -m "feat: rebuild BackLink on Material tokens with native ripple"
```

---

### Task 2: Migrate `workout-session.tsx` — Material tokens, celebration icon, own ripple

**Files:**
- Modify: `src/app/workout-session.tsx`
- Modify: `src/__tests__/workout-session.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `withRippleAlpha`, `type MaterialColorScheme`, `type MaterialTertiary` (Phase 4). `MaterialIcons` from `@expo/vector-icons`. `Button` (Phase 4, unchanged props).
- Produces: nothing new — leaf screen.

This screen has its own `PressableScale` usage (the "Quitter" exit link) — separate from `BackLink` — that this task converts directly.

- [ ] **Step 1: Add a new test for the celebration icon**

There's no existing test asserting on the mascot in this file. Add one new `it` block to `src/__tests__/workout-session.test.tsx`, inside the existing `describe('WorkoutSessionScreen', ...)` block, after the `'logs completion and returns to the workout tab when finishing'` test:

```tsx
  it('shows a celebration icon on the finished screen', async () => {
    mockParams('beginner', '2');
    const { findByText, getByTestId } = await render(<WorkoutSessionScreen />);

    await fireEvent.press(await findByText('Terminé'));

    expect(await findByText('Séance terminée')).toBeTruthy();
    expect(getByTestId('celebration-icon').props.name).toBe('celebration');
  });
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/workout-session.test.tsx`
Expected: FAIL on the new test — `getByTestId('celebration-icon')` doesn't exist yet (the screen still renders `<Mascot pose="celebrating" .../>` with no such testID); the other existing tests still pass unchanged.

- [ ] **Step 3: Rewrite `src/app/workout-session.tsx` in full**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import type { ExperienceLevel } from '../lib/profile';
import { getLevelProgram } from '../lib/homeWorkoutProgram';
import { buildSessionSteps, type SessionStep } from '../lib/sessionSteps';
import { useStepTimer } from '../lib/useStepTimer';
import { logSessionCompletion } from '../lib/workoutCompletionsData';
import { Button } from '../components/ui/Button';
import {
  centeredContent,
  materialTypography,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  withRippleAlpha,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../theme/tokens';

const VALID_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

function resolveSession(level: string | undefined, sessionIndexParam: string | undefined) {
  if (!level || !sessionIndexParam) return undefined;
  if (!VALID_LEVELS.includes(level as ExperienceLevel)) return undefined;
  const index = Number(sessionIndexParam);
  if (!Number.isInteger(index)) return undefined;
  return getLevelProgram(level as ExperienceLevel).sessions[index];
}

function stepKindLabel(step: Exclude<SessionStep, { kind: 'manual' }>): string {
  if (step.kind === 'work') return step.roundLabel;
  if (step.kind === 'rest') return 'Repos';
  return 'Récupération';
}

function stepHeadline(step: Exclude<SessionStep, { kind: 'manual' }>): string {
  if (step.kind === 'work') return step.exerciseName;
  if (step.kind === 'rest') return `Ensuite : ${step.nextExerciseName}`;
  return `Ensuite : ${step.nextRoundLabel}`;
}

export default function WorkoutSessionScreen() {
  useKeepAwake();
  const colors = useMaterialColors();
  const sport = useMaterialTertiary('sport');
  const styles = useMemo(() => createStyles(colors, sport), [colors, sport]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const params = useLocalSearchParams<{ level: string; sessionIndex: string }>();
  const beepPlayer = useAudioPlayer(require('../../assets/audio/beep.wav'));

  const sessionIndex = Number(params.sessionIndex);
  const workoutSession = resolveSession(params.level, params.sessionIndex);
  const steps = useMemo(() => (workoutSession ? buildSessionSteps(workoutSession) : []), [workoutSession]);

  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentStep: SessionStep | undefined = steps[stepIndex];
  const finished = steps.length > 0 && stepIndex >= steps.length;

  const advance = useCallback(() => setStepIndex((i) => i + 1), []);

  const isTimed = currentStep?.kind === 'work' || currentStep?.kind === 'rest' || currentStep?.kind === 'recovery';
  const timerSeconds = isTimed && currentStep ? currentStep.seconds : 999999;
  const timer = useStepTimer(timerSeconds, advance, stepIndex);

  useEffect(() => {
    if (!isTimed) return;
    if (timer.remainingSeconds > 0 && timer.remainingSeconds <= 5) {
      beepPlayer.seekTo(0);
      beepPlayer.play();
    }
  }, [isTimed, timer.remainingSeconds, beepPlayer]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const handleFinish = async () => {
    if (!session) return;
    setError(null);
    setFinishing(true);
    try {
      await logSessionCompletion(session.user.id, sessionIndex);
      router.replace('/(tabs)/workout');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
      setFinishing(false);
    }
  };

  if (loading || !session) {
    return <View style={styles.screen} />;
  }

  if (!workoutSession) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error}>Séance introuvable.</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.screen}>
        <View style={[styles.finishedContainer, { paddingTop: insets.top }]}>
          <MaterialIcons testID="celebration-icon" name="celebration" size={96} color={sport.tertiary} />
          <Text style={styles.finishedTitle}>Séance terminée</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Marquer la séance comme terminée" onPress={handleFinish} loading={finishing} domain="sport" />
        </View>
      </View>
    );
  }

  if (!currentStep) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.exitRow, { paddingTop: spacing.lg + insets.top }]}>
        <Pressable
          onPress={() => router.replace('/(tabs)/workout')}
          accessibilityRole="button"
          hitSlop={state.hitSlop}
          android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant) }}
          style={styles.exitTouchable}
        >
          <Text style={styles.exitLabel}>Quitter</Text>
        </Pressable>
      </View>
      {currentStep.kind === 'manual' ? (
        <View style={styles.stepContainer}>
          <Text style={styles.exerciseName}>{currentStep.exerciseName}</Text>
          <Text style={styles.detail}>{currentStep.detail}</Text>
          <Button title="Terminé" onPress={advance} />
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <Text style={styles.stepKindLabel}>{stepKindLabel(currentStep)}</Text>
          <Text style={styles.exerciseName}>{stepHeadline(currentStep)}</Text>
          <Text style={styles.countdown}>{timer.remainingSeconds}</Text>
          <View style={styles.controlsRow}>
            <Button
              title={timer.isPaused ? 'Reprendre' : 'Pause'}
              variant="secondary"
              onPress={timer.isPaused ? timer.resume : timer.pause}
            />
            <Button title="Passer" variant="secondary" onPress={advance} />
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, sport: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    error: { ...materialTypography.bodyLarge, color: colors.error },
    exitRow: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, alignItems: 'flex-start' },
    exitTouchable: { minHeight: state.minTouchSize, justifyContent: 'center' },
    exitLabel: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant },
    stepContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      ...centeredContent,
    },
    stepKindLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
    exerciseName: {
      ...materialTypography.displayMedium,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    detail: { ...materialTypography.titleLarge, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.xl },
    countdown: { ...materialTypography.displayLarge, color: sport.tertiary, marginBottom: spacing.xl },
    controlsRow: { flexDirection: 'row', gap: spacing.md },
    finishedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.lg,
      ...centeredContent,
    },
    finishedTitle: { ...materialTypography.displayMedium, color: colors.onSurface, textAlign: 'center' },
  });
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx jest src/__tests__/workout-session.test.tsx`
Expected: PASS (6 tests — 5 existing + the new celebration-icon one).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `workout-session.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add src/app/workout-session.tsx src/__tests__/workout-session.test.tsx
git commit -m "feat: migrate workout-session screen to Material tokens, replace mascot with a celebration icon"
```

---

### Task 3: Migrate `generate-plan.tsx` — Material tokens, encouragement icon, own ripple cells

**Files:**
- Modify: `src/app/generate-plan.tsx`
- Modify: `src/__tests__/generate-plan-screen.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `withRippleAlpha`, `type MaterialColorScheme`, `type MaterialTertiary` (Phase 4). `MaterialIcons` from `@expo/vector-icons`. `Button`, `BackLink` (Task 1, unchanged call site) — unchanged props.
- Produces: nothing new — leaf screen.

This screen's day/meal selection grid uses its own `PressableScale` per cell (28 cells total) — converted here to the same Material filter-chip visual treatment already established for `ChoiceGroup`/`TagFilterGroup` in Phase 4 (unselected = outlined + domain-tinted border/text; selected = filled domain color).

- [ ] **Step 1: Update the test**

Replace the test in `src/__tests__/generate-plan-screen.test.tsx`:

```tsx
  it('shows a refresh icon when generation fails', async () => {
    (fetchRecipes as jest.Mock).mockRejectedValue(new Error('Réseau indisponible'));
    const { getByText, getByTestId } = await render(<GeneratePlanScreen />);
    fireEvent.press(getByText('Générer le plan'));
    await waitFor(() => expect(getByTestId('generate-plan-error-icon')).toBeTruthy());
    expect(getByTestId('generate-plan-error-icon').props.name).toBe('refresh');
  });
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/generate-plan-screen.test.tsx`
Expected: FAIL — `generate-plan-error-icon` doesn't exist yet (still the mascot's `mascot-image` testID).

- [ ] **Step 3: Rewrite `src/app/generate-plan.tsx` in full**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, fetchRecipeIngredients, saveWeeklyPlan } from '../lib/mealPlanData';
import { fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';
import { computeAdjustedTargets } from '../lib/progressTracking';
import { generateWeeklyPlan, DAY_LABELS, type MealSlot, type MealType } from '../lib/mealPlan';
import { Button } from '../components/ui/Button';
import { BackLink } from '../components/ui/BackLink';
import {
  centeredContent,
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  withRippleAlpha,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../theme/tokens';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

function defaultSelection(): boolean[][] {
  return DAY_LABELS.map(() => MEAL_TYPES.map(() => true));
}

export default function GeneratePlanScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors, nutrition), [colors, nutrition]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [selected, setSelected] = useState<boolean[][]>(defaultSelection());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const toggle = (dayIndex: number, mealIndex: number) => {
    setSelected((prev) =>
      prev.map((row, d) => (d === dayIndex ? row.map((v, m) => (m === mealIndex ? !v : v)) : row))
    );
  };

  const handleGenerate = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setGenerating(true);
    try {
      const [profile, trainingProfile] = await Promise.all([
        getProfile(session.user.id),
        getTrainingProfile(session.user.id),
      ]);

      if (!profile || !trainingProfile) {
        router.replace('/onboarding');
        return;
      }

      const baseTargets = computeTargetsFromProfile(profile);
      let weightLogs: WeightLogEntry[] = [];
      try {
        weightLogs = await fetchRecentWeightLogs(session.user.id);
      } catch {
        // Progress tracking is a strictly additive enhancement — if fetching weight
        // history fails for any reason, fall back to the base (unadjusted) targets
        // rather than aborting meal-plan generation entirely.
      }
      const targets = computeAdjustedTargets(baseTargets, profile.goal, profile.weightKg, weightLogs);
      const recipes = await fetchRecipes();
      const allIngredients = await fetchRecipeIngredients(recipes.map((r) => r.id));
      const ingredientNamesByRecipe = new Map<string, string[]>();
      for (const ingredient of allIngredients) {
        const names = ingredientNamesByRecipe.get(ingredient.recipeId) ?? [];
        names.push(ingredient.ingredientName);
        ingredientNamesByRecipe.set(ingredient.recipeId, names);
      }
      const recipeOptions = recipes.map((r) => ({
        id: r.id,
        mealType: r.mealType,
        baseCalories: r.baseCalories,
        baseProteinG: r.baseProteinG,
        baseFatG: r.baseFatG,
        baseCarbsG: r.baseCarbsG,
        ingredientNames: ingredientNamesByRecipe.get(r.id) ?? [],
      }));

      const slots: MealSlot[] = [];
      selected.forEach((row, dayIndex) => {
        row.forEach((isSelected, mealIndex) => {
          if (isSelected) slots.push({ dayIndex, mealType: MEAL_TYPES[mealIndex] });
        });
      });

      const entries = generateWeeklyPlan(targets, slots, recipeOptions);
      await saveWeeklyPlan(session.user.id, targets, entries);
      router.replace('/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de générer ton plan. Réessaie.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />
      <Text style={styles.title}>Choisis les repas à générer</Text>
      {DAY_LABELS.map((dayLabel, dayIndex) => (
        <View key={dayLabel} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((mealType, mealIndex) => {
              const isSelected = selected[dayIndex][mealIndex];
              return (
                <Pressable
                  key={mealType}
                  onPress={() => toggle(dayIndex, mealIndex)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  android_ripple={{
                    color: isSelected ? withRippleAlpha(nutrition.onTertiary) : withRippleAlpha(nutrition.tertiary),
                  }}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                >
                  <Text style={isSelected ? styles.cellLabelSelected : styles.cellLabel}>
                    {MEAL_TYPE_LABELS[mealType]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons
            testID="generate-plan-error-icon"
            name="refresh"
            size={64}
            color={colors.error}
            accessible={false}
          />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      <Button title="Générer le plan" onPress={handleGenerate} loading={generating} domain="nutrition" />
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme, nutrition: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.titleLarge, color: colors.onSurface, marginBottom: spacing.lg },
    dayRow: { marginBottom: spacing.md },
    dayLabel: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    cell: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: nutrition.tertiary,
      borderRadius: radius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: state.minTouchSize,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    cellSelected: { backgroundColor: nutrition.tertiary, borderColor: nutrition.tertiary },
    cellLabel: { ...materialTypography.labelMedium, color: nutrition.tertiary },
    cellLabelSelected: { ...materialTypography.labelSmall, color: nutrition.onTertiary },
    errorContainer: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    error: { ...materialTypography.bodyLarge, color: colors.error, textAlign: 'center' },
  });
}
```

Note the cell style changed from a filled-white-card-with-shadow look to a Material outlined/filled chip (transparent + tertiary border when unselected, filled tertiary when selected) — matching the same visual language `ChoiceGroup`/`TagFilterGroup` already established in Phase 4, since this is the same "selectable chip" interaction pattern. `overflow: 'hidden'` is added so the ripple clips to `radius.sm`, per Phase 4's Important finding about ripple corner-clipping.

- [ ] **Step 4: Run the test to see it pass**

Run: `npx jest src/__tests__/generate-plan-screen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `generate-plan.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add src/app/generate-plan.tsx src/__tests__/generate-plan-screen.test.tsx
git commit -m "feat: migrate generate-plan screen to Material tokens, replace mascot with a refresh icon"
```

---

### Task 4: Migrate `recipe/[id].tsx` — Material tokens

**Files:**
- Modify: `src/app/recipe/[id].tsx`
- Test: `src/__tests__/recipe-detail-screen.test.tsx` (no changes needed — read it first to confirm; its one test only checks the recipe name renders, unaffected by token changes)

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `materialElevation`, `type MaterialColorScheme`, `type MaterialTertiary` (Phase 4). `Card`, `ErrorNotice`, `BackLink` (Task 1, unchanged call site) — unchanged props.
- Produces: nothing new — leaf screen.

- [ ] **Step 1: Run the existing test to confirm it passes against the current component**

Run: `npx jest src/__tests__/recipe-detail-screen.test.tsx`
Expected: PASS (1 test) — baseline before your rewrite; verification is Step 3.

- [ ] **Step 2: Rewrite `src/app/recipe/[id].tsx` in full**

```tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  fetchRecipes,
  fetchRecipeIngredients,
  fetchRecipeInstructions,
  type Recipe,
  type RecipeIngredient,
} from '../../lib/mealPlanData';
import { scaleIngredientQuantity, scaleMacroValue, clampPortionMultiplier } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { BackLink } from '../../components/ui/BackLink';
import {
  centeredContent,
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';

export default function RecipeDetailScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors, nutrition), [colors, nutrition]);
  const insets = useSafeAreaInsets();
  const { id, portion: portionParam } = useLocalSearchParams<{ id: string; portion?: string }>();
  const parsedPortion = Number(portionParam);
  const portionMultiplier =
    Number.isFinite(parsedPortion) && parsedPortion > 0 ? clampPortionMultiplier(parsedPortion) : 1;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [allRecipes, allIngredients, steps] = await Promise.all([
        fetchRecipes(),
        fetchRecipeIngredients([id]),
        fetchRecipeInstructions(id),
      ]);
      setRecipe(allRecipes.find((r) => r.id === id) ?? null);
      setIngredients(allIngredients);
      setInstructions(steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la recette.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <ErrorNotice message={error} onRetry={load} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <Text style={styles.error}>Recette introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.macros}>
        {scaleMacroValue(recipe.baseCalories, portionMultiplier)} kcal — {scaleMacroValue(recipe.baseProteinG, portionMultiplier)}g prot / {scaleMacroValue(recipe.baseFatG, portionMultiplier)}g lip / {scaleMacroValue(recipe.baseCarbsG, portionMultiplier)}g gluc (
        {scaleMacroValue(recipe.baseServingG, portionMultiplier)}g)
      </Text>
      {Math.round(portionMultiplier * 100) !== 100 && (
        <Text style={styles.portionBanner}>
          Portion : {Math.round(portionMultiplier * 100)} % de la recette de base
        </Text>
      )}

      {recipe.imageUrl && (
        <View style={styles.photoFrame}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel={recipe.name}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Ingrédients</Text>
      <Card style={styles.card}>
        {ingredients.map((ing, index) => (
          <Text key={index} style={styles.ingredientLine}>
            {ing.ingredientName} — {scaleIngredientQuantity(ing, portionMultiplier)}
            {ing.unit}
          </Text>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Préparation</Text>
      {instructions.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme, nutrition: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.xs },
    macros: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginBottom: spacing.lg },
    portionBanner: { ...materialTypography.labelSmall, color: nutrition.tertiaryContainer, marginBottom: spacing.lg },
    photoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceVariant,
      marginBottom: spacing.lg,
      overflow: 'hidden',
      ...materialElevation,
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    sectionTitle: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    card: { marginBottom: spacing.sm },
    ingredientLine: { ...materialTypography.bodyLarge, color: colors.onSurface, marginBottom: spacing.xs },
    stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: nutrition.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepBadgeText: { ...materialTypography.overline, color: nutrition.onTertiary, letterSpacing: 0 },
    stepText: { ...materialTypography.bodyLarge, flex: 1, color: colors.onSurface },
    error: { ...materialTypography.bodyLarge, color: colors.error },
  });
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx jest src/__tests__/recipe-detail-screen.test.tsx`
Expected: PASS.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `recipe/[id].tsx`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/recipe/[id].tsx"
git commit -m "feat: migrate recipe detail screen to Material tokens"
```

---

### Task 5: Migrate `exercise/[id].tsx` — Material tokens

**Files:**
- Modify: `src/app/exercise/[id].tsx`
- Test: `src/__tests__/exercise-detail-screen.test.tsx` (no changes needed — read it first to confirm; its one test only checks the exercise name renders)

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `type MaterialColorScheme`, `type MaterialTertiary` (Phase 4). `BackLink` (Task 1, unchanged call site).
- Produces: nothing new — leaf screen.

- [ ] **Step 1: Run the existing test to confirm it passes against the current component**

Run: `npx jest src/__tests__/exercise-detail-screen.test.tsx`
Expected: PASS (1 test) — baseline; verification is Step 3.

- [ ] **Step 2: Rewrite `src/app/exercise/[id].tsx` in full**

```tsx
import { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getExercise } from '../../lib/exercises';
import { BackLink } from '../../components/ui/BackLink';
import {
  centeredContent,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';

export default function ExerciseDetailScreen() {
  const colors = useMaterialColors();
  const sport = useMaterialTertiary('sport');
  const styles = useMemo(() => createStyles(colors, sport), [colors, sport]);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = id ? getExercise(id) : undefined;

  if (!exercise) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <Text style={styles.error}>Exercice introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />
      <Text style={styles.title}>{exercise.name}</Text>

      <View style={styles.photoRow}>
        <View style={styles.photoColumn}>
          <View style={styles.photoFrame}>
            <Image source={exercise.imageStart} style={styles.photo} />
          </View>
          <Text style={styles.photoLabel}>Position de départ</Text>
        </View>
        <View style={styles.photoColumn}>
          <View style={styles.photoFrame}>
            <Image source={exercise.imageEnd} style={styles.photo} />
          </View>
          <Text style={styles.photoLabel}>Position finale</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Comment faire</Text>
      {exercise.instructions.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme, sport: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    photoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    photoColumn: { flex: 1 },
    photoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      overflow: 'hidden',
    },
    photo: { width: '100%', height: '100%' },
    photoLabel: {
      ...materialTypography.labelMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    sectionTitle: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: sport.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepBadgeText: { ...materialTypography.overline, color: sport.onTertiary, letterSpacing: 0 },
    stepText: { ...materialTypography.bodyLarge, flex: 1, color: colors.onSurface },
    error: { ...materialTypography.bodyLarge, color: colors.error },
  });
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx jest src/__tests__/exercise-detail-screen.test.tsx`
Expected: PASS.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `exercise/[id].tsx`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/exercise/[id].tsx"
git commit -m "feat: migrate exercise detail screen to Material tokens"
```

---

### Task 6: Migrate `progression.tsx` — Material tokens, remove header mascot

**Files:**
- Modify: `src/app/progression.tsx`
- Modify: `src/__tests__/progression-screen.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `lightColors`, `type MaterialColorScheme`, `type MaterialTertiary` (Phase 4). `Card`, `ErrorNotice`, `BackLink` (Task 1, unchanged call site) — unchanged props.
- Produces: nothing new — leaf screen.

- [ ] **Step 1: Delete the two mascot tests**

Delete these two tests from `src/__tests__/progression-screen.test.tsx` (the header mascot is removed with no replacement, matching the same pattern `home.tsx`/`workout.tsx` used in Phase 5a):

```tsx
  it('shows the celebrating mascot when the streak is a multiple of 7', async () => {
    // ... (the whole test block, ~40 lines, through its closing `});`)
  });

  it('shows the idle mascot when the streak is not a multiple of 7', async () => {
    // ... (the whole test block through its closing `});`)
  });
```

The remaining 3 tests (`'shows streak, level, points...'`, `'renders an empty-but-valid state...'`, `'surfaces an error...'`) stay unchanged.

- [ ] **Step 2: Run the remaining tests to confirm they still pass against the current component**

Run: `npx jest src/__tests__/progression-screen.test.tsx`
Expected: PASS (3 tests) — confirms the deletion didn't break anything; real verification of the migration is Step 4.

- [ ] **Step 3: Rewrite `src/app/progression.tsx` in full**

```tsx
// src/app/progression.tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
import { computeStats, type GamificationStats } from '../lib/workoutGamification';
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import { Card } from '../components/ui/Card';
import { ErrorNotice } from '../components/ui/ErrorNotice';
import { BackLink } from '../components/ui/BackLink';
import {
  centeredContent,
  lightColors,
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../theme/tokens';

export default function ProgressionScreen() {
  const colors = useMaterialColors();
  const progress = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, progress), [colors, progress]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
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
      setError(err instanceof Error ? err.message : 'Erreur de chargement de ta progression.');
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={progress.tertiary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <ErrorNotice message={error ?? 'Impossible de charger ta progression.'} onRetry={load} />
      </View>
    );
  }

  const unlockedIds = new Set(unlockedBadgeIds(stats));

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />
      {error && <ErrorNotice message={error} onRetry={load} />}

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

      <Text style={styles.sectionLabel}>Badges</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          const unavailable = badge.available === false;
          return (
            <View key={badge.id} style={styles.badgeItem}>
              <Image
                source={badge.medalImage}
                style={[styles.badgeImage, !unlocked && styles.badgeImageLocked]}
                accessibilityLabel={badge.label}
              />
              <Text style={styles.badgeLabel}>{badge.label}</Text>
              <Text style={[styles.badgeDescription, unavailable && styles.badgeDescriptionMuted]}>
                {badge.description}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme, progress: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    sectionLabel: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    headerCard: {},
    headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    headerItem: { alignItems: 'center', flex: 1 },
    headerValue: { ...materialTypography.titleLarge, color: colors.onSurface },
    headerLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    weekCard: {},
    dayDotsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    dayDot: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    dayDotDone: { backgroundColor: progress.tertiary, borderColor: progress.tertiary },
    weekText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    badgeItem: { width: '30%', alignItems: 'center' },
    badgeImage: { width: 64, height: 64, marginBottom: spacing.xs },
    badgeImageLocked: { opacity: state.disabledOpacity },
    badgeLabel: { ...materialTypography.labelSmall, color: colors.onSurface, textAlign: 'center' },
    badgeDescription: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, textAlign: 'center' },
    // Marks a badge nobody can earn yet (a feature it depends on doesn't
    // exist) as visually distinct from a badge that's merely locked —
    // lightColors.textTertiary is used here for exactly its documented
    // purpose, decorative/non-actionable text (no Material role exists
    // for this — see the Phase 5b plan's color-mapping table).
    badgeDescriptionMuted: { color: lightColors.textTertiary },
  });
}
```

Note the header changed from a `titleRow` (flex row with the title and the now-removed mascot) to a single `<Text style={styles.title}>Progression</Text>` — the `titleRow` wrapper is gone, and `title` now carries its own `marginBottom: spacing.lg` (previously carried by `titleRow`). This avoids the same vestigial-single-child-wrapper mistake Phase 5a's final review caught on `home.tsx`/`workout.tsx`.

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx jest src/__tests__/progression-screen.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `progression.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add src/app/progression.tsx src/__tests__/progression-screen.test.tsx
git commit -m "feat: migrate progression screen to Material tokens, remove header mascot"
```

---

### Task 7: Convert the last 4 `PressableScale` spots in `home.tsx` and `workout.tsx`

**Files:**
- Modify: `src/app/(tabs)/home.tsx`
- Modify: `src/app/(tabs)/workout.tsx`

**Interfaces:**
- Consumes: `withRippleAlpha`, `radius` (already imported in `workout.tsx`; needs adding to `home.tsx`'s import list) (Phase 4, `src/theme/tokens.ts`).
- Produces: nothing new for later tasks — these are the last two files with any `PressableScale` reference; Task 8 depends on this task being complete (its grep-verification step must find zero matches).

These two files were already fully migrated to Material tokens in Phase 5a — **this task does not re-migrate their colors or typography**, it only converts 4 specific interactive elements' press-feedback mechanism from `PressableScale` to `Pressable`+`android_ripple`, matching every other component this plan and Phase 4 already converted.

- [ ] **Step 1: `home.tsx` — convert the gamification card wrapper**

In `src/app/(tabs)/home.tsx`, remove the `PressableScale` import:

```tsx
import { PressableScale } from '../../components/ui/PressableScale';
```

Add `radius` and `withRippleAlpha` to the existing tokens import (currently `import { centeredContent, lightColors, materialTypography, spacing, useMaterialColors, useMaterialTertiary, type MaterialColorScheme } from '../../theme/tokens';`):

```tsx
import {
  centeredContent,
  lightColors,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  withRippleAlpha,
  type MaterialColorScheme,
} from '../../theme/tokens';
```

Replace:

```tsx
      {gamification && (
        <PressableScale onPress={() => router.push('/progression')} accessibilityRole="button">
          <Card style={styles.gamificationCard}>
```

...through its matching closing tag...

```tsx
          </Card>
        </PressableScale>
      )}
```

with:

```tsx
      {gamification && (
        <Pressable
          onPress={() => router.push('/progression')}
          accessibilityRole="button"
          android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant) }}
          style={styles.gamificationTouchable}
        >
          <Card style={styles.gamificationCard}>
```

...(the middle content — the `<Text style={styles.sectionLabel}>Progression</Text>` and the three-item `gamificationRow` — is unchanged, only the outer wrapper and closing tag change)...

```tsx
          </Card>
        </Pressable>
      )}
```

`Pressable` is already imported in this file (used by the meal-row list items) — no new import needed for it. Add one new style entry to `createStyles` (`home.tsx` already has a `createStyles(colors: MaterialColorScheme)` function — add this alongside the existing entries): `gamificationTouchable: { borderRadius: radius.lg, overflow: 'hidden' }` — this clips the ripple to the same rounded corners `Card` itself renders with, per Phase 4's Important finding about ripple corner-clipping.

- [ ] **Step 2: `workout.tsx` — convert the "Annuler" link and the two exercise-cell branches**

In `src/app/(tabs)/workout.tsx`, remove the `PressableScale` import:

```tsx
import { PressableScale } from '../../components/ui/PressableScale';
```

Add `Pressable` to the `react-native` import (currently `import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image } from 'react-native';`):

```tsx
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image, Pressable } from 'react-native';
```

Add `withRippleAlpha` to the existing tokens import (currently ends `..., useMaterialColors, useMaterialTertiary, type MaterialColorScheme, type MaterialTertiary } from '../../theme/tokens';`):

```tsx
import {
  centeredContent,
  lightColors,
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  withRippleAlpha,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';
```

Replace the "Annuler" link:

```tsx
                  <PressableScale
                    onPress={handleToggleCompletion}
                    disabled={loggingCompletion}
                    hitSlop={state.hitSlop}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: loggingCompletion }}
                    style={styles.completionUndoTouchable}
                  >
                    <Text style={styles.completionUndoLink}>Annuler</Text>
                  </PressableScale>
```

with:

```tsx
                  <Pressable
                    onPress={handleToggleCompletion}
                    disabled={loggingCompletion}
                    hitSlop={state.hitSlop}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: loggingCompletion }}
                    android_ripple={{ color: withRippleAlpha(sport.tertiaryContainer) }}
                    style={styles.completionUndoTouchable}
                  >
                    <Text style={styles.completionUndoLink}>Annuler</Text>
                  </Pressable>
```

`WorkoutScreen`'s top-level component already has `sport` in scope (`const sport = useMaterialTertiary('sport');`, from Phase 5a's migration) — no new variable needed here.

`SessionDetail` (the sub-component rendering the two exercise-cell branches) currently has this signature:

```tsx
function SessionDetail({ session, styles }: { session: Session; styles: Styles }) {
```

Change it to also receive `sport`:

```tsx
function SessionDetail({ session, styles, sport }: { session: Session; styles: Styles; sport: MaterialTertiary }) {
```

Update both of its two call sites (inside `WorkoutScreen`'s render, both currently `<SessionDetail session={sessionItem} styles={styles} />`) to also pass it:

```tsx
            <SessionDetail session={sessionItem} styles={styles} sport={sport} />
```

Then, inside `SessionDetail`, replace both exercise-cell `PressableScale` blocks. The circuit branch:

```tsx
        {session.exercises.map((exercise) => (
          <PressableScale
            key={exercise.name}
            onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
            accessibilityRole="link"
            hitSlop={4}
            style={styles.exerciseCard}
          >
            <Text style={styles.exerciseLine}>{exercise.name}</Text>
          </PressableScale>
        ))}
```

becomes:

```tsx
        {session.exercises.map((exercise) => (
          <Pressable
            key={exercise.name}
            onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
            accessibilityRole="link"
            hitSlop={4}
            android_ripple={{ color: withRippleAlpha(sport.tertiary) }}
            style={styles.exerciseCard}
          >
            <Text style={styles.exerciseLine}>{exercise.name}</Text>
          </Pressable>
        ))}
```

And the series branch (same transformation, this one also renders `exercise.detail`):

```tsx
        {session.exercises.map((exercise) => (
          <PressableScale
            key={exercise.name}
            onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
            accessibilityRole="link"
            hitSlop={4}
            style={styles.exerciseCard}
          >
            <Text style={styles.exerciseLine}>{exercise.name}</Text>
            <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
          </PressableScale>
        ))}
```

becomes:

```tsx
        {session.exercises.map((exercise) => (
          <Pressable
            key={exercise.name}
            onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
            accessibilityRole="link"
            hitSlop={4}
            android_ripple={{ color: withRippleAlpha(sport.tertiary) }}
            style={styles.exerciseCard}
          >
            <Text style={styles.exerciseLine}>{exercise.name}</Text>
            <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
          </Pressable>
        ))}
```

Finally, add `overflow: 'hidden'` to the `exerciseCard` style entry in `createStyles` (it already has `borderRadius: radius.sm`) so the ripple clips to its rounded corners:

```tsx
    exerciseCard: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
```

- [ ] **Step 3: Run the full test suite for both files**

Run: `npx jest src/__tests__/home.test.tsx src/__tests__/home-progression-card.test.tsx src/__tests__/workout-completion.test.tsx`
Expected: PASS — every test in these three files, unchanged behavior (pressing "Progression" still navigates to `/progression`; pressing "Annuler" still calls `undoSessionCompletion`; pressing "Commencer" still navigates to `/workout-session`).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to either file.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(tabs)/home.tsx" "src/app/(tabs)/workout.tsx"
git commit -m "feat: convert home/workout's remaining PressableScale usages to native ripple"
```

---

### Task 8: Retire `PressableScale.tsx` and `motion.spring.snappy`

**Files:**
- Delete: `src/components/ui/PressableScale.tsx`
- Modify: `src/theme/tokens.ts` (remove `motion.spring.snappy`)
- Test: check `src/__tests__/tokens.test.ts` for any reference to `motion.spring.snappy` and update if present

**Interfaces:**
- Consumes: nothing — this task only removes things, once nothing else in the repo references them.
- Produces: nothing — terminal cleanup task.

- [ ] **Step 1: Verify zero remaining consumers of `PressableScale`**

Run: `grep -rl "PressableScale" src/`
Expected: exactly one match — `src/components/ui/PressableScale.tsx` itself. If anything else appears, STOP: that file was missed by an earlier task in this plan (or by Phase 5a) and must be converted before this task can proceed — do not delete `PressableScale.tsx` while any consumer still imports it.

- [ ] **Step 2: Verify zero remaining consumers of `motion.spring.snappy`**

Run: `grep -rl "motion\.spring\.snappy" src/`
Expected: no matches (now that `PressableScale.tsx` — its only consumer — is about to be deleted in the same task, this should already be true even before you delete the file, since nothing outside `PressableScale.tsx` itself ever referenced it directly).

- [ ] **Step 3: Delete `PressableScale.tsx`**

```bash
git rm src/components/ui/PressableScale.tsx
```

- [ ] **Step 4: Remove `motion.spring.snappy` from `src/theme/tokens.ts`**

Find the `motion.spring` object (it currently has three entries: `gentle`, `snappy`, `celebrate`). Remove the `snappy` entry — **keep `gentle` and `celebrate`** (`celebrate` is still used by `Mascot.tsx`'s celebration bounce; `gentle` predates this whole design system's motion work and may have other consumers — verify with `grep -rl "motion\.spring\.gentle" src/` before touching anything beyond `snappy`, but do not remove `gentle` regardless of what that grep shows, since it is explicitly out of this task's scope).

The `motion.spring` object goes from:

```ts
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    /** Base of the "chips and cells" press pattern — visibly bouncy, the
     *  default feel for everyday taps and button presses in this direction. */
    snappy: { damping: 8, stiffness: 260, mass: 0.9 },
    /** Reward moments only: the mascot's celebration pose bouncing in.
     *  Pronounced overshoot — do not use for routine taps, it would read as
     *  exhausting rather than delightful. */
    celebrate: { damping: 5, stiffness: 220, mass: 1 },
  },
```

to:

```ts
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    /** Reward moments only: the mascot's celebration pose bouncing in.
     *  Pronounced overshoot — do not use for routine taps, it would read as
     *  exhausting rather than delightful. */
    celebrate: { damping: 5, stiffness: 220, mass: 1 },
  },
```

- [ ] **Step 5: Check `src/__tests__/tokens.test.ts` for a reference to `snappy`**

Run: `grep -n "snappy" src/__tests__/tokens.test.ts`
If this returns a match, read the surrounding test and remove the specific assertion referencing `motion.spring.snappy` (do not delete unrelated assertions in the same file). If it returns nothing, this step needs no change — move on.

- [ ] **Step 6: Run the full test suite**

Run: `npx jest`
Expected: every suite passes. Compare the total suite/test counts against the baseline you recorded in Task 1, Step 1 — the count should be higher by exactly the tests this plan added (1 new test in Task 2) and unchanged otherwise (Task 6 removed 2 tests but they were pre-existing, already counted in the Task 1 baseline).

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors anywhere — specifically confirms no file anywhere in the repo still imports the now-deleted `PressableScale.tsx` or references the now-removed `motion.spring.snappy`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: retire PressableScale and motion.spring.snappy — zero remaining consumers"
```

---

### Task 9: Final verification pass

**Files:** none modified — verification only.

**Interfaces:** none.

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: only pre-existing errors confined to `src/__tests__/*.test.ts(x)` files (the jest-globals typing gap, unrelated to this plan — confirmed in every prior phase). Zero errors in any of the 8 production files this plan touched (`BackLink.tsx`, `workout-session.tsx`, `generate-plan.tsx`, `recipe/[id].tsx`, `exercise/[id].tsx`, `progression.tsx`, `home.tsx`, `workout.tsx`) or in `tokens.ts`.

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: every suite passes.

- [ ] **Step 3: Confirm no touched screen still imports the old claymorphic hook or `Mascot`**

Run: `grep -n "useThemeColors\|from '.*ui/Mascot'" src/components/ui/BackLink.tsx src/app/workout-session.tsx src/app/generate-plan.tsx "src/app/recipe/[id].tsx" "src/app/exercise/[id].tsx" src/app/progression.tsx`
Expected: no output.

- [ ] **Step 4: Confirm `PressableScale.tsx` is gone and nothing references it or `motion.spring.snappy`**

Run: `git status --short src/components/ui/PressableScale.tsx` (expect no output — the deletion is committed, not pending) and `grep -rl "PressableScale\|motion\.spring\.snappy" src/` (expect no output at all — not even the file itself, since it's deleted).

- [ ] **Step 5: Confirm `Mascot.tsx` itself is untouched and still has exactly its original 3 consumers minus the 3 this plan removed**

Run: `grep -rl "from '.*ui/Mascot'" src/` — expected: **no output**. Every screen that used to import `Mascot` (`workout-session.tsx`, `generate-plan.tsx`, `progression.tsx` from this plan; `home.tsx`, `workout.tsx`, `plan.tsx`, `recipes.tsx`, `grocery-list.tsx`, `weight-log.tsx` from Phase 5a) no longer does. `src/components/ui/Mascot.tsx` itself must still exist on disk (`ls src/components/ui/Mascot.tsx`) — it is not deleted by this plan, only orphaned from screen usage; it remains the source for the app icon/splash assets' identity per every prior phase's explicit scope decision.

- [ ] **Step 6: Confirm every domain's `MaterialTertiary` role usage is internally consistent per screen**

Spot-check: `recipe/[id].tsx`/`generate-plan.tsx` use `useMaterialTertiary('nutrition')`; `workout-session.tsx`/`exercise/[id].tsx` use `useMaterialTertiary('sport')`; `progression.tsx` uses `useMaterialTertiary('progress')`. Run `grep -n "useMaterialTertiary(" src/app/workout-session.tsx src/app/generate-plan.tsx "src/app/recipe/[id].tsx" "src/app/exercise/[id].tsx" src/app/progression.tsx` and confirm each matches this list — a screen calling the wrong domain would silently render the wrong accent color with no type error.

- [ ] **Step 7: No commit for this task** — verification-only. If any check above fails, fix the specific regression it points to, re-run Steps 1-2, and only then consider this plan complete.
