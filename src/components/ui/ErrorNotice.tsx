import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

type ErrorNoticeProps = {
  message: string;
  onRetry: () => void;
};

/** An error message with a "what to do next" action, for a screen whose load failed. */
export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Button title="Réessayer" variant="secondary" onPress={onRetry} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    message: {
      ...typography.body,
      color: colors.error,
      marginBottom: spacing.sm,
    },
  });
}
