import { getProfile, upsertProfile, getTrainingProfile, upsertTrainingProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function mockSelectChain(result: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select, eq, maybeSingle };
}

describe('profile data access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProfile returns null when no row exists', async () => {
    const chain = mockSelectChain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getProfile('user-1');

    expect(result).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('getProfile maps a row to the Profile shape', async () => {
    const chain = mockSelectChain({
      data: {
        sex: 'male',
        age: 30,
        height_cm: 180,
        weight_kg: 80,
        activity_level: 'moderate',
        goal: 'cut',
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getProfile('user-1');

    expect(result).toEqual({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderate',
      goal: 'cut',
    });
  });

  it('getProfile throws on a Supabase error', async () => {
    const chain = mockSelectChain({ data: null, error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    await expect(getProfile('user-1')).rejects.toThrow('boom');
  });

  it('upsertProfile calls upsert with snake_case columns', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await upsertProfile('user-1', {
      sex: 'female',
      age: 25,
      heightCm: 165,
      weightKg: 60,
      activityLevel: 'light',
      goal: 'maintain',
    });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(upsert).toHaveBeenCalledWith({
      id: 'user-1',
      sex: 'female',
      age: 25,
      height_cm: 165,
      weight_kg: 60,
      activity_level: 'light',
      goal: 'maintain',
      updated_at: expect.any(String),
    });
  });

  it('upsertProfile throws on a Supabase error', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await expect(
      upsertProfile('user-1', {
        sex: 'female',
        age: 25,
        heightCm: 165,
        weightKg: 60,
        activityLevel: 'light',
        goal: 'maintain',
      })
    ).rejects.toThrow('boom');
  });

  it('getTrainingProfile maps a row to the TrainingProfile shape', async () => {
    const chain = mockSelectChain({
      data: { days_per_week: 4, experience_level: 'intermediate', equipment: 'full_gym' },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getTrainingProfile('user-1');

    expect(result).toEqual({ daysPerWeek: 4, experienceLevel: 'intermediate', equipment: 'full_gym' });
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('getTrainingProfile returns null when no row exists', async () => {
    const chain = mockSelectChain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ select: chain.select });

    const result = await getTrainingProfile('user-1');

    expect(result).toBeNull();
  });

  it('upsertTrainingProfile calls upsert with snake_case columns', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await upsertTrainingProfile('user-1', {
      daysPerWeek: 3,
      experienceLevel: 'beginner',
      equipment: 'bodyweight',
    });

    expect(supabase.from).toHaveBeenCalledWith('training_profile');
    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      days_per_week: 3,
      experience_level: 'beginner',
      equipment: 'bodyweight',
      updated_at: expect.any(String),
    });
  });

  it('upsertTrainingProfile throws on a Supabase error', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await expect(
      upsertTrainingProfile('user-1', {
        daysPerWeek: 3,
        experienceLevel: 'beginner',
        equipment: 'bodyweight',
      })
    ).rejects.toThrow('boom');
  });
});
