import { homeWorkoutProgram } from '../lib/homeWorkoutProgram';
import { exerciseNameToMovementKey, movementAssets, getExerciseVisual } from '../lib/exerciseVisuals';

function allProgramExerciseNames(): string[] {
  const names: string[] = [];
  for (const level of homeWorkoutProgram.levels) {
    for (const session of level.sessions) {
      if (session.type === 'circuit') {
        names.push(...session.exercises);
      } else {
        names.push(...session.exercises.map((exercise) => exercise.name));
      }
    }
  }
  return names;
}

describe('exerciseVisuals', () => {
  it('maps every exercise name in the program to a known movement key', () => {
    for (const name of allProgramExerciseNames()) {
      expect(exerciseNameToMovementKey[name]).toBeDefined();
    }
  });

  it('has start and end visual assets for every movement key referenced by the mapping', () => {
    const usedKeys = new Set(Object.values(exerciseNameToMovementKey));
    expect(usedKeys.size).toBeGreaterThan(0);
    for (const key of usedKeys) {
      expect(movementAssets[key]).toBeDefined();
      expect(movementAssets[key].start).toBeTruthy();
      expect(movementAssets[key].end).toBeTruthy();
      expect(movementAssets[key].label.length).toBeGreaterThan(0);
    }
  });

  it('getExerciseVisual resolves a real program exercise to its movement visual', () => {
    const visual = getExerciseVisual('Squats');
    expect(visual).toBeDefined();
    expect(visual?.label).toBe('Squat');
  });

  it('getExerciseVisual returns undefined for a name not in the program', () => {
    expect(getExerciseVisual('Not a real exercise')).toBeUndefined();
  });
});
