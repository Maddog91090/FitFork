import type { ExperienceLevel, Equipment } from './profile';

const EQUIPMENT_RANK: Record<Equipment, number> = {
  bodyweight: 0,
  home_limited: 1,
  full_gym: 2,
};

export type WorkoutTemplateOption = {
  id: string;
  name: string;
  daysPerWeek: number;
  level: ExperienceLevel;
  equipment: Equipment;
};

export type TrainingProfileInput = {
  daysPerWeek: number;
  experienceLevel: ExperienceLevel;
  equipment: Equipment;
};

export function selectTemplate(
  trainingProfile: TrainingProfileInput,
  templates: WorkoutTemplateOption[]
): WorkoutTemplateOption | null {
  const userRank = EQUIPMENT_RANK[trainingProfile.equipment];
  const compatible = templates.filter((t) => EQUIPMENT_RANK[t.equipment] <= userRank);
  if (compatible.length === 0) return null;

  const sorted = [...compatible].sort((a, b) => {
    const dayDiffA = Math.abs(a.daysPerWeek - trainingProfile.daysPerWeek);
    const dayDiffB = Math.abs(b.daysPerWeek - trainingProfile.daysPerWeek);
    if (dayDiffA !== dayDiffB) return dayDiffA - dayDiffB;

    const levelMatchA = a.level === trainingProfile.experienceLevel ? 0 : 1;
    const levelMatchB = b.level === trainingProfile.experienceLevel ? 0 : 1;
    if (levelMatchA !== levelMatchB) return levelMatchA - levelMatchB;

    return a.name.localeCompare(b.name);
  });

  return sorted[0];
}
