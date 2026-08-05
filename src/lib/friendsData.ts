import { supabase } from './supabase';

export type Friend = {
  friendUserId: string;
  friendEmail: string;
  friendedAt: string;
};

export type FriendInvite = {
  code: string;
  expiresAt: string;
};

function firstRow<T>(data: T[] | T | null): T {
  return Array.isArray(data) ? data[0] : (data as T);
}

export async function createFriendInvite(): Promise<FriendInvite> {
  const { data, error } = await supabase.rpc('create_friend_invite');
  if (error) throw error;
  const row = firstRow<any>(data);
  return { code: row.code, expiresAt: row.expires_at };
}

export async function redeemFriendInvite(code: string): Promise<{ friendUserId: string }> {
  const { data, error } = await supabase.rpc('redeem_friend_invite', { invite_code: code });
  if (error) throw error;
  const row = firstRow<any>(data);
  return { friendUserId: row.friend_user_id };
}

export async function fetchMyFriends(): Promise<Friend[]> {
  const { data, error } = await supabase.rpc('list_my_friends');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    friendUserId: row.friend_user_id,
    friendEmail: row.friend_email,
    friendedAt: row.friended_at,
  }));
}

export async function removeFriendship(friendUserId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friendship', { friend_user_id: friendUserId });
  if (error) throw error;
}
