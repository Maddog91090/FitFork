import { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../lib/targets';

export default function HomeScreen() {
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    let cancelled = false;

    (async () => {
      try {
        const [profile, trainingProfile] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
        ]);

        if (cancelled) return;

        if (!profile || !trainingProfile) {
          router.replace('/onboarding');
          return;
        }

        setMacros(computeTargetsFromProfile(profile, trainingProfile));
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
        }
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, session]);

  if (loading || !session || checkingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Connecté : {session.user.email}</Text>
      {loadError && <Text style={{ color: 'red' }}>{loadError}</Text>}
      {macros && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text>Calories cibles : {macros.calories} kcal</Text>
          <Text>Protéines : {macros.proteinG} g</Text>
          <Text>Lipides : {macros.fatG} g</Text>
          <Text>Glucides : {macros.carbsG} g</Text>
        </View>
      )}
      <View style={{ marginTop: 16 }}>
        <Button title="Se déconnecter" onPress={signOut} />
      </View>
    </View>
  );
}
