import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../../lib/weightLogData';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { colors, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';

export default function WeightLogScreen() {
  const { session, loading } = useAuth();
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const recent = await fetchRecentWeightLogs(session.user.id);
      setLogs(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setChecking(false);
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

  const handleSubmit = async () => {
    setError(null);
    const weightNum = Number(weightInput);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setError('Poids invalide.');
      return;
    }
    if (!session) return;

    setSubmitting(true);
    try {
      await logWeight(session.user.id, weightNum);
      setWeightInput('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session || checking) {
    return (
      <Screen edges={['top']} style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Suivi de poids</Text>
        <TextField label="Poids (kg)" value={weightInput} onChangeText={setWeightInput} keyboardType="numeric" />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} />

        <Text style={styles.historyTitle}>Historique</Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>Aucune pesée enregistrée.</Text>
        ) : (
          <Card>
            {logs.map((log, index) => (
              <View key={log.id} style={[styles.row, index === logs.length - 1 && styles.rowLast]}>
                <Text style={styles.date}>{log.loggedAt}</Text>
                <Text style={styles.weight}>{log.weightKg} kg</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.lg },
  title: { ...typography.title, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  historyTitle: {
    ...typography.label,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  date: { ...typography.caption, color: colors.textPrimary },
  weight: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  error: { color: colors.error, marginBottom: spacing.md },
  emptyText: { ...typography.caption, color: colors.textSecondary },
});
