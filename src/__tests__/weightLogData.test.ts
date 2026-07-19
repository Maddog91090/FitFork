import { logWeight, fetchRecentWeightLogs } from '../lib/weightLogData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('logWeight', () => {
  it('inserts a weight log row for the user with the given date', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await logWeight('user-1', 79.5, '2026-01-15');

    expect(supabase.from).toHaveBeenCalledWith('weight_logs');
    expect(insert).toHaveBeenCalledWith({ user_id: 'user-1', weight_kg: 79.5, logged_at: '2026-01-15' });
  });

  it('throws on a Supabase error', async () => {
    const insert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await expect(logWeight('user-1', 79.5, '2026-01-15')).rejects.toThrow('boom');
  });
});

describe('fetchRecentWeightLogs', () => {
  it('maps rows to the WeightLogEntry shape, most recent first', async () => {
    const limit = jest.fn().mockResolvedValue({
      data: [
        { id: 'w2', logged_at: '2026-01-15', weight_kg: 79 },
        { id: 'w1', logged_at: '2026-01-01', weight_kg: 80 },
      ],
      error: null,
    });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecentWeightLogs('user-1');

    expect(result).toEqual([
      { id: 'w2', loggedAt: '2026-01-15', weightKg: 79 },
      { id: 'w1', loggedAt: '2026-01-01', weightKg: 80 },
    ]);
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(order).toHaveBeenCalledWith('logged_at', { ascending: false });
    expect(limit).toHaveBeenCalledWith(10);
  });

  it('throws on a Supabase error', async () => {
    const limit = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchRecentWeightLogs('user-1')).rejects.toThrow('boom');
  });
});
