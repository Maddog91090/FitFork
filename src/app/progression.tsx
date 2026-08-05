// src/app/progression.tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { loadGamificationStats } from '../lib/loadGamificationStats';
import type { GamificationStats } from '../lib/workoutGamification';
import type { FriendBonusSummary } from '../lib/friendGamification';
import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import { Card } from '../components/ui/Card';
import { PressableScale } from '../components/ui/PressableScale';
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
  const [friendBonuses, setFriendBonuses] = useState<FriendBonusSummary[]>([]);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendEmailById, setFriendEmailById] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await loadGamificationStats(session.user.id, today);
      setStats(result.stats);
      setFriendBonuses(result.friendBonuses);
      setFriendsError(result.friendsError);
      setFriendEmailById(new Map(result.friends.map((f) => [f.friendUserId, f.friendEmail])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
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
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  const unlockedIds = new Set(unlockedBadgeIds(stats));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

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

      <Text style={styles.sectionLabel}>Bonus d'équipe</Text>
      <PressableScale onPress={() => router.push('/friends')} accessibilityRole="button">
        <Card style={styles.teamCard}>
          {friendsError ? (
            <Text style={styles.teamError}>{friendsError}</Text>
          ) : friendBonuses.length === 0 ? (
            <Text style={styles.teamText}>Ajoute un ami pour débloquer le bonus d'équipe.</Text>
          ) : (
            friendBonuses.map((friend) => (
              <Text key={friend.friendUserId} style={styles.teamText}>
                Avec {friendEmailById.get(friend.friendUserId) ?? 'ton ami'} : {friend.thisWeekCombinedDays}/6 cette
                semaine — bonus à 6/6
              </Text>
            ))
          )}
          <Text style={styles.teamManageLink}>Gérer mes amis</Text>
        </Card>
      </PressableScale>

      <Text style={styles.sectionLabel}>Badges</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          return (
            <View key={badge.id} style={styles.badgeItem}>
              <Image
                source={badge.medalImage}
                style={[styles.badgeImage, !unlocked && styles.badgeImageLocked]}
                accessibilityLabel={badge.label}
              />
              <Text style={styles.badgeLabel}>{badge.label}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
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
    title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
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
    dayDotDone: { backgroundColor: colors.accentRed, borderColor: colors.accentRed },
    weekText: { ...typography.body, color: colors.textSecondary },
    teamCard: {},
    teamText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
    teamError: { ...typography.body, color: colors.textTertiary, marginBottom: spacing.xs },
    teamManageLink: { ...typography.caption, color: colors.accentRedDeep, marginTop: spacing.xs },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    badgeItem: { width: '30%', alignItems: 'center' },
    badgeImage: { width: 64, height: 64, marginBottom: spacing.xs },
    badgeImageLocked: { opacity: state.disabledOpacity },
    badgeLabel: { ...typography.captionStrong, color: colors.textPrimary, textAlign: 'center' },
    badgeDescription: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  });
}
