import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import WeightLogScreen from '../app/weight-log';
import { useAuth } from '../lib/auth-context';
import { fetchRecentWeightLogs } from '../lib/weightLogData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/weightLogData', () => ({
  logWeight: jest.fn(),
  fetchRecentWeightLogs: jest.fn(),
}));

jest.mock('../lib/progressTracking', () => ({
  calculateWeeklyTrendPercent: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('WeightLogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (fetchRecentWeightLogs as jest.Mock).mockResolvedValue([]);
  });

  it('shows the empty-history icon when there is no weight history yet', async () => {
    const { getByTestId } = await render(<WeightLogScreen />);
    await waitFor(() => expect(getByTestId('empty-state-icon').props.name).toBe('monitor-weight'));
  });
});
