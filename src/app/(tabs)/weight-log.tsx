import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../../lib/weightLogData';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors, spacing } from '../../theme/tokens';

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
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  container: { padding: spacing.lg },
  title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  historyTitle: {
    fontSize: 11,
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
  date: { color: colors.textPrimary, fontSize: 12 },
  weight: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  error: { color: colors.error, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 12 },
});
