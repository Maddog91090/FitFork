import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { centeredContent, spacing, typography, useThemeColors, type ThemeColors } from '../theme/tokens';

export default function SignupScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
      return;
    }
    setConfirmationSent(true);
  };

  if (confirmationSent) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <Text style={styles.confirmText}>
            Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.
          </Text>
          <Link href="/login" style={styles.switchLink}>
            <Text style={styles.switchTextAccent}>Aller à la connexion</Text>
          </Link>
        </View>
      </View>
    );
  }

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
        <TextField
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Créer un compte" onPress={handleSubmit} loading={submitting} />

        <Link href="/login" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Déjà un compte ? <Text style={styles.switchTextAccent}>Se connecter</Text>
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
    // Same knockout logic as the login screen: no white card behind the mark.
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
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...typography.caption, textAlign: 'center', color: colors.textSecondary },
    switchTextAccent: { ...typography.captionStrong, color: colors.accentOrangeDeep },
    confirmText: { ...typography.body, textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.lg },
  });
}
