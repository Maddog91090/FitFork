import { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useLinkingURL } from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../../lib/supabase';
import { translateAuthError } from '../../lib/authErrors';
import { centeredContent, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

/**
 * Landing screen for Supabase email links (signup confirmation, magic link,
 * password reset) opened via the app's deep link scheme. Supabase verifies
 * the one-time token server-side and redirects here with the session tokens
 * in the URL; this screen just has to pick them up and hand them to the
 * client so `auth-context`'s onAuthStateChange listener takes it from there.
 */
export default function AuthCallbackScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      <ActivityIndicator color={colors.accentRed} />
      <Text style={styles.message}>Confirmation en cours…</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.bgBase,
    },
    content: { ...centeredContent, alignItems: 'center' },
    message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    error: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.lg },
    link: { marginTop: spacing.sm },
    linkText: { ...typography.captionStrong, color: colors.accentRedDeep },
  });
}
