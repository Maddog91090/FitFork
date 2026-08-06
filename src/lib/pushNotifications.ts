import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export type NotificationStatus = { enabled: boolean; canAskAgain: boolean };

export async function getNotificationStatus(userId: string): Promise<NotificationStatus> {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();

  const { data } = await supabase.from('push_tokens').select('user_id').eq('user_id', userId).maybeSingle();

  return { enabled: granted && data !== null, canAskAgain };
}

export async function enableNotifications(userId: string): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
  if (error) throw error;

  return true;
}

export async function disableNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').delete().eq('user_id', userId);
  if (error) throw error;
}
