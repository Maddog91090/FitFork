import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Suivi de poids</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Poids (kg)"
        value={weightInput}
        onChangeText={setWeightInput}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={submitting ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSubmit} disabled={submitting} />

      <Text style={styles.historyTitle}>Historique</Text>
      {logs.length === 0 && <Text>Aucune pesée enregistrée.</Text>}
      {logs.map((log) => (
        <View key={log.id} style={styles.row}>
          <Text>{log.loggedAt}</Text>
          <Text>{log.weightKg} kg</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 8, marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  error: { color: 'red', marginBottom: 12 },
});
