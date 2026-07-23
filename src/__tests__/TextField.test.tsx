import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextField } from '../components/ui/TextField';

describe('TextField', () => {
  it('renders the label and value', async () => {
    const { getByText, getByDisplayValue } = await render(
      <TextField label="Âge" value="28" onChangeText={() => {}} />
    );
    expect(getByText('Âge')).toBeTruthy();
    expect(getByDisplayValue('28')).toBeTruthy();
  });

  it('calls onChangeText when typing', async () => {
    const onChangeText = jest.fn();
    const { getByTestId } = await render(
      <TextField label="Âge" value="" onChangeText={onChangeText} testID="age-input" />
    );
    fireEvent.changeText(getByTestId('age-input'), '29');
    expect(onChangeText).toHaveBeenCalledWith('29');
  });
});
