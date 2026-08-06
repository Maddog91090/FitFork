# Lecteur de séance guidée — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Commencer" button to the Sport screen that opens a guided
session player: it auto-advances through a session's exercises with a
work timer, then a rest timer, then the next exercise, and so on, beeping
during the last 5 seconds of every timed step.

**Architecture:** A pure function (`buildSessionSteps`) flattens a session
(circuit or series) into a linear array of typed steps. A wall-clock-deadline
timer hook (`useStepTimer`) drives the countdown for timed steps. A new
route (`src/app/workout-session.tsx`) walks the step array with local
`stepIndex` state, rendering the timer UI for timed steps and a manual
"Terminé" button for rep-based steps, then a finish screen that reuses the
app's existing completion-logging call.

**Tech Stack:** Expo SDK 57, expo-router, React Native, Jest + jest-expo +
`@testing-library/react-native` (incl. `renderHook`). Two new dependencies:
`expo-audio` (beep playback) and `expo-keep-awake` (screen-on during a
session).

## Global Constraints

- Expo SDK is 57 (`~57.0.7`). Use the current versioned API for any Expo
  module — confirmed against https://docs.expo.dev/versions/v57.0.0/ for
  both new dependencies below. Do not use older `expo-av`-style APIs.
- `expo-audio`: `useAudioPlayer(source)` hook: `.play()`, `.pause()`,
  `.seekTo(seconds)`; auto-releases on unmount.
- `expo-keep-awake`: `useKeepAwake()` hook called in a component body —
  automatically activates/deactivates tied to mount/unmount.
- Visual values (colors, font sizes/weights, spacing, radii) must come
  from `src/theme/tokens.ts`. Never inline a hex code, font size, or font
  weight (`.claude/skills/fitfork-design/SKILL.md`, referenced from
  `AGENTS.md`).
- Beep fires at each of the last 5 seconds of a timed step individually
  (5, 4, 3, 2, 1 — not a single beep at the 5s mark), and only for timed
  steps (`work`/`rest`/`recovery`), never for manual (rep-based) steps.
- Series (rep-based) sessions get a manual "Terminé" advance — no
  countdown for the exercise itself, only for the rest between exercises.
