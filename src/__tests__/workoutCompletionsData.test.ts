import {
  logSessionCompletion,
  undoSessionCompletion,
  fetchCompletionForToday,
  fetchMyCompletions,
  fetchTeamWeekProgress,
} from '../lib/workoutCompletionsData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('logSessionCompletion', () => {
  it('inserts a completion row for the user and session', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await logSessionCompletion('user-1', 1);

    expect(supabase.from).toHaveBeenCalledWith('workout_completions');
    expect(insert).toHaveBeenCalledWith({ user_id: 'user-1', session_index: 1 });
  });

  it('throws on a Supabase error', async () => {
    const insert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await expect(logSessionCompletion('user-1', 1)).rejects.toThrow('boom');
  });
});

describe('undoSessionCompletion', () => {
  it('deletes the matching row by user, session and date', async () => {
    const eq3 = jest.fn().mockResolvedValue({ error: null });
    const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const del = jest.fn().mockReturnValue({ eq: eq1 });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await undoSessionCompletion('user-1', 1, '2026-08-05');

    expect(supabase.from).toHaveBeenCalledWith('workout_completions');
    expect(eq1).toHaveBeenCalledWith('user_id', 'user-1');
    expect(eq2).toHaveBeenCalledWith('session_index', 1);
    expect(eq3).toHaveBeenCalledWith('completed_date', '2026-08-05');
  });
});

describe('fetchCompletionForToday', () => {
  it('maps a found row to WorkoutCompletionRow', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'c1', session_index: 1, completed_date: '2026-08-05' },
      error: null,
    });
    const eq3 = jest.fn().mockReturnValue({ maybeSingle });
    const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const select = jest.fn().mockReturnValue({ eq: eq1 });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchCompletionForToday('user-1', 1, '2026-08-05');

    expect(result).toEqual({ id: 'c1', sessionIndex: 1, completedDate: '2026-08-05' });
  });

  it('returns null when no row matches', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq3 = jest.fn().mockReturnValue({ maybeSingle });
    const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const select = jest.fn().mockReturnValue({ eq: eq1 });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchCompletionForToday('user-1', 1, '2026-08-05');

    expect(result).toBeNull();
  });
});

describe('fetchMyCompletions', () => {
  it('maps all rows for the user, ordered by date', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        { id: 'c1', session_index: 0, completed_date: '2026-08-03' },
        { id: 'c2', session_index: 1, completed_date: '2026-08-04' },
      ],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchMyCompletions('user-1');

    expect(result).toEqual([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
    ]);
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(order).toHaveBeenCalledWith('completed_date', { ascending: true });
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchMyCompletions('user-1')).rejects.toThrow('boom');
  });
});

describe('fetchTeamWeekProgress', () => {
  it('calls the RPC with weeksBack and maps rows to TeamWeekRow', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ user_id: 'user-1', week_start: '2026-08-03', days_that_week: 3 }],
      error: null,
    });

    const result = await fetchTeamWeekProgress(12);

    expect(supabase.rpc).toHaveBeenCalledWith('team_week_progress', { weeks_back: 12 });
    expect(result).toEqual([{ userId: 'user-1', weekStart: '2026-08-03', days: 3 }]);
  });

  it('defaults weeksBack to 26', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

    await fetchTeamWeekProgress();

    expect(supabase.rpc).toHaveBeenCalledWith('team_week_progress', { weeks_back: 26 });
  });

  it('throws on a Supabase error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('boom') });

    await expect(fetchTeamWeekProgress()).rejects.toThrow('boom');
  });
});
