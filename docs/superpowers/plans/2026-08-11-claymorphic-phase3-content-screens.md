# Claymorphic Phase 3: Content Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 5 remaining content/utility screens (generate-plan,
grocery-list, weight-log, recipe detail, exercise detail) to the
claymorphic design system, and ship the mascot's third pose
(`encouraging`) for generate-plan's failure state.

**Architecture:** Same wiring pattern as Phase 2 — no new shared-component
work beyond one addition to `Mascot` itself (a third pose). Every domain
color swap routes through tokens that already exist
(`domainNutrition`/`domainSport`/`domainNeutral` and their `*Deep`
variants). Two of the five screens (recipe detail, exercise detail) are
content-dense drill-down screens with no empty state or celebratory
moment, so they get color-only migrations — no mascot placement, matching
the design decision made during brainstorming.

**Tech Stack:** Expo SDK 57 / React Native, TypeScript, `expo-image`,
`react-native-reanimated`, Jest + `jest-expo` + `@testing-library/react-native`.
Image generation via `mcp__claude_ai_Higgsfield__generate_image` +
`remove_background` (the `media-use` skill has no working provider in this
environment — the same substitution used successfully for every prior
mascot/icon asset in this project).

## Global Constraints

- Zero hex codes, zero raw `fontSize`/`fontWeight` inline — everything
  from `src/theme/tokens.ts`. This plan introduces no new token values.
- Every tappable element stays at minimum `state.minTouchSize` (44pt) with
  a visible pressed state and `accessibilityRole`.
- No new text/background color pairing is introduced — the domain tokens'
  AA contrast was already verified in Phase 1.
- `npx tsc --noEmit` and `npx jest` must be clean before any task is done.
  This repo has pre-existing `tsc` errors confined to `src/__tests__/*`
  (missing `@types/jest` wiring in `tsconfig.json`) and one Deno-based
  Supabase edge function — judge cleanliness as "introduces no new error
  category in a non-test file," not literally zero.
- The app stays light-only. French, tutoiement, sober functional copy (no
  exclamation marks, no hype) — the mascot/celebration/encouragement
  moments are the one place energy is allowed. The `encouraging` pose in
  particular must never look mocking, sad, or apologetic.
- No EAS build is triggered by this plan, automatically or otherwise.

---

### Task 1: Third mascot pose — `encouraging`

**Files:**
- Create: `assets/images/mascot/mascot-encouraging.png`
- Modify: `assets/images/mascot/README.md`
- Modify: `src/components/ui/Mascot.tsx`
- Test: Modify `src/__tests__/Mascot.test.tsx`

