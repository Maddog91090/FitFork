import { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useLinkingURL } from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../../lib/supabase';
import { translateAuthError } from '../../lib/authErrors';
import {
  centeredContent,
  materialTypography,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

export default function AuthCallbackScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer), [colors, accent]);
  const insets = useSafeAreaInsets();
  const url = useLinkingURL();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode || params.error) {
      setError(
        params.error_code === 'otp_expired'
          ? 'Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.'
          : 'Lien invalide ou expiré.'
      );
      return;
    }
    if (!params.access_token || !params.refresh_token) {
      setError("Lien invalide : jetons de session manquants.");
      return;
    }
    supabase.auth
      .setSession({ access_token: params.access_token, refresh_token: params.refresh_token })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError(translateAuthError(sessionError));
          return;
        }
        router.replace(params.type === 'recovery' ? '/auth/reset-password' : '/home');
      });
  }, [url]);

  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.error}>{error}</Text>
          <Link href="/login" style={styles.link}>
            <Text style={styles.linkText}>Aller à la connexion</Text>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={accent.tertiary} />
      <Text style={styles.message}>Confirmation en cours…</Text>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, accentDeep: string) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent, alignItems: 'center' },
    message: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant, marginTop: spacing.md },
    error: { ...materialTypography.bodyLarge, color: colors.error, textAlign: 'center', marginBottom: spacing.lg },
    link: { marginTop: spacing.sm },
    linkText: { ...materialTypography.labelSmall, color: accentDeep },
  });
}
