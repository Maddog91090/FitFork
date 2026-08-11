import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { TabIcon, type TabIconName } from '../components/icons/TabIcon';
import { lightMaterialColors } from '../theme/tokens';

const NAMES: TabIconName[] = ['home', 'plan', 'recipes', 'workout', 'grocery', 'weight'];

describe('TabIcon', () => {
  it.each(NAMES)('renders an icon for %s', async (name) => {
    const { getByTestId } = await render(<TabIcon name={name} focused={false} />);
    expect(getByTestId('tab-icon-image')).toBeTruthy();
  });

  it('tints with the primary color when focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused />);
    const element = getByTestId('tab-icon-image');
    const flattenedStyle = StyleSheet.flatten(element.props.style);
    expect(flattenedStyle.color).toBe(lightMaterialColors.primary);
  });

  it('tints with onSurfaceVariant when not focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused={false} />);
    const element = getByTestId('tab-icon-image');
    const flattenedStyle = StyleSheet.flatten(element.props.style);
    expect(flattenedStyle.color).toBe(lightMaterialColors.onSurfaceVariant);
  });
});
