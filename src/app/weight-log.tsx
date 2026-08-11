import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';
import { calculateWeeklyTrendPercent } from '../lib/progressTracking';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Sparkline } from '../components/ui/Sparkline';
import {
  centeredContent,
  fontFamily,
  lightColors,
  materialTypography,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../theme/tokens';

/** French decimals, without depending on Intl being built into the JS engine. */
function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

function formatDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return month && day ? `${day}/${month}` : isoDate;
}

/**
 * The trend is stated as a rate, not judged. Whether losing weight counts as
 * progress depends on the user's goal, which this screen does not load — so the
 * delta carries a direction and a period, and no success/warning color.
 */
function formatTrend(percentPerWeek: number): string {
  const sign = percentPerWeek > 0 ? '+' : '−';
  return `${sign}${formatNumber(Math.abs(percentPerWeek), 2)} % par semaine`;
}

export default function WeightLogScreen() {
  const colors = useMaterialColors();
  const neutral = useMaterialTertiary('neutral');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const recent = await fetchRecentWeightLogs(session.user.id);
      setLogs(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement de l'historique de poids.");
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
      setError('Poids invalide (supérieur à 0 kg).');
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={neutral.tertiary} />
      </View>
    );
  }

  // The API returns newest first; a trend line reads left to right.
  const chronological = [...logs].reverse();
  const current = chronological[chronological.length - 1];
  const trendPercent = calculateWeeklyTrendPercent(chronological);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Suivi de poids</Text>
      <TextField label="Poids (kg)" value={weightInput} onChangeText={setWeightInput} keyboardType="numeric" />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} domain="neutral" />

      {current && (
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Poids actuel</Text>
          <Text style={styles.statValue}>{formatNumber(current.weightKg)} kg</Text>
          <Text style={styles.statDelta}>
            {trendPercent === null
              ? `Première pesée le ${formatDate(current.loggedAt)}`
              : `${formatTrend(trendPercent)} sur ${chronological.length} pesées`}
          </Text>

          <View style={styles.chart} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
            <Sparkline
              values={chronological.map((log) => log.weightKg)}
              width={chartWidth}
              accessibilityLabel={`Évolution du poids sur ${chronological.length} pesées, de ${formatNumber(
                chronological[0].weightKg
              )} à ${formatNumber(current.weightKg)} kilos.`}
            />
          </View>

          {chronological.length > 1 && (
            <View style={styles.chartAxis}>
              <Text style={styles.axisLabel}>{formatDate(chronological[0].loggedAt)}</Text>
              <Text style={styles.axisLabel}>{formatDate(current.loggedAt)}</Text>
            </View>
          )}
        </Card>
      )}

      <Text style={styles.historyTitle}>Historique</Text>
      {logs.length === 0 ? (
        <EmptyState
          icon={
            <MaterialIcons testID="empty-state-icon" name="monitor-weight" size={64} color={colors.onSurfaceVariant} />
          }
          title="Aucune pesée"
          message="Enregistre ton poids ci-dessus pour voir ta courbe se construire."
        />
      ) : (
        <Card>
          {logs.map((log, index) => (
            <View key={log.id} style={[styles.row, index === logs.length - 1 && styles.rowLast]}>
              <Text style={styles.date}>{log.loggedAt}</Text>
              <Text style={styles.weight}>{formatNumber(log.weightKg)} kg</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    statCard: { marginTop: spacing.xl },
    statLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant },
    statValue: { ...materialTypography.headlineLarge, color: colors.onSurface, marginTop: spacing.xs },
    statDelta: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    chart: { marginTop: spacing.lg },
    chartAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
    axisLabel: { ...materialTypography.labelMedium, color: lightColors.textTertiary },
    historyTitle: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    rowLast: { borderBottomWidth: 0 },
    date: { ...materialTypography.labelMedium, color: colors.onSurface },
    // The number is the point of this screen — serif, and darker than its date.
    weight: { ...materialTypography.bodyMedium, color: colors.onSurface, fontFamily: fontFamily.displayBold },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.md },
  });
}