**Interfaces:**
- Produces: `MascotPose` extended to `'idle' | 'celebrating' |
  'encouraging'`. Consumed by Task 2 (generate-plan's failure state).

- [ ] **Step 1: Generate the pose**

Use `mcp__claude_ai_Higgsfield__generate_image`, `model: "recraft_v4_1"`,
`model_type: "standard"`, `aspect_ratio: "1:1"`, `resolution: "2k"` — same
settings used for `mascot-idle.png`/`mascot-celebrating.png`. Reuse the
exact validated base prompt from `assets/images/mascot/README.md`, with
this pose-specific clause:

> A cute stylized cartoon broccoli character mascot with simple cartoon
> arms and legs, **a gentle, reassuring pose — one hand raised near the
> chest in a warm "it's okay, let's try again" gesture, relaxed
> shoulders, still smiling warmly and making eye contact — encouraging
> and upbeat, never mocking, never sad-looking, never apologetic**, for a
> fitness and nutrition app, in a modern 3D Pixar-style animation look.
> Simplified, rounded, cartoon-illustrated broccoli shape (soft rounded
> floret bumps, not photorealistic texture), deep green color on top with
> a paler green stem below, smooth clean 3D cartoon shading, soft studio
> lighting from the upper left. Simple stubby cartoon arms and legs with
> small rounded hands and feet, wearing only small coral orange sneakers
> as a minimal sporty accent. Large expressive Pixar-style eyes: big
> round glossy eyes with bright catchlight reflections, expressive
> eyebrows, and a warm cheerful smile. Plain background, one single
> centered character, no text, no logos.

Poll with `mcp__claude_ai_Higgsfield__jobs_wait` until complete.

- [ ] **Step 2: Make it transparent**

Call `remove_background` on the job's `media_id`/`job_id`,
`media_type: "image"` — matching `mascot-idle.png`/`mascot-celebrating.png`,
which are both transparent so they sit on `bgBase`/`bgSurface`/`bgSunken`
with no seam.

- [ ] **Step 3: Download and verify**

Download to `assets/images/mascot/mascot-encouraging.png`. Verify with
`file` that it's a real PNG, ≥1024×1024, genuinely transparent (spot-check
corner alpha). Open it and manually compare against `mascot-idle.png`/
`mascot-celebrating.png`: same species, same floret/stem color split, same
eye/eyebrow style — a likeness drift here would be a real defect (the same
check Phase 2's app-identity task applied). Confirm the pose itself reads
as reassuring, not sad or mocking — this is a judgment call worth taking
seriously since it's explicitly the one thing the design spec forbids. If
the first generation doesn't read right (introduces an unintended facial
feature, wrong eyebrow color, or a pose that reads as apologetic/sad
rather than reassuring), regenerate with a refined prompt rather than
shipping it — this exact failure mode (stray details, off-brand color)
happened repeatedly during Phase 2's mascot-portrait generation and was
each time caught by this kind of side-by-side comparison, not by
eyeballing the image alone.

- [ ] **Step 4: Update the mascot README**

In `assets/images/mascot/README.md`, add a row to the pose table:

```md
| `mascot-encouraging.png` | Encouraging (after a setback — never mocking, never sad-looking) | Used on `generate-plan.tsx`'s generation-failure state (Phase 3). |
```

And update the closing line:

```md
One more pose is planned but not part of this set — see "Follow-up work"
in the Phase 2 plan: a moving/transition pose.
```

(replacing the old "Two more poses are planned..." sentence, which now
overcounts by one).

- [ ] **Step 5: Write the failing test**

In `src/__tests__/Mascot.test.tsx`, change:

```tsx
const POSES: MascotPose[] = ['idle', 'celebrating'];
```

to:

```tsx
const POSES: MascotPose[] = ['idle', 'celebrating', 'encouraging'];
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npx jest Mascot.test.tsx`
Expected: FAIL — `'encouraging'` is not assignable to `MascotPose`, and
`MASCOT_SOURCES` has no matching key, so the `it.each` case for
`'encouraging'` throws.

- [ ] **Step 7: Wire the pose into `Mascot.tsx`**

Change:

```ts
export type MascotPose = 'idle' | 'celebrating';

const MASCOT_SOURCES: Record<MascotPose, ImageProps['source']> = {
  idle: require('../../../assets/images/mascot/mascot-idle.png'),
  celebrating: require('../../../assets/images/mascot/mascot-celebrating.png'),
};
```

to:

```ts
export type MascotPose = 'idle' | 'celebrating' | 'encouraging';

const MASCOT_SOURCES: Record<MascotPose, ImageProps['source']> = {
  idle: require('../../../assets/images/mascot/mascot-idle.png'),
  celebrating: require('../../../assets/images/mascot/mascot-celebrating.png'),
  encouraging: require('../../../assets/images/mascot/mascot-encouraging.png'),
};
```

Change the animation branch — currently only `pose === 'idle'` breathes and
everything else bounces, which was fine when `'celebrating'` was the only
other pose but would now make `encouraging` bounce too, which the design
spec explicitly rules out (a triumphant spring-in would read as discordant
on a setback moment):

