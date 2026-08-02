import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function springConfig(dampingRatio: number, response: number, mass = 1) {
  const stiffness = ((2 * Math.PI) / response) ** 2 * mass;
  const damping = 2 * dampingRatio * Math.sqrt(stiffness * mass);
  return { mass, stiffness, damping };
}

export const motion = {
  spring: {
    press: springConfig(1.0, 0.15),
    settle: springConfig(1.0, 0.3),
  },
} as const;

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
