import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';
import type { ExperienceLevel, Equipment } from '../lib/profile';
import { ChoiceGroup } from '../components/ChoiceGroup';
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

export default function OnboardingScreen() {
  const { session, loading } = useAuth();
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

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const handleSubmit = async () => {
    setError(null);

    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);
    const daysNum = Number(daysPerWeek);

    if (!sex || !activityLevel || !goal || !experienceLevel || !equipment) {
      setError('Merci de remplir tous les champs.');
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum >= 120) {
      setError('Âge invalide.');
      return;
    }
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      setError('Taille invalide.');
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setError('Poids invalide.');
      return;
    }
    if (!Number.isInteger(daysNum) || daysNum < 0 || daysNum > 7) {
      setError("Jours d'entraînement invalides (0 à 7).");
      return;
    }
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertProfile(session.user.id, {
        sex,
        age: ageNum,
        heightCm: heightNum,
        weightKg: weightNum,
        activityLevel,
        goal,
      });
      await upsertTrainingProfile(session.user.id, {
        daysPerWeek: daysNum,
        experienceLevel,
        equipment,
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Sexe</Text>
      <ChoiceGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />

      <Text style={styles.label}>Âge</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />

      <Text style={styles.label}>Taille (cm)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />

      <Text style={styles.label}>Poids (kg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />

      <Text style={styles.label}>Niveau d'activité quotidienne</Text>
      <ChoiceGroup options={ACTIVITY_OPTIONS} value={activityLevel} onChange={setActivityLevel} />

      <Text style={styles.label}>Objectif</Text>
      <ChoiceGroup options={GOAL_OPTIONS} value={goal} onChange={setGoal} />

      <Text style={styles.label}>Jours d'entraînement / semaine</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={daysPerWeek} onChangeText={setDaysPerWeek} />

      <Text style={styles.label}>Niveau</Text>
      <ChoiceGroup options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={setExperienceLevel} />

      <Text style={styles.label}>Matériel disponible</Text>
      <ChoiceGroup options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title={submitting ? 'Enregistrement...' : 'Valider'} onPress={handleSubmit} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  label: { marginTop: 16, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 8, marginBottom: 8 },
  error: { color: 'red', marginTop: 16 },
});
