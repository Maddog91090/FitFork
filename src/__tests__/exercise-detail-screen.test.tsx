import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseDetailScreen from '../app/exercise/[id]';
import { useLocalSearchParams } from 'expo-router';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

describe('ExerciseDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'squat' });
  });

  it('renders the exercise once found', async () => {
    const { findByText } = await render(<ExerciseDetailScreen />);
    expect(await findByText('Squat')).toBeTruthy();
  });
});
