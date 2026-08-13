# Exercise Session Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each exercise's start/end photos on the workout-session screen while it's being performed, reusing (and extracting) the photo-pair display already built for the exercise detail screen.

**Architecture:** Extract the existing inline photo-pair JSX/styles from `src/app/exercise/[id].tsx` into a new small, self-contained component `src/components/ui/ExercisePhotoPair.tsx` (same pattern as `Card.tsx`/`Mascot.tsx`: `useThemeColors()` internally, `useMemo`-memoized `createStyles`). Reuse it in `exercise/[id].tsx` (no visual change) and newly in `src/app/workout-session.tsx`, where it renders between the exercise name and the timer/detail text for both `work` and `manual` steps, looked up via the existing `getExercise(exerciseId)` from `src/lib/exercises.ts`.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Expo Router, Jest + `jest-expo` + `@testing-library/react-native`.

## Global Constraints

- `npx tsc --noEmit` and `npx jest` must be clean (zero new errors/failures) before any task is considered done. Establish the exact pre-existing baseline at the start of Task 1 — this repo may already have some pre-existing failures unrelated to this work; only regressions you introduce count.
- No inline hex codes, font sizes, or font weights — visual values come from `src/theme/tokens.ts` (per `AGENTS.md`).
- Follow the existing `testID` convention for testing `Image` components (see `mascot-image` in `src/components/ui/Mascot.tsx` / `src/__tests__/Mascot.test.tsx`).
- This project's screens use the claymorphic token system (`useThemeColors`/`ThemeColors` from `src/theme/tokens.ts`) — not the Material 3 tokens from the unrelated `phase3-content-screens` branch. Do not import from anything Material-3-named.

---

### Task 1: Create `ExercisePhotoPair` component

**Files:**
- Create: `src/components/ui/ExercisePhotoPair.tsx`
- Create: `src/__tests__/ExercisePhotoPair.test.tsx`

**Interfaces:**
- Consumes: `radius`, `spacing`, `typography`, `useThemeColors`, `type ThemeColors` from `../../theme/tokens` (all already exported — verify by reading `src/theme/tokens.ts` if unsure of exact names).
- Produces: `ExercisePhotoPair({ imageStart, imageEnd, showLabels }: ExercisePhotoPairProps)` — a React component. `ExercisePhotoPairProps = { imageStart: ImageSourcePropType; imageEnd: ImageSourcePropType; showLabels?: boolean }` (`ImageSourcePropType` from `react-native`), `showLabels` defaults to `true`. Renders two `Image`s side by side with `testID="exercise-photo-start"` and `testID="exercise-photo-end"`. When `showLabels` is true (or omitted), renders `<Text>Position de départ</Text>` under the start photo and `<Text>Position finale</Text>` under the end photo; when `false`, renders neither `Text`. Tasks 2 and 3 both import `{ ExercisePhotoPair }` from `../components/ui/ExercisePhotoPair` (adjust relative depth per call site).

- [ ] **Step 1: Establish the tsc/jest baseline**

Run: `npx tsc --noEmit 2>&1 | tail -5` — note the error count (or 0).
Run: `npx jest 2>&1 | tail -15` — note the pass/fail suite and test counts.
These are the numbers every later task's "no new errors/failures" check is measured against.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/ExercisePhotoPair.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ExercisePhotoPair } from '../components/ui/ExercisePhotoPair';

const START = 1;
const END = 2;

