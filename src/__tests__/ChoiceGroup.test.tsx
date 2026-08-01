import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChoiceGroup } from '../components/ChoiceGroup';

describe('ChoiceGroup', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders every option label', async () => {
    const { getByText } = await render(
      <ChoiceGroup options={options} value={null} onChange={() => {}} />
    );
    expect(getByText('Option A')).toBeTruthy();
    expect(getByText('Option B')).toBeTruthy();
  });

  it('calls onChange with the pressed option value', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(
      <ChoiceGroup options={options} value="a" onChange={onChange} />
    );
    fireEvent.press(getByText('Option B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
