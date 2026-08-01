# Apple-Style Motion & Materials Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the app's shared UI kit (theme tokens, `Button`, `Card`, `TextField`, `EmptyState`, `ChoiceGroup`, and the tab bar chrome) so every screen inherits spring-based press feedback, a translucent glass tab bar, jump-free focus/selection transitions, and an optical type scale — without rewriting any individual screen.

**Architecture:** Two new pure token modules (`src/theme/motion.ts`, `src/theme/typography.ts`) supply spring configs / reduced-motion state and a small type scale. Five existing components adopt them via `react-native-reanimated` (already a dependency, previously unused). A new `GlassSurface` wrapper around `expo-glass-effect` gives `Card`'s new opt-in `glass` variant and the tab bar a real native-material background with an automatic solid fallback.

**Tech Stack:** React Native / Expo SDK 57, `react-native-reanimated` 4.5, `expo-glass-effect`, Jest + `@testing-library/react-native`, TypeScript strict mode.

## Global Constraints

- Light theme only — no `useColorScheme`/theme provider/dark tokens in this plan (explicitly deferred; see spec "Out of scope").
- No individual screen file (`src/app/**`, except `src/app/(tabs)/_layout.tsx` itself) is modified.
- `src/theme/typography.ts` has exactly three entries — `label`, `body`, `caption` — no unused larger "title/display" tier.
- `src/theme/motion.ts` has exactly two spring presets — `press` (damping 1.0, response 0.15s) and `settle` (damping 1.0, response 0.3s) — no bounce/momentum preset (nothing in scope is gesture/velocity-driven).
- `GlassSurface` gates on `isGlassEffectAPIAvailable()` (the crash-safety check `expo-glass-effect` recommends), not `isLiquidGlassAvailable()`, and additionally checks `AccessibilityInfo.isReduceTransparencyEnabled()`.
- `Card`'s `glass` variant is opt-in (`variant='glass'`); the default (`'solid'`, i.e. no `variant` prop) must render byte-for-byte the same styles as today for every existing call site.
- The tab bar's background becomes `GlassSurface` but stays in normal (non-`absolute`) layout flow — see spec's "Deliberate trade-off."
- Every task's Jest run must include the full suite (`npx jest`), not just the new/changed test file, to catch cross-component regressions.

---

### Task 1: Jest/Reanimated test infrastructure + motion tokens

**Files:**
- Modify: `jest.config.js`
- Create: `src/theme/motion.ts`
- Test: `src/__tests__/motion.test.ts`

**Interfaces:**
- Produces: `springConfig(dampingRatio: number, response: number, mass?: number): { mass: number; stiffness: number; damping: number }`, `motion.spring.press`, `motion.spring.settle` (both `{ mass, stiffness, damping }`), `useReducedMotion(): boolean`.

- [ ] **Step 1: Add the Reanimated Jest resolver**

Reanimated 4's native worklet runtime (`react-native-worklets`) crashes when any component using its hooks (`useSharedValue`, `useAnimatedStyle`, `withSpring`, etc.) is rendered under Jest — `TypeError: Cannot read properties of undefined (reading 'loadUnpackers')` — because Jest resolves the package's `.native.ts` files, which try to load a real native module. The package ships a resolver specifically to fix this. In `jest.config.js`, add `resolver` as a new top-level key (alongside the existing `preset`, `transformIgnorePatterns`, `moduleNameMapper`, `setupFiles`):

```js
module.exports = {
  preset: 'jest-expo',
  resolver: 'react-native-worklets/jest/resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|standard-navigation)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};
```

- [ ] **Step 2: Verify the resolver fix with a throwaway probe**

Create a temporary file `src/__tests__/_probe.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from 'react-native';

function Probe() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  scale.value = withSpring(0.97, { damping: 10, stiffness: 100 });
  return (
    <Animated.View style={style}>
      <Text>probe</Text>
    </Animated.View>
  );
}

describe('reanimated probe', () => {
  it('renders without throwing', async () => {
    const { getByText } = await render(<Probe />);
    expect(getByText('probe')).toBeTruthy();
  });
});
```

Run: `npx jest src/__tests__/_probe.test.tsx`
Expected: PASS. Then delete `src/__tests__/_probe.test.tsx` — it was only to confirm the resolver works, it is not part of the deliverable.

- [ ] **Step 3: Write the failing test for `springConfig`**

```ts
// src/__tests__/motion.test.ts
import { springConfig } from '../theme/motion';

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
```

