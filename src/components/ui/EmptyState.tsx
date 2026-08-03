import { View, Text, StyleSheet } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { Card } from './Card';
import { Button } from './Button';
import { colors, spacing, typography } from '../../theme/tokens';

type EmptyStateProps = {
  /** Brand illustration for this slot. Generated on bgSurface, so it sits on the card seamlessly. */
  illustration?: ImageProps['source'];
  /** Fallback for empty states that have no illustration of their own yet. */
  icon?: React.ReactNode;
  title: string;
  message: string;
  /** Omit both when the screen already offers the action elsewhere. */
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  illustration,
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const hasAction = Boolean(actionLabel && onAction);
  return (
    <Card style={styles.card}>
      {illustration ? (
        <Image source={illustration} style={styles.illustration} contentFit="contain" />
      ) : (
        icon && <View style={styles.icon}>{icon}</View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.message, hasAction && styles.messageSpaced]}>{message}</Text>
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  illustration: {
    width: 160,
    height: 160,
    marginBottom: spacing.sm,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messageSpaced: {
    marginBottom: spacing.lg,
  },
});
