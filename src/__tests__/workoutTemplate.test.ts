import { selectTemplate, type WorkoutTemplateOption, type TrainingProfileInput } from '../lib/workoutTemplate';

const TEMPLATES: WorkoutTemplateOption[] = [
  { id: 't1', name: 'A - Full Gym 3d Intermediate', daysPerWeek: 3, level: 'intermediate', equipment: 'full_gym' },
  { id: 't2', name: 'B - Full Gym 4d Intermediate', daysPerWeek: 4, level: 'intermediate', equipment: 'full_gym' },
  { id: 't3', name: 'C - Full Gym 5d Intermediate', daysPerWeek: 5, level: 'intermediate', equipment: 'full_gym' },
  { id: 't4', name: 'D - Bodyweight 3d Beginner', daysPerWeek: 3, level: 'beginner', equipment: 'bodyweight' },
  { id: 't5', name: 'E - Full Gym 3d Beginner', daysPerWeek: 3, level: 'beginner', equipment: 'full_gym' },
  { id: 't6', name: 'F - Full Gym 3d Intermediate B', daysPerWeek: 3, level: 'intermediate', equipment: 'full_gym' },
];

describe('selectTemplate', () => {
  it('picks the exact day/level/equipment match', () => {
    const profile: TrainingProfileInput = { daysPerWeek: 5, experienceLevel: 'intermediate', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t3');
  });

  it('prioritizes day-count closeness over level match', () => {
    // t2 (4 days) has the smallest day-diff (0) even though its level (intermediate) doesn't match beginner
    const profile: TrainingProfileInput = { daysPerWeek: 4, experienceLevel: 'beginner', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t2');
  });

  it('falls back to level match when day-diff ties', () => {
    // t1 and t5 both have daysPerWeek 3 (diff 0); t5's level (beginner) matches, t1's doesn't
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t4');
  });

  it('excludes templates requiring more equipment than the user has', () => {
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'bodyweight' };
    // Only t4 is bodyweight-tier; all full_gym templates must be excluded
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t4');
  });

  it('allows a higher-equipment user to select a lower-equipment template when it is the best match', () => {
    // t4 (bodyweight) and t5 (full_gym) both have daysPerWeek 3 + level beginner (tie);
    // a full_gym user is compatible with both, and 'D...' sorts before 'E...' alphabetically
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t4');
  });

  it('returns null when no equipment-compatible template exists', () => {
    const fullGymOnly = TEMPLATES.filter((t) => t.equipment === 'full_gym');
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'intermediate', equipment: 'bodyweight' };
    expect(selectTemplate(profile, fullGymOnly)).toBeNull();
  });

  it('breaks ties stably by name when day-diff and level match are both equal', () => {
    // t1 and t6 are identical in daysPerWeek/level/equipment; 'A...' sorts before 'F...'
    const profile: TrainingProfileInput = { daysPerWeek: 3, experienceLevel: 'intermediate', equipment: 'full_gym' };
    expect(selectTemplate(profile, TEMPLATES)?.id).toBe('t1');
  });
});