Run: `npx jest src/__tests__/motion.test.ts`
Expected: FAIL with "Cannot find module '../theme/motion'".

- [ ] **Step 4: Implement `src/theme/motion.ts`**

```ts
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
```

- [ ] **Step 5: Run the `springConfig` tests to verify they pass**

Run: `npx jest src/__tests__/motion.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Write and run the `useReducedMotion` test**

Append to `src/__tests__/motion.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { springConfig, useReducedMotion } from '../theme/motion';

// ...existing springConfig describe block stays above...

describe('useReducedMotion', () => {
  it('reflects the current AccessibilityInfo reduce-motion setting', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });
});
```

(Merge the two `import` blocks at the top of the file into one set of imports rather than duplicating `springConfig`'s import line.)

Run: `npx jest src/__tests__/motion.test.ts`
Expected: PASS (4 tests total).

- [ ] **Step 7: Run the full suite and commit**

Run: `npx jest`
Expected: all suites pass (baseline was 112/112 before this task; this task adds 4 more).

```bash
git add jest.config.js src/theme/motion.ts src/__tests__/motion.test.ts
git commit -m "Add Reanimated Jest resolver and motion (spring) tokens"
```

---

### Task 2: Typography tokens

**Files:**
- Create: `src/theme/typography.ts`
- Test: `src/__tests__/typography.test.ts`

**Interfaces:**
- Produces: `typography.label`, `typography.body`, `typography.caption`, each `{ fontSize: number; lineHeight: number; letterSpacing: number }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/typography.test.ts
import { typography } from '../theme/typography';

