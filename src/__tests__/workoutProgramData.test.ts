import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchProgramDetails,
  fetchTemplateDaySlots,
  fetchExercisePool,
  saveGeneratedProgram,
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

describe('fetchTemplateDaySlots', () => {
  it('groups slots by day, sorted by order_index, preserving day order', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          day_number: 1,
          name: 'Push',
          template_day_slots: [
            { muscle_group: 'shoulders', slot_count: 1, order_index: 2 },
            { muscle_group: 'chest', slot_count: 3, order_index: 1 },
          ],
        },
        {
          day_number: 2,
          name: 'Pull',
          template_day_slots: [{ muscle_group: 'back', slot_count: 3, order_index: 1 }],
        },
      ],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchTemplateDaySlots('template-1');

    expect(result).toEqual([
      { name: 'Push', slots: [{ muscleGroup: 'chest', count: 3 }, { muscleGroup: 'shoulders', count: 1 }] },
      { name: 'Pull', slots: [{ muscleGroup: 'back', count: 3 }] },
    ]);
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchTemplateDaySlots('template-1')).rejects.toThrow('boom');
  });
});

describe('fetchExercisePool', () => {
  it('maps rows to ExercisePoolItem, filtered by equipment', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ id: 'e1', muscle_group: 'chest' }],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchExercisePool('full_gym');

    expect(result).toEqual([{ id: 'e1', muscleGroup: 'chest' }]);
    expect(eq).toHaveBeenCalledWith('equipment_needed', 'full_gym');
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchExercisePool('full_gym')).rejects.toThrow('boom');
  });
});

describe('saveGeneratedProgram', () => {
  const days = [
    { dayNumber: 1, dayName: 'Push', exerciseIds: ['e1', 'e2'] },
    { dayNumber: 2, dayName: 'Pull', exerciseIds: ['e3'] },
  ];

  it('deletes existing rows then inserts the new generated days', async () => {
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq: deleteEq });
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del, insert });

    await saveGeneratedProgram('user-1', days);

    expect(deleteEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(insert).toHaveBeenCalledWith([
      { user_id: 'user-1', day_number: 1, day_name: 'Push', exercise_id: 'e1', order_index: 0 },
      { user_id: 'user-1', day_number: 1, day_name: 'Push', exercise_id: 'e2', order_index: 1 },
      { user_id: 'user-1', day_number: 2, day_name: 'Pull', exercise_id: 'e3', order_index: 0 },
    ]);
  });

  it('throws if the delete fails, without attempting the insert', async () => {
    const deleteEq = jest.fn().mockResolvedValue({ error: new Error('boom') });
    const del = jest.fn().mockReturnValue({ eq: deleteEq });
    const insert = jest.fn();
    (supabase.from as jest.Mock).mockReturnValue({ delete: del, insert });

    await expect(saveGeneratedProgram('user-1', days)).rejects.toThrow('boom');
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws if the insert fails', async () => {
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq: deleteEq });
    const insert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del, insert });

    await expect(saveGeneratedProgram('user-1', days)).rejects.toThrow('boom');
  });
});

describe('fetchProgramDetails', () => {
  it('assembles the template name and generated days, sorted by day and order_index', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: { name: 'Full Body' }, error: null });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });

    const rowsOrder2 = jest.fn().mockResolvedValue({
      data: [
        {
          day_number: 1,
          day_name: 'Full Body',
          exercises: { name: 'Squat', muscle_group: 'legs', default_sets: 4, default_reps_min: 8, default_reps_max: 10 },
        },
        {
          day_number: 1,
          day_name: 'Full Body',
          exercises: { name: 'Rowing', muscle_group: 'back', default_sets: 3, default_reps_min: 10, default_reps_max: 12 },
        },
      ],
      error: null,
    });
    const rowsOrder1 = jest.fn().mockReturnValue({ order: rowsOrder2 });
    const rowsEq = jest.fn().mockReturnValue({ order: rowsOrder1 });
    const rowsSelect = jest.fn().mockReturnValue({ eq: rowsEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: templateSelect })
      .mockReturnValueOnce({ select: rowsSelect });

    const result = await fetchProgramDetails('user-1', 'template-1');

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

    await expect(fetchProgramDetails('user-1', 'template-1')).rejects.toThrow('boom');
  });
});
