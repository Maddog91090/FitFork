import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';
import type { ExperienceLevel, Equipment } from '../lib/profile';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { spacing, type ThemeColors } from '../theme/tokens';
import { typography } from '../theme/typography';
import { useColors } from '../theme/useColors';
import type { Sex, ActivityLevel, Goal } from '../lib/nutrition';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light', label: 'Légère' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Très active' },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'cut', label: 'Sèche' },
  { value: 'maintain', label: 'Maintien' },
  { value: 'bulk', label: 'Prise de masse' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'full_gym', label: 'Salle complète' },
  { value: 'home_limited', label: 'Maison (matériel limité)' },
  { value: 'bodyweight', label: 'Poids du corps' },
];

const STEP_TITLES = ['Ton profil', 'Ton activité', 'Ton entraînement', 'Récapitulatif'];
const TOTAL_STEPS = 4;

export type OnboardingFields = {
  sex: Sex | null;
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  daysPerWeek: string;
  experienceLevel: ExperienceLevel | null;
  equipment: Equipment | null;
};

function parseDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

export function validateStep(step: number, fields: OnboardingFields): string | null {
  if (step === 0) {
    if (!fields.sex) return 'Merci de choisir un sexe.';
    const ageNum = Number(fields.age);
    if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum >= 120) return 'Âge invalide.';
    const heightNum = parseDecimal(fields.heightCm);
    if (!Number.isFinite(heightNum) || heightNum <= 0) return 'Taille invalide.';
    const weightNum = parseDecimal(fields.weightKg);
    if (!Number.isFinite(weightNum) || weightNum <= 0) return 'Poids invalide.';
    return null;
  }
  if (step === 1) {
    if (!fields.activityLevel) return "Merci de choisir un niveau d'activité.";
    if (!fields.goal) return 'Merci de choisir un objectif.';
    return null;
  }
  if (step === 2) {
    const daysNum = Number(fields.daysPerWeek);
    if (!Number.isInteger(daysNum) || daysNum < 0 || daysNum > 7) {
      return "Jours d'entraînement invalides (0 à 7).";
    }
    if (!fields.experienceLevel) return 'Merci de choisir un niveau.';
    if (!fields.equipment) return 'Merci de choisir un matériel.';
    return null;
  }
  return null;
}

export default function OnboardingScreen() {
  const { session, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const fields: OnboardingFields = {
    sex,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goal,
    daysPerWeek,
    experienceLevel,
    equipment,
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleContinue = () => {
    const validationError = validateStep(step, fields);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertProfile(session.user.id, {
        sex: sex!,
        age: Number(age),
        heightCm: parseDecimal(heightCm),
        weightKg: parseDecimal(weightKg),
        activityLevel: activityLevel!,
        goal: goal!,
      });
      await upsertTrainingProfile(session.user.id, {
        daysPerWeek: Number(daysPerWeek),
        experienceLevel: experienceLevel!,
        equipment: equipment!,
      });
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.avoiding} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View key={index} style={[styles.segment, index <= step && styles.segmentDone]} />
          ))}
        </View>
        <Text style={styles.stepCounter}>
          {step < TOTAL_STEPS - 1 ? `ÉTAPE ${step + 1}/${TOTAL_STEPS}` : 'RÉCAPITULATIF'}
        </Text>
        <Text style={styles.title} accessibilityRole="header">{STEP_TITLES[step]}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {step === 0 && (
          <>
            <Text style={styles.label}>Sexe</Text>
            <ChoiceGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />
            <TextField label="Âge" value={age} onChangeText={setAge} keyboardType="numeric" testID="age-input" />
            <TextField
              label="Taille (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              testID="height-input"
            />
            <TextField
              label="Poids (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              testID="weight-input"
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.label}>Niveau d&apos;activité quotidienne</Text>
            <ChoiceGroup options={ACTIVITY_OPTIONS} value={activityLevel} onChange={setActivityLevel} />
            <Text style={styles.label}>Objectif</Text>
            <ChoiceGroup options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
          </>
        )}

        {step === 2 && (
          <>
            <TextField
              label="Jours d'entraînement / semaine"
              value={daysPerWeek}
              onChangeText={setDaysPerWeek}
              keyboardType="numeric"
              testID="days-input"
            />
            <Text style={styles.label}>Niveau</Text>
            <ChoiceGroup options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={setExperienceLevel} />
            <Text style={styles.label}>Matériel disponible</Text>
            <ChoiceGroup options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.recapGroup}>Profil</Text>
            <RecapRow label="Sexe" value={SEX_OPTIONS.find((o) => o.value === sex)?.label ?? '—'} />
            <RecapRow label="Âge" value={`${age} ans`} />
            <RecapRow label="Taille" value={`${heightCm} cm`} />
            <RecapRow label="Poids" value={`${weightKg} kg`} />

            <Text style={styles.recapGroup}>Activité</Text>
            <RecapRow
              label="Niveau d'activité"
              value={ACTIVITY_OPTIONS.find((o) => o.value === activityLevel)?.label ?? '—'}
            />
            <RecapRow label="Objectif" value={GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? '—'} />

            <Text style={styles.recapGroup}>Entraînement</Text>
            <RecapRow label="Jours/semaine" value={daysPerWeek} />
            <RecapRow
              label="Niveau"
              value={EXPERIENCE_OPTIONS.find((o) => o.value === experienceLevel)?.label ?? '—'}
            />
            <RecapRow
              label="Matériel"
              value={EQUIPMENT_OPTIONS.find((o) => o.value === equipment)?.label ?? '—'}
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Pressable
            onPress={handleBack}
            style={styles.backLink}
            hitSlop={8}
            android_ripple={{ color: colors.divider }}
            accessibilityRole="button"
            accessibilityLabel="Retour à l'étape précédente"
          >
            <Text style={styles.backLinkText}>← Retour</Text>
          </Pressable>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button title="Continuer" onPress={handleContinue} />
        ) : (
          <Button title="Valider" onPress={handleSubmit} loading={submitting} />
        )}
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avoiding: { flex: 1 },
    header: { padding: spacing.lg, paddingBottom: spacing.sm },
    progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.divider },
    segmentDone: { backgroundColor: colors.accentRed },
    stepCounter: { ...typography.label, color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.xs },
    title: { ...typography.title, fontWeight: '800', color: colors.textPrimary },
    body: { flex: 1 },
    bodyContent: { padding: spacing.lg, paddingTop: spacing.sm },
    label: {
      ...typography.label,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '700',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    error: { color: colors.error, marginTop: spacing.md },
    footer: { padding: spacing.lg },
    backLink: { alignSelf: 'flex-start', marginBottom: spacing.md },
    backLinkText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
    recapGroup: {
      ...typography.label,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '700',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    recapRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    recapLabel: { ...typography.caption, color: colors.textSecondary },
    recapValue: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  });
