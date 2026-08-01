import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { springConfig, useReducedMotion } from '../theme/motion';

describe('springConfig', () => {
  it('converts damping ratio 1.0 / response 0.15s into the matching stiffness and damping', () => {
    const { mass, stiffness, damping } = springConfig(1.0, 0.15);
    expect(mass).toBe(1);
    expect(stiffness).toBeCloseTo(1754.6, 1);
    expect(damping).toBeCloseTo(83.78, 1);
  });

  it('a shorter response produces a stiffer (snappier) spring at the same damping ratio', () => {
    const snappy = springConfig(1.0, 0.15);
    const gentle = springConfig(1.0, 0.3);
    expect(snappy.stiffness).toBeGreaterThan(gentle.stiffness);
  });

  it('a lower damping ratio produces less damping at the same stiffness (more bounce)', () => {
    const critical = springConfig(1.0, 0.3);
    const bouncy = springConfig(0.8, 0.3);
    expect(bouncy.stiffness).toBeCloseTo(critical.stiffness, 5);
    expect(bouncy.damping).toBeLessThan(critical.damping);
  });
});

describe('useReducedMotion', () => {
  it('reflects the current AccessibilityInfo reduce-motion setting', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });
});
