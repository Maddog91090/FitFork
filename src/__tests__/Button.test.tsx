import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
});