- No session resume, no background-audio-session configuration, no
  user-adjustable durations, no per-rep history — all explicitly out of
  scope (see the design doc's "Hors périmètre").
- Finishing a session calls the existing
  `logSessionCompletion(userId, sessionIndex)` from
  `src/lib/workoutCompletionsData.ts` — do not add new completion-tracking
  logic.

---

### Task 1: Add numeric timer fields to the session data model

**Files:**
- Modify: `src/lib/homeWorkoutProgram.ts:9-32` (types), and the 9 session
  objects across the 3 levels (lines 92-241)
- Test: `src/__tests__/homeWorkoutProgram.test.ts`

**Interfaces:**
- Produces: `CircuitSession.recoverySeconds: number`,
  `SeriesSession.restSeconds: number` — consumed by `buildSessionSteps`
  (Task 4).

- [ ] **Step 1: Write the failing tests**

Add these two `it` blocks inside the existing `describe('getLevelProgram', ...)`
block in `src/__tests__/homeWorkoutProgram.test.ts` (after the last existing
`it`, before the closing `});`):

```ts
  it('gives every circuit session a recoverySeconds matching its recoveryLabel', () => {
    const expected: Record<string, number> = {
      'Full body doux': 120,
      'Cardio léger': 120,
      'Full body en circuit': 90,
      'Cardio HIIT': 120,
      'Full body intense': 90,
      'HIIT explosif': 90,
    };
    for (const level of levels) {
      const program = getLevelProgram(level);
      for (const session of program.sessions) {
        if (session.type === 'circuit') {
          expect(session.recoverySeconds).toBe(expected[session.name]);
        }
      }
    }
  });

  it('gives every series session a restSeconds matching the upper bound of its restLabel', () => {
    const expected: Record<string, number> = {
      'Renforcement de base': 60,
      'Bas du corps + gainage': 60,
      'Force + gainage': 45,
    };
    for (const level of levels) {
      const program = getLevelProgram(level);
      for (const session of program.sessions) {
        if (session.type === 'series') {
          expect(session.restSeconds).toBe(expected[session.name]);
        }
      }
    }
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest homeWorkoutProgram.test.ts`
Expected: FAIL — `recoverySeconds`/`restSeconds` is `undefined`, `toBe`
assertions fail (or a TypeScript error on `session.recoverySeconds` /
`session.restSeconds` not existing on the type, depending on ts-jest
strictness; either way, red).

- [ ] **Step 3: Add the fields to the types**

In `src/lib/homeWorkoutProgram.ts`, add `recoverySeconds: number;` right
after `recoveryLabel: string;` in `CircuitSession` (line 16), and
`restSeconds: number;` right after `restLabel: string;` in `SeriesSession`
(line 30):

```ts
export type CircuitSession = {
  type: 'circuit';
  name: string;
  image: ImageSourcePropType;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  recoveryLabel: string;
  recoverySeconds: number;
  exercises: CircuitExercise[];
};
```

```ts
export type SeriesSession = {
  type: 'series';
  name: string;
  image: ImageSourcePropType;
  restLabel: string;
  restSeconds: number;
  exercises: SeriesExercise[];
};
```

- [ ] **Step 4: Add the values to the 9 session objects**

Add `recoverySeconds` right after each `recoveryLabel` line, and
`restSeconds` right after each `restLabel` line, using these exact values:

Circuit sessions (`recoveryLabel` → `recoverySeconds`):
- Beginner, "Full body doux" (line 99, `recoveryLabel: '2 min de récup entre les tours'`) → `recoverySeconds: 120,`
- Beginner, "Cardio léger" (line 115, `recoveryLabel: '2 min de récup'`) → `recoverySeconds: 120,`
- Intermediate, "Full body en circuit" (line 150, `recoveryLabel: '1 min 30 de récup'`) → `recoverySeconds: 90,`
- Intermediate, "Cardio HIIT" (line 166, `recoveryLabel: '2 min de récup'`) → `recoverySeconds: 120,`
- Advanced, "Full body intense" (line 203, `recoveryLabel: '1 min 30 de récup'`) → `recoverySeconds: 90,`
- Advanced, "HIIT explosif" (line 219, `recoveryLabel: '1 min 30 de récup'`) → `recoverySeconds: 90,`

Series sessions (`restLabel` → `restSeconds`):
- Beginner, "Renforcement de base" (line 127, `restLabel: '45 s à 1 min de repos entre chaque'`) → `restSeconds: 60,`
- Intermediate, "Bas du corps + gainage" (line 178, `restLabel: '45 s à 1 min de repos'`) → `restSeconds: 60,`
- Advanced, "Force + gainage" (line 232, `restLabel: '30 à 45 s de repos seulement'`) → `restSeconds: 45,`

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest homeWorkoutProgram.test.ts`
Expected: PASS (all tests, including the two new ones).

- [ ] **Step 6: Commit**

```bash
git add src/lib/homeWorkoutProgram.ts src/__tests__/homeWorkoutProgram.test.ts
git commit -m "feat: add numeric recovery/rest durations to workout sessions"
```

---

### Task 2: Generate the beep sound asset

**Files:**
- Create: `scripts/generate-beep.js`
- Create (generated binary, committed): `assets/audio/beep.wav`

**Interfaces:**
- Produces: `assets/audio/beep.wav` — consumed by `src/app/workout-session.tsx`
  (Task 6) via `require('../../assets/audio/beep.wav')`.

There is no test for this task — it produces a binary asset via a
deterministic generator script, not application logic.

- [ ] **Step 1: Write the generator script**

Create `scripts/generate-beep.js`:

```js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 0.15;
const FREQUENCY_HZ = 880;
const AMPLITUDE = 0.5;

const numSamples = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
const samples = new Int16Array(numSamples);

for (let i = 0; i < numSamples; i++) {
  const t = i / SAMPLE_RATE;
  // Fade the last 20% of the beep to zero so playback doesn't click on cutoff.
  const fadeStart = numSamples * 0.8;
  const envelope = i > fadeStart ? (numSamples - i) / (numSamples - fadeStart) : 1;
  const sample = Math.sin(2 * Math.PI * FREQUENCY_HZ * t) * AMPLITUDE * envelope;
  samples[i] = Math.round(sample * 32767);
}

const dataSize = samples.length * 2;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate (mono, 16-bit)
buffer.writeUInt16LE(2, 32); // block align
buffer.writeUInt16LE(16, 34); // bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < samples.length; i++) {
  buffer.writeInt16LE(samples[i], 44 + i * 2);
}