describe('ExercisePhotoPair', () => {
  it('renders both photos with the given sources', async () => {
    const { getByTestId } = await render(<ExercisePhotoPair imageStart={START} imageEnd={END} />);

    expect(getByTestId('exercise-photo-start').props.source).toBe(START);
    expect(getByTestId('exercise-photo-end').props.source).toBe(END);
  });

  it('shows the position labels by default', async () => {
    const { getByText } = await render(<ExercisePhotoPair imageStart={START} imageEnd={END} />);

    expect(getByText('Position de départ')).toBeTruthy();
    expect(getByText('Position finale')).toBeTruthy();
  });

  it('hides the position labels when showLabels is false', async () => {
    const { queryByText } = await render(
      <ExercisePhotoPair imageStart={START} imageEnd={END} showLabels={false} />
    );

    expect(queryByText('Position de départ')).toBeNull();
    expect(queryByText('Position finale')).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest ExercisePhotoPair`
Expected: FAIL — `Cannot find module '../components/ui/ExercisePhotoPair'`.

- [ ] **Step 4: Create the component**

Create `src/components/ui/ExercisePhotoPair.tsx`:

```tsx
import { useMemo } from 'react';
import { View, Text, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import { radius, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

type ExercisePhotoPairProps = {
  imageStart: ImageSourcePropType;
  imageEnd: ImageSourcePropType;
  /** Shows "Position de départ" / "Position finale" captions under each photo. Defaults to `true`. */
  showLabels?: boolean;
};

export function ExercisePhotoPair({ imageStart, imageEnd, showLabels = true }: ExercisePhotoPairProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.photoRow}>
      <View style={styles.photoColumn}>
        <View style={styles.photoFrame}>
          <Image testID="exercise-photo-start" source={imageStart} style={styles.photo} />
        </View>
        {showLabels && <Text style={styles.photoLabel}>Position de départ</Text>}
      </View>
      <View style={styles.photoColumn}>
        <View style={styles.photoFrame}>
          <Image testID="exercise-photo-end" source={imageEnd} style={styles.photo} />
        </View>
        {showLabels && <Text style={styles.photoLabel}>Position finale</Text>}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    photoRow: { flexDirection: 'row', gap: spacing.sm },
    photoColumn: { flex: 1 },
    photoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.md,
      backgroundColor: colors.bgSunken,
      overflow: 'hidden',
    },
    photo: { width: '100%', height: '100%' },
    photoLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
}
```

Note: `photoRow` here has no `marginBottom` (unlike the original inline style in `exercise/[id].tsx`, which had `marginBottom: spacing.lg` because it sat directly above the "Comment faire" section). Task 2 adds that spacing back at the call site so this component stays layout-agnostic and reusable as-is in Task 3's tighter session-screen layout.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest ExercisePhotoPair`
Expected: PASS, 3 tests.

- [ ] **Step 6: Run tsc**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: no new errors versus Step 1's baseline.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/ExercisePhotoPair.tsx src/__tests__/ExercisePhotoPair.test.tsx
git commit -m "feat: add ExercisePhotoPair component"
```

---

### Task 2: Refactor `exercise/[id].tsx` to use `ExercisePhotoPair`

**Files:**
- Modify: `src/app/exercise/[id].tsx`

**Interfaces:**
- Consumes: `ExercisePhotoPair` from `../../components/ui/ExercisePhotoPair` (Task 1).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the inline photo JSX**

In `src/app/exercise/[id].tsx`, replace:

```tsx
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
```

with:

```tsx
      <ExercisePhotoPair imageStart={exercise.imageStart} imageEnd={exercise.imageEnd} />
```

Add the import near the top of the file (alongside the other component imports):

```tsx
import { ExercisePhotoPair } from '../../components/ui/ExercisePhotoPair';
```

Since `ExercisePhotoPair`'s own `photoRow` style no longer includes the `marginBottom: spacing.lg` this screen relied on (see Task 1 Step 4's note), wrap it to restore that spacing. Replace the JSX above with:

```tsx
      <View style={styles.photoRowSpacing}>
        <ExercisePhotoPair imageStart={exercise.imageStart} imageEnd={exercise.imageEnd} />
      </View>
```

- [ ] **Step 2: Update the styles**

In `createStyles`, remove the now-unused `photoRow`, `photoColumn`, `photoFrame`, `photo`, and `photoLabel` entries, and add:

```tsx
    photoRowSpacing: { marginBottom: spacing.lg },
```

`Image` becomes unused in this file's `react-native` import — remove it from the `import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';` line, leaving `import { View, Text, ScrollView, StyleSheet } from 'react-native';`.

- [ ] **Step 3: Run tsc**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: no new errors versus Task 1's baseline (in particular, no "unused variable" error for the removed `Image` import or removed style keys — if any remain referenced, tsc will catch it).

- [ ] **Step 4: Run the full test suite**

Run: `npx jest 2>&1 | tail -15`
Expected: same pass/fail counts as Task 1 Step 1's baseline — this screen has no existing test file, so nothing exercises it directly, but confirm no other suite broke (e.g. a snapshot elsewhere referencing this screen).

- [ ] **Step 5: Commit**

```bash
git add src/app/exercise/\[id\].tsx
git commit -m "refactor: use ExercisePhotoPair on the exercise detail screen"
```

---

### Task 3: Show the exercise photos on the workout-session screen

**Files:**
- Modify: `src/app/workout-session.tsx`
- Test: `src/__tests__/workout-session.test.tsx`

**Interfaces:**
- Consumes: `ExercisePhotoPair` from `../components/ui/ExercisePhotoPair` (Task 1); `getExercise` from `../lib/exercises` (existing, `(id: string) => Exercise | undefined`, `Exercise` having `imageStart`/`imageEnd`).
- Produces: nothing later tasks depend on — this is the last task.

- [ ] **Step 1: Write the failing test assertions**

In `src/__tests__/workout-session.test.tsx`, add a mock for `../lib/exercises` right after the existing `jest.mock('../lib/homeWorkoutProgram', ...)` block:

```tsx
jest.mock('../lib/exercises', () => ({
  getExercise: jest.fn((id: string) => {
    if (id === 'a') {
      return { id: 'a', name: 'Exercice A', instructions: [], imageStart: 101, imageEnd: 102 };
    }
    if (id === 'x') {
      return { id: 'x', name: 'Exercice X', instructions: [], imageStart: 201, imageEnd: 202 };
    }
    return undefined;
  }),
}));
```

This resolves real photo sources for the `circuitFixture`'s first exercise (`exerciseId: 'a'`, used by the existing "shows the first work step" test) and the `seriesFixture`'s exercise (`exerciseId: 'x'`, used by the existing "shows the manual step detail" test) — the two fixtures already defined in this file. `'b'` (the circuit's second exercise) intentionally has no mock entry: it's only ever referenced as `nextExerciseName` text during a rest step in the existing tests, never as the active step, so it doesn't need photo data.

Then add two new `it` blocks at the end of the `describe` block, before the closing `});`:

```tsx
  it('shows the exercise photos during a work step', async () => {
    mockParams('beginner', '0');
    const { findByText, getByTestId } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice A');

    expect(getByTestId('exercise-photo-start').props.source).toBe(101);
    expect(getByTestId('exercise-photo-end').props.source).toBe(102);
  });

  it('shows the exercise photos during a manual step', async () => {
    mockParams('beginner', '2');
    const { findByText, getByTestId } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice X');

    expect(getByTestId('exercise-photo-start').props.source).toBe(201);
    expect(getByTestId('exercise-photo-end').props.source).toBe(202);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest workout-session`
Expected: the two new tests FAIL (`Unable to find an element with testID: exercise-photo-start`); all pre-existing tests in this file still PASS (the mock returns `undefined` only for ids not used as an active step in the existing tests, so it doesn't change their behavior).

- [ ] **Step 3: Add the imports**

In `src/app/workout-session.tsx`, add alongside the other local imports:

```tsx
import { getExercise } from '../lib/exercises';
import { ExercisePhotoPair } from '../components/ui/ExercisePhotoPair';
```

- [ ] **Step 4: Compute the active exercise once, above the render**

Find the existing guard `if (!currentStep) { return <View style={styles.screen} />; }`, which sits just before the component's final `return (`. Immediately after that guard (still before the final `return (`), add:

```tsx
  const activeExercise =
    currentStep.kind === 'manual' || currentStep.kind === 'work' ? getExercise(currentStep.exerciseId) : undefined;
```

By this point `currentStep` is narrowed to non-`undefined` (the guard above returned early otherwise), so `currentStep.kind` is safe to read. `rest` and `recovery` steps fall through the ternary's `else`, so `activeExercise` is `undefined` for them — matching the design spec (no photos while resting).

- [ ] **Step 5: Render the photo pair in the manual-step branch**

Replace:

```tsx
      {currentStep.kind === 'manual' ? (
        <View style={styles.stepContainer}>
          <Text style={styles.exerciseName}>{currentStep.exerciseName}</Text>
          <Text style={styles.detail}>{currentStep.detail}</Text>
          <Button title="Terminé" onPress={advance} />
        </View>
      ) : (
```

with:

```tsx
      {currentStep.kind === 'manual' ? (
        <View style={styles.stepContainer}>
          <Text style={styles.exerciseName}>{currentStep.exerciseName}</Text>
          {activeExercise && (
            <View style={styles.photoRowSpacing}>
              <ExercisePhotoPair
                imageStart={activeExercise.imageStart}
                imageEnd={activeExercise.imageEnd}
                showLabels={false}
              />
            </View>
          )}
          <Text style={styles.detail}>{currentStep.detail}</Text>
          <Button title="Terminé" onPress={advance} />
        </View>
      ) : (
```

- [ ] **Step 6: Render the photo pair in the work-step branch**

Replace:

```tsx
          <Text style={styles.stepKindLabel}>{stepKindLabel(currentStep)}</Text>
          <Text style={styles.exerciseName}>{stepHeadline(currentStep)}</Text>
          <Text style={styles.countdown}>{timer.remainingSeconds}</Text>
```

with:

```tsx
          <Text style={styles.stepKindLabel}>{stepKindLabel(currentStep)}</Text>
          <Text style={styles.exerciseName}>{stepHeadline(currentStep)}</Text>
          {activeExercise && (
            <View style={styles.photoRowSpacing}>
              <ExercisePhotoPair
                imageStart={activeExercise.imageStart}
                imageEnd={activeExercise.imageEnd}
                showLabels={false}
              />
            </View>
          )}
          <Text style={styles.countdown}>{timer.remainingSeconds}</Text>
```

(`rest` and `recovery` steps share this same branch — since `activeExercise` is `undefined` for them per Step 4, no photo pair renders, matching the design spec.)

- [ ] **Step 7: Add the `photoRowSpacing` style**

In `createStyles`, add a style so the photo pair doesn't sit flush against the surrounding text:

```tsx
    photoRowSpacing: { marginBottom: spacing.lg },
```

(`spacing` is already imported in this file.)

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx jest workout-session`
Expected: PASS, all tests including the two new ones.

- [ ] **Step 9: Run tsc**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 10: Run the full test suite**

Run: `npx jest 2>&1 | tail -15`
Expected: same pass/fail counts as Task 1 Step 1's baseline, plus this file's 2 new passing tests.

- [ ] **Step 11: Commit**

```bash
git add src/app/workout-session.tsx src/__tests__/workout-session.test.tsx
git commit -m "feat: show exercise photos during workout session steps"
```
