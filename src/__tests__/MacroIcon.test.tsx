import React from 'react';
import { render } from '@testing-library/react-native';
import { MacroIcon, type MacroIconName } from '../components/icons/MacroIcon';

const NAMES: MacroIconName[] = ['protein', 'fat', 'carbs'];

describe('MacroIcon', () => {
  it.each(NAMES)('renders an image for %s', async (name) => {
    const { getByTestId } = await render(<MacroIcon name={name} />);
    expect(getByTestId('macro-icon-image')).toBeTruthy();
  });

  it('defaults to a 20px square', async () => {
    const { getByTestId } = await render(<MacroIcon name="protein" />);
    expect(getByTestId('macro-icon-image').props.style).toEqual({ width: 20, height: 20 });
  });

  it('accepts a custom size', async () => {
    const { getByTestId } = await render(<MacroIcon name="protein" size={32} />);
    expect(getByTestId('macro-icon-image').props.style).toEqual({ width: 32, height: 32 });
  });
});
