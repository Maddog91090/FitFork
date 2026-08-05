// src/__tests__/friends-screen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FriendsScreen from '../app/friends';
import { useAuth } from '../lib/auth-context';
import { fetchMyFriends, createFriendInvite, redeemFriendInvite, removeFriendship } from '../lib/friendsData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/friendsData', () => ({
  fetchMyFriends: jest.fn(),
  createFriendInvite: jest.fn(),
  redeemFriendInvite: jest.fn(),
  removeFriendship: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('FriendsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1' } },
      loading: false,
    });
  });

  it('lists existing friends and lets you remove one', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([
      { friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' },
    ]);
    (removeFriendship as jest.Mock).mockResolvedValue(undefined);

    const { findByText, getByText, queryByText } = await render(<FriendsScreen />);

    await findByText('a@example.com');
    await fireEvent.press(getByText('Retirer'));

    await waitFor(() => expect(removeFriendship).toHaveBeenCalledWith('friend-a'));
    expect(queryByText('a@example.com')).toBeNull();
  });

  it('shows an empty state with no friends yet', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([]);
    const { findByText } = await render(<FriendsScreen />);
    expect(await findByText("Tu n'as pas encore d'ami d'entraînement.")).toBeTruthy();
  });

  it('generates an invite code and shows share/copy actions', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([]);
    (createFriendInvite as jest.Mock).mockResolvedValue({ code: 'ABCD2345', expiresAt: '2026-08-12T00:00:00Z' });

    const { findByText, getByText } = await render(<FriendsScreen />);
    await findByText("Tu n'as pas encore d'ami d'entraînement.");

    await fireEvent.press(getByText('Générer un code'));

    expect(await findByText('ABCD2345')).toBeTruthy();
    expect(getByText('Partager')).toBeTruthy();
    expect(getByText('Copier')).toBeTruthy();
  });

  it('redeems a code and refreshes the friend list', async () => {
    (fetchMyFriends as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { friendUserId: 'friend-b', friendEmail: 'b@example.com', friendedAt: '2026-08-05T00:00:00Z' },
      ]);
    (redeemFriendInvite as jest.Mock).mockResolvedValue({ friendUserId: 'friend-b' });

    const { findByText, getByText, getByTestId } = await render(<FriendsScreen />);
    await findByText("Tu n'as pas encore d'ami d'entraînement.");

    await fireEvent.changeText(getByTestId('redeem-code-input'), 'WXYZ6789');
    await fireEvent.press(getByText('Valider'));

    await waitFor(() => expect(redeemFriendInvite).toHaveBeenCalledWith('WXYZ6789'));
    expect(await findByText('b@example.com')).toBeTruthy();
  });

  it('shows an inline error when a code is invalid', async () => {
    (fetchMyFriends as jest.Mock).mockResolvedValue([]);
    (redeemFriendInvite as jest.Mock).mockRejectedValue(new Error('Code invalide ou expiré'));

    const { findByText, getByText, getByTestId } = await render(<FriendsScreen />);
    await findByText("Tu n'as pas encore d'ami d'entraînement.");

    await fireEvent.changeText(getByTestId('redeem-code-input'), 'BADCODE1');
    await fireEvent.press(getByText('Valider'));

    expect(await findByText('Code invalide ou expiré')).toBeTruthy();
  });
});
