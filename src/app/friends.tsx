// src/app/friends.tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import {
  fetchMyFriends,
  createFriendInvite,
  redeemFriendInvite,
  removeFriendship,
  type Friend,
  type FriendInvite,
} from '../lib/friendsData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PressableScale } from '../components/ui/PressableScale';
import { TextField } from '../components/ui/TextField';
import {
  centeredContent,
  radius,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../theme/tokens';

export default function FriendsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [invite, setInvite] = useState<FriendInvite | null>(null);
  const [generating, setGenerating] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const list = await fetchMyFriends();
      setFriends(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleGenerateInvite = async () => {
    setGenerating(true);
    setInviteError(null);
    try {
      const result = await createFriendInvite();
      setInvite(result);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Erreur lors de la création du code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareInvite = async () => {
    if (!invite) return;
    await Share.share({
      message: `Rejoins-moi sur FitPro ! Utilise ce code pour devenir mon ami d'entraînement : ${invite.code}`,
    });
  };

  const handleCopyInvite = async () => {
    if (!invite) return;
    await Clipboard.setStringAsync(invite.code);
  };

  const handleRedeem = async () => {
    const trimmed = redeemCode.trim();
    if (!trimmed) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      await redeemFriendInvite(trimmed);
      setRedeemCode('');
      await load();
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Erreur lors de la validation du code.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleRemove = async (friendUserId: string) => {
    const previous = friends;
    setFriends(friends.filter((f) => f.friendUserId !== friendUserId));
    setRemovingId(friendUserId);
    setError(null);
    try {
      await removeFriendship(friendUserId);
    } catch (err) {
      setFriends(previous);
      setError(err instanceof Error ? err.message : "Erreur lors du retrait de l'ami.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.title}>Mes amis</Text>

      <Card style={styles.friendsCard}>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>Tu n'as pas encore d'ami d'entraînement.</Text>
        ) : (
          friends.map((friend, index) => (
            <View
              key={friend.friendUserId}
              style={[styles.friendRow, index === friends.length - 1 && styles.friendRowLast]}
            >
              <Text style={styles.friendEmail}>{friend.friendEmail}</Text>
              <PressableScale
                onPress={() => handleRemove(friend.friendUserId)}
                disabled={removingId === friend.friendUserId}
                accessibilityRole="button"
                accessibilityState={{ disabled: removingId === friend.friendUserId }}
                style={styles.removeTouchable}
              >
                <Text style={styles.removeLink}>Retirer</Text>
              </PressableScale>
            </View>
          ))
        )}
      </Card>

      <Text style={styles.sectionLabel}>Inviter quelqu'un</Text>
      <Card style={styles.inviteCard}>
        {invite ? (
          <>
            <Text style={styles.inviteCode}>{invite.code}</Text>
            <View style={styles.inviteActions}>
              <View style={styles.inviteActionButton}>
                <Button title="Partager" onPress={handleShareInvite} />
              </View>
              <View style={styles.inviteActionButton}>
                <Button title="Copier" variant="secondary" onPress={handleCopyInvite} />
              </View>
            </View>
          </>
        ) : (
          <Button title="Générer un code" onPress={handleGenerateInvite} loading={generating} />
        )}
        {inviteError && <Text style={styles.error}>{inviteError}</Text>}
      </Card>

      <Text style={styles.sectionLabel}>J'ai un code</Text>
      <Card style={styles.redeemCard}>
        <TextField
          value={redeemCode}
          onChangeText={setRedeemCode}
          placeholder="Code à 8 caractères"
          autoCapitalize="characters"
          testID="redeem-code-input"
        />
        {redeemError && <Text style={styles.error}>{redeemError}</Text>}
        <Button title="Valider" onPress={handleRedeem} loading={redeeming} />
      </Card>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
    sectionLabel: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    friendsCard: {},
    emptyText: { ...typography.body, color: colors.textSecondary },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    friendRowLast: { borderBottomWidth: 0 },
    friendEmail: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
    removeTouchable: {
      minHeight: state.minTouchSize,
      paddingHorizontal: spacing.sm,
      justifyContent: 'center',
    },
    removeLink: { ...typography.caption, color: colors.accentRedDeep },
    inviteCard: {},
    inviteCode: {
      ...typography.metric,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
      letterSpacing: 2,
    },
    inviteActions: { flexDirection: 'row', gap: spacing.sm },
    inviteActionButton: { flex: 1 },
    redeemCard: {},
  });
}
