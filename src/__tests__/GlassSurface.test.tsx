import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AccessibilityInfo } from 'react-native';
import * as expoGlassEffect from 'expo-glass-effect';
import { GlassSurface } from '../components/ui/GlassSurface';

jest.mock('expo-glass-effect', () => ({
  GlassView: jest.fn(({ children }) => children),
  isGlassEffectAPIAvailable: jest.fn(),
}));

describe('GlassSurface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
  });

  it('renders the fallback View when the glass API is unavailable', async () => {
    (expoGlassEffect.isGlassEffectAPIAvailable as jest.Mock).mockReturnValue(false);
    const { getByText } = await render(
      <GlassSurface>
        <Text>content</Text>
      </GlassSurface>
    );
    expect(getByText('content')).toBeTruthy();
    expect(expoGlassEffect.GlassView).not.toHaveBeenCalled();
  });

  it('renders GlassView when the glass API is available and transparency is not reduced', async () => {
    (expoGlassEffect.isGlassEffectAPIAvailable as jest.Mock).mockReturnValue(true);
    const { getByText } = await render(
      <GlassSurface>
        <Text>content</Text>
      </GlassSurface>
    );
    expect(getByText('content')).toBeTruthy();
    // Starts on the conservative fallback until the async accessibility check resolves.
    await waitFor(() => expect(expoGlassEffect.GlassView).toHaveBeenCalled());
  });

  it('falls back to the solid View when the glass API is available but reduce-transparency is on', async () => {
    (expoGlassEffect.isGlassEffectAPIAvailable as jest.Mock).mockReturnValue(true);
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);
    const { getByText, findByText } = await render(
      <GlassSurface>
        <Text>content</Text>
      </GlassSurface>
    );
    await findByText('content');
    expect(getByText('content')).toBeTruthy();
    expect(expoGlassEffect.GlassView).not.toHaveBeenCalled();
  });
});