```ts
  useEffect(() => {
    if (pose === 'idle') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      // Reset to the pre-bounce starting point before springing back to 1.
      // Without this, a long-lived Mascot that switches from `idle` (where
      // scale is already ~1, oscillating from the breathing loop) to
      // `celebrating` would spring from ~1 to 1 — a no-op with no visible
      // bounce. Setting `.value` twice synchronously is a standard
      // Reanimated idiom: the first assignment commits immediately, and the
      // `withSpring` animation then starts from that committed value.
      scale.value = 0.5;
      scale.value = withSpring(1, motion.spring.celebrate);
    }
  }, [pose, scale]);
```

becomes:

```ts
  useEffect(() => {
    if (pose === 'celebrating') {
      // Reset to the pre-bounce starting point before springing back to 1.
      // Without this, a long-lived Mascot that switches from `idle` (where
      // scale is already ~1, oscillating from the breathing loop) to
      // `celebrating` would spring from ~1 to 1 — a no-op with no visible
      // bounce. Setting `.value` twice synchronously is a standard
      // Reanimated idiom: the first assignment commits immediately, and the
      // `withSpring` animation then starts from that committed value.
      scale.value = 0.5;
      scale.value = withSpring(1, motion.spring.celebrate);
    } else {
      // `idle` and `encouraging` both breathe calmly — a triumphant bounce
      // would feel discordant on `encouraging`'s reassure-after-a-setback
      // moment.
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: motion.duration.idle / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [pose, scale]);
```

(`useSharedValue(pose === 'celebrating' ? 0.5 : 1)` on the line above this
`useEffect` needs no change — it already only pre-sets the pre-bounce
value for `'celebrating'`, so `'encouraging'` correctly initializes to 1
like `'idle'` does.)

Update the component's doc comment to mention the third pose:

```ts
/**
 * The FitPro mascot. `idle` breathes continuously (a slow scale pulse) so it
 * reads as alive even when nothing is happening — the design spec's
 * "présence continue" requirement. `celebrating` bounces in once with an
 * overshooting spring instead. `encouraging` (reassurance after a setback)
 * shares `idle`'s calm breathing rather than bouncing — a triumphant
 * entrance would read as discordant on a setback moment. `style` fully
 * replaces the default size-based sizing when given, so a caller that needs
 * responsive sizing (percentage width, aspectRatio) doesn't fight a
 * baked-in width/height.
 */
```

- [ ] **Step 8: Run the tests and confirm they pass**

Run: `npx jest Mascot.test.tsx`
Expected: PASS, all tests including the new `'encouraging'` case in
`POSES`.

- [ ] **Step 9: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean (per the pre-existing-error caveat in Global
Constraints).

- [ ] **Step 10: Commit**

```bash
git add assets/images/mascot/mascot-encouraging.png assets/images/mascot/README.md src/components/ui/Mascot.tsx src/__tests__/Mascot.test.tsx
git commit -m "feat: add the mascot's third pose (encouraging)"
```

---

### Task 2: Migrate generate-plan (`generate-plan.tsx`)

**Files:**
- Modify: `src/app/generate-plan.tsx`
- Test: Create `src/__tests__/generate-plan-screen.test.tsx`

**Interfaces:**
- Consumes: `Mascot` with `pose="encouraging"` (Task 1).
- Produces: nothing consumed by a later task.

