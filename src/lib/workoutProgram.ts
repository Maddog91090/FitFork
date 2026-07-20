export type ExercisePoolItem = {
  id: string;
  muscleGroup: string;
};

export type DaySlot = {
  muscleGroup: string;
  count: number;
};

export type DayArchetype = {
  name: string;
  slots: DaySlot[];
};

export type GeneratedProgramDay = {
  dayNumber: number;
  dayName: string;
  exerciseIds: string[];
};

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateWorkoutProgram(
  daysPerWeek: number,
  dayArchetypes: DayArchetype[],
  exercisePool: ExercisePoolItem[]
): GeneratedProgramDay[] {
  const usedThisWeek = new Set<string>();
  const days: GeneratedProgramDay[] = [];

  for (let i = 0; i < daysPerWeek; i++) {
    const archetype = dayArchetypes[i % dayArchetypes.length];
    const exerciseIds: string[] = [];

    for (const slot of archetype.slots) {
      const candidates = exercisePool.filter((e) => e.muscleGroup === slot.muscleGroup);
      const unused = candidates.filter((e) => !usedThisWeek.has(e.id));
      const shortfall = slot.count - unused.length;
      const picked = shortfall <= 0
        ? shuffle(unused).slice(0, slot.count)
        : [...unused, ...shuffle(candidates).slice(0, shortfall)];

      for (const exercise of picked) {
        usedThisWeek.add(exercise.id);
        exerciseIds.push(exercise.id);
      }
    }

    days.push({ dayNumber: i + 1, dayName: archetype.name, exerciseIds });
  }

  return days;
}
