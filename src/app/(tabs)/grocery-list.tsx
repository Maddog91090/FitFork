import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../../lib/mealPlanData';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { spacing, type ThemeColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { motion, useReducedMotion } from '../../theme/motion';
import { useColors } from '../../theme/useColors';

type AggregatedIngredient = { name: string; quantity: number; unit: string };

function itemKey(item: Pick<AggregatedIngredient, 'name' | 'unit'>): string {
  return `${item.name}|${item.unit}`;
}

export default function GroceryListScreen() {
  const { session, loading } = useAuth();
  const [items, setItems] = useState<AggregatedIngredient[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hasPlan, setHasPlan] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const load = useCallback(async () => {
    if (!session) return;
    if (!hasLoadedOnce.current) setChecking(true);
    setError(null);
    try {
      const plan = await getCurrentPlan(session.user.id);
      if (!plan || plan.entries.length === 0) {
        setHasPlan(false);
        setItems([]);
        return;
      }
      setHasPlan(true);

      const recipeIds = Array.from(new Set(plan.entries.map((e) => e.recipeId)));
      const ingredients = await fetchRecipeIngredients(recipeIds);

      const totals = new Map<string, AggregatedIngredient>();
      for (const entry of plan.entries) {
        const recipeIngredients = ingredients.filter((i) => i.recipeId === entry.recipeId);
        for (const ingredient of recipeIngredients) {
          const key = `${ingredient.ingredientName}|${ingredient.unit}`;
          const scaledQuantity = ingredient.quantity * entry.portionMultiplier;
          const existing = totals.get(key);
          if (existing) {
            existing.quantity += scaledQuantity;
          } else {
            totals.set(key, { name: ingredient.ingredientName, quantity: scaledQuantity, unit: ingredient.unit });
          }
        }
      }

      setItems(Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la liste de courses.');
    } finally {
      setChecking(false);
      hasLoadedOnce.current = true;
    }
  }, [session]);

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

  const toggleItem = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (loading || !session || checking) {
    return (
      <Screen edges={['top']} style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </Screen>
    );
  }

  if (!hasPlan) {
    return (
      <Screen edges={['top']} style={styles.centered}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>🛒</Text>}
          title="Aucun plan pour l'instant"
          message="Génère un plan de repas pour obtenir ta liste de courses."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
        />
      </Screen>
    );
  }

  const checkedCount = items.filter((item) => checked.has(itemKey(item))).length;

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title} accessibilityRole="header">Liste de courses</Text>
        <Text style={styles.progress}>
          {checkedCount} sur {items.length} récupérés
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <Card>
          {items.map((item, index) => {
            const key = itemKey(item);
            return (
              <GroceryRow
                key={key}
                item={item}
                isChecked={checked.has(key)}
                onToggle={() => toggleItem(key)}
                isLast={index === items.length - 1}
              />
            );
          })}
        </Card>
      </ScrollView>
    </Screen>
  );
}

type GroceryRowProps = {
  item: AggregatedIngredient;
  isChecked: boolean;
  onToggle: () => void;
  isLast: boolean;
};

function GroceryRow({ item, isChecked, onToggle, isLast }: GroceryRowProps) {
  const reduceMotion = useReducedMotion();
  const checkedProgress = useSharedValue(isChecked ? 1 : 0);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    const target = isChecked ? 1 : 0;
    checkedProgress.value = reduceMotion ? target : withSpring(target, motion.spring.settle);
  }, [isChecked, reduceMotion, checkedProgress]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(checkedProgress.value, [0, 1], ['transparent', colors.accentRed]),
    borderColor: interpolateColor(checkedProgress.value, [0, 1], [colors.divider, colors.accentRed]),
  }));

  const animatedNameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(checkedProgress.value, [0, 1], [colors.textPrimary, colors.textSecondary]),
  }));

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={`${item.name}, ${Math.round(item.quantity * 10) / 10} ${item.unit}`}
      accessibilityState={{ checked: isChecked }}
      android_ripple={{ color: colors.divider }}
      style={[styles.row, isLast && styles.rowLast]}
    >
      <Animated.View style={[styles.checkbox, animatedCheckStyle]}>
        {isChecked && <Ionicons name="checkmark" size={14} color={colors.onAccent} />}
      </Animated.View>
      <Animated.Text style={[styles.name, animatedNameStyle, isChecked && styles.nameChecked]}>
        {item.name}
      </Animated.Text>
      <Text style={styles.quantity}>
        {Math.round(item.quantity * 10) / 10} {item.unit}
      </Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    container: { padding: spacing.lg },
    title: { ...typography.title, fontWeight: '800', color: colors.textPrimary },
    progress: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    rowLast: { borderBottomWidth: 0 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    name: { ...typography.body, flex: 1, color: colors.textPrimary },
    nameChecked: { textDecorationLine: 'line-through' },
    quantity: { ...typography.caption, color: colors.textSecondary },
    error: { color: colors.error, marginBottom: spacing.md },
    emptyIcon: { fontSize: 32 },
  });
