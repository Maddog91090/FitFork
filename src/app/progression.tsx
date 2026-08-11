// src/app/progression.tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
import { computeStats, type GamificationStats } from '../lib/workoutGamification';
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import { Card } from '../components/ui/Card';
import { ErrorNotice } from '../components/ui/ErrorNotice';
import { BackLink } from '../components/ui/BackLink';
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
} from '../theme/tokens';

export default function ProgressionScreen() {
  const colors = useMaterialColors();
  const progress = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, progress), [colors, progress]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const myCompletions = await fetchMyCompletions(session.user.id);
      const today = new Date().toISOString().slice(0, 10);
      // Bonus d'équipe volontairement désactivé : sans système de binôme
      // (demande d'ami), n'importe quel autre compte serait compté comme
      // partenaire. Les badges « Esprit d'équipe » et « Duo en or » restent
      // donc verrouillés jusqu'à ce que ce système existe.
      setStats(computeStats(myCompletions, [], today));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de ta progression.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !session || checking) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={progress.tertiary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <ErrorNotice message={error ?? 'Impossible de charger ta progression.'} onRetry={load} />
      </View>
    );
  }

  const unlockedIds = new Set(unlockedBadgeIds(stats));

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />
      {error && <ErrorNotice message={error} onRetry={load} />}

      <Text style={styles.title}>Progression</Text>

      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerItem}>
            <Text style={styles.headerValue}>🔥 {stats.streak}</Text>
            <Text style={styles.headerLabel}>Série</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={styles.headerValue}>Niv. {stats.level}</Text>
            <Text style={styles.headerLabel}>Niveau</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={styles.headerValue}>{stats.totalPoints}</Text>
            <Text style={styles.headerLabel}>Points</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Cette semaine</Text>
      <Card style={styles.weekCard}>
        <View style={styles.dayDotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dayDot, i < stats.thisWeekDays && styles.dayDotDone]} />
          ))}
        </View>
        <Text style={styles.weekText}>{stats.thisWeekDays}/3 séances cette semaine</Text>
      </Card>

      <Text style={styles.sectionLabel}>Badges</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          const unavailable = badge.available === false;
          return (
            <View key={badge.id} style={styles.badgeItem}>
              <Image
                source={badge.medalImage}
                style={[styles.badgeImage, !unlocked && styles.badgeImageLocked]}
                accessibilityLabel={badge.label}
              />
              <Text style={styles.badgeLabel}>{badge.label}</Text>
              <Text style={[styles.badgeDescription, unavailable && styles.badgeDescriptionMuted]}>
                {badge.description}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme, progress: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    sectionLabel: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    headerCard: {},
    headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    headerItem: { alignItems: 'center', flex: 1 },
    headerValue: { ...materialTypography.titleLarge, color: colors.onSurface },
    headerLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    weekCard: {},
    dayDotsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    dayDot: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    dayDotDone: { backgroundColor: progress.tertiary, borderColor: progress.tertiary },
    weekText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    badgeItem: { width: '30%', alignItems: 'center' },
    badgeImage: { width: 64, height: 64, marginBottom: spacing.xs },
    badgeImageLocked: { opacity: state.disabledOpacity },
    badgeLabel: { ...materialTypography.labelSmall, color: colors.onSurface, textAlign: 'center' },
    badgeDescription: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, textAlign: 'center' },
    // Marks a badge nobody can earn yet (a feature it depends on doesn't
    // exist) as visually distinct from a badge that's merely locked —
    // lightColors.textTertiary is used here for exactly its documented
    // purpose, decorative/non-actionable text (no Material role exists
    // for this — see the Phase 5b plan's color-mapping table).
    badgeDescriptionMuted: { color: lightColors.textTertiary },
  });
}
