import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseVisualModal } from '../components/ExerciseVisualModal';

describe('ExerciseVisualModal', () => {
  it('shows the movement label and Départ/Fin captions for a known exercise', async () => {
    const { getByText } = await render(
      <ExerciseVisualModal visible exerciseName="Squats" onClose={() => {}} />
    );
    expect(getByText('Squat')).toBeTruthy();
    expect(getByText('Départ')).toBeTruthy();
    expect(getByText('Fin')).toBeTruthy();
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <ExerciseVisualModal visible exerciseName="Squats" onClose={onClose} />
    );
    fireEvent.press(getByText('Fermer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for an exercise name with no known visual', async () => {
    const { queryByText } = await render(
      <ExerciseVisualModal visible exerciseName="Not a real exercise" onClose={() => {}} />
    );
    expect(queryByText('Fermer')).toBeNull();
  });

  it('renders nothing when exerciseName is null', async () => {
    const { queryByText } = await render(<ExerciseVisualModal visible exerciseName={null} onClose={() => {}} />);
    expect(queryByText('Fermer')).toBeNull();
  });
});
