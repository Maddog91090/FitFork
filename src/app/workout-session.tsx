import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { useAuth } from '../lib/auth-context';
import type { ExperienceLevel } from '../lib/profile';
import { getLevelProgram } from '../lib/homeWorkoutProgram';
import { buildSessionSteps, type SessionStep } from '../lib/sessionSteps';
import { useStepTimer } from '../lib/useStepTimer';
import { logSessionCompletion } from '../lib/workoutCompletionsData';
import { Button } from '../components/ui/Button';
import { centeredContent, spacing, typography, useThemeColors, type ThemeColors } from '../theme/tokens';

const VALID_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

function resolveSession(level: string | undefined, sessionIndexParam: string | undefined) {
  if (!level || !sessionIndexParam) return undefined;
  if (!VALID_LEVELS.includes(level as ExperienceLevel)) return undefined;
  const index = Number(sessionIndexParam);
  if (!Number.isInteger(index)) return undefined;
  return getLevelProgram(level as ExperienceLevel).sessions[index];
}

function stepKindLabel(step: SessionStep): string {
  if (step.kind === 'work') return step.roundLabel;
  if (step.kind === 'rest') return 'Repos';
  return 'Récupération';
}

function stepHeadline(step: Exclude<SessionStep, { kind: 'manual' }>): string {
  if (step.kind === 'work') return step.exerciseName;
  if (step.kind === 'rest') return `Ensuite : ${step.nextExerciseName}`;
  return `Ensuite : ${step.nextRoundLabel}`;
}

export default function WorkoutSessionScreen() {
  useKeepAwake();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const params = useLocalSearchParams<{ level: string; sessionIndex: string }>();
  const beepPlayer = useAudioPlayer(require('../../assets/audio/beep.wav'));

  const sessionIndex = Number(params.sessionIndex);
  const workoutSession = resolveSession(params.level, params.sessionIndex);
  const steps = useMemo(() => (workoutSession ? buildSessionSteps(workoutSession) : []), [workoutSession]);

  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const currentStep: SessionStep | undefined = steps[stepIndex];
  const finished = steps.length > 0 && stepIndex >= steps.length;

  const advance = useCallback(() => setStepIndex((i) => i + 1), []);

  const isTimed = currentStep?.kind === 'work' || currentStep?.kind === 'rest' || currentStep?.kind === 'recovery';
  const timerSeconds = isTimed && currentStep ? currentStep.seconds : 999999;
  const timer = useStepTimer(timerSeconds, advance);

  useEffect(() => {
    if (!isTimed) return;
    if (timer.remainingSeconds > 0 && timer.remainingSeconds <= 5) {
      beepPlayer.seekTo(0);
      beepPlayer.play();
    }
  }, [isTimed, timer.remainingSeconds, beepPlayer]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const handleFinish = async () => {
    if (!session) return;
    setFinishing(true);
    try {
      await logSessionCompletion(session.user.id, sessionIndex);
      router.replace('/(tabs)/workout');
    } finally {
      setFinishing(false);
    }
  };

  if (loading || !session) {
    return <View style={styles.screen} />;
  }

  if (!workoutSession) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Séance introuvable.</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.screen}>
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedTitle}>Séance terminée 🎉</Text>
          <Button title="Marquer la séance comme terminée" onPress={handleFinish} loading={finishing} />
        </View>
      </View>
    );
  }

  if (!currentStep) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      {currentStep.kind === 'manual' ? (
        <View style={styles.stepContainer}>
          <Text style={styles.exerciseName}>{currentStep.exerciseName}</Text>
          <Text style={styles.detail}>{currentStep.detail}</Text>
          <Button title="Terminé" onPress={advance} />
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <Text style={styles.stepKindLabel}>{stepKindLabel(currentStep)}</Text>
          <Text style={styles.exerciseName}>{stepHeadline(currentStep)}</Text>
          <Text style={styles.countdown}>{timer.remainingSeconds}</Text>
          <View style={styles.controlsRow}>
            <Button
              title={timer.isPaused ? 'Reprendre' : 'Pause'}
              variant="secondary"
              onPress={timer.isPaused ? timer.resume : timer.pause}
            />
            <Button title="Passer" variant="secondary" onPress={advance} />
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bgBase,
      padding: spacing.lg,
    },
    error: { ...typography.body, color: colors.error },
    stepContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      ...centeredContent,
    },
    stepKindLabel: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.sm },
    exerciseName: { ...typography.display, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
    detail: { ...typography.title, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    countdown: { ...typography.hero, color: colors.accentRed, marginBottom: spacing.xl },
    controlsRow: { flexDirection: 'row', gap: spacing.md },
    finishedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.lg,
      ...centeredContent,
    },
    finishedTitle: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  });
}
