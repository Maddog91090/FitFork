import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../app/onboarding';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';
import { enableNotifications } from '../lib/pushNotifications';
import { router } from 'expo-router';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/profile', () => ({
  upsertProfile: jest.fn(),
  upsertTrainingProfile: jest.fn(),
}));

jest.mock('../lib/pushNotifications', () => ({
  enableNotifications: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

async function fillAndSubmitWizard(getByTestId: any, getByText: any) {
  await fireEvent.press(getByText('Homme'));
  await fireEvent.changeText(getByTestId('age-input'), '30');
  await fireEvent.changeText(getByTestId('height-input'), '180');
  await fireEvent.changeText(getByTestId('weight-input'), '80');
  await fireEvent.press(getByText('Continuer'));
  await fireEvent.press(getByText('Sédentaire'));
  await fireEvent.press(getByText('Maintien'));
  await fireEvent.press(getByText('Continuer'));
  await fireEvent.changeText(getByTestId('days-input'), '3');
  await fireEvent.press(getByText('Débutant'));
  await fireEvent.press(getByText('Poids du corps'));
  await fireEvent.press(getByText('Continuer'));
  await fireEvent.press(getByText('Valider'));
}

describe('OnboardingScreen notification prompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (upsertProfile as jest.Mock).mockResolvedValue(undefined);
    (upsertTrainingProfile as jest.Mock).mockResolvedValue(undefined);
  });

  it('shows the notification prompt after successful submit, before navigating home', async () => {
    const { getByTestId, getByText, findByText } = await render(<OnboardingScreen />);

    await fillAndSubmitWizard(getByTestId, getByText);

    expect(await findByText('Activer les notifications ?')).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('registers for notifications and navigates home on "Activer les notifications"', async () => {
    (enableNotifications as jest.Mock).mockResolvedValue(true);
    const { getByTestId, getByText, findByText } = await render(<OnboardingScreen />);

    await fillAndSubmitWizard(getByTestId, getByText);
    await findByText('Activer les notifications ?');
    await fireEvent.press(getByText('Activer les notifications'));

    await waitFor(() => expect(enableNotifications).toHaveBeenCalledWith('user-1'));
    expect(router.replace).toHaveBeenCalledWith('/home');
  });

  it('navigates home without registering on "Plus tard"', async () => {
    const { getByTestId, getByText, findByText } = await render(<OnboardingScreen />);

    await fillAndSubmitWizard(getByTestId, getByText);
    await findByText('Activer les notifications ?');
    await fireEvent.press(getByText('Plus tard'));

    expect(enableNotifications).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/home');
  });
});
