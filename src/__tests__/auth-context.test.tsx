import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

function TestConsumer() {
  const { session, loading } = useAuth();
  if (loading) return <Text>loading</Text>;
  return <Text>{session ? `signed-in:${session.user.id}` : 'signed-out'}</Text>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it('resolves to signed-out when there is no existing session', async () => {
    (supabase.auth.getSession as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 0))
    );

    const { getByText } = await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(getByText('loading')).toBeTruthy());
    await waitFor(() => expect(getByText('signed-out')).toBeTruthy());
  });

  it('resolves to signed-in when a session already exists', async () => {
    const fakeSession = { user: { id: 'user-123' } } as any;
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: fakeSession } });

    const { getByText } = await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(getByText('signed-in:user-123')).toBeTruthy());
  });
});
