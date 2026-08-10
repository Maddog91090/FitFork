// src/app/progression.tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
import { computeStats, type GamificationStats } from '../lib/workoutGamification';
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import { Card } from '../components/ui/Card';
import { ErrorNotice } from '../components/ui/ErrorNotice';
import { BackLink } from '../components/ui/BackLink';
import { Mascot } from '../components/ui/Mascot';
import {
  centeredContent,
  radius,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../theme/tokens';

export default function ProgressionScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      <View style={styles.centered}>
        <ActivityIndicator color={colors.domainProgress} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <BackLink />
        <ErrorNotice message={error ?? 'Impossible de charger ta progression.'} onRetry={load} />
      </View>
    );
  }

  const unlockedIds = new Set(unlockedBadgeIds(stats));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <BackLink />
      {error && <ErrorNotice message={error} onRetry={load} />}

      <View style={styles.titleRow}>
        <Text style={styles.title}>Progression</Text>
        <Mascot pose={stats.streak > 0 && stats.streak % 7 === 0 ? 'celebrating' : 'idle'} size={64} />
      </View>

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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...typography.display, color: colors.textPrimary },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    headerCard: {},
    headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    headerItem: { alignItems: 'center', flex: 1 },
    headerValue: { ...typography.title, color: colors.textPrimary },
    headerLabel: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.xs },
    weekCard: {},
    dayDotsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    dayDot: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.bgSunken,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayDotDone: { backgroundColor: colors.domainProgress, borderColor: colors.domainProgress },
    weekText: { ...typography.body, color: colors.textSecondary },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    badgeItem: { width: '30%', alignItems: 'center' },
    badgeImage: { width: 64, height: 64, marginBottom: spacing.xs },
    badgeImageLocked: { opacity: state.disabledOpacity },
    badgeLabel: { ...typography.captionStrong, color: colors.textPrimary, textAlign: 'center' },
    badgeDescription: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
    // Marks a badge nobody can earn yet (a feature it depends on doesn't
    // exist) as visually distinct from a badge that's merely locked —
    // textTertiary is used here for exactly its documented purpose,
    // decorative/non-actionable text.
    badgeDescriptionMuted: { color: colors.textTertiary },
  });
}
