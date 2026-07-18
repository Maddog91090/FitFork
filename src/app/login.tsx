import { useEffect, useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.replace('/home');
    }
  }, [session]);

  const handleSubmit = async () => {
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    }
  };

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
      <Button title="Se connecter" onPress={handleSubmit} />
      <Link href="/signup" style={{ marginTop: 16, textAlign: 'center' }}>
        Pas de compte ? Créer un compte
      </Link>
    </View>
  );
}
