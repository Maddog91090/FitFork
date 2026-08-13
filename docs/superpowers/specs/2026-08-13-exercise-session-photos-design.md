# Exercise Session Photos Design

**Goal:** Show each exercise's start/end photos on the workout-session screen while it's being performed, so the user can see how to do the movement without leaving the timer screen.

## Context

`src/lib/exercises.ts` already defines an `Exercise` record per exercise id with `imageStart`/`imageEnd` (`ImageSourcePropType`), backed by photos already committed at `assets/images/exercises/*.jpg`. `src/app/exercise/[id].tsx` already renders both photos side by side (`photoRow`/`photoColumn`/`photoFrame`/`photo`/`photoLabel` styles) with "Position de départ" / "Position finale" captions.

`src/app/workout-session.tsx` renders two step layouts today, neither showing a photo:
- `kind === 'manual'`: exercise name, detail text, "Terminé" button.
- `kind === 'work'` (and `rest`/`recovery`, which share the same branch): step label, headline, countdown, Pause/Passer buttons.

Both `work` and `manual` steps carry `exerciseId` (see `src/lib/sessionSteps.ts`); `rest`/`recovery` steps don't, since no exercise is being performed during them.

## Design

**New shared component — `src/components/ui/ExercisePhotoPair.tsx`**
Extracted from the exact pattern already in `exercise/[id].tsx`, so that screen's visual output doesn't change. Props: `{ imageStart: ImageSourcePropType; imageEnd: ImageSourcePropType; showLabels?: boolean }`, `showLabels` defaulting to `true`. Renders the existing `photoRow`/`photoColumn`/`photoFrame`/`photo` styling; `photoLabel` captions ("Position de départ" / "Position finale") render only when `showLabels` is true.

**`exercise/[id].tsx`** is refactored to render `<ExercisePhotoPair imageStart={exercise.imageStart} imageEnd={exercise.imageEnd} />` in place of its inline JSX, keeping `showLabels` at its default (`true`). No visual or behavioral change to this screen.

**`workout-session.tsx`** imports `getExercise` from `src/lib/exercises.ts`. For both the `manual` branch and the `work` branch (inside the existing non-manual branch, gated on `currentStep.kind === 'work'`), it resolves `getExercise(currentStep.exerciseId)` and renders `<ExercisePhotoPair imageStart={...} imageEnd={...} showLabels={false} />`:
- `manual` branch: between `exerciseName` and `detail` text.
- `work` branch: between `exerciseName` (headline) and the `countdown` timer.

`rest` and `recovery` steps are unchanged — no photo, since no exercise is being performed. If `getExercise` returns `undefined` for a given `exerciseId` (shouldn't happen given the current dataset, but the lookup is a plain object index), the screen renders as it does today for that step (no photo pair), rather than throwing.

## Testing

- `src/__tests__/ExercisePhotoPair.test.tsx` (new): renders with both images, asserts both `Image` sources render; asserts labels render when `showLabels` is true/unset and are absent when `showLabels={false}`.
- `src/__tests__/workout-session.test.tsx` (existing, extended): asserts the photo pair renders for a `work` step and a `manual` step, using each step's `exerciseId` to resolve the expected image sources via `getExercise`.
- No existing test file covers `exercise/[id].tsx` today; the refactor to `ExercisePhotoPair` is verified via the new `ExercisePhotoPair.test.tsx` plus a manual check that the screen still renders both photos and labels.
