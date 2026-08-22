import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Mascot } from '../components/ui/Mascot';

describe('Mascot', () => {
  it('renders the Dualo image at the requested size', async () => {
    const { getByTestId } = await render(<Mascot size={120} />);
    const image = getByTestId('mascot-image');
    const flatStyle = [].concat(image.props.style).reduce((acc, s) => ({ ...acc, ...s }), {});
    expect(flatStyle.width).toBe(120);
    expect(flatStyle.height).toBe(120);
  });

  it('is not pressable when no onPress is given', async () => {
    const { queryByTestId } = await render(<Mascot />);
    expect(queryByTestId('mascot-pressable')).toBeNull();
  });

  it('calls onPress and reacts when tapped', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<Mascot onPress={onPress} />);
    fireEvent.press(getByTestId('mascot-pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has an accessible role and label when pressable', async () => {
    const { getByTestId } = await render(<Mascot onPress={() => {}} />);
    const pressable = getByTestId('mascot-pressable');
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Dualo');
  });

  it('re-renders without crashing when celebrateTrigger changes', async () => {
    const { rerender } = await render(<Mascot celebrateTrigger={0} />);
    await rerender(<Mascot celebrateTrigger={1} />);
    await rerender(<Mascot celebrateTrigger={2} />);
  });
});
