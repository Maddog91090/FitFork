import { supabase } from './supabase';
import type { WorkoutTemplateOption } from './workoutTemplate';
import type { DayArchetype, ExercisePoolItem, GeneratedProgramDay } from './workoutProgram';

export type ProgramExercise = {
  name: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  instructions: string[];
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

export async function fetchTemplateDaySlots(templateId: string): Promise<DayArchetype[]> {
  const { data, error } = await supabase
    .from('template_days')
    .select('day_number, name, template_day_slots(muscle_group, slot_count, order_index)')
    .eq('template_id', templateId)
    .order('day_number');

  if (error) throw error;

  return (data ?? []).map((day: any) => ({
    name: day.name,
    slots: (day.template_day_slots ?? [])
      .slice()
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((s: any) => ({ muscleGroup: s.muscle_group, count: s.slot_count })),
  }));
}

export async function fetchExercisePool(equipment: string): Promise<ExercisePoolItem[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, muscle_group')
    .eq('equipment_needed', equipment)
    .order('id');

  if (error) throw error;

  return (data ?? []).map((row: any) => ({ id: row.id, muscleGroup: row.muscle_group }));
}

export async function saveGeneratedProgram(userId: string, days: GeneratedProgramDay[]): Promise<void> {
  const { error: deleteError } = await supabase.from('user_program_exercises').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;

  const rows = days.flatMap((day) =>
    day.exerciseIds.map((exerciseId, index) => ({
      user_id: userId,
      day_number: day.dayNumber,
      day_name: day.dayName,
      exercise_id: exerciseId,
      order_index: index,
    }))
  );

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('user_program_exercises').insert(rows);
    if (insertError) throw insertError;
  }
}

export async function fetchProgramDetails(userId: string, templateId: string): Promise<WorkoutProgram> {
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select('name')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: rows, error: rowsError } = await supabase
    .from('user_program_exercises')
    .select(
      'day_number, day_name, exercises(name, muscle_group, default_sets, default_reps_min, default_reps_max, exercise_instructions(step_number, text))'
    )
    .eq('user_id', userId)
    .order('day_number')
    .order('order_index');

  if (rowsError) throw rowsError;

  const dayMap = new Map<number, ProgramDay>();
  for (const row of (rows ?? []) as any[]) {
    if (!dayMap.has(row.day_number)) {
      dayMap.set(row.day_number, { dayNumber: row.day_number, name: row.day_name, exercises: [] });
    }
    const instructions = (row.exercises.exercise_instructions ?? [])
      .slice()
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((i: any) => i.text);
    dayMap.get(row.day_number)!.exercises.push({
      name: row.exercises.name,
      muscleGroup: row.exercises.muscle_group,
      sets: row.exercises.default_sets,
      repsMin: row.exercises.default_reps_min,
      repsMax: row.exercises.default_reps_max,
      instructions,
    });
  }

  return {
    templateId,
    templateName: template.name,
    days: Array.from(dayMap.values()).sort((a, b) => a.dayNumber - b.dayNumber),
  };
}
