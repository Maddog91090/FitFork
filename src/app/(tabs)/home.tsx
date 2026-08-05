import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { getCurrentPlan, fetchRecipes, type Recipe, type SavedPlanEntry } from '../../lib/mealPlanData';
import { fetchMyCompletions, fetchTeamWeekProgress } from '../../lib/workoutCompletionsData';
import {
  computeStats,
  computeTeamBonusWeeks,
  groupByWeek,
  partnerWeeks,
  type GamificationStats,
} from '../../lib/workoutGamification';
import { todayDayIndex, type MealType } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { centeredContent, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [todayMeals, setTodayMeals] = useState<SavedPlanEntry[]>([]);
  const [recipesById, setRecipesById] = useState<Map<string, Recipe>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    let cancelled = false;

    (async () => {
      try {
        const [profile, trainingProfile, plan, recipes, myCompletions] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
          getCurrentPlan(session.user.id),
          fetchRecipes(),
          fetchMyCompletions(session.user.id),
        ]);

        if (cancelled) return;

        if (!profile || !trainingProfile) {
          router.replace('/onboarding');
          return;
        }

        setMacros(computeTargetsFromProfile(profile));
        setRecipesById(new Map(recipes.map((r) => [r.id, r])));
        if (plan) {
          const dayIndex = todayDayIndex();
          const entriesToday = plan.entries
            .filter((e) => e.dayIndex === dayIndex)
            .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
          setTodayMeals(entriesToday);
        }

        let teamBonusWeeks: string[] = [];
        try {
          const teamRows = await fetchTeamWeekProgress();
          teamBonusWeeks = computeTeamBonusWeeks(
            groupByWeek(myCompletions),
            partnerWeeks(teamRows, session.user.id)
          );
        } catch {
          // Team progress is a cooperative bonus on top of personal stats —
          // if it fails to load, still show the user's own streak/level below.
        }
        setGamification(computeStats(myCompletions, teamBonusWeeks, new Date().toISOString().slice(0, 10)));
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

  if (loading || !session || checkingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Bonjour</Text>
      <Text style={styles.name}>{session.user.email}</Text>

      {loadError && <Text style={styles.error}>{loadError}</Text>}

      {macros && (
        <Card style={styles.macroCard}>
          <Text style={styles.sectionLabel}>Objectifs du jour</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, styles.macroProtein]}>{macros.proteinG}g</Text>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, styles.macroFat]}>{macros.fatG}g</Text>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, styles.macroCarbs]}>{macros.carbsG}g</Text>
              <Text style={styles.macroLabel}>Gluc</Text>
            </View>
          </View>
        </Card>
      )}

      {gamification && (
        <PressableScale onPress={() => router.push('/progression')} accessibilityRole="button">
          <Card style={styles.gamificationCard}>
            <Text style={styles.sectionLabel}>Progression</Text>
            <View style={styles.gamificationRow}>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>🔥 {gamification.streak}</Text>
                <Text style={styles.macroLabel}>Série</Text>
              </View>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>Niv. {gamification.level}</Text>
                <Text style={styles.macroLabel}>Niveau</Text>
              </View>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>{gamification.thisWeekDays}/3</Text>
                <Text style={styles.macroLabel}>Cette semaine</Text>
              </View>
            </View>
          </Card>
        </PressableScale>
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

      <Text style={styles.sectionLabel}>Repas du jour</Text>
      {todayMeals.length > 0 ? (
        <Card style={styles.mealsCard}>
          {todayMeals.map((entry, index) => {
            const recipe = recipesById.get(entry.recipeId);
            return (
              <Pressable
                key={entry.id}
                onPress={() =>
                  router.push({
                    pathname: '/recipe/[id]',
                    params: { id: entry.recipeId, portion: String(entry.portionMultiplier) },
                  })
                }
                accessibilityRole="button"
                style={[styles.mealRow, index === todayMeals.length - 1 && styles.mealRowLast]}
              >
                <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                <Text style={styles.mealRecipeName}>{recipe ? recipe.name : entry.recipeId}</Text>
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card style={styles.mealsCard}>
          <Text style={styles.mealsEmptyText}>
            Pas de plan pour aujourd'hui. Génère ton plan de la semaine pour voir tes repas ici.
          </Text>
        </Card>
      )}

      <View style={styles.signOut}>
        <Button title="Se déconnecter" variant="secondary" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    greeting: { ...typography.caption, color: colors.textSecondary },
    name: { ...typography.hero, color: colors.textPrimary, marginBottom: spacing.lg },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
    macroCard: { marginBottom: spacing.lg },
    gamificationCard: { marginBottom: spacing.lg },
    gamificationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    gamificationItem: { alignItems: 'center', flex: 1 },
    gamificationValue: { ...typography.title, color: colors.textPrimary },
    sectionLabel: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    macroItem: { alignItems: 'center', flex: 1 },
    // Calories stay neutral; each macro carries its own hue so the numbers are
    // scannable at a glance and match the colors used elsewhere for the same macro.
    // typography.title rather than typography.metric: four values share this row,
    // and metric's 28px would wrap a 4-digit calorie target on narrow phones.
    macroValue: { ...typography.title, color: colors.textPrimary },
    macroProtein: { color: colors.macroProtein },
    macroFat: { color: colors.macroFat },
    macroCarbs: { color: colors.macroCarbs },
    macroLabel: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.xs },
    actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    actionButton: { flex: 1 },
    mealsCard: { marginBottom: spacing.lg },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    mealRowLast: { borderBottomWidth: 0 },
    mealTypeLabel: { ...typography.caption, width: 80, color: colors.textSecondary },
    mealRecipeName: { ...typography.bodyStrong, flex: 1, color: colors.textPrimary, textAlign: 'right' },
    mealsEmptyText: { ...typography.body, color: colors.textSecondary },
    signOut: { marginTop: spacing.xl },
  });
}
