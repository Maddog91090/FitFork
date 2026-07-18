import { supabase } from './supabase';
import type { Sex, ActivityLevel, Goal } from './nutrition';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'full_gym' | 'home_limited' | 'bodyweight';

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export type TrainingProfile = {
  daysPerWeek: number;
  experienceLevel: ExperienceLevel;
  equipment: Equipment;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('sex, age, height_cm, weight_kg, activity_level, goal')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    sex: data.sex,
    age: data.age,
    heightCm: data.height_cm,
    weightKg: data.weight_kg,
    activityLevel: data.activity_level,
    goal: data.goal,
  };
}

export async function upsertProfile(userId: string, profile: Profile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    sex: profile.sex,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    activity_level: profile.activityLevel,
    goal: profile.goal,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getTrainingProfile(userId: string): Promise<TrainingProfile | null> {
  const { data, error } = await supabase
    .from('training_profile')
    .select('days_per_week, experience_level, equipment')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    daysPerWeek: data.days_per_week,
    experienceLevel: data.experience_level,
    equipment: data.equipment,
  };
}

export async function upsertTrainingProfile(userId: string, trainingProfile: TrainingProfile): Promise<void> {
  const { error } = await supabase.from('training_profile').upsert({
    user_id: userId,
    days_per_week: trainingProfile.daysPerWeek,
    experience_level: trainingProfile.experienceLevel,
    equipment: trainingProfile.equipment,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
