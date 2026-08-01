import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../components/ui/Card';

jest.mock('expo-glass-effect', () => ({
  GlassView: jest.fn(({ children }) => children),
  isGlassEffectAPIAvailable: jest.fn().mockReturnValue(false),
}));

describe('Card', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <Card>
        <Text>Contenu</Text>
      </Card>
    );
    expect(getByText('Contenu')).toBeTruthy();
  });

  it('renders its children when variant is glass', async () => {
    const { getByText } = await render(
      <Card variant="glass">
        <Text>Contenu verre</Text>
      </Card>
    );
    expect(getByText('Contenu verre')).toBeTruthy();
  });
});
