import React from 'react';
import { render } from '@testing-library/react-native';
import { ExercisePhotoPair } from '../components/ui/ExercisePhotoPair';

const START = 1;
const END = 2;

describe('ExercisePhotoPair', () => {
  it('renders both photos with the given sources', async () => {
    const { getByTestId } = await render(<ExercisePhotoPair imageStart={START} imageEnd={END} />);

    expect(getByTestId('exercise-photo-start').props.source).toBe(START);
    expect(getByTestId('exercise-photo-end').props.source).toBe(END);
  });

  it('shows the position labels by default', async () => {
    const { getByText } = await render(<ExercisePhotoPair imageStart={START} imageEnd={END} />);

    expect(getByText('Position de départ')).toBeTruthy();
    expect(getByText('Position finale')).toBeTruthy();
  });

  it('hides the position labels when showLabels is false', async () => {
    const { queryByText } = await render(
      <ExercisePhotoPair imageStart={START} imageEnd={END} showLabels={false} />
    );

    expect(queryByText('Position de départ')).toBeNull();
    expect(queryByText('Position finale')).toBeNull();
  });
});
