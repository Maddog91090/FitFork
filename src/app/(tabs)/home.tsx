import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { getCurrentPlan, fetchRecipes, type Recipe, type SavedPlanEntry } from '../../lib/mealPlanData';
import { fetchMyCompletions } from '../../lib/workoutCompletionsData';
import { getNotificationStatus, enableNotifications, disableNotifications } from '../../lib/pushNotifications';
import { computeStats, type GamificationStats } from '../../lib/workoutGamification';
import { todayDayIndex, type MealType } from '../../lib/mealPlan';
import { PressableScale } from '../../components/ui/PressableScale';
import { TransformingMascot, type MascotForm } from '../../components/ui/TransformingMascot';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { MacroIcon } from '../../components/icons/MacroIcon';
import {
  centeredContent,
  motion,
  radius,
  shadow,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../../theme/tokens';

type PremiumButtonProps = { title: string; onPress: () => void; variant?: 'primary' | 'secondary' };

/**
 * The premium-direction button: flat bronze fill (primary) or a bronze-bordered
 * surface (secondary) instead of ClayButton's domain-colored clay bounce —
 * scoped to Home's premium hero-card treatment, not a replacement for
 * ClayButton elsewhere.
 */
function PremiumButton({ title, onPress, variant = 'primary' }: PremiumButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPremiumButtonStyles(colors, variant), [colors, variant]);
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={styles.base}>
      <Text style={styles.label}>{title}</Text>
    </PressableScale>
  );
}

