import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { logManual } from '../lib/foodLogData';
import type { MealType } from '../lib/mealPlan';
import { BackLink } from '../components/ui/BackLink';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { materialTypography, spacing, useMaterialColors, type MaterialColorScheme } from '../theme/tokens';

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Petit-déj' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'snack', label: 'Collation' },
  { value: 'dinner', label: 'Dîner' },
];

export default function LogManualScreen() {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [name, setName] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [carbsInput, setCarbsInput] = useState('');
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calories = Number(caloriesInput.replace(',', '.'));
  const isValid = name.trim().length > 0 && Number.isFinite(calories) && calories >= 0 && mealType !== null;

  const parseMacro = (input: string): number => {
    const value = Number(input.replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  };

  const handleSubmit = async () => {
    if (!session || !isValid || !mealType) return;
    setSubmitting(true);
    setError(null);
    try {
      await logManual(session.user.id, mealType, name.trim(), {
        calories: Math.round(calories),
        proteinG: Math.round(parseMacro(proteinInput)),
        fatG: Math.round(parseMacro(fatInput)),
        carbsG: Math.round(parseMacro(carbsInput)),
      });
      router.replace('/journal');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout au journal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />
      <Text style={styles.title}>Ajout manuel</Text>

      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex. Salade César" />
      <TextField label="Calories (kcal)" value={caloriesInput} onChangeText={setCaloriesInput} keyboardType="numeric" />
      <TextField label="Protéines (g)" value={proteinInput} onChangeText={setProteinInput} keyboardType="numeric" />
      <TextField label="Lipides (g)" value={fatInput} onChangeText={setFatInput} keyboardType="numeric" />
      <TextField label="Glucides (g)" value={carbsInput} onChangeText={setCarbsInput} keyboardType="numeric" />

      <Text style={styles.sectionLabel}>Repas</Text>
      <ChoiceGroup options={MEAL_TYPE_OPTIONS} value={mealType} onChange={setMealType} domain="nutrition" />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.submitButton}>
        <Button title="Ajouter au journal" onPress={handleSubmit} loading={submitting} disabled={!isValid} domain="nutrition" />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { padding: spacing.lg },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    sectionLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginTop: spacing.sm },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginTop: spacing.md },
    submitButton: { marginTop: spacing.xl },
  });
}
