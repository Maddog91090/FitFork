import type { Session } from './homeWorkoutProgram';

export type SessionStep =
  | { kind: 'work'; exerciseName: string; exerciseId: string; seconds: number; roundLabel: string }
  | { kind: 'rest'; seconds: number; nextExerciseName: string }
  | { kind: 'recovery'; seconds: number; label: string; nextRoundLabel: string }
  | { kind: 'manual'; exerciseName: string; exerciseId: string; detail: string };

export function buildSessionSteps(session: Session): SessionStep[] {
  const steps: SessionStep[] = [];

  if (session.type === 'circuit') {
    for (let round = 1; round <= session.rounds; round++) {
      const roundLabel = `Tour ${round}/${session.rounds}`;
      session.exercises.forEach((exercise, exerciseIndex) => {
        steps.push({
          kind: 'work',
          exerciseName: exercise.name,
          exerciseId: exercise.exerciseId,
          seconds: session.workSeconds,
          roundLabel,
        });
        const isLastExerciseInRound = exerciseIndex === session.exercises.length - 1;
        if (!isLastExerciseInRound) {
          const nextExercise = session.exercises[exerciseIndex + 1];
          steps.push({
            kind: 'rest',
            seconds: session.restSeconds,
            nextExerciseName: nextExercise.name,
          });
        }
      });
      const isLastRound = round === session.rounds;
      if (!isLastRound) {
        steps.push({
          kind: 'recovery',
          seconds: session.recoverySeconds,
          label: session.recoveryLabel,
          nextRoundLabel: `Tour ${round + 1}/${session.rounds}`,
        });
      }
    }
  } else {
    session.exercises.forEach((exercise, exerciseIndex) => {
      steps.push({
        kind: 'manual',
        exerciseName: exercise.name,
        exerciseId: exercise.exerciseId,
        detail: exercise.detail,
      });
      const isLastExercise = exerciseIndex === session.exercises.length - 1;
      if (!isLastExercise) {
        const nextExercise = session.exercises[exerciseIndex + 1];
        steps.push({
          kind: 'rest',
          seconds: session.restSeconds,
          nextExerciseName: nextExercise.name,
        });
      }
    });
  }

  return steps;
}
