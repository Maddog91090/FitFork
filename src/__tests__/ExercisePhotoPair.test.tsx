import React from 'react';
import { render } from '@testing-library/react-native';
import { ExercisePhotoPair } from '../components/ui/ExercisePhotoPair';

// uri sources, not numeric require()-style ids: expo-image's asset pipeline
// resolves numeric mocks to an identical placeholder object regardless of
// input, which would make the two images indistinguishable here.
const START = { uri: 'https://example.com/start.jpg' };
const END = { uri: 'https://example.com/end.jpg' };

describe('ExercisePhotoPair', () => {
  it('renders both photos with the given sources', async () => {
    const { getByTestId } = await render(<ExercisePhotoPair imageStart={START} imageEnd={END} />);

    // expo-image normalizes a single source into a one-element source list.
    expect(getByTestId('exercise-photo-start').props.source).toEqual([START]);
    expect(getByTestId('exercise-photo-end').props.source).toEqual([END]);
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