const outDir = path.join(__dirname, '..', 'assets', 'audio');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'beep.wav');
fs.writeFileSync(outPath, buffer);
console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
```

- [ ] **Step 2: Run it**

Run: `node scripts/generate-beep.js`
Expected output: `Wrote .../assets/audio/beep.wav (13274 bytes)` (44-byte
WAV header + 6615 samples × 2 bytes)

- [ ] **Step 3: Verify the file was created**

Run: `ls -la assets/audio/beep.wav` (or `Get-Item assets/audio/beep.wav`
on PowerShell)
Expected: file exists, non-zero size (~13KB).

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-beep.js assets/audio/beep.wav
git commit -m "feat: add generated beep sound asset for the workout timer"
```

---

### Task 3: Install expo-audio and expo-keep-awake

**Files:**
- Modify: `package.json`, `package-lock.json` (or the project's lockfile)

**Interfaces:**
- Produces: `expo-audio` and `expo-keep-awake` as installed dependencies
  — consumed by `src/app/workout-session.tsx` (Task 6).

No test — this is a dependency install.

- [ ] **Step 1: Install**

Run: `npx expo install expo-audio expo-keep-awake`

- [ ] **Step 2: Verify**

Run: `grep -E '"expo-(audio|keep-awake)"' package.json`
Expected: both packages listed with SDK-57-compatible version ranges
(the `expo install` command resolves the correct range automatically).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-audio and expo-keep-awake dependencies"
```

(Substitute `yarn.lock`/`pnpm-lock.yaml` for `package-lock.json` if the
project uses a different package manager — check which lockfile exists at
the repo root before running `git add`.)

---

### Task 4: `buildSessionSteps` — flatten a session into a step queue

**Files:**
- Create: `src/lib/sessionSteps.ts`
- Test: `src/__tests__/sessionSteps.test.ts`

**Interfaces:**
- Consumes: `Session`, `CircuitSession`, `SeriesSession` types from
  `src/lib/homeWorkoutProgram.ts` (Task 1 — `recoverySeconds`/`restSeconds`
  must exist on these types before this task starts).
- Produces: `export type SessionStep = ...` (union below) and
  `export function buildSessionSteps(session: Session): SessionStep[]` —
  consumed by `src/app/workout-session.tsx` (Task 6).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/sessionSteps.test.ts`:

```ts
import { buildSessionSteps } from '../lib/sessionSteps';
import type { CircuitSession, SeriesSession } from '../lib/homeWorkoutProgram';

const circuitFixture: CircuitSession = {
  type: 'circuit',
  name: 'Test Circuit',
  image: 1,
  workSeconds: 30,
  restSeconds: 15,
  rounds: 2,
  recoverySeconds: 90,
  recoveryLabel: '1 min 30 de récup',
  exercises: [
    { name: 'Exercice A', exerciseId: 'a' },
    { name: 'Exercice B', exerciseId: 'b' },
  ],
};

const seriesFixture: SeriesSession = {
  type: 'series',
  name: 'Test Series',
  image: 1,
  restSeconds: 60,
  restLabel: '45 s à 1 min',
  exercises: [
    { name: 'Exercice X', detail: '3 x 12', exerciseId: 'x' },
    { name: 'Exercice Y', detail: '3 x 12', exerciseId: 'y' },
    { name: 'Exercice Z', detail: '3 x 12', exerciseId: 'z' },
  ],
};

describe('buildSessionSteps', () => {
  it('builds work/rest/recovery steps for a circuit session across all rounds', () => {
    expect(buildSessionSteps(circuitFixture)).toEqual([
      { kind: 'work', exerciseName: 'Exercice A', exerciseId: 'a', seconds: 30, roundLabel: 'Tour 1/2' },
      { kind: 'rest', seconds: 15, nextExerciseName: 'Exercice B' },
      { kind: 'work', exerciseName: 'Exercice B', exerciseId: 'b', seconds: 30, roundLabel: 'Tour 1/2' },
      { kind: 'recovery', seconds: 90, label: '1 min 30 de récup', nextRoundLabel: 'Tour 2/2' },
      { kind: 'work', exerciseName: 'Exercice A', exerciseId: 'a', seconds: 30, roundLabel: 'Tour 2/2' },
      { kind: 'rest', seconds: 15, nextExerciseName: 'Exercice B' },
      { kind: 'work', exerciseName: 'Exercice B', exerciseId: 'b', seconds: 30, roundLabel: 'Tour 2/2' },
    ]);
  });

  it('builds manual/rest steps for a series session, with no rest after the last exercise', () => {
    expect(buildSessionSteps(seriesFixture)).toEqual([
      { kind: 'manual', exerciseName: 'Exercice X', exerciseId: 'x', detail: '3 x 12' },
      { kind: 'rest', seconds: 60, nextExerciseName: 'Exercice Y' },
      { kind: 'manual', exerciseName: 'Exercice Y', exerciseId: 'y', detail: '3 x 12' },
      { kind: 'rest', seconds: 60, nextExerciseName: 'Exercice Z' },
      { kind: 'manual', exerciseName: 'Exercice Z', exerciseId: 'z', detail: '3 x 12' },
    ]);
  });

  it('produces no recovery step for a single-round circuit session', () => {
    const oneRound: CircuitSession = { ...circuitFixture, rounds: 1 };
    expect(buildSessionSteps(oneRound)).toEqual([
      { kind: 'work', exerciseName: 'Exercice A', exerciseId: 'a', seconds: 30, roundLabel: 'Tour 1/1' },
      { kind: 'rest', seconds: 15, nextExerciseName: 'Exercice B' },
      { kind: 'work', exerciseName: 'Exercice B', exerciseId: 'b', seconds: 30, roundLabel: 'Tour 1/1' },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest sessionSteps.test.ts`
Expected: FAIL with "Cannot find module '../lib/sessionSteps'".

- [ ] **Step 3: Implement**

Create `src/lib/sessionSteps.ts`:

```ts
import type { Session } from './homeWorkoutProgram';

export type SessionStep =
  | { kind: 'work'; exerciseName: string; exerciseId: string; seconds: number; roundLabel: string }
  | { kind: 'rest'; seconds: number; nextExerciseName: string }
  | { kind: 'recovery'; seconds: number; label: string; nextRoundLabel: string }
  | { kind: 'manual'; exerciseName: string; exerciseId: string; detail: string };

export function buildSessionSteps(session: Session): SessionStep[] {
  const steps: SessionStep[] = [];

  if (session.type === 'circuit') {
    for (let round = 1; round <= session.rounds; round++) {
      const roundLabel = `Tour ${round}/${session.rounds}`;
      session.exercises.forEach((exercise, exerciseIndex) => {
        steps.push({
          kind: 'work',
          exerciseName: exercise.name,
          exerciseId: exercise.exerciseId,
          seconds: session.workSeconds,
          roundLabel,
        });
        const isLastExerciseInRound = exerciseIndex === session.exercises.length - 1;
        if (!isLastExerciseInRound) {
          const nextExercise = session.exercises[exerciseIndex + 1];
          steps.push({
            kind: 'rest',
            seconds: session.restSeconds,
            nextExerciseName: nextExercise.name,
          });
        }
      });
      const isLastRound = round === session.rounds;
      if (!isLastRound) {
        steps.push({
          kind: 'recovery',
          seconds: session.recoverySeconds,
          label: session.recoveryLabel,
          nextRoundLabel: `Tour ${round + 1}/${session.rounds}`,
        });
      }
    }
  } else {
    session.exercises.forEach((exercise, exerciseIndex) => {
      steps.push({
        kind: 'manual',
        exerciseName: exercise.name,
        exerciseId: exercise.exerciseId,
        detail: exercise.detail,
      });
      const isLastExercise = exerciseIndex === session.exercises.length - 1;
      if (!isLastExercise) {
        const nextExercise = session.exercises[exerciseIndex + 1];
        steps.push({
          kind: 'rest',
          seconds: session.restSeconds,
          nextExerciseName: nextExercise.name,
        });
      }
    });
  }

  return steps;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest sessionSteps.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/sessionSteps.ts src/__tests__/sessionSteps.test.ts
git commit -m "feat: add buildSessionSteps to flatten a workout session into a step queue"
```

---

### Task 5: `useStepTimer` — wall-clock countdown hook

**Files:**
- Create: `src/lib/useStepTimer.ts`
- Test: `src/__tests__/useStepTimer.test.ts`

**Interfaces:**
- Produces:
  `export function useStepTimer(totalSeconds: number, onComplete: () => void): { remainingSeconds: number; isPaused: boolean; pause: () => void; resume: () => void }`
  — consumed by `src/app/workout-session.tsx` (Task 6).
- Independent of `buildSessionSteps` — takes a plain number of seconds,
  not a `SessionStep`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/useStepTimer.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react-native';
import { useStepTimer } from '../lib/useStepTimer';

describe('useStepTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down from the given total and calls onComplete at zero', async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepTimer(3, onComplete));

    expect(result.current.remainingSeconds).toBe(3);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(2);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stops counting down while paused, and resumes from the paused value', async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepTimer(5, onComplete));

    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(3);

    await act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    await act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(3);

    await act(() => {
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);

    await act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets to the new total when totalSeconds changes', async () => {
    const onComplete = jest.fn();
    const { result, rerender } = await renderHook(({ seconds }) => useStepTimer(seconds, onComplete), {
      initialProps: { seconds: 3 },
    });

    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(1);

    await rerender({ seconds: 10 });
    expect(result.current.remainingSeconds).toBe(10);
  });
});
```

**Environment note (verified against the installed package, not assumed):**
in this repo's installed `@testing-library/react-native` version, `renderHook`,
`act`, and the `rerender` function `renderHook` returns are all `async` —
every call must be `await`ed, even when the callback passed to `act()` is
itself synchronous. Skipping `await` leaves state updates un-flushed by the
time the next assertion runs (stale or `null` `result.current`). This is
why every `renderHook(...)`, `act(...)`, and `rerender(...)` call above is
awaited — do not remove any of these `await`s when transcribing.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest useStepTimer.test.ts`
Expected: FAIL with "Cannot find module '../lib/useStepTimer'".

