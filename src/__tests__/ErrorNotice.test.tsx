import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorNotice } from '../components/ui/ErrorNotice';

describe('ErrorNotice', () => {
  it('renders the message and fires the retry action', async () => {
    const onRetry = jest.fn();
    const { getByText } = await render(
      <ErrorNotice message="Erreur de chargement du profil." onRetry={onRetry} />
    );
    expect(getByText('Erreur de chargement du profil.')).toBeTruthy();
    fireEvent.press(getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
