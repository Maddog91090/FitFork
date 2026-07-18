import { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function HomeScreen() {
  const { session, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  if (loading || !session) {
    return null;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Connecté : {session.user.email}</Text>
      <Button title="Se déconnecter" onPress={signOut} />
    </View>
  );
}
