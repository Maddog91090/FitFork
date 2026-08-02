import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { spacing, type ThemeColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { motion, useReducedMotion } from '../../theme/motion';
import { useColors } from '../../theme/useColors';

// Counts up from 0 to `target` once, the moment it becomes available -- the app's one
// "look at this" number, not a general-purpose utility applied everywhere.
function useCountUp(target: number, active: boolean, reduceMotion: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    const duration = 700;
    const start = Date.now();
    let frame: ReturnType<typeof requestAnimationFrame>;

    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, reduceMotion]);

  return value;
}

export default function HomeScreen() {
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const cardProgress = useSharedValue(0);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    let cancelled = false;

    (async () => {
      try {
        const [profile, trainingProfile] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
        ]);

        if (cancelled) return;

        if (!profile || !trainingProfile) {
          router.replace('/onboarding');
          return;
        }

        setMacros(computeTargetsFromProfile(profile, trainingProfile));
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
        }
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, session]);

  useEffect(() => {
    if (macros) {
      cardProgress.value = reduceMotion ? 1 : withSpring(1, motion.spring.settle);
    }
  }, [macros, reduceMotion, cardProgress]);

  const caloriesDisplay = useCountUp(macros?.calories ?? 0, !!macros, reduceMotion);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardProgress.value,
    transform: [{ scale: 0.96 + cardProgress.value * 0.04 }, { translateY: (1 - cardProgress.value) * 8 }],
  }));

  if (loading || !session || checkingProfile) {
    return (
      <Screen edges={['top']} style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Bonjour</Text>
      <Text style={styles.name} accessibilityRole="header" numberOfLines={1} ellipsizeMode="tail">
        {session.user.email}
      </Text>

      {loadError && <Text style={styles.error}>{loadError}</Text>}

      {macros && (
        <Animated.View style={animatedCardStyle}>
          <Card style={styles.macroCard}>
            <Text style={styles.sectionLabel}>Objectifs du jour</Text>
            <View style={styles.heroRow}>
              <Text
                style={styles.heroValue}
                accessible
                accessibilityLabel={`${macros.calories} kilocalories, objectif du jour`}
              >
                {caloriesDisplay}
              </Text>
              <Text style={styles.heroUnit}>kcal</Text>
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macroItem} accessible accessibilityLabel={`${macros.proteinG} grammes de protéines`}>
                <Text style={[styles.macroValue, styles.macroValueAccent]}>{macros.proteinG}g</Text>
                <Text style={styles.macroLabel}>Prot</Text>
              </View>
              <View style={styles.macroItem} accessible accessibilityLabel={`${macros.fatG} grammes de lipides`}>
                <Text style={styles.macroValue}>{macros.fatG}g</Text>
                <Text style={styles.macroLabel}>Lip</Text>
              </View>
              <View style={styles.macroItem} accessible accessibilityLabel={`${macros.carbsG} grammes de glucides`}>
                <Text style={styles.macroValue}>{macros.carbsG}g</Text>
                <Text style={styles.macroLabel}>Gluc</Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      )}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <Button title="Voir mon plan" variant="secondary" onPress={() => router.push('/plan')} />
        </View>
        <View style={styles.actionButton}>
          <Button title="Générer" onPress={() => router.push('/generate-plan')} />
        </View>
      </View>

      <View style={styles.signOut}>
        <Button title="Se déconnecter" variant="secondary" onPress={signOut} />
      </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: spacing.lg },
    greeting: { ...typography.caption, color: colors.textSecondary },
    name: { ...typography.title, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
    error: { color: colors.error, marginBottom: spacing.md },
    macroCard: { marginBottom: spacing.lg },
    sectionLabel: {
      ...typography.label,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: spacing.md },
    heroValue: { ...typography.display, fontWeight: '800', color: colors.accentRed, fontVariant: ['tabular-nums'] },
    heroUnit: { ...typography.subtitle, fontWeight: '700', color: colors.textSecondary },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
    macroItem: { alignItems: 'center', flex: 1 },
    macroValue: { ...typography.subtitle, fontWeight: '800', color: colors.textPrimary },
    macroValueAccent: { color: colors.accentRed },
    macroLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 2 },
    actionsRow: { flexDirection: 'row', gap: spacing.sm },
    actionButton: { flex: 1 },
    signOut: { marginTop: spacing.xl },
  });
