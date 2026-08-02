import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile, upsertTrainingProfile } from '../../lib/profile';
import type { ExperienceLevel, TrainingProfile } from '../../lib/profile';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { homeWorkoutProgram, getLevelProgram } from '../../lib/homeWorkoutProgram';
import type { Session } from '../../lib/homeWorkoutProgram';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StaggerItem } from '../../components/ui/StaggerItem';
import { spacing, type ThemeColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { motion, useReducedMotion } from '../../theme/motion';
import { useColors } from '../../theme/useColors';

const isAndroid = Platform.OS === 'android';
const LEVEL_OPTIONS = homeWorkoutProgram.levels.map((entry) => ({ value: entry.level, label: entry.label }));

export default function WorkoutScreen() {
  const { session, loading } = useAuth();
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [savingLevel, setSavingLevel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const hasLoadedOnce = useRef(false);
  const hasEnteredRef = useRef(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const shouldAnimateEntrance = !hasEnteredRef.current;

  useEffect(() => {
    if (trainingProfile) hasEnteredRef.current = true;
  });

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
    if (!hasLoadedOnce.current) setChecking(true);
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
      hasLoadedOnce.current = true;
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

      <Text style={styles.title} accessibilityRole="header">{homeWorkoutProgram.title}</Text>
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

      {levelProgram.sessions.map((sessionItem, index) => (
        <StaggerItem key={sessionItem.name} index={index} enabled={shouldAnimateEntrance}>
          <SessionCard
            index={index}
            session={sessionItem}
            isExpanded={expanded.has(index)}
            onToggle={() => toggleSession(index)}
            colors={colors}
          />
        </StaggerItem>
      ))}

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

type SessionCardProps = {
  index: number;
  session: Session;
  isExpanded: boolean;
  onToggle: () => void;
  colors: ThemeColors;
};

function SessionCard({ index, session, isExpanded, onToggle, colors }: SessionCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    const target = isExpanded ? 1 : 0;
    rotation.value = reduceMotion ? target : withSpring(target, motion.spring.settle);
  }, [isExpanded, reduceMotion, rotation]);

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`Séance ${index + 1}, ${session.name}`}
      accessibilityState={{ expanded: isExpanded }}
      android_ripple={{ color: colors.divider }}
      style={styles.sessionTouchable}
    >
      <Card style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>
            Séance {index + 1} — {session.name}
          </Text>
          <Animated.View style={animatedChevronStyle}>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </Animated.View>
        </View>
        {isExpanded && <SessionDetail session={session} colors={colors} />}
      </Card>
    </Pressable>
  );
}

function SessionDetail({ session, colors }: { session: Session; colors: ThemeColors }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (session.type === 'circuit') {
    return (
      <View style={styles.sessionDetail}>
        <Text style={styles.sessionMeta}>
          Circuit : {session.workSeconds} s d&apos;effort / {session.restSeconds} s de repos. {session.rounds} tours,{' '}
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: spacing.lg },
    title: { ...typography.title, fontWeight: '800', color: colors.textPrimary },
    subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
    block: { marginVertical: spacing.lg },
    blockTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
    blockText: { ...typography.body, color: colors.textSecondary },
    levelSummary: { ...typography.body, marginTop: spacing.sm, color: colors.textSecondary },
    levelDuration: { ...typography.caption, marginBottom: spacing.lg, color: colors.textSecondary, fontStyle: 'italic' },
    sessionTouchable: {
      borderRadius: 16,
      overflow: isAndroid ? 'hidden' : 'visible',
    },
    sessionCard: { marginBottom: spacing.sm },
    sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sessionTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
    sessionDetail: { marginTop: spacing.sm, marginLeft: spacing.md },
    sessionMeta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
    exerciseLine: { ...typography.caption, color: colors.textPrimary, marginBottom: spacing.xs },
    coachNote: { ...typography.body, marginBottom: spacing.xs, color: colors.textSecondary },
    error: { color: colors.error, marginBottom: spacing.md },
  });
