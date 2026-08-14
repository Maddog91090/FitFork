import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { lightColors } from '../theme/tokens';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders the title', async () => {
    const { getByText } = await render(<Button title="Continuer" onPress={() => {}} />);
    expect(getByText('Continuer')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Continuer" onPress={onPress} />);
    fireEvent.press(getByText('Continuer'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Continuer" onPress={onPress} disabled />);
    fireEvent.press(getByText('Continuer'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner and hides the label when loading', async () => {
    const { queryByText } = await render(<Button title="Continuer" onPress={() => {}} loading />);
    expect(queryByText('Continuer')).toBeNull();
  });

  it('fills a primary button with its domain color', async () => {
    const { getByTestId } = await render(
      <Button title="Continuer" onPress={() => {}} domain="sport" />
    );
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightColors.domainSport);
  });

  it('defaults to the progress domain when none is given', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} />);
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightColors.domainProgress);
  });

  it('renders a clay overlay for the primary variant', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} />);
    expect(getByTestId('button-clay-overlay')).toBeTruthy();
  });

  it('does not render a clay overlay for the secondary variant', async () => {
    const { queryByTestId } = await render(
      <Button title="Continuer" onPress={() => {}} variant="secondary" />
    );
    expect(queryByTestId('button-clay-overlay')).toBeNull();
  });
});