- [ ] **Step 3: Implement**

Create `src/lib/useStepTimer.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export type StepTimer = {
  remainingSeconds: number;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
};

export function useStepTimer(totalSeconds: number, onComplete: () => void): StepTimer {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const deadlineRef = useRef(Date.now() + totalSeconds * 1000);
  const pausedRemainingRef = useRef(totalSeconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    deadlineRef.current = Date.now() + totalSeconds * 1000;
    pausedRemainingRef.current = totalSeconds;
    setRemainingSeconds(totalSeconds);
    setIsPaused(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (isPaused) return undefined;

    const interval = setInterval(() => {
      const msLeft = deadlineRef.current - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setRemainingSeconds((prev) => (prev === secondsLeft ? prev : secondsLeft));
      if (msLeft <= 0) {
        clearInterval(interval);
        onCompleteRef.current();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPaused]);

  const pause = useCallback(() => {
    pausedRemainingRef.current = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    deadlineRef.current = Date.now() + pausedRemainingRef.current * 1000;
    setIsPaused(false);
  }, []);

  return { remainingSeconds, isPaused, pause, resume };
}
```

The countdown is driven by a recalculated `deadline = Date.now() + seconds * 1000`
on every 200ms tick, rather than decrementing a counter — so it stays
accurate even if JS execution is briefly throttled (app backgrounded,
screen locked for a moment).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest useStepTimer.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/useStepTimer.ts src/__tests__/useStepTimer.test.ts
git commit -m "feat: add useStepTimer wall-clock countdown hook"
```

---

### Task 6: The guided session screen (`/workout-session`)

**Files:**
- Create: `src/app/workout-session.tsx`
- Test: `src/__tests__/workout-session.test.tsx`

**Interfaces:**
- Consumes:
  - `getLevelProgram(level: ExperienceLevel): LevelProgram` from
    `src/lib/homeWorkoutProgram.ts`
  - `buildSessionSteps(session: Session): SessionStep[]` from
    `src/lib/sessionSteps.ts` (Task 4)
  - `useStepTimer(totalSeconds: number, onComplete: () => void): StepTimer`
    from `src/lib/useStepTimer.ts` (Task 5)
  - `logSessionCompletion(userId: string, sessionIndex: number): Promise<void>`
    from `src/lib/workoutCompletionsData.ts`
  - `assets/audio/beep.wav` from Task 2
  - `expo-audio`'s `useAudioPlayer`, `expo-keep-awake`'s `useKeepAwake`
    (Task 3)
  - `useAuth()` from `src/lib/auth-context.tsx` (same shape used by
    `src/app/(tabs)/workout.tsx`: `{ session, loading }`)
- Route params: `{ level: ExperienceLevel; sessionIndex: string }`, reached
  via `router.push({ pathname: '/workout-session', params: { level, sessionIndex } })`
  (wired up in Task 7).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/workout-session.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import WorkoutSessionScreen from '../app/workout-session';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getLevelProgram } from '../lib/homeWorkoutProgram';
import { logSessionCompletion } from '../lib/workoutCompletionsData';
import { useAudioPlayer } from 'expo-audio';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/workoutCompletionsData', () => ({
  logSessionCompletion: jest.fn(),
}));

jest.mock('../lib/homeWorkoutProgram', () => {
  const actual = jest.requireActual('../lib/homeWorkoutProgram');
  return { ...actual, getLevelProgram: jest.fn() };
});

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn(),
}));

const mockBeepPlayer = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() };
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(),
}));

const circuitFixture = {
  type: 'circuit' as const,
  name: 'Test Circuit',
  image: 1,
  workSeconds: 8,
  restSeconds: 2,
  rounds: 1,
  recoverySeconds: 5,
  recoveryLabel: '5 s de récup',
  exercises: [
    { name: 'Exercice A', exerciseId: 'a' },
    { name: 'Exercice B', exerciseId: 'b' },
  ],
};

const seriesFixture = {
  type: 'series' as const,
  name: 'Test Series',
  image: 1,
  restSeconds: 2,
  restLabel: '2 s',
  exercises: [{ name: 'Exercice X', detail: '3 x 12', exerciseId: 'x' }],
};

function mockParams(level: string, sessionIndex: string) {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ level, sessionIndex });
}

describe('WorkoutSessionScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00Z'));
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (getLevelProgram as jest.Mock).mockReturnValue({
      level: 'beginner',
      label: 'Débutant',
      summary: '',
      sessionDurationLabel: '',
      sessions: [circuitFixture, circuitFixture, seriesFixture],
    });
    (useAudioPlayer as jest.Mock).mockReturnValue(mockBeepPlayer);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the first work step with its countdown and exercise name', async () => {
    mockParams('beginner', '0');
    const { findByText } = await render(<WorkoutSessionScreen />);

    expect(await findByText('Exercice A')).toBeTruthy();
    expect(await findByText('Tour 1/1')).toBeTruthy();
    expect(await findByText('8')).toBeTruthy();
  });

  it('advances to the rest step when "Passer" is pressed', async () => {
    mockParams('beginner', '0');
    const { findByText, getByText } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice A');
    await fireEvent.press(getByText('Passer'));

    expect(await findByText('Repos')).toBeTruthy();
    expect(await findByText('Ensuite : Exercice B')).toBeTruthy();
  });

  it('shows the manual step detail for a series session and advances on "Terminé"', async () => {
    mockParams('beginner', '2');
    const { findByText, getByText } = await render(<WorkoutSessionScreen />);

    expect(await findByText('Exercice X')).toBeTruthy();
    expect(await findByText('3 x 12')).toBeTruthy();

    await fireEvent.press(getByText('Terminé'));

    expect(await findByText('Séance terminée 🎉')).toBeTruthy();
  });

  it('logs completion and returns to the workout tab when finishing', async () => {
    mockParams('beginner', '2');
    (logSessionCompletion as jest.Mock).mockResolvedValue(undefined);
    const { findByText, getByText } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice X');
    await fireEvent.press(getByText('Terminé'));
    await fireEvent.press(await findByText('Marquer la séance comme terminée'));

    await waitFor(() => expect(logSessionCompletion).toHaveBeenCalledWith('user-1', 2));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/workout');
  });

  it('beeps only once the countdown enters its last 5 seconds, then auto-advances at zero', async () => {
    mockParams('beginner', '0');
    const { findByText } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice A');

    // workSeconds is 8; after 2s, remainingSeconds is 6 — still outside the
    // last-5-seconds beep window.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockBeepPlayer.play).not.toHaveBeenCalled();

    // After 4 more seconds (6s elapsed total), remainingSeconds is 2 — inside
    // the beep window.
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(mockBeepPlayer.play).toHaveBeenCalled();

    // After the remaining 2s (8s elapsed total), the step completes and
    // auto-advances to the rest step.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(await findByText('Repos')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest workout-session.test.tsx`
