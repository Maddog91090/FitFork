import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(session ? '/home' : '/login');
    }
  }, [loading, session]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }}>
      <ActivityIndicator />
    </View>
  );
}