describe('typography scale', () => {
  it('uses positive tracking on the small uppercase label and near-zero on body/caption', () => {
    expect(typography.label.letterSpacing).toBeGreaterThan(0);
    expect(typography.body.letterSpacing).toBe(0);
    expect(typography.caption.letterSpacing).toBeGreaterThan(0);
  });

  it('orders line-height with font size (body > caption > label)', () => {
    expect(typography.body.lineHeight).toBeGreaterThan(typography.caption.lineHeight);
    expect(typography.caption.lineHeight).toBeGreaterThan(typography.label.lineHeight);
  });
});
```

Run: `npx jest src/__tests__/typography.test.ts`
Expected: FAIL with "Cannot find module '../theme/typography'".

- [ ] **Step 2: Implement `src/theme/typography.ts`**

```ts
export const typography = {
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  body: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
} as const;
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx jest src/__tests__/typography.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add src/theme/typography.ts src/__tests__/typography.test.ts
git commit -m "Add optical typography scale (label/body/caption)"
```

---

### Task 3: `Button` press feedback

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Test: `src/__tests__/Button.test.tsx` (no code changes — re-run only)

**Interfaces:**
- Consumes: `motion.spring.press` and `useReducedMotion` from `../../theme/motion` (Task 1), `typography.body` from `../../theme/typography` (Task 2).
- `ButtonProps` is unchanged (`title`, `onPress`, `variant?`, `disabled?`, `loading?`) — this task changes no public interface.

This is a behavior-preserving change (adds visual feedback, doesn't change what `Button` does), so there's no new test to write first — the existing `Button.test.tsx` is the regression guard. Verify it still passes after the change.

- [ ] **Step 1: Replace `src/components/ui/Button.tsx`**

```tsx
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { motion, useReducedMotion } from '../../theme/motion';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false }: ButtonProps) {
  const isDisabled = disabled || loading;
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = reduceMotion ? 0.97 : withSpring(0.97, motion.spring.press);
  };

  const handlePressOut = () => {
    scale.value = reduceMotion ? 1 : withSpring(1, motion.spring.press);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          variant === 'primary' ? styles.primary : styles.secondary,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.textPrimary} />
        ) : (
          <Text
            style={[
              styles.label,
              variant === 'primary' ? styles.labelPrimary : styles.labelSecondary,
              isDisabled && styles.labelDisabled,
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accentRed,
    ...shadow.button,
  },
  secondary: {
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  disabled: {
    backgroundColor: colors.bgSurface,
    shadowOpacity: 0.04,
    elevation: 0,
  },
  label: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '700',
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
});
```

- [ ] **Step 2: Run `Button.test.tsx` to confirm no regression**

Run: `npx jest src/__tests__/Button.test.tsx`
Expected: PASS (4 tests, unchanged from before this task).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "Add spring-based press feedback to Button"
```

---

### Task 4: `ChoiceGroup` press feedback + animated selection

**Files:**
- Modify: `src/components/ChoiceGroup.tsx`
- Create: `src/__tests__/ChoiceGroup.test.tsx`

**Interfaces:**
- Consumes: `motion.spring.press`, `motion.spring.settle`, `useReducedMotion` (Task 1), `typography.body` (Task 2).
- `ChoiceOption<T>` and `ChoiceGroupProps<T>` (`options`, `value`, `onChange`) are unchanged.

- [ ] **Step 1: Write the failing regression test**

The component is being restructured internally (a new `Pill` subcomponent), so write a behavior-contract test first to guard the refactor:

```tsx
// src/__tests__/ChoiceGroup.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChoiceGroup } from '../components/ChoiceGroup';

describe('ChoiceGroup', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders every option label', async () => {
    const { getByText } = await render(
      <ChoiceGroup options={options} value={null} onChange={() => {}} />
    );
    expect(getByText('Option A')).toBeTruthy();
    expect(getByText('Option B')).toBeTruthy();
  });

  it('calls onChange with the pressed option value', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(
      <ChoiceGroup options={options} value="a" onChange={onChange} />
    );
    fireEvent.press(getByText('Option B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
```

Run: `npx jest src/__tests__/ChoiceGroup.test.tsx`
Expected: PASS already, against the *current* (pre-refactor) `ChoiceGroup` — this confirms the test correctly describes existing behavior before you change the implementation. (Unlike the usual red-green flow, this is a characterization test for a refactor: it must be green before Step 2, and must stay green after.)

- [ ] **Step 2: Replace `src/components/ChoiceGroup.tsx`**

```tsx
import { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import { typography } from '../theme/typography';
import { motion, useReducedMotion } from '../theme/motion';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function ChoiceGroup<T extends string>({ options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Pill
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

type PillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Pill({ label, selected, onPress }: PillProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    selectedProgress.value = reduceMotion ? target : withSpring(target, motion.spring.settle);
  }, [selected, reduceMotion, selectedProgress]);

  const handlePressIn = () => {
    scale.value = reduceMotion ? 0.97 : withSpring(0.97, motion.spring.press);
  };

  const handlePressOut = () => {
    scale.value = reduceMotion ? 1 : withSpring(1, motion.spring.press);
  };

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [colors.bgSurface, colors.accentRed]
    ),
    shadowColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [shadow.card.shadowColor, colors.accentRed]
    ),
    shadowOpacity:
      shadow.card.shadowOpacity + (0.25 - shadow.card.shadowOpacity) * selectedProgress.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedProgress.value, [0, 1], [colors.textPrimary, '#FFFFFF']),
  }));

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.pill, animatedPillStyle]}>
        <Animated.Text style={[styles.label, animatedLabelStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    elevation: shadow.card.elevation,
    shadowOffset: shadow.card.shadowOffset,
    shadowRadius: shadow.card.shadowRadius,
  },
  label: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '600',
  },
});
```

Note: `shadow.card`'s `shadowColor`/`shadowOpacity` are intentionally *not* spread into `styles.pill` — they're fully owned by `animatedPillStyle` now (animated from the unselected values to the selected values), so they aren't duplicated/fought over between a static and an animated style.

- [ ] **Step 3: Run the regression test to verify it still passes**

Run: `npx jest src/__tests__/ChoiceGroup.test.tsx`
Expected: PASS (2 tests) — same assertions, now against the refactored implementation.

- [ ] **Step 4: Run the full suite and commit**

Run: `npx jest`
Expected: all suites pass.

```bash
git add src/components/ChoiceGroup.tsx src/__tests__/ChoiceGroup.test.tsx
git commit -m "Animate ChoiceGroup press feedback and selection transition"
```

---

### Task 5: `TextField` jump-free animated focus

**Files:**
- Modify: `src/components/ui/TextField.tsx`
- Test: `src/__tests__/TextField.test.tsx` (no code changes — re-run only)

**Interfaces:**
- Consumes: `motion.spring.settle`, `useReducedMotion` (Task 1), `typography.label`/`typography.body` (Task 2).
- `TextFieldProps` is unchanged.

- [ ] **Step 1: Replace `src/components/ui/TextField.tsx`**

```tsx
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { motion, useReducedMotion } from '../../theme/motion';

type TextFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  testID?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  testID,
}: TextFieldProps) {
  const reduceMotion = useReducedMotion();
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    focusProgress.value = reduceMotion ? 1 : withSpring(1, motion.spring.settle);
  };

  const handleBlur = () => {
    focusProgress.value = reduceMotion ? 0 : withSpring(0, motion.spring.settle);
  };

  const animatedWrapperStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], ['transparent', colors.accentRed]),
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, animatedWrapperStyle]}>
        <TextInput
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    letterSpacing: typography.label.letterSpacing,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    borderRadius: radius.sm,
    borderWidth: 2,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  input: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    color: colors.textPrimary,
  },
});
```

The border moved from the `TextInput` itself onto a wrapping `Animated.View` (`inputWrapper`), always at `borderWidth: 2` — `transparent` when unfocused, `colors.accentRed` when focused, animated between the two. This is the fix for the pre-existing layout jump (the old code only added `borderWidth: 2` on focus, shifting content by 2px each side).

- [ ] **Step 2: Run `TextField.test.tsx` to confirm no regression**

Run: `npx jest src/__tests__/TextField.test.tsx`
Expected: PASS (2 tests) — `getByDisplayValue`/`fireEvent.changeText` still resolve through to the `TextInput`, which is unaffected by the new wrapper.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TextField.tsx
git commit -m "Fix TextField focus layout jump and animate the focus border"
```

---

### Task 6: `EmptyState` typography adoption

**Files:**
- Modify: `src/components/ui/EmptyState.tsx`
- Test: `src/__tests__/EmptyState.test.tsx` (no code changes — re-run only)

**Interfaces:**
- Consumes: `typography.body`, `typography.caption` (Task 2).
- `EmptyStateProps` is unchanged.

- [ ] **Step 1: Replace `src/components/ui/EmptyState.tsx`**

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { colors, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title={actionLabel} onPress={onAction} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    letterSpacing: typography.caption.letterSpacing,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
```

- [ ] **Step 2: Run `EmptyState.test.tsx` to confirm no regression**

Run: `npx jest src/__tests__/EmptyState.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/EmptyState.tsx
git commit -m "Adopt typography scale in EmptyState"
```

---

### Task 7: `GlassSurface` component

**Files:**
- Create: `src/components/ui/GlassSurface.tsx`
- Test: `src/__tests__/GlassSurface.test.tsx`

**Interfaces:**
- Produces: `GlassSurface({ children?, style?, tintColor? }): JSX.Element` — a `View`-like wrapper. `children` is optional (the tab bar in Task 9 uses `GlassSurface` as a childless absolute-fill background layer). `style` accepts the same `StyleProp<ViewStyle>` shape as `View`; `GlassSurface` applies no `borderRadius` of its own, so callers control shape via `style`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/GlassSurface.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
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
    expect(expoGlassEffect.GlassView).toHaveBeenCalled();
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
```

Run: `npx jest src/__tests__/GlassSurface.test.tsx`
Expected: FAIL with "Cannot find module '../components/ui/GlassSurface'".

- [ ] **Step 2: Implement `src/components/ui/GlassSurface.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { AccessibilityInfo, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { colors, shadow } from '../../theme/tokens';

type GlassSurfaceProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
};

function useReduceTransparency(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduced
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

export function GlassSurface({ children, style, tintColor }: GlassSurfaceProps) {
  const reduceTransparency = useReduceTransparency();

  if (!isGlassEffectAPIAvailable() || reduceTransparency) {
    return <View style={[styles.fallback, style]}>{children}</View>;
  }

  return (
    <GlassView style={style} tintColor={tintColor} glassEffectStyle="regular">
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
});
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `npx jest src/__tests__/GlassSurface.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/GlassSurface.tsx src/__tests__/GlassSurface.test.tsx
git commit -m "Add GlassSurface: native glass material with solid fallback"
```

---

### Task 8: `Card` `glass` variant

**Files:**
- Modify: `src/components/ui/Card.tsx`
- Test: `src/__tests__/Card.test.tsx`

**Interfaces:**
- Consumes: `GlassSurface` (Task 7).
- `CardProps` gains an optional `variant?: 'solid' | 'glass'`, default `'solid'`. `children`/`style` are unchanged.

- [ ] **Step 1: Write the failing test for the new variant**

Replace the entire contents of `src/__tests__/Card.test.tsx` with (adds the `jest.mock` and the new `glass` case alongside the existing test, does not append below the old file):

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../components/ui/Card';

jest.mock('expo-glass-effect', () => ({
  GlassView: jest.fn(({ children }) => children),
  isGlassEffectAPIAvailable: jest.fn().mockReturnValue(false),
}));

describe('Card', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <Card>
        <Text>Contenu</Text>
      </Card>
    );
    expect(getByText('Contenu')).toBeTruthy();
  });

  it('renders its children when variant is glass', async () => {
    const { getByText } = await render(
      <Card variant="glass">
        <Text>Contenu verre</Text>
      </Card>
    );
    expect(getByText('Contenu verre')).toBeTruthy();
  });
});
```

Run: `npx jest src/__tests__/Card.test.tsx`
Expected: FAIL — `variant` prop doesn't exist yet (TypeScript error surfaces as a test-run failure since `ts-jest`/babel type-checks aren't enforced at runtime, but the render will still throw because `Card` ignores `variant` and always renders solid; to make the failure explicit, this step's real signal is the next step's `git diff` showing `Card.tsx` didn't support `glass` before — proceed to Step 2 regardless).

- [ ] **Step 2: Replace `src/components/ui/Card.tsx`**

```tsx
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { GlassSurface } from './GlassSurface';

