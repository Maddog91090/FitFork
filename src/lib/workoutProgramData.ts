import { supabase } from './supabase';
import type { WorkoutTemplateOption } from './workoutTemplate';

export type ProgramExercise = {
  name: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
};

export type ProgramDay = {
  dayNumber: number;
  name: string;
  exercises: ProgramExercise[];
};

export type WorkoutProgram = {
  templateId: string;
  templateName: string;
  days: ProgramDay[];
};

export async function fetchWorkoutTemplates(): Promise<WorkoutTemplateOption[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('id, name, days_per_week, level, equipment')
    .order('id');

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    daysPerWeek: row.days_per_week,
    level: row.level,
    equipment: row.equipment,
  }));
}

export async function saveWorkoutProgram(userId: string, templateId: string): Promise<void> {
  const { error } = await supabase.from('user_workout_programs').upsert({
    user_id: userId,
    template_id: templateId,
    assigned_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getAssignedTemplateId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_workout_programs')
    .select('template_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data.template_id;
}

export async function fetchProgramDetails(templateId: string): Promise<WorkoutProgram> {
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select('name')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: days, error: daysError } = await supabase
    .from('template_days')
    .select(
      'day_number, name, template_exercises(sets, reps_min, reps_max, order_index, exercises(name, muscle_group))'
    )
    .eq('template_id', templateId)
    .order('day_number');

  if (daysError) throw daysError;

  return {
    templateId,
    templateName: template.name,
    days: (days ?? []).map((day: any) => ({
      dayNumber: day.day_number,
      name: day.name,
      exercises: (day.template_exercises ?? [])
        .slice()
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((te: any) => ({
          name: te.exercises.name,
          muscleGroup: te.exercises.muscle_group,
          sets: te.sets,
          repsMin: te.reps_min,
          repsMax: te.reps_max,
        })),
    })),
  };
}
