import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
      return;
    }
    setConfirmationSent(true);
  };

  if (confirmationSent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.</Text>
        <Link href="/login" style={{ marginTop: 16, textAlign: 'center' }}>
          Aller à la connexion
        </Link>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      {error && <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>}
      <Button title="Créer un compte" onPress={handleSubmit} />
      <Link href="/login" style={{ marginTop: 16, textAlign: 'center' }}>
        Déjà un compte ? Se connecter
      </Link>
    </View>
  );
}
