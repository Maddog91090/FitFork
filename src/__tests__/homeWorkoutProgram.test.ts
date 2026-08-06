import { homeWorkoutProgram, getLevelProgram } from '../lib/homeWorkoutProgram';
import type { ExperienceLevel } from '../lib/profile';

describe('homeWorkoutProgram', () => {
  it('has a warm-up and cool-down block with non-empty descriptions', () => {
    expect(homeWorkoutProgram.warmup.description.length).toBeGreaterThan(0);
    expect(homeWorkoutProgram.cooldown.description.length).toBeGreaterThan(0);
  });

  it('has exactly 3 levels covering beginner, intermediate, and advanced', () => {
    const levels = homeWorkoutProgram.levels.map((l) => l.level).slice().sort();
    expect(levels).toEqual(['advanced', 'beginner', 'intermediate']);
  });

  it('has at least one coach note', () => {
    expect(homeWorkoutProgram.coachNotes.length).toBeGreaterThan(0);
  });
});

describe('getLevelProgram', () => {
  const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

  it.each(levels)('returns the matching level program for %s', (level) => {
    const program = getLevelProgram(level);
    expect(program.level).toBe(level);
    expect(program.sessions).toHaveLength(3);
  });

  it('gives every circuit session a positive round count and at least one exercise', () => {
    for (const level of levels) {
      const program = getLevelProgram(level);
      for (const session of program.sessions) {
        if (session.type === 'circuit') {
          expect(session.rounds).toBeGreaterThan(0);
          expect(session.exercises.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('gives every series session at least one exercise with a non-empty detail', () => {
    for (const level of levels) {
      const program = getLevelProgram(level);
      for (const session of program.sessions) {
        if (session.type === 'series') {
          expect(session.exercises.length).toBeGreaterThan(0);
          for (const exercise of session.exercises) {
            expect(exercise.detail.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

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
});
