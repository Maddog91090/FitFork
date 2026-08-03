import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { centeredContent, colors, spacing, radius, shadow, typography } from '../theme/tokens';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
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

const styles = StyleSheet.create({
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
  error: { ...typography.body, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  switchLink: { marginTop: spacing.lg, textAlign: 'center' },
  switchText: { ...typography.caption, textAlign: 'center', color: colors.textSecondary },
  switchTextAccent: { ...typography.captionStrong, color: colors.accentRedDeep },
  confirmText: { ...typography.body, textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.lg },
});
