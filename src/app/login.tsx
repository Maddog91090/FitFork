import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
  shadow,
  smokedGlass,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  useThemeColors,
  type MaterialColorScheme,
  type ThemeColors,
} from '../theme/tokens';

export default function LoginScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer, themeColors), [colors, accent, themeColors]);
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

        <View style={styles.authWellWrap}>
          {/* Soft ambient color behind the well, so the BlurView actually
              has something to diffuse — a blur over a flat background is
              indistinguishable from a flat tint. Reuses the app's two
              premium accent softs (bronze/indigo) rather than new colors. */}
          <View style={styles.glowBronze} pointerEvents="none" />
          <View style={styles.glowIndigo} pointerEvents="none" />
          <View style={styles.authWell}>
            <BlurView intensity={smokedGlass.blurIntensity} tint="dark" style={[StyleSheet.absoluteFill, styles.authWellRadius]} />
            <View style={[styles.authWellTint, styles.authWellRadius]} pointerEvents="none" />
            <LinearGradient
              colors={smokedGlass.bevel.colors}
              locations={smokedGlass.bevel.locations}
              start={smokedGlass.bevel.start}
              end={smokedGlass.bevel.end}
              style={[StyleSheet.absoluteFill, styles.authWellRadius]}
              pointerEvents="none"
            />
            <View style={styles.authWellContent}>
              <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" onDark />
              <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry onDark />

              <Link href="/forgot-password" style={styles.forgotLink}>
                <Text style={styles.wellText}>
                  Mot de passe oublié ? <Text style={styles.wellTextAccent}>Réinitialiser</Text>
                </Text>
              </Link>
            </View>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Se connecter" onPress={handleSubmit} loading={submitting} />

        <Link href="/signup" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Pas de compte ? <Text style={styles.switchTextAccent}>Créer un compte</Text>
          </Text>
        </Link>
      </View>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, accentDeep: string, themeColors: ThemeColors) {
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
    authWellWrap: { marginBottom: spacing.md },
    glowBronze: {
      position: 'absolute',
      width: 190,
      height: 190,
      borderRadius: radius.full,
      top: -50,
      left: -30,
      backgroundColor: themeColors.premiumBronzeSoft,
    },
    glowIndigo: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: radius.full,
      bottom: -40,
      right: -20,
      backgroundColor: themeColors.premiumIndigoSoft,
    },
    // Smoked-glass well behind the email/password fields and the
    // forgot-password link — see tokens.ts's `smokedGlass` doc comment. No
    // 3D tilt here (unlike Home's decorative plaque) — this well contains
    // real TextInputs, and tilting interactive controls is bad UX.
    authWell: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: smokedGlass.border,
      ...shadow.raised,
    },
    authWellRadius: { borderRadius: radius.lg },
    authWellTint: { ...StyleSheet.absoluteFill, backgroundColor: smokedGlass.tint },
    authWellContent: { padding: spacing.lg },
    forgotLink: { marginTop: spacing.sm, textAlign: 'center' },
    wellText: { ...materialTypography.labelMedium, textAlign: 'center', color: smokedGlass.text, opacity: 0.85, ...smokedGlass.textShadow },
    wellTextAccent: { ...materialTypography.labelSmall, color: smokedGlass.text, ...smokedGlass.textShadow },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...materialTypography.labelMedium, textAlign: 'center', color: colors.onSurfaceVariant },
    switchTextAccent: { ...materialTypography.labelSmall, color: accentDeep },
  });
}
