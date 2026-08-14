import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the system's Reduce Motion (iOS) / Remove animations (Android)
 * setting, live. Components that reach for `motion.spring.*` check this
 * first and fall back to an instant/near-instant state change instead of a
 * bouncy spring — see `.claude/skills/fitfork-design/SKILL.md`'s Motion
 * section, which calls this "not optional."
 */
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