function createPremiumButtonStyles(colors: ThemeColors, variant: 'primary' | 'secondary') {
  return StyleSheet.create({
    base: {
      minHeight: state.minTouchSize,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: variant === 'primary' ? colors.premiumBronze : colors.bgSurface,
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: colors.premiumBronzeSoft,
      ...shadow.subtle,
    },
    label: {
      ...typography.label,
      color: variant === 'primary' ? colors.textOnAccent : colors.premiumBronze,
    },
  });
}

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
  const [mascotForm, setMascotForm] = useState<MascotForm>('nutrition');

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

  if (loading || !session || checkingProfile) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.domainNutrition} />
      </View>
    );
  }

  const firstName = session.user.email?.split('@')[0] ?? '';

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.name} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
        <PressableScale
          onPress={() => setMascotForm((current) => (current === 'nutrition' ? 'sport' : 'nutrition'))}
          accessibilityRole="button"
          accessibilityLabel="Mascotte"
          accessibilityHint={mascotForm === 'nutrition' ? 'Appuie pour la voir en mode sport' : 'Appuie pour la voir en mode nutrition'}
        >
          <TransformingMascot form={mascotForm} size={76} />
        </PressableScale>
      </View>

      {loadError && <ErrorNotice message={loadError} onRetry={load} />}

      {macros && (
        <Animated.View entering={FadeInDown.duration(motion.duration.base)}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} pointerEvents="none" />
            <Text style={styles.heroLabel}>Objectifs du jour</Text>
            <View style={styles.heroValueRow}>
              <Text style={styles.heroValue}>{macros.calories}</Text>
              <Text style={styles.heroUnit}>kcal</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MacroIcon name="protein" size={20} />
              <Text style={[styles.statValue, styles.macroProtein]}>{macros.proteinG}g</Text>
              <Text style={styles.statLabel}>Prot</Text>
            </View>
            <View style={styles.statCard}>
              <MacroIcon name="fat" size={20} />
              <Text style={[styles.statValue, styles.macroFat]}>{macros.fatG}g</Text>
              <Text style={styles.statLabel}>Lip</Text>
            </View>
            <View style={styles.statCard}>
              <MacroIcon name="carbs" size={20} />
              <Text style={[styles.statValue, styles.macroCarbs]}>{macros.carbsG}g</Text>
              <Text style={styles.statLabel}>Gluc</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {gamification && (
        <Animated.View entering={FadeInDown.duration(motion.duration.base).delay(40)}>
          <PressableScale
            onPress={() => router.push('/progression')}
            accessibilityRole="button"
            style={[styles.heroCard, styles.gamificationTouchable]}
          >
            <>
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
            </>
          </PressableScale>
        </Animated.View>
      )}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <PremiumButton title="Voir mon plan" variant="secondary" onPress={() => router.push('/plan')} />
        </View>
        <View style={styles.actionButton}>
          <PremiumButton title="Générer" onPress={() => router.push('/generate-plan')} />
        </View>
      </View>
      <View style={styles.actionsRowSecondary}>
        <PremiumButton title="Suivre mon poids" variant="secondary" onPress={() => router.push('/weight-log')} />
      </View>

      <Text style={styles.sectionLabel}>Repas du jour</Text>
      {todayMeals.length > 0 ? (
        <View style={[styles.heroCard, styles.mealsCard]}>
          {todayMeals.map((entry, index) => {
            const recipe = recipesById.get(entry.recipeId);
            return (
              <PressableScale
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
                <View style={styles.mealRowInner}>
                  <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                  <Text style={styles.mealRecipeName}>{recipe ? recipe.name : entry.recipeId}</Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      ) : (
        <View style={[styles.heroCard, styles.mealsCard]}>
          <Text style={styles.mealsEmptyText}>
            Pas de plan pour aujourd'hui. Génère ton plan de la semaine pour voir tes repas ici.
          </Text>
        </View>
      )}

      <View style={styles.notificationsRow}>
        <Text style={styles.notificationsLabel}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          disabled={notificationsBusy}
          trackColor={{ true: colors.premiumBronze, false: colors.border }}
          thumbColor={colors.bgSurface}
          accessibilityLabel="Notifications de rappel d'entraînement"
        />
      </View>

      <View style={styles.signOut}>
        <PremiumButton title="Se déconnecter" variant="secondary" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    headerText: { flexShrink: 1, paddingRight: spacing.sm },
    greeting: { ...typography.hero, color: colors.textPrimary },
    name: { ...typography.body, color: colors.textSecondary, textTransform: 'capitalize' },
    heroCard: {
      borderRadius: radius.xl,
      paddingVertical: spacing.xxxl,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.premiumBronzeSoft,
      alignItems: 'center',
      ...shadow.card,
    },
    // Fakes a soft radial glow behind the hero number — RN has no radial
    // gradient, so this is a big soft-shadowed circle sized past the card's
    // edges and centered behind the text via absolute positioning.
    heroGlow: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 220,
      height: 220,
      marginLeft: -110,
      marginTop: -110,
      borderRadius: 110,
      backgroundColor: colors.premiumBronzeSoft,
      opacity: 0.55,
      shadowColor: colors.premiumBronze,
      shadowOpacity: 0.35,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 0 },
    },
    heroLabel: { ...typography.overline, color: colors.premiumBronze },
    heroValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.sm },
    heroValue: { ...typography.heroNumeral, color: colors.textPrimary },
    heroUnit: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.premiumBronzeSoft,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      ...shadow.subtle,
    },
    statValue: { ...typography.title },
    statLabel: { ...typography.overline, color: colors.textSecondary },
    gamificationTouchable: { borderRadius: radius.lg, marginBottom: spacing.lg },
    gamificationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, alignSelf: 'stretch' },
    gamificationItem: { alignItems: 'center', flex: 1 },
    gamificationValue: { ...typography.title, color: colors.textPrimary },
    sectionLabel: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    macroProtein: { color: colors.macroProtein },
    macroFat: { color: colors.macroFat },
    macroCarbs: { color: colors.macroCarbs },
    macroLabel: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.xs },
    actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    actionButton: { flex: 1 },
    actionsRowSecondary: { marginBottom: spacing.lg },
    mealsCard: { marginBottom: spacing.lg, padding: spacing.md },
    mealRow: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    mealRowInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
    },
    mealRowLast: { borderBottomWidth: 0 },
    mealTypeLabel: { ...typography.caption, width: 80, color: colors.textSecondary },
    mealRecipeName: { ...typography.bodyStrong, flex: 1, color: colors.textPrimary, textAlign: 'right' },
    mealsEmptyText: { ...typography.body, color: colors.textSecondary },
    notificationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    notificationsLabel: { ...typography.bodyStrong, color: colors.textPrimary },
    signOut: { marginTop: spacing.xl },
  });
}
