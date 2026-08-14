import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { lightColors } from '../theme/tokens';
import { ChoiceGroup } from '../components/ChoiceGroup';

const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('ChoiceGroup', () => {
  it('renders every option and calls onChange with the pressed value', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(<ChoiceGroup options={OPTIONS} value="a" onChange={onChange} />);
    fireEvent.press(getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('defaults the selected pill to the progress domain color', async () => {
    const { getByTestId } = await render(<ChoiceGroup options={OPTIONS} value="a" onChange={() => {}} />);
    const style = StyleSheet.flatten(getByTestId('choice-pill-a').props.style);
    expect(style.backgroundColor).toBe(lightColors.domainProgress);
  });

  it('uses the given domain color for the selected pill', async () => {
    const { getByTestId } = await render(
      <ChoiceGroup options={OPTIONS} value="a" onChange={() => {}} domain="sport" />
    );
    const style = StyleSheet.flatten(getByTestId('choice-pill-a').props.style);
    expect(style.backgroundColor).toBe(lightColors.domainSport);
  });
});
