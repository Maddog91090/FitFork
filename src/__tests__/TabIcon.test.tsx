import React from 'react';
import { render } from '@testing-library/react-native';
import { TabIcon, type TabIconName } from '../components/icons/TabIcon';
import { lightColors } from '../theme/tokens';

const NAMES: TabIconName[] = ['home', 'plan', 'recipes', 'workout', 'grocery', 'weight'];

describe('TabIcon', () => {
  it.each(NAMES)('renders an icon for %s', async (name) => {
    const { getByTestId } = await render(<TabIcon name={name} focused={false} />);
    expect(getByTestId('tab-icon-image')).toBeTruthy();
  });

  it('tints with the home domain color when focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused />);
    expect(getByTestId('tab-icon-image').props.color).toBe(lightColors.domainNeutral);
  });

  it('tints with textSecondary when not focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused={false} />);
    expect(getByTestId('tab-icon-image').props.color).toBe(lightColors.textSecondary);
  });
});
