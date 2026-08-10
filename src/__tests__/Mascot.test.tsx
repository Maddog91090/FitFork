import React from 'react';
import { render } from '@testing-library/react-native';
import { Mascot, type MascotPose } from '../components/ui/Mascot';

const POSES: MascotPose[] = ['idle', 'celebrating'];

describe('Mascot', () => {
  it.each(POSES)('renders an image for the %s pose', async (pose) => {
    const { getByTestId } = await render(<Mascot pose={pose} />);
    expect(getByTestId('mascot-image')).toBeTruthy();
  });

  it('defaults to a size x size square when no style is given', async () => {
    const { getByTestId } = await render(<Mascot pose="idle" size={96} />);
    expect(getByTestId('mascot-image').props.style).toEqual({ width: 96, height: 96 });
  });

  it('lets an explicit style fully replace the default sizing', async () => {
    const { getByTestId } = await render(
      <Mascot pose="idle" style={{ width: '100%', aspectRatio: 1, maxHeight: 150 }} />
    );
    expect(getByTestId('mascot-image').props.style).toEqual({
      width: '100%',
      aspectRatio: 1,
      maxHeight: 150,
    });
  });
});