generate-plan's domain is `nutrition`. This screen has no dedicated test
file today.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/generate-plan-screen.test.tsx`. Follow this repo's
established mocking shape (see `src/__tests__/plan-screen.test.tsx` for
the pattern) — mock every module `generate-plan.tsx` imports data from,
and drive `fetchRecipes` to reject so `handleGenerate`'s `catch` block
fires:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GeneratePlanScreen from '../app/generate-plan';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes } from '../lib/mealPlanData';
import { fetchRecentWeightLogs } from '../lib/weightLogData';
import { computeAdjustedTargets } from '../lib/progressTracking';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/profile', () => ({
  getProfile: jest.fn(),
  getTrainingProfile: jest.fn(),
}));

jest.mock('../lib/targets', () => ({
  computeTargetsFromProfile: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  fetchRecipes: jest.fn(),
  fetchRecipeIngredients: jest.fn(),
  saveWeeklyPlan: jest.fn(),
}));

jest.mock('../lib/weightLogData', () => ({
  fetchRecentWeightLogs: jest.fn(),
}));

jest.mock('../lib/progressTracking', () => ({
  computeAdjustedTargets: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

describe('GeneratePlanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (getProfile as jest.Mock).mockResolvedValue({});
    (getTrainingProfile as jest.Mock).mockResolvedValue({});
    (computeTargetsFromProfile as jest.Mock).mockReturnValue({
      calories: 2000,
      proteinG: 150,
      fatG: 60,
      carbsG: 200,
    });
    (fetchRecentWeightLogs as jest.Mock).mockResolvedValue([]);
    (computeAdjustedTargets as jest.Mock).mockReturnValue({
      calories: 2000,
      proteinG: 150,
      fatG: 60,
      carbsG: 200,
    });
  });

  it('shows the encouraging mascot when generation fails', async () => {
    (fetchRecipes as jest.Mock).mockRejectedValue(new Error('Réseau indisponible'));
    const { getByText, getByTestId } = await render(<GeneratePlanScreen />);
    fireEvent.press(getByText('Générer le plan'));
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest generate-plan-screen.test.tsx`
Expected: FAIL — no `testID="mascot-image"` exists yet in the error state.

- [ ] **Step 3: Add the mascot to the error state and wire the domain**

In `src/app/generate-plan.tsx`, add the import:

```tsx
import { Mascot } from '../components/ui/Mascot';
```

Replace:

```tsx
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Générer le plan" onPress={handleGenerate} loading={generating} />
```

with:

```tsx
      {error && (
        <View style={styles.errorContainer}>
          <Mascot pose="encouraging" size={100} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      <Button title="Générer le plan" onPress={handleGenerate} loading={generating} domain="nutrition" />
```

Update the `error` style and add `errorContainer` (in `createStyles`):

```ts
    errorContainer: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
```

```ts
    error: { ...typography.body, color: colors.error, textAlign: 'center' },
```

