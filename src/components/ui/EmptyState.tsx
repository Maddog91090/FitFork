import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { Card } from './Card';
import { Button, type ButtonDomain } from './Button';
import { materialTypography, spacing, useMaterialColors, type MaterialColorScheme } from '../../theme/tokens';

type EmptyStateProps = {
  /** Brand illustration for this slot. Generated on the light surface color, so it sits on the card seamlessly. */
  illustration?: ImageProps['source'];
  /** Fallback for empty states that have no illustration of their own yet. */
  icon?: React.ReactNode;
  title: string;
  message: string;
  /** Omit both when the screen already offers the action elsewhere. */
  actionLabel?: string;
  onAction?: () => void;
  /** Domain color for the action button. Defaults to `'progress'`, matching `Button`'s own default. */
  domain?: ButtonDomain;
};

export function EmptyState({
  illustration,
  icon,
  title,
  message,
  actionLabel,
  onAction,
  domain,
}: EmptyStateProps) {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} domain={domain} />}
    </Card>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
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
      ...materialTypography.titleLarge,
      color: colors.onSurface,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    message: {
      ...materialTypography.bodyLarge,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    messageSpaced: {
      marginBottom: spacing.lg,
    },
  });
}
