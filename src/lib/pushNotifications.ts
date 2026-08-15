import Constants from 'expo-constants';
import { supabase } from './supabase';

export type NotificationStatus = { enabled: boolean; canAskAgain: boolean };

const isExpoGo = Constants.appOwnership === 'expo';

// expo-notifications' remote-notification plumbing was removed from Expo Go
// with SDK 53 — importing the module now throws there as a side effect of
// its own internal auto-registration. Load it lazily via `require` (Metro
// and Jest both resolve this correctly, unlike a dynamic `import()`, which
// Jest can't evaluate without --experimental-vm-modules), and only outside
// Expo Go, so nothing here touches it during a plain `expo start` session.
function getNotificationsModule(): typeof import('expo-notifications') {
  return require('expo-notifications');
}

export async function getNotificationStatus(userId: string): Promise<NotificationStatus> {
  if (isExpoGo) return { enabled: false, canAskAgain: false };

  const Notifications = getNotificationsModule();
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();

  const { data } = await supabase.from('push_tokens').select('user_id').eq('user_id', userId).maybeSingle();

  return { enabled: granted && data !== null, canAskAgain };
}

export async function enableNotifications(userId: string): Promise<boolean> {
  if (isExpoGo) return false;

  const Notifications = getNotificationsModule();
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
