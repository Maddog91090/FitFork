import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../theme/tokens';

export default function HomeScreen() {
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    let cancelled = false;

    (async () => {
      try {
        const [profile, trainingProfile] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
        ]);

        if (cancelled) return;

        if (!profile || !trainingProfile) {
          router.replace('/onboarding');
          return;
        }

        setMacros(computeTargetsFromProfile(profile, trainingProfile));
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
              <Text style={[styles.macroValue, styles.macroValueAccent]}>{macros.proteinG}g</Text>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.fatG}g</Text>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.carbsG}g</Text>
              <Text style={styles.macroLabel}>Gluc</Text>
            </View>
          </View>
        </Card>
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

      <View style={styles.signOut}>
        <Button title="Se déconnecter" variant="secondary" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  container: { padding: spacing.lg },
  greeting: { fontSize: 12, color: colors.textSecondary },
  name: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  error: { color: colors.error, marginBottom: spacing.md },
  macroCard: { marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  macroValueAccent: { color: colors.accentRed },
  macroLabel: { fontSize: 9, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  signOut: { marginTop: spacing.xl },
});
