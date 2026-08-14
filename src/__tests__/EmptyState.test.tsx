import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, StyleSheet } from 'react-native';
import { EmptyState } from '../components/ui/EmptyState';
import { lightTertiaryByDomain } from '../theme/tokens';

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

  it('forwards its domain to the action button', async () => {
    const onAction = jest.fn();
    const { getByTestId } = await render(
      <EmptyState
        title="Aucun plan pour l'instant"
        message="Génère ton premier plan."
        actionLabel="Générer un plan"
        onAction={onAction}
        domain="nutrition"
      />
    );
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightTertiaryByDomain.nutrition.tertiary);
  });
});
