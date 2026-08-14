// This suite intentionally exercises the REAL @expo/vector-icons MaterialIcons
// component — specifically that it folds the `color` prop into `.props.style`
// rather than keeping it as a top-level prop. __mocks__/@expo/vector-icons.js
// (a bare pass-through mock used by other screen tests) is auto-applied to
// every test file, so opt this one back out to restore real behavior.
jest.unmock('@expo/vector-icons');

import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

// Hoisted by Babel to the top of the file — must live in its own file so the
// existing light-scheme tests in TabIcon.test.tsx are unaffected.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'dark',
}));

import { TabIcon } from '../components/icons/TabIcon';
import { darkMaterialColors } from '../theme/tokens';

describe('TabIcon (dark scheme)', () => {
  it('tints with the dark primary color when focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused />);
    const element = getByTestId('tab-icon-image');
    const flattenedStyle = StyleSheet.flatten(element.props.style);
    expect(flattenedStyle.color).toBe(darkMaterialColors.primary);
  });
});
