import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, saveWeeklyPlan } from '../lib/mealPlanData';
import { fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';
import { computeAdjustedTargets } from '../lib/progressTracking';
import { generateWeeklyPlan, type MealSlot, type MealType } from '../lib/mealPlan';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { radius, shadow, spacing, type ThemeColors } from '../theme/tokens';
import { typography } from '../theme/typography';
import { motion, useReducedMotion } from '../theme/motion';
import { useColors } from '../theme/useColors';

const isAndroid = Platform.OS === 'android';
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

function defaultSelection(): boolean[][] {
  return DAY_LABELS.map(() => MEAL_TYPES.map(() => true));
}

export default function GeneratePlanScreen() {
  const { session, loading } = useAuth();
  const [selected, setSelected] = useState<boolean[][]>(defaultSelection());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const toggle = (dayIndex: number, mealIndex: number) => {
    setSelected((prev) =>
      prev.map((row, d) => (d === dayIndex ? row.map((v, m) => (m === mealIndex ? !v : v)) : row))
    );
  };

  const handleGenerate = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setGenerating(true);
    try {
      const [profile, trainingProfile] = await Promise.all([
        getProfile(session.user.id),
        getTrainingProfile(session.user.id),
      ]);

      if (!profile || !trainingProfile) {
        router.replace('/onboarding');
        return;
      }

      const baseTargets = computeTargetsFromProfile(profile, trainingProfile);
      let weightLogs: WeightLogEntry[] = [];
      try {
        weightLogs = await fetchRecentWeightLogs(session.user.id);
      } catch {
        // Progress tracking is a strictly additive enhancement — if fetching weight
        // history fails for any reason, fall back to the base (unadjusted) targets
        // rather than aborting meal-plan generation entirely.
      }
      const targets = computeAdjustedTargets(baseTargets, profile.goal, profile.weightKg, weightLogs);
      const recipes = await fetchRecipes();
      const recipeOptions = recipes.map((r) => ({
        id: r.id,
        mealType: r.mealType,
        baseCalories: r.baseCalories,
        baseProteinG: r.baseProteinG,
        baseFatG: r.baseFatG,
        baseCarbsG: r.baseCarbsG,
      }));

      const slots: MealSlot[] = [];
      selected.forEach((row, dayIndex) => {
        row.forEach((isSelected, mealIndex) => {
          if (isSelected) slots.push({ dayIndex, mealType: MEAL_TYPES[mealIndex] });
        });
      });

      const entries = generateWeeklyPlan(targets, slots, recipeOptions);
      await saveWeeklyPlan(session.user.id, targets, entries);
      router.replace('/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title} accessibilityRole="header">Choisis les repas à générer</Text>
      {DAY_LABELS.map((dayLabel, dayIndex) => (
        <View key={dayLabel} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((mealType, mealIndex) => (
              <MealCell
                key={mealType}
                label={MEAL_TYPE_LABELS[mealType]}
                checked={selected[dayIndex][mealIndex]}
                onPress={() => toggle(dayIndex, mealIndex)}
                accessibilityLabel={`${MEAL_TYPE_LABELS[mealType]}, ${dayLabel}`}
              />
            ))}
          </View>
        </View>
      ))}
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Générer le plan" onPress={handleGenerate} loading={generating} />
      </ScrollView>
    </Screen>
  );
}

type MealCellProps = {
  label: string;
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

// Matches ChoiceGroup's Pill vocabulary (shape, colors, press/selection springs) rather than
// reusing ChoiceGroup itself: this is a multi-select checkbox grid, not a single-select radiogroup,
// so the accessibility semantics genuinely differ even though the visual language shouldn't.
function MealCell({ label, checked, onPress, accessibilityLabel }: MealCellProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const checkedProgress = useSharedValue(checked ? 1 : 0);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    const target = checked ? 1 : 0;
    checkedProgress.value = reduceMotion ? target : withSpring(target, motion.spring.settle);
  }, [checked, reduceMotion, checkedProgress]);

  const handlePressIn = () => {
    scale.value = reduceMotion ? 0.97 : withSpring(0.97, motion.spring.press);
  };

  const handlePressOut = () => {
    scale.value = reduceMotion ? 1 : withSpring(1, motion.spring.press);
  };

  const animatedCellStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      checkedProgress.value,
      [0, 1],
      [isAndroid ? colors.surfaceVariant : colors.bgSurface, colors.accentRed]
    );
    if (isAndroid) {
      return {
        transform: [{ scale: scale.value }],
        backgroundColor,
        borderColor: interpolateColor(checkedProgress.value, [0, 1], [colors.outline, colors.accentRed]),
      };
    }
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      shadowColor: interpolateColor(checkedProgress.value, [0, 1], [shadow.card.shadowColor, colors.accentRed]),
      shadowOpacity: shadow.card.shadowOpacity + (0.25 - shadow.card.shadowOpacity) * checkedProgress.value,
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(checkedProgress.value, [0, 1], [colors.textSecondary, colors.onAccent]),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      android_ripple={{ color: colors.accentRedTint }}
      style={styles.cellTouchable}
    >
      <Animated.View style={[styles.cell, animatedCellStyle]}>
        <Animated.Text style={[styles.cellLabel, animatedLabelStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    container: { padding: spacing.lg },
    title: { ...typography.title, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
    dayRow: { marginBottom: spacing.md },
    dayLabel: {
      ...typography.label,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    cellTouchable: {
      borderRadius: radius.pill,
      overflow: isAndroid ? 'hidden' : 'visible',
    },
    cell: {
      borderRadius: radius.pill,
      minHeight: 44,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      ...(isAndroid
        ? { borderWidth: 1 }
        : { elevation: shadow.card.elevation, shadowOffset: shadow.card.shadowOffset, shadowRadius: shadow.card.shadowRadius }),
    },
    cellLabel: { ...typography.label, fontWeight: '600' },
    error: { color: colors.error, marginTop: spacing.md, marginBottom: spacing.sm },
  });