Expected: FAIL with "Cannot find module '../app/workout-session'".

- [ ] **Step 3: Implement**

Create `src/app/workout-session.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { useAuth } from '../lib/auth-context';
import type { ExperienceLevel } from '../lib/profile';
import { getLevelProgram } from '../lib/homeWorkoutProgram';
import { buildSessionSteps, type SessionStep } from '../lib/sessionSteps';
import { useStepTimer } from '../lib/useStepTimer';
import { logSessionCompletion } from '../lib/workoutCompletionsData';
import { Button } from '../components/ui/Button';
import { centeredContent, spacing, typography, useThemeColors, type ThemeColors } from '../theme/tokens';

const VALID_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

function resolveSession(level: string | undefined, sessionIndexParam: string | undefined) {
  if (!level || !sessionIndexParam) return undefined;
  if (!VALID_LEVELS.includes(level as ExperienceLevel)) return undefined;
  const index = Number(sessionIndexParam);
  if (!Number.isInteger(index)) return undefined;
  return getLevelProgram(level as ExperienceLevel).sessions[index];
}

function stepKindLabel(step: SessionStep): string {
  if (step.kind === 'work') return step.roundLabel;
  if (step.kind === 'rest') return 'Repos';
  return 'Récupération';
}

function stepHeadline(step: SessionStep): string {
  if (step.kind === 'work') return step.exerciseName;
  if (step.kind === 'rest') return `Ensuite : ${step.nextExerciseName}`;
  return `Ensuite : ${step.nextRoundLabel}`;
}

export default function WorkoutSessionScreen() {
  useKeepAwake();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const params = useLocalSearchParams<{ level: string; sessionIndex: string }>();
  const beepPlayer = useAudioPlayer(require('../../assets/audio/beep.wav'));

  const sessionIndex = Number(params.sessionIndex);
  const workoutSession = resolveSession(params.level, params.sessionIndex);
  const steps = useMemo(() => (workoutSession ? buildSessionSteps(workoutSession) : []), [workoutSession]);

  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const currentStep: SessionStep | undefined = steps[stepIndex];
  const finished = steps.length > 0 && stepIndex >= steps.length;

  const advance = useCallback(() => setStepIndex((i) => i + 1), []);

  const isTimed = currentStep?.kind === 'work' || currentStep?.kind === 'rest' || currentStep?.kind === 'recovery';
  const timerSeconds = isTimed && currentStep ? currentStep.seconds : 999999;
  const timer = useStepTimer(timerSeconds, advance);

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
    setFinishing(true);
    try {
      await logSessionCompletion(session.user.id, sessionIndex);
      router.replace('/(tabs)/workout');
    } finally {
      setFinishing(false);
    }
  };

  if (loading || !session) {
    return <View style={styles.screen} />;
  }

  if (!workoutSession) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Séance introuvable.</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.screen}>
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedTitle}>Séance terminée 🎉</Text>
          <Button title="Marquer la séance comme terminée" onPress={handleFinish} loading={finishing} />
        </View>
      </View>
    );
  }

  if (!currentStep) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bgBase,
      padding: spacing.lg,
    },
    error: { ...typography.body, color: colors.error },
    stepContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      ...centeredContent,
    },
    stepKindLabel: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.sm },
    exerciseName: { ...typography.display, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
    detail: { ...typography.title, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    countdown: { ...typography.hero, color: colors.accentRed, marginBottom: spacing.xl },
    controlsRow: { flexDirection: 'row', gap: spacing.md },
    finishedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.lg,
      ...centeredContent,
    },
    finishedTitle: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  });
}
```

