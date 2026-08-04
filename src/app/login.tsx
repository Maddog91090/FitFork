import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { centeredContent, spacing, radius, shadow, typography, useThemeColors, type ThemeColors } from '../theme/tokens';

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace('/home');
    }
  }, [session]);

  const handleSubmit = async () => {
    setError(null);
    setResetSent(false);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Entre ton email ci-dessus pour recevoir le lien de réinitialisation.');
      return;
    }
    setError(null);
    setResetSent(false);
    setResetSubmitting(true);
    const { error } = await resetPassword(email);
    setResetSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
      return;
    }
    setResetSent(true);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/images/logo-mark.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Text style={styles.brand}>FitPro</Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />

        {resetSent && <Text style={styles.confirmText}>Email envoyé si ce compte existe. Vérifie ta boîte mail.</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Se connecter" onPress={handleSubmit} loading={submitting} />

        <Link href="/signup" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Pas de compte ? <Text style={styles.switchTextAccent}>Créer un compte</Text>
          </Text>
        </Link>

        <Pressable onPress={handleForgotPassword} disabled={resetSubmitting} style={styles.forgotLink}>
          <Text style={styles.switchText}>
            Mot de passe oublié ? <Text style={styles.switchTextAccent}>Réinitialiser</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bgBase },
    content: { ...centeredContent },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.sm,
      padding: spacing.sm,
      ...shadow.card,
    },
    logo: { width: '100%', height: '100%' },
    brand: {
      ...typography.display,
      textAlign: 'center',
      color: colors.textPrimary,
      marginBottom: spacing.xl,
    },
    forgotLink: { marginTop: spacing.sm, textAlign: 'center' },
    confirmText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    error: { ...typography.body, color: colors.error, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...typography.caption, textAlign: 'center', color: colors.textSecondary },
    switchTextAccent: { ...typography.captionStrong, color: colors.accentRedDeep },
  });
}
