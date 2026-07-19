import { supabase } from './supabase';

export type WeightLogEntry = {
  id: string;
  loggedAt: string;
  weightKg: number;
};

export async function logWeight(userId: string, weightKg: number, loggedAt?: string): Promise<void> {
  const { error } = await supabase.from('weight_logs').insert({
    user_id: userId,
    weight_kg: weightKg,
    logged_at: loggedAt ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}

export async function fetchRecentWeightLogs(userId: string, limit = 10): Promise<WeightLogEntry[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('id, logged_at, weight_kg')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    loggedAt: row.logged_at,
    weightKg: row.weight_kg,
  }));
}
