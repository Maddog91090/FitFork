import React from 'react';
import { render } from '@testing-library/react-native';
import { TabIcon, type TabIconName } from '../components/icons/TabIcon';

const NAMES: TabIconName[] = ['home', 'plan', 'recipes', 'workout', 'grocery', 'weight'];

describe('TabIcon', () => {
  it.each(NAMES)('renders an image for %s', async (name) => {
    const { getByTestId } = await render(<TabIcon name={name} focused={false} />);
    expect(getByTestId('tab-icon-image')).toBeTruthy();
  });

  it('is fully opaque when focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused />);
    expect(getByTestId('tab-icon-image').props.style.opacity).toBe(1);
  });

  it('is dimmed when not focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused={false} />);
    expect(getByTestId('tab-icon-image').props.style.opacity).toBeLessThan(1);
  });
});
