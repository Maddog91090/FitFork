import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../app/onboarding';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/profile', () => ({
  upsertProfile: jest.fn(),
  upsertTrainingProfile: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

async function fillStep1(getByText: any, getByTestId: any) {
  await fireEvent.press(getByText('Homme'));
  await fireEvent.changeText(getByTestId('age-input'), '28');
  await fireEvent.changeText(getByTestId('height-input'), '178');
  await fireEvent.changeText(getByTestId('weight-input'), '75');
}

async function fillStep2(getByText: any) {
  await fireEvent.press(getByText('Modérée'));
  await fireEvent.press(getByText('Maintien'));
}

async function fillStep3(getByText: any, getByTestId: any) {
  await fireEvent.changeText(getByTestId('days-input'), '4');
  await fireEvent.press(getByText('Intermédiaire'));
  await fireEvent.press(getByText('Salle complète'));
}

describe('OnboardingScreen wizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1' } },
      loading: false,
    });
    (upsertProfile as jest.Mock).mockResolvedValue(undefined);
    (upsertTrainingProfile as jest.Mock).mockResolvedValue(undefined);
  });

  it('blocks advancing from step 1 when fields are missing', async () => {
    const { getByText, queryByText } = await render(<OnboardingScreen />);
    await fireEvent.press(getByText('Continuer'));
    expect(queryByText('Ton activité')).toBeNull();
    expect(getByText('Merci de choisir un sexe.')).toBeTruthy();
  });

  it('advances through all steps, shows the recap, and submits', async () => {
    const { getByText, getByTestId } = await render(<OnboardingScreen />);

    await fillStep1(getByText, getByTestId);
    await fireEvent.press(getByText('Continuer'));
    expect(getByText('Ton activité')).toBeTruthy();

    await fillStep2(getByText);
    await fireEvent.press(getByText('Continuer'));
    expect(getByText('Ton entraînement')).toBeTruthy();

    await fillStep3(getByText, getByTestId);
    await fireEvent.press(getByText('Continuer'));
    expect(getByText('Récapitulatif')).toBeTruthy();
    expect(getByText('178 cm')).toBeTruthy();

    await fireEvent.press(getByText('Valider'));

    await waitFor(() =>
      expect(upsertProfile).toHaveBeenCalledWith('user-1', {
        sex: 'male',
        age: 28,
        heightCm: 178,
        weightKg: 75,
        activityLevel: 'moderate',
        goal: 'maintain',
      })
    );
    expect(upsertTrainingProfile).toHaveBeenCalledWith('user-1', {
      daysPerWeek: 4,
      experienceLevel: 'intermediate',
      equipment: 'full_gym',
    });
  });

  it('returns to the previous step via the back link', async () => {
    const { getByText, getByTestId } = await render(<OnboardingScreen />);
    await fillStep1(getByText, getByTestId);
    await fireEvent.press(getByText('Continuer'));
    expect(getByText('Ton activité')).toBeTruthy();

    await fireEvent.press(getByText('← Retour'));
    expect(getByText('Ton profil')).toBeTruthy();
  });
});
