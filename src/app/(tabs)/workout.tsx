import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile, upsertTrainingProfile } from '../../lib/profile';
import type { ExperienceLevel, TrainingProfile } from '../../lib/profile';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { homeWorkoutProgram, getLevelProgram } from '../../lib/homeWorkoutProgram';
import type { Session } from '../../lib/homeWorkoutProgram';
import {
  logSessionCompletion,
  undoSessionCompletion,
  fetchCompletionForToday,
  type WorkoutCompletionRow,
} from '../../lib/workoutCompletionsData';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { Button } from '../../components/ui/Button';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import {
  centeredContent,
  lightColors,
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';

const LEVEL_OPTIONS = homeWorkoutProgram.levels.map((entry) => ({ value: entry.level, label: entry.label }));

const SESSION_TAB_OPTIONS = homeWorkoutProgram.levels[0].sessions.map((_, index) => ({
  value: String(index),
  label: `Séance ${index + 1}`,
}));

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkoutScreen() {
  const colors = useMaterialColors();
  const sport = useMaterialTertiary('sport');
  const styles = useMemo(() => createStyles(colors, sport), [colors, sport]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [savingLevel, setSavingLevel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletionRow | null>(null);
  const [loggingCompletion, setLoggingCompletion] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const profile = await getTrainingProfile(session.user.id);
      if (!profile) {
        router.replace('/onboarding');
        return;
      }
      setTrainingProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  const loadTodayCompletion = useCallback(async () => {
    if (!session) return;
    try {
      const completion = await fetchCompletionForToday(session.user.id, activeSessionIndex, todayDateString());
      setTodayCompletion(completion);
    } catch {
      // Non-blocking: the button just falls back to its "not completed" state.
      setTodayCompletion(null);
    }
  }, [session, activeSessionIndex]);

  const handleLevelChange = async (level: ExperienceLevel) => {
    if (!session || !trainingProfile || level === trainingProfile.experienceLevel) return;
    const previous = trainingProfile;
    const next = { ...trainingProfile, experienceLevel: level };
    setTrainingProfile(next);
    setActiveSessionIndex(0);
    setSavingLevel(true);
    setError(null);
    try {
      await upsertTrainingProfile(session.user.id, next);
    } catch (err) {
      setTrainingProfile(previous);
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de niveau.');
    } finally {
      setSavingLevel(false);
    }
  };

  const handleStartSession = (index: number) => {
    if (!trainingProfile) return;
    router.push({
      pathname: '/workout-session',
      params: { level: trainingProfile.experienceLevel, sessionIndex: String(index) },
    });
  };

  const handleToggleCompletion = async () => {
    if (!session) return;
    setError(null);

    if (todayCompletion) {
      const previous = todayCompletion;
      setTodayCompletion(null);
      setLoggingCompletion(true);
      try {
        await undoSessionCompletion(session.user.id, activeSessionIndex, previous.completedDate);
      } catch (err) {
        setTodayCompletion(previous);
        setError(err instanceof Error ? err.message : "Erreur lors de l'annulation.");
      } finally {
        setLoggingCompletion(false);
      }
      return;
    }

    const optimistic: WorkoutCompletionRow = {
      id: 'optimistic',
      sessionIndex: activeSessionIndex,
      completedDate: todayDateString(),
    };
    setTodayCompletion(optimistic);
    setLoggingCompletion(true);
    try {
      await logSessionCompletion(session.user.id, activeSessionIndex);
      const completion = await fetchCompletionForToday(session.user.id, activeSessionIndex, todayDateString());
      setTodayCompletion(completion);
    } catch (err) {
      setTodayCompletion(null);
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setLoggingCompletion(false);
    }
  };

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useFocusEffect(
    useCallback(() => {
      loadTodayCompletion();
    }, [loadTodayCompletion])
  );

  if (loading || !session || checking) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={sport.tertiary} />
      </View>
    );
  }

  if (!trainingProfile) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ErrorNotice message={error ?? 'Impossible de charger ton profil sportif.'} onRetry={load} />
      </View>
    );
  }

  const levelProgram = getLevelProgram(trainingProfile.experienceLevel);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.title}>{homeWorkoutProgram.title}</Text>
      <Text style={styles.subtitle}>{homeWorkoutProgram.subtitle}</Text>
      <Text style={styles.blockText}>{homeWorkoutProgram.guidance}</Text>

      <ChoiceGroup
        options={LEVEL_OPTIONS}
        value={trainingProfile.experienceLevel}
        onChange={handleLevelChange}
        domain="sport"
      />
      {savingLevel && <ActivityIndicator size="small" color={sport.tertiary} />}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {homeWorkoutProgram.warmup.title} ({homeWorkoutProgram.warmup.durationLabel})
        </Text>
        <Text style={styles.blockText}>{homeWorkoutProgram.warmup.description}</Text>
      </View>

      <Text style={styles.levelSummary}>{levelProgram.summary}</Text>
      <Text style={styles.levelDuration}>Durée par séance : {levelProgram.sessionDurationLabel}</Text>

      <ChoiceGroup
        options={SESSION_TAB_OPTIONS}
        value={String(activeSessionIndex)}
        onChange={(value) => setActiveSessionIndex(Number(value))}
        domain="sport"
      />

      {levelProgram.sessions.map((sessionItem, index) => {
        if (index !== activeSessionIndex) return null;
        return (
          <Card key={sessionItem.name} style={styles.sessionCard}>
            <View style={styles.sessionPhotoFrame}>
              <Image source={sessionItem.image} style={styles.sessionPhoto} accessibilityLabel={sessionItem.name} />
            </View>
            <Text style={styles.sessionTitle}>
              Séance {index + 1} — {sessionItem.name}
            </Text>
            <View style={styles.startRow}>
              <Button title="Commencer" onPress={() => handleStartSession(index)} domain="sport" />
            </View>
            <SessionDetail session={sessionItem} styles={styles} />
            <View style={styles.completionRow}>
              {todayCompletion ? (
                <>
                  <View style={styles.completionDoneBadge}>
                    <Text style={styles.completionDoneText}>Fait aujourd'hui ✓</Text>
                  </View>
                  <PressableScale
                    onPress={handleToggleCompletion}
                    disabled={loggingCompletion}
                    hitSlop={state.hitSlop}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: loggingCompletion }}
                    style={styles.completionUndoTouchable}
                  >
                    <Text style={styles.completionUndoLink}>Annuler</Text>
                  </PressableScale>
                </>
              ) : (
                <Button
                  title="Marquer comme terminée"
                  onPress={handleToggleCompletion}
                  loading={loggingCompletion}
                  domain="sport"
                />
              )}
            </View>
          </Card>
        );
      })}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {homeWorkoutProgram.cooldown.title} ({homeWorkoutProgram.cooldown.durationLabel})
        </Text>
        <Text style={styles.blockText}>{homeWorkoutProgram.cooldown.description}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Repères de coach</Text>
        {homeWorkoutProgram.coachNotes.map((note) => (
          <Text key={note} style={styles.coachNote}>
            • {note}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof createStyles>;

function SessionDetail({ session, styles }: { session: Session; styles: Styles }) {
  if (session.type === 'circuit') {
    return (
      <View style={styles.sessionDetail}>
        <Text style={styles.exerciseListLabel}>Aperçu des exercices</Text>
        <Text style={styles.sessionMeta}>
          Circuit : {session.workSeconds} s d'effort / {session.restSeconds} s de repos. {session.rounds} tours,{' '}
          {session.recoveryLabel}.
        </Text>
        {session.exercises.map((exercise) => (
          <PressableScale
            key={exercise.name}
            onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
            accessibilityRole="link"
            hitSlop={4}
            style={styles.exerciseCard}
          >
            <Text style={styles.exerciseLine}>{exercise.name}</Text>
          </PressableScale>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.sessionDetail}>
      <Text style={styles.exerciseListLabel}>Aperçu des exercices</Text>
      <Text style={styles.sessionMeta}>En séries, {session.restLabel}.</Text>
      {session.exercises.map((exercise) => (
        <PressableScale
          key={exercise.name}
          onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
          accessibilityRole="link"
          hitSlop={4}
          style={styles.exerciseCard}
        >
          <Text style={styles.exerciseLine}>{exercise.name}</Text>
          <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, sport: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface },
    subtitle: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant, marginBottom: spacing.lg },
    block: { marginVertical: spacing.lg },
    blockTitle: { ...materialTypography.titleMedium, color: colors.onSurface, marginBottom: spacing.xs },
    blockText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant },
    levelSummary: { ...materialTypography.bodyLarge, marginTop: spacing.sm, color: colors.onSurfaceVariant },
    levelDuration: { ...materialTypography.labelMedium, marginBottom: spacing.lg, color: colors.onSurfaceVariant },
    sessionCard: { marginBottom: spacing.sm },
    sessionPhotoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    sessionPhoto: {
      width: '100%',
      height: '100%',
    },
    sessionTitle: { ...materialTypography.titleSmall, color: colors.onSurface },
    startRow: { marginTop: spacing.sm, marginBottom: spacing.md },
    exerciseListLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
    sessionDetail: { marginTop: spacing.sm },
    sessionMeta: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
    exerciseCard: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    exerciseLine: { ...materialTypography.bodyMedium, color: colors.onSurface },
    exerciseDetail: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: 2 },
    coachNote: { ...materialTypography.bodyLarge, marginBottom: spacing.xs, color: colors.onSurfaceVariant },
    completionRow: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    completionDoneBadge: {
      backgroundColor: lightColors.successSoft,
      borderRadius: radius.pill,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    completionDoneText: { ...materialTypography.labelSmall, color: lightColors.success },
    completionUndoTouchable: {
      minHeight: state.minTouchSize,
      paddingHorizontal: spacing.sm,
      justifyContent: 'center',
    },
    completionUndoLink: { ...materialTypography.labelMedium, color: sport.tertiaryContainer },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.md },
  });
}
