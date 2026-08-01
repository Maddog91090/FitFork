-- Drop the tables backing the old randomly-generated workout system,
-- superseded by the static program in src/lib/homeWorkoutProgram.ts.
-- Dropped in FK-safe order (children before parents).
drop table if exists public.user_program_exercises;
drop table if exists public.exercise_instructions;
drop table if exists public.template_day_slots;
drop table if exists public.template_days;
drop table if exists public.user_workout_programs;
drop table if exists public.workout_templates;
drop table if exists public.exercises;
