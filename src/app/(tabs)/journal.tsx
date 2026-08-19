import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { getCurrentPlan, fetchRecipes, type Recipe, type SavedPlanEntry } from '../../lib/mealPlanData';
import { fetchLogsForDate, logPlanEntry, unlogPlanEntry, deleteLog, type FoodLogEntry } from '../../lib/foodLogData';
import { sumMacros, remainingMacros } from '../../lib/foodLog';
import { todayDayIndex, type MealType } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { EmptyState } from '../../components/ui/EmptyState';
import { MacroIcon } from '../../components/icons/MacroIcon';
import {
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  withRippleAlpha,
  type MaterialColorScheme,
} from '../../theme/tokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function JournalScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [planMeals, setPlanMeals] = useState<SavedPlanEntry[]>([]);
  const [recipesById, setRecipesById] = useState<Map<string, Recipe>>(new Map());
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    const userId = session.user.id;
    setError(null);

    try {
      const [profile, plan, recipes, todayLogs] = await Promise.all([
        getProfile(userId),
        getCurrentPlan(userId),
        fetchRecipes(),
        fetchLogsForDate(userId, todayIso()),
      ]);

      if (!profile) {
        router.replace('/onboarding');
        return;
      }

      setMacros(computeTargetsFromProfile(profile));
      setRecipesById(new Map(recipes.map((r) => [r.id, r])));
      if (plan) {
        const dayIndex = todayDayIndex();
        setPlanMeals(
          plan.entries
            .filter((e) => e.dayIndex === dayIndex)
            .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType))
        );
      } else {
        setPlanMeals([]);
      }
      setLogs(todayLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du journal.');
    } finally {
      setChecking(false);
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const loggedPlanEntryIds = useMemo(() => new Set(logs.filter((l) => l.planEntryId).map((l) => l.planEntryId)), [logs]);
  const adHocLogs = useMemo(() => logs.filter((l) => l.source !== 'plan_entry'), [logs]);
  const consumed = useMemo(() => sumMacros(logs.map((l) => ({ calories: l.calories, proteinG: l.proteinG, fatG: l.fatG, carbsG: l.carbsG }))), [logs]);
  const remaining = macros ? remainingMacros(macros, consumed) : null;

  const handleTogglePlanMeal = async (entry: SavedPlanEntry) => {
    if (!session || busyId) return;
    const recipe = recipesById.get(entry.recipeId);
    if (!recipe) return;

    setBusyId(entry.id);
    setError(null);
    try {
      if (loggedPlanEntryIds.has(entry.id)) {
        await unlogPlanEntry(session.user.id, entry.id);
      } else {
        await logPlanEntry(session.user.id, entry, recipe);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du journal.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteLog = async (log: FoodLogEntry) => {
    if (busyId) return;
    setBusyId(log.id);
    setError(null);
    try {
      await deleteLog(log.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Journal</Text>

      {error && <ErrorNotice message={error} onRetry={load} />}

      {remaining && (
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>{remaining.calories >= 0 ? 'Calories restantes' : 'Dépassement'}</Text>
          <Text style={styles.summaryValue}>{Math.abs(remaining.calories)} kcal</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="protein" size={16} />
                <Text style={styles.macroValue}>{consumed.proteinG}g</Text>
              </View>
              <Text style={styles.macroLabel}>/ {macros!.proteinG}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="fat" size={16} />
                <Text style={styles.macroValue}>{consumed.fatG}g</Text>
              </View>
              <Text style={styles.macroLabel}>/ {macros!.fatG}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="carbs" size={16} />
                <Text style={styles.macroValue}>{consumed.carbsG}g</Text>
              </View>
              <Text style={styles.macroLabel}>/ {macros!.carbsG}g</Text>
            </View>
          </View>
        </Card>
      )}

      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <Button title="Scanner un produit" onPress={() => router.push('/scan-barcode')} domain="nutrition" />
        </View>
        <View style={styles.actionButton}>
          <Button title="Ajouter" variant="secondary" onPress={() => router.push('/log-manual')} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Repas du jour</Text>
      {planMeals.length > 0 ? (
        <Card style={styles.listCard}>
          {planMeals.map((entry, index) => {
            const recipe = recipesById.get(entry.recipeId);
            const isLogged = loggedPlanEntryIds.has(entry.id);
            return (
              <Pressable
                key={entry.id}
                onPress={() => handleTogglePlanMeal(entry)}
                disabled={busyId === entry.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isLogged, disabled: busyId === entry.id }}
                android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant) }}
                style={[styles.row, index === planMeals.length - 1 && styles.rowLast]}
              >
                <PlanCheckIcon
                  isLogged={isLogged}
                  colors={colors}
                  tertiary={nutrition.tertiary}
                />
                <View style={styles.rowText}>
                  <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                  <Text style={styles.mealRecipeName}>{recipe ? recipe.name : entry.recipeId}</Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card style={styles.listCard}>
          <Text style={styles.emptyText}>Pas de plan pour aujourd'hui.</Text>
        </Card>
      )}

      <Text style={styles.sectionLabel}>Ajouts libres</Text>
      {adHocLogs.length > 0 ? (
        <Card style={styles.listCard}>
          {adHocLogs.map((log, index) => (
            <View key={log.id} style={[styles.row, index === adHocLogs.length - 1 && styles.rowLast]}>
              <View style={styles.rowText}>
                <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[log.mealType]}</Text>
                <Text style={styles.mealRecipeName}>{log.name}</Text>
                <Text style={styles.mealCalories}>{log.calories} kcal</Text>
              </View>
              <Pressable
                onPress={() => handleDeleteLog(log)}
                disabled={busyId === log.id}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer ${log.name}`}
                hitSlop={state.hitSlop}
                android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant), radius: 20 }}
                style={styles.deleteButton}
              >
                <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={<MaterialIcons name="qr-code-scanner" size={64} color={colors.onSurfaceVariant} accessible={false} />}
          title="Rien d'ajouté"
          message="Scanne un produit ou ajoute une entrée manuelle pour compléter ton journal."
          domain="nutrition"
        />
      )}
    </ScrollView>
  );
}

function PlanCheckIcon({ isLogged, colors, tertiary }: { isLogged: boolean; colors: MaterialColorScheme; tertiary: string }) {
  return (
    <MaterialIcons
      name={isLogged ? 'check-circle' : 'radio-button-unchecked'}
      size={24}
      color={isLogged ? tertiary : colors.onSurfaceVariant}
      accessible={false}
    />
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg },
    title: { ...materialTypography.displayLarge, color: colors.onSurface, marginBottom: spacing.lg },
    summaryCard: { marginBottom: spacing.lg, alignItems: 'center' },
    sectionLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
    summaryValue: { ...materialTypography.headlineLarge, color: colors.onSurface, marginTop: spacing.xs },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: spacing.md },
    macroItem: { alignItems: 'center', flex: 1 },
    macroValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    macroValue: { ...materialTypography.titleMedium, color: colors.onSurface },
    macroLabel: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    actionButton: { flex: 1 },
    listCard: { marginBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    rowLast: { borderBottomWidth: 0 },
    rowText: { flex: 1 },
    mealTypeLabel: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant },
    mealRecipeName: { ...materialTypography.bodyMedium, color: colors.onSurface },
    mealCalories: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    emptyText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant },
    deleteButton: { minHeight: state.minTouchSize, minWidth: state.minTouchSize, alignItems: 'center', justifyContent: 'center' },
  });
}
