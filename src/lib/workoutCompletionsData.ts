import { supabase } from './supabase';
import type { WorkoutCompletion, TeamWeekRow } from './workoutGamification';

export type WorkoutCompletionRow = WorkoutCompletion & { id: string };

export async function logSessionCompletion(userId: string, sessionIndex: number): Promise<void> {
  const { error } = await supabase.from('workout_completions').insert({
    user_id: userId,
    session_index: sessionIndex,
  });
  if (error) throw error;
}

export async function undoSessionCompletion(
  userId: string,
  sessionIndex: number,
  completedDate: string
): Promise<void> {
  const { error } = await supabase
    .from('workout_completions')
    .delete()
    .eq('user_id', userId)
    .eq('session_index', sessionIndex)
    .eq('completed_date', completedDate);
  if (error) throw error;
}

export async function fetchCompletionForToday(
  userId: string,
  sessionIndex: number,
  today: string
): Promise<WorkoutCompletionRow | null> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('id, session_index, completed_date')
    .eq('user_id', userId)
    .eq('session_index', sessionIndex)
    .eq('completed_date', today)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    sessionIndex: data.session_index,
    completedDate: data.completed_date,
  };
}

export async function fetchMyCompletions(userId: string): Promise<WorkoutCompletionRow[]> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('id, session_index, completed_date')
    .eq('user_id', userId)
    .order('completed_date', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    sessionIndex: row.session_index,
    completedDate: row.completed_date,
  }));
}

export async function fetchTeamWeekProgress(weeksBack = 26): Promise<TeamWeekRow[]> {
  const { data, error } = await supabase.rpc('team_week_progress', { weeks_back: weeksBack });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    weekStart: row.week_start,
    days: row.days_that_week,
  }));
}
