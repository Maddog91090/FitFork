import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile, upsertTrainingProfile } from '../../lib/profile';
import type { ExperienceLevel, TrainingProfile } from '../../lib/profile';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { homeWorkoutProgram, getLevelProgram } from '../../lib/homeWorkoutProgram';
import type { Session } from '../../lib/homeWorkoutProgram';
import { Card } from '../../components/ui/Card';
import { centeredContent, radius, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

const LEVEL_OPTIONS = homeWorkoutProgram.levels.map((entry) => ({ value: entry.level, label: entry.label }));

export default function WorkoutScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [savingLevel, setSavingLevel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleSession = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

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

  const handleLevelChange = async (level: ExperienceLevel) => {
    if (!session || !trainingProfile || level === trainingProfile.experienceLevel) return;
    const previous = trainingProfile;
    const next = { ...trainingProfile, experienceLevel: level };
    setTrainingProfile(next);
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

  if (loading || !session || checking || !trainingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  const levelProgram = getLevelProgram(trainingProfile.experienceLevel);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.title}>{homeWorkoutProgram.title}</Text>
      <Text style={styles.subtitle}>{homeWorkoutProgram.subtitle}</Text>
      <Text style={styles.blockText}>{homeWorkoutProgram.guidance}</Text>

      <ChoiceGroup options={LEVEL_OPTIONS} value={trainingProfile.experienceLevel} onChange={handleLevelChange} />
      {savingLevel && <ActivityIndicator size="small" color={colors.accentRed} />}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {homeWorkoutProgram.warmup.title} ({homeWorkoutProgram.warmup.durationLabel})
        </Text>
        <Text style={styles.blockText}>{homeWorkoutProgram.warmup.description}</Text>
      </View>

      <Text style={styles.levelSummary}>{levelProgram.summary}</Text>
      <Text style={styles.levelDuration}>Durée par séance : {levelProgram.sessionDurationLabel}</Text>

      {levelProgram.sessions.map((sessionItem, index) => {
        const isExpanded = expanded.has(index);
        return (
          <Pressable key={sessionItem.name} onPress={() => toggleSession(index)}>
            <Card style={styles.sessionCard}>
              <View style={styles.sessionPhotoFrame}>
                <Image source={sessionItem.image} style={styles.sessionPhoto} accessibilityLabel={sessionItem.name} />
              </View>
              <Text style={styles.sessionTitle}>
                Séance {index + 1} — {sessionItem.name}
              </Text>
              {isExpanded && <SessionDetail session={sessionItem} styles={styles} />}
            </Card>
          </Pressable>
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
        <Text style={styles.sessionMeta}>
          Circuit : {session.workSeconds} s d'effort / {session.restSeconds} s de repos. {session.rounds} tours,{' '}
          {session.recoveryLabel}.
        </Text>
        {session.exercises.map((exercise) => (
          <Text key={exercise} style={styles.exerciseLine}>
            • {exercise}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.sessionDetail}>
      <Text style={styles.sessionMeta}>En séries, {session.restLabel}.</Text>
      {session.exercises.map((exercise) => (
        <Text key={exercise.name} style={styles.exerciseLine}>
          • {exercise.name} : {exercise.detail}
        </Text>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...typography.display, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
    block: { marginVertical: spacing.lg },
    blockTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.xs },
    blockText: { ...typography.body, color: colors.textSecondary },
    levelSummary: { ...typography.body, marginTop: spacing.sm, color: colors.textSecondary },
    levelDuration: { ...typography.caption, marginBottom: spacing.lg, color: colors.textSecondary },
    sessionCard: { marginBottom: spacing.sm },
    sessionPhotoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.md,
      backgroundColor: colors.bgSunken,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    sessionPhoto: {
      width: '100%',
      height: '100%',
    },
    sessionTitle: { ...typography.subheading, color: colors.textPrimary },
    sessionDetail: { marginTop: spacing.sm, marginLeft: spacing.md },
    sessionMeta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
    exerciseLine: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
    coachNote: { ...typography.body, marginBottom: spacing.xs, color: colors.textSecondary },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  });
}
