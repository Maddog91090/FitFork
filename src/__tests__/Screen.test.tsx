import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Screen } from '../components/ui/Screen';

describe('Screen', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <Screen>
        <Text>Contenu</Text>
      </Screen>
    );
    expect(getByText('Contenu')).toBeTruthy();
  });
});
