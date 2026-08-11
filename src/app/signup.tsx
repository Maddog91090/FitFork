import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import {
  centeredContent,
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../theme/tokens';

export default function SignupScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer), [colors, accent]);
  const insets = useSafeAreaInsets();
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
      <View style={[styles.screen, { paddingTop: insets.top }]}>
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
          <Image source={require('../../assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />
        </View>
        <Text style={styles.brand}>FitPro</Text>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
        <TextField label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

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

function createStyles(colors: MaterialColorScheme, accentDeep: string) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent },
    logoWrap: {
      width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
      marginBottom: spacing.sm, padding: spacing.sm, ...materialElevation,
    },
    logo: { width: '100%', height: '100%' },
    brand: { ...materialTypography.displayMedium, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.xl },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...materialTypography.labelMedium, textAlign: 'center', color: colors.onSurfaceVariant },
    switchTextAccent: { ...materialTypography.labelSmall, color: accentDeep },
    confirmText: { ...materialTypography.bodyLarge, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.lg },
  });
}
