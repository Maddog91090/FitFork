import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { centeredContent, spacing, typography, useThemeColors, type ThemeColors } from '../theme/tokens';

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      setError(translateAuthError(error));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/logo-fitfork.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.brand}>
          FitF<Text style={styles.brandAccent}>o</Text>rk
        </Text>

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

        <Link href="/forgot-password" style={styles.forgotLink}>
          <Text style={styles.switchText}>
            Mot de passe oublié ? <Text style={styles.switchTextAccent}>Réinitialiser</Text>
          </Text>
        </Link>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bgBase },
    content: { ...centeredContent },
    // The mark is a transparent knockout — the arrow inside it is the screen
    // showing through — so it sits straight on bgBase rather than on a white
    // card, which would fill the arrow with white and flatten the shape.
    logo: {
      width: 76,
      aspectRatio: 602 / 790,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    brand: {
      ...typography.display,
      textAlign: 'center',
      color: colors.textPrimary,
      marginBottom: spacing.xl,
    },
    // The mockup's wordmark colors the "o" in the brand orange. accentOrange
    // itself is only 1.9:1 on bgBase — unreadable even at display size — so the
    // letter uses accentOrangeDeep, which still reads orange and clears AA.
    brandAccent: { color: colors.accentOrangeDeep },
    forgotLink: { marginTop: spacing.sm, textAlign: 'center' },
    error: { ...typography.body, color: colors.error, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...typography.caption, textAlign: 'center', color: colors.textSecondary },
    switchTextAccent: { ...typography.captionStrong, color: colors.accentOrangeDeep },
  });
}