Notes for the implementer:
- `timerSeconds` uses a large dummy value (`999999`) for manual steps so
  `useStepTimer` (always called — hooks must run unconditionally) never
  practically completes during a manual step; `isTimed` gates the beep
  effect so manual steps never beep.
- `typography.hero` is the largest size in the token scale — used for the
  countdown per the "never inline a font size" constraint. There is no
  bigger token available; do not invent one.
- No visible header/back button on this screen — this matches the
  existing pattern for `src/app/exercise/[id].tsx`, which also renders
  under the root `Stack`'s app-wide `headerShown: false`
  (`src/app/_layout.tsx:48`). Back navigation is via the native swipe/
  gesture back, same as the exercise detail screen.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest workout-session.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/workout-session.tsx src/__tests__/workout-session.test.tsx
git commit -m "feat: add guided workout session player screen"
```

---

### Task 7: Restyle the Sport screen and add the "Commencer" button

**Files:**
- Modify: `src/app/(tabs)/workout.tsx`
- Modify: `src/__tests__/workout-completion.test.tsx`

**Interfaces:**
- Consumes: the `/workout-session` route from Task 6 (navigated to via
  `router.push`).
- No new exports — this task only changes the screen's rendering and
  navigation wiring.

This task also fixes a pre-existing bug found while making this change:
every `require('../../assets/images/workouts/...')` call in this file
resolves to `src/assets/images/workouts/...`, which does not exist — it's
missing one `../` for this file's actual depth (`src/app/(tabs)/`, 3
levels below the repo root). The sibling tab screens `plan.tsx` and
`grocery-list.tsx` (same `src/app/(tabs)/` depth) both correctly use
`../../../assets/...` for their images. This has presumably been failing
to bundle every session's photo since it was introduced. Fixed as part of
this task since it touches the exact same lines being restyled.

- [ ] **Step 1: Write the failing test**

First, add a plain import at the top of `src/__tests__/workout-completion.test.tsx`,
alongside the other imports (the existing `jest.mock('expo-router', ...)`
block already defines `router: { replace: jest.fn(), push: jest.fn() }` —
this import just gives the test access to that same mock object):

```ts
import { router } from 'expo-router';
```

Then add this `it` to the existing `describe('WorkoutScreen completion button', ...)`
block (after the last existing `it`, before the closing `});`):

```ts
  it('navigates to the guided session player when "Commencer" is pressed', async () => {
    const { findByText, getByText } = await render(<WorkoutScreen />);

    await findByText('Commencer');
    await fireEvent.press(getByText('Commencer'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/workout-session',
      params: { level: 'beginner', sessionIndex: '0' },
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest workout-completion.test.tsx`
Expected: FAIL — no element with text "Commencer" exists yet.

- [ ] **Step 3: Implement**

In `src/app/(tabs)/workout.tsx`:

1. Fix the 9 broken image require paths — change every
   `require('../../assets/images/workouts/...')` to
   `require('../../../assets/images/workouts/...')` (add one `../`). There
   are 9 occurrences, one per session across the 3 levels — this is a
   textual search-and-replace of `'../../assets/images/workouts/` to
   `'../../../assets/images/workouts/` across the whole file (safe: no
   other string in this file matches that prefix).

2. Add a `handleStartSession` function next to `handleToggleCompletion`:

```tsx
  const handleStartSession = (index: number) => {
    if (!trainingProfile) return;
    router.push({
      pathname: '/workout-session',
      params: { level: trainingProfile.experienceLevel, sessionIndex: String(index) },
    });
  };
```

3. In the session `Card` render block, add the "Commencer" button right
   after `sessionTitle` and before `<SessionDetail .../>`:

```tsx
            <Text style={styles.sessionTitle}>
              Séance {index + 1} — {sessionItem.name}
            </Text>
            <View style={styles.startRow}>
              <Button title="Commencer" onPress={() => handleStartSession(index)} />
            </View>
            <SessionDetail session={sessionItem} styles={styles} />
```

4. Demote the exercise list visually by adding a small label above it in
   `SessionDetail` — in both the `circuit` branch and the `series`
   branch, add this line as the first child inside the returned
   `<View style={styles.sessionDetail}>`, right before the existing
   `<Text style={styles.sessionMeta}>`:

```tsx
        <Text style={styles.exerciseListLabel}>Aperçu des exercices</Text>
```

5. Add the two new styles to `createStyles`:

```ts
    startRow: { marginTop: spacing.sm, marginBottom: spacing.md },
    exerciseListLabel: { ...typography.overline, color: colors.textTertiary, marginBottom: spacing.xs },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest workout-completion.test.tsx`
Expected: PASS (all tests, including the new one).

- [ ] **Step 5: Commit**

```bash
git add src/app/\(tabs\)/workout.tsx src/__tests__/workout-completion.test.tsx
git commit -m "feat: add Commencer button to Sport screen, fix broken session image paths"
```

---

## Final check

- [ ] Run the full test suite: `npx jest`
  Expected: all tests pass, including the new
  `homeWorkoutProgram.test.ts`, `sessionSteps.test.ts`, `useStepTimer.test.ts`,
  `workout-session.test.tsx`, and `workout-completion.test.tsx` assertions.
