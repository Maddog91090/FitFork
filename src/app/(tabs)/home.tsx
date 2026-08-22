import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { getCurrentPlan, fetchRecipes, type Recipe, type SavedPlanEntry } from '../../lib/mealPlanData';
import { fetchMyCompletions } from '../../lib/workoutCompletionsData';
import { getNotificationStatus, enableNotifications, disableNotifications } from '../../lib/pushNotifications';
import { computeStats, type GamificationStats } from '../../lib/workoutGamification';
import { todayDayIndex, type MealType } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { Mascot } from '../../components/ui/Mascot';
import { SpeechBubble } from '../../components/ui/SpeechBubble';
import { MacroIcon } from '../../components/icons/MacroIcon';
import {
  centeredContent,
  lightColors,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  withRippleAlpha,
  type MaterialColorScheme,
  type MaterialDomain,
} from '../../theme/tokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function HomeScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [todayMeals, setTodayMeals] = useState<SavedPlanEntry[]>([]);
  const [recipesById, setRecipesById] = useState<Map<string, Recipe>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsBusy, setNotificationsBusy] = useState(false);

  const load = useCallback(async () => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    const userId = session.user.id;
    setLoadError(null);

    try {
      const [profile, trainingProfile, plan, recipes] = await Promise.all([
        getProfile(userId),
        getTrainingProfile(userId),
        getCurrentPlan(userId),
        fetchRecipes(),
      ]);

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
      } else {
        setTodayMeals([]);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
    } finally {
      setCheckingProfile(false);
    }

    // La gamification est un bonus par-dessus l'accueil : elle est chargée
    // hors du Promise.all ci-dessus pour qu'un échec ici ne fasse pas
    // disparaître les macros et les repas du jour, qui ne dépendent pas
    // d'elle. En cas d'échec, la carte Progression ne s'affiche simplement pas.
    try {
      const myCompletions = await fetchMyCompletions(userId);
      // Bonus d'équipe volontairement désactivé : sans système de binôme
      // (demande d'ami), on ne sait pas qui est le partenaire, et n'importe
      // quel autre compte serait compté comme tel. Réactivable en repassant
      // les semaines bonus ici une fois ce système en place.
      setGamification(computeStats(myCompletions, [], new Date().toISOString().slice(0, 10)));
    } catch {
      // Pas de carte Progression plutôt qu'un accueil vide.
    }

    try {
      const status = await getNotificationStatus(userId);
      setNotificationsEnabled(status.enabled);
    } catch {
      // Toggle just stays in its last known state rather than blocking the screen.
    }
  }, [loading, session]);

  // useFocusEffect plutôt que useEffect : les écrans d'onglets restent montés,
  // donc sans ça l'accueil afficherait encore la série et les repas d'avant en
  // revenant de l'onglet Sport où l'on vient justement de valider une séance.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Sign-out is irreversible from the user's point of view (they land back on
  // /login and must re-enter credentials), sitting at the bottom of a long
  // scroll next to otherwise-benign secondary buttons — a distracted tap is
  // plausible. A confirmation is the smallest fix that prevents it outright.
  const handleSignOutPress = () => {
    Alert.alert('Se déconnecter ?', 'Tu devras te reconnecter pour retrouver ton plan.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!session) return;
    setNotificationsBusy(true);
    try {
      if (value) {
        const granted = await enableNotifications(session.user.id);
        setNotificationsEnabled(granted);
      } else {
        await disableNotifications(session.user.id);
        setNotificationsEnabled(false);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur avec les notifications.');
    } finally {
      setNotificationsBusy(false);
    }
  };

  // One line from Dualo, chosen from whatever state is already loaded — never
  // a big celebration here: this fires on every app open, so intensity stays
  // low and steady (see impeccable delight.md's "repeated interaction" rule).
  // Real celebration is reserved for genuine milestones (workout completion).
  const heroLine = useMemo((): { message: string; domain: MaterialDomain } => {
    if (gamification && gamification.streak >= 1) {
      const weeks = gamification.streak;
      return {
        message: `Série de ${weeks} semaine${weeks > 1 ? 's' : ''} — continue comme ça.`,
        domain: 'sport',
      };
    }
    if (todayMeals.length > 0) {
      return { message: 'Ton programme du jour est prêt.', domain: 'nutrition' };
    }
    return { message: "Pas encore de plan pour aujourd'hui — je peux t'aider à en générer un.", domain: 'neutral' };
  }, [gamification, todayMeals]);

  if (loading || !session || checkingProfile) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Mascot size={64} />
        <Text style={styles.greeting}>Bonjour</Text>
      </View>
      <SpeechBubble message={heroLine.message} domain={heroLine.domain} />

      {loadError && <ErrorNotice message={loadError} onRetry={load} />}

      {macros && (
        <Card style={styles.macroCard}>
          <Text style={styles.sectionLabel}>Objectifs du jour</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="protein" size={16} />
                <Text style={[styles.macroValue, styles.macroProtein]}>{macros.proteinG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="fat" size={16} />
                <Text style={[styles.macroValue, styles.macroFat]}>{macros.fatG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="carbs" size={16} />
                <Text style={[styles.macroValue, styles.macroCarbs]}>{macros.carbsG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Gluc</Text>
            </View>
          </View>
        </Card>
      )}

      {gamification && (
        <Pressable
          onPress={() => router.push('/progression')}
          accessibilityRole="button"
          android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant), foreground: true }}
          style={({ pressed }) => [styles.gamificationTouchable, pressed && styles.gamificationPressed]}
        >
          <Card>
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
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <Button title="Voir mon plan" variant="secondary" onPress={() => router.push('/plan')} />
        </View>
        <View style={styles.actionButton}>
          <Button title="Générer" onPress={() => router.push('/generate-plan')} domain="nutrition" />
        </View>
      </View>
      <View style={styles.actionsRowSecondary}>
        <View style={styles.actionButton}>
          <Button title="S'entraîner" onPress={() => router.push('/workout')} domain="sport" />
        </View>
        <View style={styles.actionButton}>
          <Button title="Suivre mon poids" variant="secondary" onPress={() => router.push('/weight-log')} domain="neutral" />
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

      <View style={styles.notificationsRow}>
        <Text style={styles.notificationsLabel}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          disabled={notificationsBusy}
          trackColor={{ true: nutrition.tertiary, false: colors.outline }}
          thumbColor={colors.surface}
          accessibilityLabel="Notifications de rappel d'entraînement"
        />
      </View>

      <View style={styles.signOut}>
        <Button title="Se déconnecter" variant="secondary" onPress={handleSignOutPress} />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    greeting: { ...materialTypography.titleLarge, color: colors.onSurface },
    macroCard: { marginTop: spacing.lg, marginBottom: spacing.lg },
    gamificationTouchable: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg },
    gamificationPressed: { opacity: 0.85 },
    gamificationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    gamificationItem: { alignItems: 'center', flex: 1 },
    gamificationValue: { ...materialTypography.titleLarge, color: colors.onSurface },
    sectionLabel: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    macroItem: { alignItems: 'center', flex: 1 },
    macroValue: { ...materialTypography.titleLarge, color: colors.onSurface },
    macroProtein: { color: lightColors.macroProtein },
    macroFat: { color: lightColors.macroFat },
    macroCarbs: { color: lightColors.macroCarbs },
    macroLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    macroValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    actionButton: { flex: 1 },
    actionsRowSecondary: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    mealsCard: { marginBottom: spacing.lg },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    mealRowLast: { borderBottomWidth: 0 },
    mealTypeLabel: { ...materialTypography.labelMedium, width: 80, color: colors.onSurfaceVariant },
    mealRecipeName: { ...materialTypography.bodyMedium, flex: 1, color: colors.onSurface, textAlign: 'right' },
    mealsEmptyText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant },
    notificationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    notificationsLabel: { ...materialTypography.bodyMedium, color: colors.onSurface },
    signOut: { marginTop: spacing.xl },
  });
}
