import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import {
  centeredContent,
  lightMaterialColors,
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../theme/tokens';

export default function LoginScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer), [colors, accent]);
  const insets = useSafeAreaInsets();
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />
        </View>
        <Text style={styles.brand}>FitPro</Text>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
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

function createStyles(colors: MaterialColorScheme, accentDeep: string) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent },
    logoWrap: {
      width: 64, height: 64, borderRadius: radius.lg, backgroundColor: lightMaterialColors.surface,
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
      marginBottom: spacing.sm, padding: spacing.sm, ...materialElevation,
    },
    logo: { width: '100%', height: '100%' },
    brand: { ...materialTypography.displayMedium, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.xl },
    forgotLink: { marginTop: spacing.sm, textAlign: 'center' },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...materialTypography.labelMedium, textAlign: 'center', color: colors.onSurfaceVariant },
    switchTextAccent: { ...materialTypography.labelSmall, color: accentDeep },
  });
}
