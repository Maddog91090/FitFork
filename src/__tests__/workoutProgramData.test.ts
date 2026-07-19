import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchProgramDetails,
} from '../lib/workoutProgramData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchWorkoutTemplates', () => {
  it('maps rows to the WorkoutTemplateOption shape', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ id: 't1', name: 'Full Body', days_per_week: 3, level: 'intermediate', equipment: 'full_gym' }],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchWorkoutTemplates();

    expect(result).toEqual([
      { id: 't1', name: 'Full Body', daysPerWeek: 3, level: 'intermediate', equipment: 'full_gym' },
    ]);
    expect(order).toHaveBeenCalledWith('id');
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchWorkoutTemplates()).rejects.toThrow('boom');
  });
});

describe('saveWorkoutProgram', () => {
  it('upserts the user_workout_programs row', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await saveWorkoutProgram('user-1', 'template-1');

    expect(supabase.from).toHaveBeenCalledWith('user_workout_programs');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', template_id: 'template-1' })
    );
  });

  it('throws on a Supabase error', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await expect(saveWorkoutProgram('user-1', 'template-1')).rejects.toThrow('boom');
  });
});

describe('getAssignedTemplateId', () => {
  it('returns null when the user has no assigned program', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getAssignedTemplateId('user-1');

    expect(result).toBeNull();
  });

  it('returns the assigned template id', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { template_id: 'template-1' }, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getAssignedTemplateId('user-1');

    expect(result).toBe('template-1');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});

describe('fetchProgramDetails', () => {
  it('assembles the template name, days, and exercises sorted by order_index', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: { name: 'Full Body' }, error: null });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });

    const daysOrder = jest.fn().mockResolvedValue({
      data: [
        {
          day_number: 1,
          name: 'Full Body',
          template_exercises: [
            { sets: 3, reps_min: 10, reps_max: 12, order_index: 2, exercises: { name: 'Rowing', muscle_group: 'back' } },
            { sets: 4, reps_min: 8, reps_max: 10, order_index: 1, exercises: { name: 'Squat', muscle_group: 'legs' } },
          ],
        },
      ],
      error: null,
    });
    const daysEq = jest.fn().mockReturnValue({ order: daysOrder });
    const daysSelect = jest.fn().mockReturnValue({ eq: daysEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: templateSelect })
      .mockReturnValueOnce({ select: daysSelect });

    const result = await fetchProgramDetails('template-1');

    expect(result).toEqual({
      templateId: 'template-1',
      templateName: 'Full Body',
      days: [
        {
          dayNumber: 1,
          name: 'Full Body',
          exercises: [
            { name: 'Squat', muscleGroup: 'legs', sets: 4, repsMin: 8, repsMax: 10 },
            { name: 'Rowing', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12 },
          ],
        },
      ],
    });
  });

  it('throws if the template lookup fails', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: templateSelect });

    await expect(fetchProgramDetails('template-1')).rejects.toThrow('boom');
  });
});
