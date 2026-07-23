import React from 'react';
import { render } from '@testing-library/react-native';
import { KgIcon } from '../components/icons/KgIcon';

describe('KgIcon', () => {
  it('renders the kg label', async () => {
    const { getByText } = await render(<KgIcon color="#DC2626" focused={false} />);
    expect(getByText('kg')).toBeTruthy();
  });
});
