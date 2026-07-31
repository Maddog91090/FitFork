# Onboarding Athletic Dark Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `src/app/onboarding.tsx` as the 4-step wizard + récap defined in `docs/superpowers/specs/2026-07-20-onboarding-visual-design.md`, styled in the Athletic Dark theme, backed by new shared design-system components.

**Architecture:** One screen, local component state (`currentStep: 0-3`). Five new presentational components (`ProgressBar`, `ChoicePill`/`ChoicePillGroup`, `TextFieldUnderline`, `PrimaryButton`, `BackLink`) consume a shared `theme.ts` token file and replace the existing unstyled form and `ChoiceGroup` component. No new routes, no global state.

**Tech Stack:** React Native (Expo SDK 57), TypeScript, `expo-router`, `expo-font` + `@expo-google-fonts/inter`, Jest + `@testing-library/react-native` (existing `jest-expo` preset, no config changes needed).

## Global Constraints

- Color tokens (exact hex, from `2026-07-31-onboarding-athletic-dark-wizard-design.md`): `bgBase #0E0E12`, `bgSurface #18181D`, `borderDefault #2A2A32`, `accentLime #C6FF3D`, `textPrimary #FFFFFF`, `textSecondary #8A8A94`, `stateError #FF5C5C`.
- Corner radius: 6px on all interactive elements (pills, fields, button).
- Typography: Inter (`Inter_400Regular`, `Inter_700Bold` via `@expo-google-fonts/inter`), installed with `npx expo install @expo-google-fonts/inter` (not plain `npm install`, to keep the version Expo-SDK-compatible).
- Field set and validation rules are unchanged from the current `onboarding.tsx` (same 9 fields, same numeric bounds) — only reorganized per step.
- `ChoiceGroup` (`src/components/ChoiceGroup.tsx`) is used only by `onboarding.tsx` today and is deleted once the rewrite lands (replaced by `ChoicePill`/`ChoicePillGroup`).

---

### Task 1: Design tokens

**Files:**
- Create: `src/lib/theme.ts`
- Test: `src/__tests__/theme.test.ts`

**Interfaces:**
- Produces: `theme: { bgBase: string; bgSurface: string; borderDefault: string; accentLime: string; textPrimary: string; textSecondary: string; stateError: string }` — imported by every component in Tasks 2-7.

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/theme.test.ts
import { theme } from '../lib/theme';

