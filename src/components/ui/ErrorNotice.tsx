import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { materialTypography, spacing, useMaterialColors, type MaterialColorScheme } from '../../theme/tokens';

type ErrorNoticeProps = { message: string; onRetry: () => void; };

export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Button title="Réessayer" variant="secondary" onPress={onRetry} />
    </View>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    message: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.sm },
  });
}
