import {
  createFriendInvite,
  redeemFriendInvite,
  fetchMyFriends,
  removeFriendship,
} from '../lib/friendsData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createFriendInvite', () => {
  it('calls the create_friend_invite RPC and maps the result', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ code: 'ABCD2345', expires_at: '2026-08-12T00:00:00Z' }],
      error: null,
    });

    const result = await createFriendInvite();

    expect(supabase.rpc).toHaveBeenCalledWith('create_friend_invite');
    expect(result).toEqual({ code: 'ABCD2345', expiresAt: '2026-08-12T00:00:00Z' });
  });

  it('throws on a Supabase error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('boom') });
    await expect(createFriendInvite()).rejects.toThrow('boom');
  });
});

describe('redeemFriendInvite', () => {
  it('calls the redeem_friend_invite RPC with the code and maps the result', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ friend_user_id: 'user-1' }],
      error: null,
    });

    const result = await redeemFriendInvite('ABCD2345');

    expect(supabase.rpc).toHaveBeenCalledWith('redeem_friend_invite', { invite_code: 'ABCD2345' });
    expect(result).toEqual({ friendUserId: 'user-1' });
  });

  it('throws on a Supabase error (e.g. invalid code)', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('Code invalide ou expiré') });
    await expect(redeemFriendInvite('bad')).rejects.toThrow('Code invalide ou expiré');
  });
});

describe('fetchMyFriends', () => {
  it('calls list_my_friends and maps rows to Friend', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        { friend_user_id: 'user-1', friend_email: 'a@example.com', friended_at: '2026-08-01T00:00:00Z' },
      ],
      error: null,
    });

    const result = await fetchMyFriends();

    expect(supabase.rpc).toHaveBeenCalledWith('list_my_friends');
    expect(result).toEqual([
      { friendUserId: 'user-1', friendEmail: 'a@example.com', friendedAt: '2026-08-01T00:00:00Z' },
    ]);
  });

  it('throws on a Supabase error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('boom') });
    await expect(fetchMyFriends()).rejects.toThrow('boom');
  });
});

describe('removeFriendship', () => {
  it('deletes the friendship row matching the given friend', async () => {
    const or = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ or });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await removeFriendship('user-2');

    expect(supabase.from).toHaveBeenCalledWith('friendships');
    expect(or).toHaveBeenCalledWith('user_id_a.eq.user-2,user_id_b.eq.user-2');
  });

  it('throws on a Supabase error', async () => {
    const or = jest.fn().mockResolvedValue({ error: new Error('boom') });
    const del = jest.fn().mockReturnValue({ or });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await expect(removeFriendship('user-2')).rejects.toThrow('boom');
  });
});
