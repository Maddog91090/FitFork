import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile, upsertTrainingProfile } from '../../lib/profile';
import type { ExperienceLevel, TrainingProfile } from '../../lib/profile';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { homeWorkoutProgram, getLevelProgram } from '../../lib/homeWorkoutProgram';
import type { Session } from '../../lib/homeWorkoutProgram';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { colors, spacing } from '../../theme/tokens';

const LEVEL_OPTIONS = homeWorkoutProgram.levels.map((entry) => ({ value: entry.level, label: entry.label }));

export default function WorkoutScreen() {
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
      <Screen edges={['top']} style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </Screen>
    );
  }

  const levelProgram = getLevelProgram(trainingProfile.experienceLevel);

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
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
          <Pressable
            key={sessionItem.name}
            onPress={() => toggleSession(index)}
            accessibilityRole="button"
            accessibilityLabel={`Séance ${index + 1}, ${sessionItem.name}`}
            accessibilityState={{ expanded: isExpanded }}
          >
            <Card style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>
                Séance {index + 1} — {sessionItem.name}
              </Text>
              {isExpanded && <SessionDetail session={sessionItem} />}
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
    </Screen>
  );
}

function SessionDetail({ session }: { session: Session }) {
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

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.lg },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg },
  block: { marginVertical: spacing.lg },
  blockTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  blockText: { color: colors.textSecondary, fontSize: 13 },
  levelSummary: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: 13 },
  levelDuration: { marginBottom: spacing.lg, color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  sessionCard: { marginBottom: spacing.sm },
  sessionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  sessionDetail: { marginTop: spacing.sm, marginLeft: spacing.md },
  sessionMeta: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.xs },
  exerciseLine: { color: colors.textPrimary, fontSize: 12, marginBottom: spacing.xs },
  coachNote: { marginBottom: spacing.xs, color: colors.textSecondary, fontSize: 13 },
  error: { color: colors.error, marginBottom: spacing.md },
});
