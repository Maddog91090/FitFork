import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

// Hoisted by Babel to the top of the file — must live in its own file so the
// existing light-scheme tests in Button.test.tsx are unaffected.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'dark',
}));

import { darkTertiaryByDomain } from '../theme/tokens';
import { Button } from '../components/ui/Button';

describe('Button (dark scheme)', () => {
  it('fills a primary button with the dark domain tertiary color', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} domain="progress" />);
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(darkTertiaryByDomain.progress.tertiary);
  });
});
