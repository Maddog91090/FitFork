import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../components/ui/Card';

describe('Card', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <Card>
        <Text>Contenu</Text>
      </Card>
    );
    expect(getByText('Contenu')).toBeTruthy();
  });
});
