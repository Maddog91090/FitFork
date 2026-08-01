import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EmptyState } from '../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title, message and fires the action', async () => {
    const onAction = jest.fn();
    const { getByText } = await render(
      <EmptyState
        icon={<Text>icon</Text>}
        title="Aucun plan pour l'instant"
        message="Génère ton premier plan."
        actionLabel="Générer un plan"
        onAction={onAction}
      />
    );
    expect(getByText("Aucun plan pour l'instant")).toBeTruthy();
    fireEvent.press(getByText('Générer un plan'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
