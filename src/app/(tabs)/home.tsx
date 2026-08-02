import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { spacing, type ThemeColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { useColors } from '../../theme/useColors';

export default function HomeScreen() {
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      <Screen edges={['top']} style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Bonjour</Text>
      <Text style={styles.name} accessibilityRole="header" numberOfLines={1} ellipsizeMode="tail">
        {session.user.email}
      </Text>

      {loadError && <Text style={styles.error}>{loadError}</Text>}

      {macros && (
        <Card style={styles.macroCard}>
          <Text style={styles.sectionLabel}>Objectifs du jour</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem} accessible accessibilityLabel={`${macros.calories} kilocalories`}>
              <Text style={styles.macroValue}>{macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem} accessible accessibilityLabel={`${macros.proteinG} grammes de protéines`}>
              <Text style={[styles.macroValue, styles.macroValueAccent]}>{macros.proteinG}g</Text>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem} accessible accessibilityLabel={`${macros.fatG} grammes de lipides`}>
              <Text style={styles.macroValue}>{macros.fatG}g</Text>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem} accessible accessibilityLabel={`${macros.carbsG} grammes de glucides`}>
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
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: spacing.lg },
    greeting: { ...typography.caption, color: colors.textSecondary },
    name: { ...typography.title, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
    error: { color: colors.error, marginBottom: spacing.md },
    macroCard: { marginBottom: spacing.lg },
    sectionLabel: {
      ...typography.label,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    macroItem: { alignItems: 'center', flex: 1 },
    macroValue: { ...typography.subtitle, fontWeight: '800', color: colors.textPrimary },
    macroValueAccent: { color: colors.accentRed },
    macroLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 2 },
    actionsRow: { flexDirection: 'row', gap: spacing.sm },
    actionButton: { flex: 1 },
    signOut: { marginTop: spacing.xl },
  });