type CardVariant = 'solid' | 'glass';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
};

export function Card({ children, style, variant = 'solid' }: CardProps) {
  if (variant === 'glass') {
    return <GlassSurface style={[styles.shape, style]}>{children}</GlassSurface>;
  }
  return <View style={[styles.shape, styles.solid, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  shape: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  solid: {
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
});
```

`styles.shape` + `styles.solid` together are byte-for-byte the same styles as the pre-existing `styles.card` — the default (`variant='solid'`, i.e. no prop passed) renders identically to before this task.

- [ ] **Step 3: Run the tests to verify they pass**

Run: `npx jest src/__tests__/Card.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 4: Run the full suite and commit**

Run: `npx jest`
Expected: all suites pass (`EmptyState` renders a `Card` internally with no `variant` — confirms the default path is unaffected).

```bash
git add src/components/ui/Card.tsx src/__tests__/Card.test.tsx
git commit -m "Add opt-in glass variant to Card"
```

---

### Task 9: Tab bar glass background

**Files:**
- Modify: `src/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `GlassSurface` (Task 7).
- No test file — this is a screen-chrome layout change with no unit-testable behavior beyond "still renders the same 5 tabs," which existing manual/E2E coverage (none exists for this file today) doesn't cover either; matches repo convention of not adding a test for `_layout.tsx` files.

- [ ] **Step 1: Replace `src/app/(tabs)/_layout.tsx`**

```tsx
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KgIcon } from '../../components/icons/KgIcon';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { colors } from '../../theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentRed,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { borderTopColor: colors.divider },
        tabBarBackground: () => <GlassSurface style={StyleSheet.absoluteFill} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Muscu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="weight-log"
        options={{
          title: 'Poids',
          tabBarIcon: ({ color, focused }) => <KgIcon color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
```

Only two things changed from the current file: the `import` of `GlassSurface` and `StyleSheet`, and `screenOptions.tabBarStyle`/`tabBarBackground` (dropped the flat `backgroundColor: colors.bgSurface`, added the `tabBarBackground` render prop). All five `Tabs.Screen` blocks are untouched.

- [ ] **Step 2: Run the full suite**

Run: `npx jest`
Expected: all suites pass (no test exercises this file directly; this confirms nothing else broke).

- [ ] **Step 3: Run the TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/_layout.tsx"
git commit -m "Use GlassSurface for the tab bar background"
```

---

### Task 10: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: all suites pass. Compare the total test count against the pre-plan baseline (112 passing, 0 failing) — this plan adds: 4 (`motion.test.ts`) + 2 (`typography.test.ts`) + 2 (`ChoiceGroup.test.tsx`) + 3 (`GlassSurface.test.tsx`) + 1 (`Card.test.tsx`'s new glass case) = 12 new tests, so the expected final count is 124 passing, 0 failing.

- [ ] **Step 3: Lint**

Run: `npx expo lint`
Expected: no new errors introduced by this plan's files (pre-existing lint state, if any, is out of scope to fix here).

- [ ] **Step 4: Confirm no screen files changed**

Run: `git diff --stat master... -- src/app` (or the equivalent diff against the branch's base) and confirm the only path listed under `src/app/` is `src/app/(tabs)/_layout.tsx` — no screen under `src/app/(tabs)/{home,plan,workout,grocery-list,weight-log}.tsx`, `src/app/recipe/`, `src/app/onboarding.tsx`, `src/app/login.tsx`, `src/app/signup.tsx`, or `src/app/generate-plan.tsx` should appear, per this plan's Global Constraints.

No commit for this task — it's a checkpoint, not a deliverable.
