import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { centeredContent, colors, spacing, typography } from '../../theme/tokens';

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
  container: { padding: spacing.lg, ...centeredContent },
  greeting: { ...typography.caption, color: colors.textSecondary },
  name: { ...typography.hero, color: colors.textPrimary, marginBottom: spacing.lg },
  error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  macroCard: { marginBottom: spacing.lg },
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
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  signOut: { marginTop: spacing.xl },
});
