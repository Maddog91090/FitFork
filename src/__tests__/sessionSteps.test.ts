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
