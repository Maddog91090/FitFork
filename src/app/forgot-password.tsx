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
  radius,
  shadow,
  spacing,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../theme/tokens';

export default function ForgotPasswordScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Entre ton email ci-dessus.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.confirmText}>Email envoyé si ce compte existe. Vérifie ta boîte mail.</Text>
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
        <Text style={styles.brand}>Mot de passe oublié</Text>
        <Text style={styles.hint}>Entre ton email, on t'envoie un lien pour choisir un nouveau mot de passe.</Text>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Envoyer le lien" onPress={handleSubmit} loading={submitting} domain="neutral" />

        <Link href="/login" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Retour à la <Text style={styles.switchTextAccent}>connexion</Text>
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
    logoWrap: {
      width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.bgSurface,
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
      marginBottom: spacing.sm, padding: spacing.sm, ...shadow.card,
    },
    logo: { width: '100%', height: '100%' },
    brand: { ...typography.display, textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.sm },
    hint: { ...typography.body, textAlign: 'center', color: colors.textSecondary, marginBottom: spacing.xl },
    confirmText: { ...typography.body, textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.lg },
    error: { ...typography.body, color: colors.error, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...typography.caption, textAlign: 'center', color: colors.textSecondary },
    switchTextAccent: { ...typography.captionStrong, color: colors.domainNeutralDeep },
  });
}
