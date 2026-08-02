import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { colors, spacing, radius, shadow } from '../theme/tokens';

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setError(error.message);
    }
  };

  return (
    <Screen style={styles.screen}>
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

      <Link href="/signup" style={styles.switchLink}>
        <Text style={styles.switchText}>
          Pas de compte ? <Text style={styles.switchTextAccent}>Créer un compte</Text>
        </Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', padding: spacing.xl },
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
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  error: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  switchLink: { marginTop: spacing.lg, textAlign: 'center' },
  switchText: { textAlign: 'center', fontSize: 12, color: colors.textSecondary },
  switchTextAccent: { color: colors.accentRed, fontWeight: '700' },
});

