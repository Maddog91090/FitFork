import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { colors, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title={actionLabel} onPress={onAction} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    letterSpacing: typography.caption.letterSpacing,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
