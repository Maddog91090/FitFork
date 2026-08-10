import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { BackLink } from '../components/ui/BackLink';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

describe('BackLink', () => {
  it('calls router.back() when pressed', async () => {
    const { getByText } = await render(<BackLink />);
    fireEvent.press(getByText('‹ Retour'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
