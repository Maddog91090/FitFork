import { generateWorkoutProgram, type DayArchetype, type ExercisePoolItem } from '../lib/workoutProgram';

describe('generateWorkoutProgram', () => {
  const archetypes: DayArchetype[] = [
    { name: 'Push', slots: [{ muscleGroup: 'chest', count: 2 }] },
    { name: 'Pull', slots: [{ muscleGroup: 'back', count: 2 }] },
    { name: 'Legs', slots: [{ muscleGroup: 'legs', count: 2 }] },
  ];

  const pool: ExercisePoolItem[] = [
    { id: 'chest-1', muscleGroup: 'chest' },
    { id: 'chest-2', muscleGroup: 'chest' },
    { id: 'chest-3', muscleGroup: 'chest' },
    { id: 'chest-4', muscleGroup: 'chest' },
    { id: 'back-1', muscleGroup: 'back' },
    { id: 'back-2', muscleGroup: 'back' },
    { id: 'back-3', muscleGroup: 'back' },
    { id: 'back-4', muscleGroup: 'back' },
    { id: 'legs-1', muscleGroup: 'legs' },
    { id: 'legs-2', muscleGroup: 'legs' },
  ];

  it('cycles through archetypes in order, repeating to fill daysPerWeek', () => {
    const days = generateWorkoutProgram(5, archetypes, pool);
    expect(days.map((d) => d.dayName)).toEqual(['Push', 'Pull', 'Legs', 'Push', 'Pull']);
    expect(days.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4, 5]);
  });

  it('produces the correct number of exercises per day', () => {
    const days = generateWorkoutProgram(5, archetypes, pool);
    for (const day of days) {
      expect(day.exerciseIds).toHaveLength(2);
    }
  });

  it('never repeats an exercise within the week when the pool is large enough', () => {
    const days = generateWorkoutProgram(5, archetypes, pool);
    const allIds = days.flatMap((d) => d.exerciseIds);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('falls back to repeating an exercise when the pool cannot cover every occurrence', () => {
    const tinyPool: ExercisePoolItem[] = [{ id: 'chest-1', muscleGroup: 'chest' }];
    const singleSlotArchetypes: DayArchetype[] = [
      { name: 'Push', slots: [{ muscleGroup: 'chest', count: 1 }] },
    ];

    const days = generateWorkoutProgram(2, singleSlotArchetypes, tinyPool);

    expect(days).toHaveLength(2);
    expect(days[0].exerciseIds).toEqual(['chest-1']);
    expect(days[1].exerciseIds).toEqual(['chest-1']);
  });

  it('uses every unused exercise in a partially-exhausted pool before repeating any', () => {
    const smallChestPool: ExercisePoolItem[] = [
      { id: 'chest-1', muscleGroup: 'chest' },
      { id: 'chest-2', muscleGroup: 'chest' },
      { id: 'chest-3', muscleGroup: 'chest' },
    ];
    const pushArchetype: DayArchetype[] = [
      { name: 'Push', slots: [{ muscleGroup: 'chest', count: 2 }] },
    ];

    // 2 Push days x 2 chest slots = 4 picks from a pool of 3 -> exactly 1 repeat
    // is unavoidable, but all 3 distinct exercises must appear before any repeat.
    const days = generateWorkoutProgram(2, pushArchetype, smallChestPool);
    const allIds = days.flatMap((d) => d.exerciseIds);

    expect(allIds).toHaveLength(4);
    expect(new Set(allIds).size).toBe(3); // all 3 pool items used at least once

    for (const day of days) {
      expect(new Set(day.exerciseIds).size).toBe(day.exerciseIds.length);
    }
  });

  it('returns an empty exercise list for a slot with no matching exercises in the pool', () => {
    const noMatchArchetypes: DayArchetype[] = [
      { name: 'Push', slots: [{ muscleGroup: 'shoulders', count: 1 }] },
    ];
    const days = generateWorkoutProgram(1, noMatchArchetypes, pool);
    expect(days[0].exerciseIds).toEqual([]);
  });
});
