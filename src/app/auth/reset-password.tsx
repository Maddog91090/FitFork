import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { translateAuthError } from '../../lib/authErrors';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import {
  centeredContent,
  spacing,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../../theme/tokens';

export default function ResetPasswordScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
      return;
    }
    router.replace('/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.brand}>Nouveau mot de passe</Text>

        <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
        <TextField label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} domain="neutral" />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bgBase },
    content: { ...centeredContent },
    brand: { ...typography.display, textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.xl },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  });
}