(was `error: { ...typography.body, color: colors.error, marginTop: spacing.md, marginBottom: spacing.sm },` — the spacing now lives on `errorContainer` instead, so it isn't doubled up.)

- [ ] **Step 4: Move `cellSelected` off the legacy token**

```ts
    cellSelected: { backgroundColor: colors.accentRed, shadowColor: colors.accentRed, shadowOpacity: 0.25 },
```
→
```ts
    cellSelected: { backgroundColor: colors.domainNutrition, shadowColor: colors.domainNutrition, shadowOpacity: 0.25 },
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest generate-plan-screen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add src/app/generate-plan.tsx src/__tests__/generate-plan-screen.test.tsx
git commit -m "feat: migrate generate-plan to the claymorphic system (encouraging mascot on failure, domain color)"
```

---

### Task 3: Migrate Courses (`(tabs)/grocery-list.tsx`)

**Files:**
- Modify: `src/app/(tabs)/grocery-list.tsx`
- Test: Create `src/__tests__/grocery-list-screen.test.tsx`

**Interfaces:**
- Consumes: `Mascot` with `pose="idle"` (Phase 1), `EmptyState`'s `domain`
  prop (Phase 2, Task 1 of that plan).
- Produces: nothing consumed by a later task.

grocery-list's domain is `nutrition`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/grocery-list-screen.test.tsx`:

```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GroceryListScreen from '../app/(tabs)/grocery-list';
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan } from '../lib/mealPlanData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  getCurrentPlan: jest.fn(),
  fetchRecipeIngredients: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('GroceryListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (getCurrentPlan as jest.Mock).mockResolvedValue(null);
  });

  it('shows the idle mascot in the empty-plan state', async () => {
    const { getByTestId } = await render(<GroceryListScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest grocery-list-screen.test.tsx`
Expected: FAIL — no `testID="mascot-image"` exists yet.

- [ ] **Step 3: Add the mascot and domain wiring**

In `src/app/(tabs)/grocery-list.tsx`, add the import:

```tsx
import { Mascot } from '../../components/ui/Mascot';
```

Replace:

```tsx
        <EmptyState
          illustration={require('../../../assets/images/illustrations/empty-grocery.png')}
          title="Aucun plan pour l'instant"
          message="Génère un plan de repas pour obtenir ta liste de courses."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
        />
```

with:

```tsx
        <EmptyState
          icon={<Mascot pose="idle" size={120} />}
          title="Aucun plan pour l'instant"
          message="Génère un plan de repas pour obtenir ta liste de courses."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
          domain="nutrition"
        />
```

- [ ] **Step 4: Move the loading spinner off the legacy token**

```tsx
        <ActivityIndicator color={colors.accentRed} />
```
→
```tsx
        <ActivityIndicator color={colors.domainNutrition} />
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest grocery-list-screen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(tabs)/grocery-list.tsx" src/__tests__/grocery-list-screen.test.tsx
git commit -m "feat: migrate Courses to the claymorphic system (mascot, domain color)"
```

---

### Task 4: Migrate Poids (`(tabs)/weight-log.tsx`)

**Files:**
- Modify: `src/app/(tabs)/weight-log.tsx`
- Test: Create `src/__tests__/weight-log-screen.test.tsx`

**Interfaces:**
- Consumes: `Mascot` with `pose="idle"` (Phase 1).
- Produces: nothing consumed by a later task.

weight-log's domain is `neutral` (matching the Phase 2 tab-bar icon choice
for this screen, rather than `progress`).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/weight-log-screen.test.tsx`:

```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import WeightLogScreen from '../app/(tabs)/weight-log';
import { useAuth } from '../lib/auth-context';
import { fetchRecentWeightLogs } from '../lib/weightLogData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/weightLogData', () => ({
  logWeight: jest.fn(),
  fetchRecentWeightLogs: jest.fn(),
}));

