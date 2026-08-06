import {
  getNotificationStatus,
  enableNotifications,
  disableNotifications,
} from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'test-project-id' } } } },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getNotificationStatus', () => {
  it('is enabled only when permission is granted AND a token row exists', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true, canAskAgain: true });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getNotificationStatus('user-1');

    expect(result).toEqual({ enabled: true, canAskAgain: true });
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('is disabled when permission is granted but no token row exists', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true, canAskAgain: true });
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getNotificationStatus('user-1');

    expect(result.enabled).toBe(false);
  });

  it('is disabled when permission is not granted, even with a token row', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false, canAskAgain: true });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getNotificationStatus('user-1');

    expect(result.enabled).toBe(false);
  });
});

describe('enableNotifications', () => {
  it('requests permission, fetches an Expo push token, and upserts it', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true, canAskAgain: true });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    const result = await enableNotifications('user-1');

    expect(result).toBe(true);
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'test-project-id' });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', token: 'ExponentPushToken[abc]' })
    );
  });

  it('returns false without fetching a token when permission is denied', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false, canAskAgain: false });

    const result = await enableNotifications('user-1');

    expect(result).toBe(false);
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('disableNotifications', () => {
  it('deletes the push token row for the user', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await disableNotifications('user-1');

    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