describe('theme', () => {
  it('exposes the Athletic Dark color tokens', () => {
    expect(theme).toEqual({
      bgBase: '#0E0E12',
      bgSurface: '#18181D',
      borderDefault: '#2A2A32',
      accentLime: '#C6FF3D',
      textPrimary: '#FFFFFF',
      textSecondary: '#8A8A94',
      stateError: '#FF5C5C',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- theme.test.ts`
Expected: FAIL with "Cannot find module '../lib/theme'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/theme.ts
export const theme = {
  bgBase: '#0E0E12',
  bgSurface: '#18181D',
  borderDefault: '#2A2A32',
  accentLime: '#C6FF3D',
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8A94',
  stateError: '#FF5C5C',
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- theme.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/__tests__/theme.test.ts
git commit -m "feat: add Athletic Dark theme tokens"
```

---

### Task 2: ProgressBar component

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Test: `src/__tests__/ProgressBar.test.tsx`

**Interfaces:**
- Consumes: `theme` from `src/lib/theme.ts` (Task 1).
- Produces: `ProgressBar({ totalSteps: number; currentStep: number })` — a `View` with `testID="progress-bar"` containing `totalSteps` children, each `testID={`progress-segment-${index}`}` with `accessibilityState={{ selected: index <= currentStep }}`. Used by `onboarding.tsx` in Task 7.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/ProgressBar.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '../components/ProgressBar';

describe('ProgressBar', () => {
  it('marks segments up to currentStep as selected', () => {
    const { getByTestId } = render(<ProgressBar totalSteps={4} currentStep={1} />);

    expect(getByTestId('progress-segment-0').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('progress-segment-1').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('progress-segment-2').props.accessibilityState.selected).toBe(false);
    expect(getByTestId('progress-segment-3').props.accessibilityState.selected).toBe(false);
  });

  it('renders exactly totalSteps segments', () => {
    const { queryAllByTestId } = render(<ProgressBar totalSteps={4} currentStep={0} />);
    expect(queryAllByTestId(/progress-segment-/).length).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ProgressBar.test.tsx`
Expected: FAIL with "Cannot find module '../components/ProgressBar'"

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ProgressBar.tsx
import { View, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

type ProgressBarProps = {
  totalSteps: number;
  currentStep: number;
};

export function ProgressBar({ totalSteps, currentStep }: ProgressBarProps) {
  return (
    <View style={styles.row} testID="progress-bar">
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          testID={`progress-segment-${index}`}
          accessibilityState={{ selected: index <= currentStep }}
          style={[styles.segment, index <= currentStep ? styles.segmentActive : styles.segmentInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  segmentActive: { backgroundColor: theme.accentLime },
  segmentInactive: { backgroundColor: theme.borderDefault },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ProgressBar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressBar.tsx src/__tests__/ProgressBar.test.tsx
git commit -m "feat: add ProgressBar component"
```

---

### Task 3: ChoicePill and ChoicePillGroup components

**Files:**
- Create: `src/components/ChoicePill.tsx`
- Test: `src/__tests__/ChoicePill.test.tsx`

**Interfaces:**
- Consumes: `theme` from `src/lib/theme.ts` (Task 1).
- Produces: `ChoicePillOption<T extends string> = { value: T; label: string }`; `ChoicePillGroup<T extends string>({ options: ChoicePillOption<T>[]; value: T | null; onChange: (value: T) => void })`; `ChoicePill({ label: string; selected: boolean; onPress: () => void })`. `ChoicePillGroup` is used by `onboarding.tsx` in Task 7 (same call shape as the old `ChoiceGroup`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/ChoicePill.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChoicePillGroup } from '../components/ChoicePill';

const OPTIONS = [
  { value: 'male' as const, label: 'Homme' },
  { value: 'female' as const, label: 'Femme' },
];

describe('ChoicePillGroup', () => {
  it('calls onChange with the pressed option value', () => {
    const onChange = jest.fn();
    const { getByText } = render(<ChoicePillGroup options={OPTIONS} value={null} onChange={onChange} />);

    fireEvent.press(getByText('Femme'));

    expect(onChange).toHaveBeenCalledWith('female');
  });

  it('marks the matching option as selected', () => {
    const { getByText } = render(<ChoicePillGroup options={OPTIONS} value="male" onChange={jest.fn()} />);

    expect(getByText('Homme').parent?.props.accessibilityState.selected).toBe(true);
    expect(getByText('Femme').parent?.props.accessibilityState.selected).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ChoicePill.test.tsx`
Expected: FAIL with "Cannot find module '../components/ChoicePill'"

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ChoicePill.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export type ChoicePillOption<T extends string> = { value: T; label: string };

type ChoicePillGroupProps<T extends string> = {
  options: ChoicePillOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function ChoicePillGroup<T extends string>({ options, value, onChange }: ChoicePillGroupProps<T>) {
  return (
    <View style={styles.list}>
      {options.map((option) => (
        <ChoicePill
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

type ChoicePillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function ChoicePill({ label, selected, onPress }: ChoicePillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}
    >
      <Text style={selected ? styles.labelSelected : styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, marginBottom: 16 },
  pill: { borderRadius: 6, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16 },
  pillSelected: { backgroundColor: 'rgba(198, 255, 61, 0.15)', borderColor: theme.accentLime },
  pillUnselected: { backgroundColor: theme.bgSurface, borderColor: theme.borderDefault },
  label: { color: theme.textSecondary, textTransform: 'uppercase' },
  labelSelected: { color: theme.accentLime, textTransform: 'uppercase' },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ChoicePill.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ChoicePill.tsx src/__tests__/ChoicePill.test.tsx
git commit -m "feat: add ChoicePill and ChoicePillGroup components"
```

---

### Task 4: TextFieldUnderline component

**Files:**
- Create: `src/components/TextFieldUnderline.tsx`
- Test: `src/__tests__/TextFieldUnderline.test.tsx`

**Interfaces:**
- Consumes: `theme` from `src/lib/theme.ts` (Task 1).
- Produces: `TextFieldUnderline({ value: string; onChangeText: (text: string) => void; keyboardType?: 'default' | 'numeric'; testID?: string })`. Used by `onboarding.tsx` in Task 7 for Âge/Taille/Poids/Jours fields.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/TextFieldUnderline.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextFieldUnderline } from '../components/TextFieldUnderline';

describe('TextFieldUnderline', () => {
  it('displays the given value', () => {
    const { getByTestId } = render(
      <TextFieldUnderline value="30" onChangeText={jest.fn()} testID="age-input" />
    );

    expect(getByTestId('age-input').props.value).toBe('30');
  });

  it('calls onChangeText when the user types', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <TextFieldUnderline value="" onChangeText={onChangeText} testID="age-input" />
    );

    fireEvent.changeText(getByTestId('age-input'), '25');

    expect(onChangeText).toHaveBeenCalledWith('25');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TextFieldUnderline.test.tsx`
Expected: FAIL with "Cannot find module '../components/TextFieldUnderline'"

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/TextFieldUnderline.tsx
import { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

type TextFieldUnderlineProps = {
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  testID?: string;
};

export function TextFieldUnderline({ value, onChangeText, keyboardType = 'default', testID }: TextFieldUnderlineProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.field, focused ? styles.fieldFocused : styles.fieldDefault]}
      placeholderTextColor={theme.textSecondary}
    />
  );
}

const styles = StyleSheet.create({
  field: { color: theme.textPrimary, paddingVertical: 8, borderBottomWidth: 2, marginBottom: 8 },
  fieldDefault: { borderBottomColor: theme.borderDefault },
  fieldFocused: { borderBottomColor: theme.accentLime },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TextFieldUnderline.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TextFieldUnderline.tsx src/__tests__/TextFieldUnderline.test.tsx
git commit -m "feat: add TextFieldUnderline component"
```

---

### Task 5: PrimaryButton component

**Files:**
- Create: `src/components/PrimaryButton.tsx`
- Test: `src/__tests__/PrimaryButton.test.tsx`

**Interfaces:**
- Consumes: `theme` from `src/lib/theme.ts` (Task 1).
- Produces: `PrimaryButton({ label: string; onPress: () => void; disabled?: boolean })`. Used by `onboarding.tsx` in Task 7 for "Continuer"/"Valider".

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/PrimaryButton.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '../components/PrimaryButton';

describe('PrimaryButton', () => {
  it('calls onPress when pressed and enabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton label="Continuer" onPress={onPress} />);

    fireEvent.press(getByText('Continuer'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton label="Continuer" onPress={onPress} disabled />);

    fireEvent.press(getByText('Continuer'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PrimaryButton.test.tsx`
Expected: FAIL with "Cannot find module '../components/PrimaryButton'"

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/PrimaryButton.tsx
import { Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: theme.accentLime, borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.4 },
  label: { color: theme.bgBase, fontWeight: '700', textTransform: 'uppercase' },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PrimaryButton.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PrimaryButton.tsx src/__tests__/PrimaryButton.test.tsx
git commit -m "feat: add PrimaryButton component"
```

---

### Task 6: BackLink component

**Files:**
- Create: `src/components/BackLink.tsx`
- Test: `src/__tests__/BackLink.test.tsx`

**Interfaces:**
- Consumes: `theme` from `src/lib/theme.ts` (Task 1).
- Produces: `BackLink({ onPress: () => void; label?: string })`, default label `'Retour'`. Used by `onboarding.tsx` in Task 7 on steps 2-4.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/BackLink.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BackLink } from '../components/BackLink';

describe('BackLink', () => {
  it('renders the default label and calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<BackLink onPress={onPress} />);

    fireEvent.press(getByText('‹ Retour'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BackLink.test.tsx`
Expected: FAIL with "Cannot find module '../components/BackLink'"

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/BackLink.tsx
import { Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

type BackLinkProps = {
  onPress: () => void;
  label?: string;
};

export function BackLink({ onPress, label = 'Retour' }: BackLinkProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Text style={styles.text}>{`‹ ${label}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { color: theme.textSecondary, marginBottom: 16 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BackLink.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BackLink.tsx src/__tests__/BackLink.test.tsx
git commit -m "feat: add BackLink component"
```

---

### Task 7: Rewrite onboarding.tsx as the 4-step wizard + récap

**Files:**
- Modify: `src/app/onboarding.tsx` (full rewrite)
- Delete: `src/components/ChoiceGroup.tsx`
- Test: `src/__tests__/onboarding.test.tsx`
- Modify: `package.json` (add `@expo-google-fonts/inter`)

**Interfaces:**
- Consumes: `theme` (Task 1), `ProgressBar` (Task 2), `ChoicePillGroup` (Task 3), `TextFieldUnderline` (Task 4), `PrimaryButton` (Task 5), `BackLink` (Task 6); existing `useAuth` (`src/lib/auth-context.tsx`), `upsertProfile`/`upsertTrainingProfile` (`src/lib/profile.ts`), `Sex`/`ActivityLevel`/`Goal` (`src/lib/nutrition.ts`), `ExperienceLevel`/`Equipment` (`src/lib/profile.ts`).
- Produces: the default-exported `OnboardingScreen` component (no external consumers besides `expo-router`'s file-based routing).

- [ ] **Step 1: Install the Inter font package**

Run: `npx expo install @expo-google-fonts/inter`
Expected: adds `@expo-google-fonts/inter` to `package.json` `dependencies`.

- [ ] **Step 2: Write the failing integration tests**

```tsx
// src/__tests__/onboarding.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../app/onboarding';
import { router } from 'expo-router';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } }, loading: false }),
}));

jest.mock('../lib/profile', () => ({
  upsertProfile: jest.fn().mockResolvedValue(undefined),
  upsertTrainingProfile: jest.fn().mockResolvedValue(undefined),
}));

function completeProfileStep(getByText: any, getByTestId: any) {
  fireEvent.press(getByText('Homme'));
  fireEvent.changeText(getByTestId('age-input'), '30');
  fireEvent.changeText(getByTestId('height-input'), '180');
  fireEvent.changeText(getByTestId('weight-input'), '80');
  fireEvent.press(getByText('Continuer'));
}

function completeActivityStep(getByText: any) {
  fireEvent.press(getByText('Modérée'));
  fireEvent.press(getByText('Sèche'));
  fireEvent.press(getByText('Continuer'));
}

function completeTrainingStep(getByText: any, getByTestId: any) {
  fireEvent.changeText(getByTestId('days-input'), '4');
  fireEvent.press(getByText('Intermédiaire'));
  fireEvent.press(getByText('Salle complète'));
  fireEvent.press(getByText('Continuer'));
}

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the user on step 1 when required fields are missing', () => {
    const { getByText, queryByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText('Continuer'));

    expect(getByText('Ton profil')).toBeTruthy();
    expect(queryByText('Ton activité')).toBeNull();
  });

  it('does not show a back link on step 1', () => {
    const { queryByText } = render(<OnboardingScreen />);
    expect(queryByText('‹ Retour')).toBeNull();
  });

  it('walks through all 4 steps to the récap with the entered values', () => {
    const { getByText, getByTestId } = render(<OnboardingScreen />);

    completeProfileStep(getByText, getByTestId);
    completeActivityStep(getByText);
    completeTrainingStep(getByText, getByTestId);

    expect(getByText('Récapitulatif')).toBeTruthy();
    expect(getByText('Sexe: Homme')).toBeTruthy();
    expect(getByText('Âge: 30')).toBeTruthy();
  });

  it('returns to the right step with values pre-filled via a Modifier link', () => {
    const { getByText, getByTestId } = render(<OnboardingScreen />);

    completeProfileStep(getByText, getByTestId);
    completeActivityStep(getByText);
    completeTrainingStep(getByText, getByTestId);

    fireEvent.press(getByTestId('modifier-profil'));

    expect(getByText('Ton profil')).toBeTruthy();
    expect(getByTestId('age-input').props.value).toBe('30');
  });

  it('submits the profile and training profile and navigates to /home', async () => {
    const { getByText, getByTestId } = render(<OnboardingScreen />);

    completeProfileStep(getByText, getByTestId);
    completeActivityStep(getByText);
    completeTrainingStep(getByText, getByTestId);

    fireEvent.press(getByText('Valider'));

    // Wait for the last effect of the async submit chain (upsertProfile then
    // upsertTrainingProfile then router.replace) so the earlier calls below
    // are guaranteed to have already happened.
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/home'));

    expect(upsertProfile).toHaveBeenCalledWith('user-1', {
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderate',
      goal: 'cut',
    });
    expect(upsertTrainingProfile).toHaveBeenCalledWith('user-1', {
      daysPerWeek: 4,
      experienceLevel: 'intermediate',
      equipment: 'full_gym',
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- onboarding.test.tsx`
Expected: FAIL (current `onboarding.tsx` has no step structure, no `age-input`/`height-input`/`weight-input`/`days-input`/`modifier-profil` testIDs, no "Récapitulatif" text).

- [ ] **Step 4: Delete the unused ChoiceGroup component**

Run: `rm src/components/ChoiceGroup.tsx` (or delete via your editor)

- [ ] **Step 5: Rewrite the implementation**

```tsx
// src/app/onboarding.tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';
import type { ExperienceLevel, Equipment } from '../lib/profile';
import type { Sex, ActivityLevel, Goal } from '../lib/nutrition';
import { theme } from '../lib/theme';
import { ProgressBar } from '../components/ProgressBar';
import { ChoicePillGroup, type ChoicePillOption } from '../components/ChoicePill';
import { TextFieldUnderline } from '../components/TextFieldUnderline';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackLink } from '../components/BackLink';

const SEX_OPTIONS: ChoicePillOption<Sex>[] = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
];

const ACTIVITY_OPTIONS: ChoicePillOption<ActivityLevel>[] = [
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light', label: 'Légère' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Très active' },
];

const GOAL_OPTIONS: ChoicePillOption<Goal>[] = [
  { value: 'cut', label: 'Sèche' },
  { value: 'maintain', label: 'Maintien' },
  { value: 'bulk', label: 'Prise de masse' },
];

const EXPERIENCE_OPTIONS: ChoicePillOption<ExperienceLevel>[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
];

const EQUIPMENT_OPTIONS: ChoicePillOption<Equipment>[] = [
  { value: 'full_gym', label: 'Salle complète' },
  { value: 'home_limited', label: 'Maison (matériel limité)' },
  { value: 'bodyweight', label: 'Poids du corps' },
];

const TOTAL_STEPS = 4;

function findLabel<T extends string>(options: ChoicePillOption<T>[], value: T | null): string {
  return options.find((option) => option.value === value)?.label ?? '';
}

function isProfileStepValid(sex: Sex | null, ageNum: number, heightNum: number, weightNum: number): boolean {
  if (!sex) return false;
  if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum >= 120) return false;
  if (!Number.isFinite(heightNum) || heightNum <= 0) return false;
  if (!Number.isFinite(weightNum) || weightNum <= 0) return false;
  return true;
}

function isActivityStepValid(activityLevel: ActivityLevel | null, goal: Goal | null): boolean {
  return activityLevel !== null && goal !== null;
}

function isTrainingStepValid(daysNum: number, experienceLevel: ExperienceLevel | null, equipment: Equipment | null): boolean {
  if (!Number.isInteger(daysNum) || daysNum < 0 || daysNum > 7) return false;
  if (!experienceLevel || !equipment) return false;
  return true;
}

export default function OnboardingScreen() {
  const { session, loading } = useAuth();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const ageNum = Number(age);
  const heightNum = Number(heightCm);
  const weightNum = Number(weightKg);
  const daysNum = Number(daysPerWeek);

  const profileValid = isProfileStepValid(sex, ageNum, heightNum, weightNum);
  const activityValid = isActivityStepValid(activityLevel, goal);
  const trainingValid = isTrainingStepValid(daysNum, experienceLevel, equipment);

  const handleSubmit = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertProfile(session.user.id, {
        sex: sex as Sex,
        age: ageNum,
        heightCm: heightNum,
        weightKg: weightNum,
        activityLevel: activityLevel as ActivityLevel,
        goal: goal as Goal,
      });
      await upsertTrainingProfile(session.user.id, {
        daysPerWeek: daysNum,
        experienceLevel: experienceLevel as ExperienceLevel,
        equipment: equipment as Equipment,
      });
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session || !fontsLoaded) {
    return null;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {step === 0 && (
        <View>
          <ProgressBar totalSteps={TOTAL_STEPS} currentStep={0} />
          <Text style={styles.stepCounter}>Étape 1/4</Text>
          <Text style={styles.title}>Ton profil</Text>

          <Text style={styles.label}>Sexe</Text>
          <ChoicePillGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />

          <Text style={styles.label}>Âge</Text>
          <TextFieldUnderline value={age} onChangeText={setAge} keyboardType="numeric" testID="age-input" />

          <Text style={styles.label}>Taille (cm)</Text>
          <TextFieldUnderline value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" testID="height-input" />

          <Text style={styles.label}>Poids (kg)</Text>
          <TextFieldUnderline value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" testID="weight-input" />

          <PrimaryButton label="Continuer" disabled={!profileValid} onPress={() => setStep(1)} />
        </View>
      )}

      {step === 1 && (
        <View>
          <BackLink onPress={() => setStep(0)} />
          <ProgressBar totalSteps={TOTAL_STEPS} currentStep={1} />
          <Text style={styles.stepCounter}>Étape 2/4</Text>
          <Text style={styles.title}>Ton activité</Text>

          <Text style={styles.label}>Niveau d'activité quotidienne</Text>
          <ChoicePillGroup options={ACTIVITY_OPTIONS} value={activityLevel} onChange={setActivityLevel} />

          <Text style={styles.label}>Objectif</Text>
          <ChoicePillGroup options={GOAL_OPTIONS} value={goal} onChange={setGoal} />

          <PrimaryButton label="Continuer" disabled={!activityValid} onPress={() => setStep(2)} />
        </View>
      )}

      {step === 2 && (
        <View>
          <BackLink onPress={() => setStep(1)} />
          <ProgressBar totalSteps={TOTAL_STEPS} currentStep={2} />
          <Text style={styles.stepCounter}>Étape 3/4</Text>
          <Text style={styles.title}>Ton entraînement</Text>

          <Text style={styles.label}>Jours d'entraînement / semaine</Text>
          <TextFieldUnderline value={daysPerWeek} onChangeText={setDaysPerWeek} keyboardType="numeric" testID="days-input" />

          <Text style={styles.label}>Niveau</Text>
          <ChoicePillGroup options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={setExperienceLevel} />

          <Text style={styles.label}>Matériel disponible</Text>
          <ChoicePillGroup options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />

          <PrimaryButton label="Continuer" disabled={!trainingValid} onPress={() => setStep(3)} />
        </View>
      )}

      {step === 3 && (
        <View>
          <BackLink onPress={() => setStep(2)} />
          <Text style={styles.title}>Récapitulatif</Text>

          <View style={styles.recapSection}>
            <View style={styles.recapHeader}>
              <Text style={styles.recapSectionTitle}>Profil</Text>
              <Pressable onPress={() => setStep(0)} testID="modifier-profil">
                <Text style={styles.modifierLink}>Modifier</Text>
              </Pressable>
            </View>
            <Text style={styles.recapLine}>Sexe: {findLabel(SEX_OPTIONS, sex)}</Text>
            <Text style={styles.recapLine}>Âge: {age}</Text>
            <Text style={styles.recapLine}>Taille: {heightCm} cm</Text>
            <Text style={styles.recapLine}>Poids: {weightKg} kg</Text>
          </View>

          <View style={styles.recapSection}>
            <View style={styles.recapHeader}>
              <Text style={styles.recapSectionTitle}>Activité</Text>
              <Pressable onPress={() => setStep(1)} testID="modifier-activite">
                <Text style={styles.modifierLink}>Modifier</Text>
              </Pressable>
            </View>
            <Text style={styles.recapLine}>Niveau d'activité: {findLabel(ACTIVITY_OPTIONS, activityLevel)}</Text>
            <Text style={styles.recapLine}>Objectif: {findLabel(GOAL_OPTIONS, goal)}</Text>
          </View>

          <View style={styles.recapSection}>
            <View style={styles.recapHeader}>
              <Text style={styles.recapSectionTitle}>Entraînement</Text>
              <Pressable onPress={() => setStep(2)} testID="modifier-entrainement">
                <Text style={styles.modifierLink}>Modifier</Text>
              </Pressable>
            </View>
            <Text style={styles.recapLine}>Jours/semaine: {daysPerWeek}</Text>
            <Text style={styles.recapLine}>Niveau: {findLabel(EXPERIENCE_OPTIONS, experienceLevel)}</Text>
            <Text style={styles.recapLine}>Matériel: {findLabel(EQUIPMENT_OPTIONS, equipment)}</Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            label={submitting ? 'Enregistrement...' : 'Valider'}
            disabled={submitting}
            onPress={handleSubmit}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bgBase },
  container: { padding: 24 },
  stepCounter: { color: theme.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 12 },
  title: {
    color: theme.textPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 16,
  },
  label: {
    color: theme.textPrimary,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  recapSection: { marginBottom: 24 },
  recapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recapSectionTitle: { color: theme.textPrimary, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
  modifierLink: { color: theme.accentLime, fontFamily: 'Inter_400Regular' },
  recapLine: { color: theme.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  error: { color: theme.stateError, marginTop: 16, fontFamily: 'Inter_400Regular' },
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- onboarding.test.tsx`
Expected: PASS. (`useFonts` resolves synchronously here because the project's `jest-expo` preset uses the Node test environment — `typeof window === 'undefined'` — which routes `expo-font` to its synchronous `useStaticFonts` path, so no `waitFor` is needed around font loading.)

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS (no other file referenced the deleted `ChoiceGroup.tsx`).

- [ ] **Step 8: Commit**

```bash
git add src/app/onboarding.tsx src/__tests__/onboarding.test.tsx package.json package-lock.json
git rm src/components/ChoiceGroup.tsx
git commit -m "feat: rebuild onboarding as the Athletic Dark wizard"
```

---

### Task 8: Manual verification

- [ ] **Step 1: Run the app**

Run: `npx expo start`, open on a simulator/device, and navigate to a fresh (no-profile) account's onboarding flow.

- [ ] **Step 2: Walk the flow**

Confirm: dark background renders on all steps; "Continuer" stays disabled until each step's fields are filled; the progress bar advances; "‹ Retour" is absent on step 1 and present on steps 2-4; the récap shows the entered values; each "Modifier" link returns to the correct step with values pre-filled; "Valider" saves the profile and navigates to `/home`.

- [ ] **Step 3: Report back**

Note any visual issues (e.g., Inter font not rendering, layout overflow) for a follow-up fix — no code change in this step.