jest.mock('../lib/progressTracking', () => ({
  calculateWeeklyTrendPercent: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('WeightLogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (fetchRecentWeightLogs as jest.Mock).mockResolvedValue([]);
  });

  it('shows the idle mascot when there is no weight history yet', async () => {
    const { getByTestId } = await render(<WeightLogScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest weight-log-screen.test.tsx`
Expected: FAIL — no `testID="mascot-image"` exists yet.

- [ ] **Step 3: Add the mascot and domain wiring**

In `src/app/(tabs)/weight-log.tsx`, add the import:

```tsx
import { Mascot } from '../../components/ui/Mascot';
```

Replace:

```tsx
        <EmptyState
          title="Aucune pesée"
          message="Enregistre ton poids ci-dessus pour voir ta courbe se construire."
        />
```

with:

```tsx
        <EmptyState
          icon={<Mascot pose="idle" size={120} />}
          title="Aucune pesée"
          message="Enregistre ton poids ci-dessus pour voir ta courbe se construire."
        />
```

(No `actionLabel`/`onAction` here — same as before, so no `domain` prop is
meaningful either; `EmptyState` only renders a `Button` when both are
given.)

Add `domain="neutral"` to the "Enregistrer" button:

```tsx
      <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} domain="neutral" />
```

- [ ] **Step 4: Move the loading spinner off the legacy token**

```tsx
        <ActivityIndicator color={colors.accentRed} />
```
→
```tsx
        <ActivityIndicator color={colors.domainNeutral} />
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx jest weight-log-screen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(tabs)/weight-log.tsx" src/__tests__/weight-log-screen.test.tsx
git commit -m "feat: migrate Poids to the claymorphic system (mascot, domain color)"
```

---

### Task 5: Migrate recipe detail (`recipe/[id].tsx`)

**Files:**
- Modify: `src/app/recipe/[id].tsx`
- Test: Create `src/__tests__/recipe-detail-screen.test.tsx`

**Interfaces:** None — no mascot, no shared-component prop threading.
Pure domain-color migration, per the brainstorming decision that this
content-dense drill-down screen doesn't need a mascot placement.

recipe detail's domain is `nutrition`.

- [ ] **Step 1: Write the failing test**

This screen has no dedicated test file today. Create
`src/__tests__/recipe-detail-screen.test.tsx` as a smoke test — since
there's no new testable behavior (no mascot, no new prop), this confirms
the screen still renders correctly after the token swap, which is the
actual risk this task carries:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import RecipeDetailScreen from '../app/recipe/[id]';
import { useLocalSearchParams } from 'expo-router';
import { fetchRecipes, fetchRecipeIngredients, fetchRecipeInstructions } from '../lib/mealPlanData';

jest.mock('../lib/mealPlanData', () => ({
  fetchRecipes: jest.fn(),
  fetchRecipeIngredients: jest.fn(),
  fetchRecipeInstructions: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('RecipeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'r1' });
    (fetchRecipes as jest.Mock).mockResolvedValue([
      {
        id: 'r1',
        name: 'Poulet grillé',
        mealType: 'lunch',
        baseCalories: 500,
        baseProteinG: 40,
        baseFatG: 15,
        baseCarbsG: 50,
        baseServingG: 400,
        imageUrl: null,
      },
    ]);
    (fetchRecipeIngredients as jest.Mock).mockResolvedValue([]);
    (fetchRecipeInstructions as jest.Mock).mockResolvedValue(['Cuire le poulet.']);
  });

  it('renders the recipe once loaded', async () => {
    const { findByText } = await render(<RecipeDetailScreen />);
    expect(await findByText('Poulet grillé')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to confirm it passes already (baseline), then apply the migration**

Run: `npx jest recipe-detail-screen.test.tsx`
Expected: PASS already — this test exercises existing behavior, not a new
feature, so there's no RED step for the test itself. The verification for
this task is: the test still passes *after* the token swap below, proving
the swap didn't break rendering.

- [ ] **Step 3: Move `accentRed`/`accentRedDeep` off the legacy tokens**

```ts
        <ActivityIndicator color={colors.accentRed} />
```
(the loading-state spinner) →
```ts
        <ActivityIndicator color={colors.domainNutrition} />
```

```ts
    portionBanner: { ...typography.captionStrong, color: colors.accentRedDeep, marginBottom: spacing.lg },
```
→
```ts
    portionBanner: { ...typography.captionStrong, color: colors.domainNutritionDeep, marginBottom: spacing.lg },
```

```ts
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accentRed,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
```
→
```ts
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.domainNutrition,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
```

- [ ] **Step 4: Run the test and confirm it still passes**

Run: `npx jest recipe-detail-screen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add "src/app/recipe/[id].tsx" src/__tests__/recipe-detail-screen.test.tsx
git commit -m "feat: migrate recipe detail to the claymorphic system (domain color)"
```

---

### Task 6: Migrate exercise detail (`exercise/[id].tsx`)

**Files:**
- Modify: `src/app/exercise/[id].tsx`
- Test: Create `src/__tests__/exercise-detail-screen.test.tsx`

**Interfaces:** None — no mascot, no shared-component prop threading. Pure
domain-color migration, same reasoning as Task 5.

exercise detail's domain is `sport`. `getExercise` (from
`src/lib/exercises.ts`) is a synchronous, pre-populated lookup — it is
real data, not a network call, so this task's test does not mock
`../../lib/exercises`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/exercise-detail-screen.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseDetailScreen from '../app/exercise/[id]';
import { useLocalSearchParams } from 'expo-router';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

describe('ExerciseDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'squat' });
  });

  it('renders the exercise once found', async () => {
    const { findByText } = await render(<ExerciseDetailScreen />);
    expect(await findByText('Squat')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to confirm it passes already (baseline), then apply the migration**

Run: `npx jest exercise-detail-screen.test.tsx`
Expected: PASS already, same reasoning as Task 5 Step 2 — this task's
verification is that the test still passes after the token swap.

- [ ] **Step 3: Move `accentRed` off the legacy token**

```ts
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accentRed,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
```
→
```ts
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.domainSport,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
```

- [ ] **Step 4: Run the test and confirm it still passes**

Run: `npx jest exercise-detail-screen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add "src/app/exercise/[id].tsx" src/__tests__/exercise-detail-screen.test.tsx
git commit -m "feat: migrate exercise detail to the claymorphic system (domain color)"
```

---

### Task 7: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: clean (per the pre-existing-error caveat in Global Constraints —
confirm no NEW error appears in any file this plan touched).

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: all tests pass, including every new/modified test file from
Tasks 1–6.

- [ ] **Step 3: Grep for leftover legacy references in the 5 migrated screens**

```bash
grep -n "accentRed" src/app/generate-plan.tsx "src/app/(tabs)/grocery-list.tsx" "src/app/(tabs)/weight-log.tsx" "src/app/recipe/[id].tsx" "src/app/exercise/[id].tsx"
```

Expected: no matches. (`accentRed*` itself still exists in
`src/theme/tokens.ts` for the auth/onboarding screens this plan doesn't
touch — that's correct and expected, not a leftover to fix.)

- [ ] **Step 4: Confirm the old grocery illustration is now orphaned (informational only)**

```bash
grep -rn "empty-grocery" src/
```

Expected: no matches — `grocery-list.tsx` no longer references it. Do NOT
delete `assets/images/illustrations/empty-grocery.png` as part of this
task; asset cleanup for orphaned illustrations (this one, plus
`empty-plan.png` orphaned back in Phase 2) is out of scope here, same as
the KgIcon/Ionicons cleanup Phase 2 explicitly deferred.

- [ ] **Step 5: Run the app and check on-device before going further**

Start the app (Expo Go or a simulator/emulator — no EAS build) and
manually walk: generate a plan with a forced failure if possible (or at
minimum visually confirm the encouraging mascot's static appearance looks
right at its actual render size, size={100}), Courses (empty state shows
the mascot if no plan exists), Poids (log a weight, then check the empty
history state before any log exists — mascot idle, brown/neutral
"Enregistrer" button), recipe detail and exercise detail (amber and green
accents respectively, no mascot, nothing looks broken). This step is not
optional — the plan's own precedent (Phase 2's final review flagged the
on-device check as never having been performed, and Phase 1 reverted dark
mode after exactly this kind of on-device-only discovery) makes this the
one step no static review can substitute for.

- [ ] **Step 6: Commit if Step 3 or 4 required any cleanup**

Only if Step 3's grep found something to fix — otherwise this task
produces no diff of its own and there's nothing to commit.

---

## Follow-up work (separate plan, not part of this one)

- **Phase 4**: auth + onboarding (login, signup, forgot-password,
  reset-password, onboarding) — different design register (forms,
  pre-brand-trust context), explicitly out of this plan's scope.
- **The remaining mascot pose** (moving/transition) — generate only once a
  real placement in a later phase actually needs it; this phase used up
  the "encouraging" pose's only known placement.
- **Orphaned illustration assets** — `empty-grocery.png` (this phase) and
  `empty-plan.png` (Phase 2) are no longer referenced anywhere; a cleanup
  pass could remove them once nothing else risks needing the old pattern.
- **`@expo/vector-icons` dependency status** — Phase 2 already noted
  `Ionicons`/`KgIcon` have no remaining call sites in the tab bar; still
  unconfirmed whether anything else in the app imports `@expo/vector-icons`
  directly, which would determine if it's safe to drop as a dependency.
