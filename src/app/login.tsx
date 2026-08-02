import { useEffect, useMemo, useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { spacing, radius, shadow, type ThemeColors } from '../theme/tokens';
import { typography } from '../theme/typography';
import { useColors } from '../theme/useColors';

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (session) {
      router.replace('/home');
    }
  }, [session]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.avoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
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

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Se connecter" onPress={handleSubmit} loading={submitting} />

        <Link
          href="/signup"
          style={styles.switchLink}
          accessibilityRole="link"
          accessibilityLabel="Créer un compte"
        >
          <Text style={styles.switchText}>
            Pas de compte ? <Text style={styles.switchTextAccent}>Créer un compte</Text>
          </Text>
        </Link>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avoiding: { flex: 1, justifyContent: 'center', padding: spacing.xl },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.sm,
      overflow: 'hidden',
      ...shadow.card,
    },
    logo: { width: '100%', height: '100%' },
    brand: {
      ...typography.subtitle,
      textAlign: 'center',
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.xl,
    },
    error: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: {
      marginTop: spacing.xs,
      textAlign: 'center',
      alignSelf: 'center',
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.md,
    },
    switchText: { ...typography.caption, textAlign: 'center', color: colors.textSecondary },
    switchTextAccent: { color: colors.accentRed, fontWeight: '700' },
  });
