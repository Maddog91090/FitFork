# Brand Visual Rollout (All Screens) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a shared "Soft Neutral" design system (tokens + reusable components) and apply it across all 10 app screens, plus add a persistent bottom tab bar for the authenticated area, per `docs/superpowers/specs/2026-07-23-brand-visual-rollout-design.md`.

**Architecture:** A new `src/theme/tokens.ts` defines colors/radius/spacing/shadows. New shared components (`Button`, `TextField`, `Card`, `EmptyState`) live in `src/components/ui/`. The existing `ChoiceGroup` is restyled in place. Home/Plan/Workout/Grocery-list/Weight-log move into an Expo Router `(tabs)` group with a new `Tabs` layout (icons from `@expo/vector-icons` + a custom `KgIcon`); Login/Signup/Onboarding/Generate-plan/Recipe-detail stay as top-level stack screens. Every screen is then restyled in place using the shared tokens/components, with no changes to business logic or data-fetching.

**Tech Stack:** React Native 0.86 / Expo SDK 57 / expo-router 57 (file-based routing, `Tabs` layout) / `@expo/vector-icons` (new dependency) / Jest + `@testing-library/react-native` (existing).

## Global Constraints

- Color tokens (exact hex): `bg/base #F7F5F2`, `bg/surface #FFFFFF`, `text/primary #1E1B18`, `text/secondary #9A958D`, `accent/red #DC2626`, `border/divider #F0ECE3`. Error text reuses `accent/red`.
- Corner radius: 12px (small fields/cells), 14px (buttons/fields/tab bar icon), 16px (cards), 20px (pills, full-round).
- Elevation: soft shadows only (`shadowOpacity` 0.05–0.06 neutral, 0.25 red-tinted on primary buttons/selected pills) — no borders for depth.
- Typography: system default font only (no custom font added). Titles bold 700–800. Labels: uppercase, ~11px, `text/secondary`, letter-spacing.
- Tab bar: exactly 5 tabs — Accueil, Plan, Muscu, Courses, Poids (in that order) — for the authenticated area only. Poids uses a custom circular "kg" badge icon, not a bathroom-scale/Ionicons icon.
- Screens outside the tab bar: Login, Signup, Onboarding, Générer le plan, Détail recette.
- No change to business logic, validation rules, or data-fetching in any screen — presentation-only changes, except the Onboarding screen's restructuring into a 4-step wizard + recap (already approved; fields/validation values unchanged).
- The current logo mark (`assets/images/icon.png`) is reused as-is (small, in a white rounded square) on Login/Signup — it is explicitly out of scope to redesign here.

---

### Task 1: Design tokens

**Files:**
- Create: `src/theme/tokens.ts`

**Interfaces:**
- Produces: `colors` (`bgBase`, `bgSurface`, `textPrimary`, `textSecondary`, `accentRed`, `divider`, `error`), `radius` (`sm`, `md`, `lg`, `pill`), `spacing` (`xs`, `sm`, `md`, `lg`, `xl`), `shadow` (`card`, `button`) — all consumed by every task below.

- [ ] **Step 1: Create the tokens file**

```ts
// src/theme/tokens.ts
export const colors = {
  bgBase: '#F7F5F2',
  bgSurface: '#FFFFFF',
  textPrimary: '#1E1B18',
  textSecondary: '#9A958D',
  accentRed: '#DC2626',
  divider: '#F0ECE3',
  error: '#DC2626',
} as const;

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  pill: 20,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors referencing `src/theme/tokens.ts`

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens.ts
git commit -m "Add shared design tokens (colors, radius, spacing, shadow)"
```

---

### Task 2: Button component

**Files:**
- Create: `src/components/ui/Button.tsx`
- Test: `src/__tests__/Button.test.tsx`

**Interfaces:**
- Consumes: `colors`, `radius`, `shadow`, `spacing` from `src/theme/tokens.ts` (Task 1).
- Produces: `Button({ title, onPress, variant?, disabled?, loading? })` — `variant` is `'primary' | 'secondary'`, defaults to `'primary'`. Consumed by every screen task below.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders the title', () => {
    const { getByText } = render(<Button title="Continuer" onPress={() => {}} />);
    expect(getByText('Continuer')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Continuer" onPress={onPress} />);
    fireEvent.press(getByText('Continuer'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Continuer" onPress={onPress} disabled />);
    fireEvent.press(getByText('Continuer'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner and hides the label when loading', () => {
    const { queryByText } = render(<Button title="Continuer" onPress={() => {}} loading />);
    expect(queryByText('Continuer')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest Button.test.tsx`
Expected: FAIL — `Cannot find module '../components/ui/Button'`

- [ ] **Step 3: Implement the component**

```tsx
// src/components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

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
  return (
    <Pressable
      onPress={onPress}
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
    fontSize: 14,
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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest Button.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx src/__tests__/Button.test.tsx
git commit -m "Add shared Button component"
```

---

### Task 3: TextField component

**Files:**
- Create: `src/components/ui/TextField.tsx`
- Test: `src/__tests__/TextField.test.tsx`

**Interfaces:**
- Consumes: `colors`, `radius`, `shadow`, `spacing` (Task 1).
- Produces: `TextField({ label?, value, onChangeText, placeholder?, keyboardType?, secureTextEntry?, autoCapitalize?, testID? })`. Consumed by Login, Signup, Onboarding, Weight-log tasks below.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/TextField.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextField } from '../components/ui/TextField';

describe('TextField', () => {
  it('renders the label and value', () => {
    const { getByText, getByDisplayValue } = render(
      <TextField label="Âge" value="28" onChangeText={() => {}} />
    );
    expect(getByText('Âge')).toBeTruthy();
    expect(getByDisplayValue('28')).toBeTruthy();
  });

  it('calls onChangeText when typing', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <TextField label="Âge" value="" onChangeText={onChangeText} testID="age-input" />
    );
    fireEvent.changeText(getByTestId('age-input'), '29');
    expect(onChangeText).toHaveBeenCalledWith('29');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest TextField.test.tsx`
Expected: FAIL — `Cannot find module '../components/ui/TextField'`

- [ ] **Step 3: Implement the component**

```tsx
// src/components/ui/TextField.tsx
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

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
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        testID={testID}
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    ...shadow.card,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.accentRed,
  },
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest TextField.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/TextField.tsx src/__tests__/TextField.test.tsx
git commit -m "Add shared TextField component"
```

---

### Task 4: Card component

**Files:**
- Create: `src/components/ui/Card.tsx`
- Test: `src/__tests__/Card.test.tsx`

**Interfaces:**
- Consumes: `colors`, `radius`, `shadow`, `spacing` (Task 1).
- Produces: `Card({ children, style? })` — a `View` wrapper. Consumed by Home, Plan, Recipe-detail, Workout, Grocery-list, Weight-log, EmptyState (Task 5).

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/Card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../components/ui/Card';

describe('Card', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <Card>
        <Text>Contenu</Text>
      </Card>
    );
    expect(getByText('Contenu')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest Card.test.tsx`
Expected: FAIL — `Cannot find module '../components/ui/Card'`

- [ ] **Step 3: Implement the component**

```tsx
// src/components/ui/Card.tsx
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest Card.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Card.tsx src/__tests__/Card.test.tsx
git commit -m "Add shared Card component"
```

---

### Task 5: EmptyState component

**Files:**
- Create: `src/components/ui/EmptyState.tsx`
- Test: `src/__tests__/EmptyState.test.tsx`

**Interfaces:**
- Consumes: `Card` (Task 4), `Button` (Task 2), `colors`, `spacing` (Task 1).
- Produces: `EmptyState({ icon, title, message, actionLabel, onAction })`. Consumed by Plan and Grocery-list tasks below.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/EmptyState.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EmptyState } from '../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title, message and fires the action', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        icon={<Text>icon</Text>}
        title="Aucun plan pour l'instant"
        message="Génère ton premier plan."
        actionLabel="Générer un plan"
        onAction={onAction}
      />
    );
    expect(getByText("Aucun plan pour l'instant")).toBeTruthy();
    fireEvent.press(getByText('Générer un plan'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest EmptyState.test.tsx`
Expected: FAIL — `Cannot find module '../components/ui/EmptyState'`

- [ ] **Step 3: Implement the component**

```tsx
// src/components/ui/EmptyState.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { colors, spacing } from '../../theme/tokens';

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
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest EmptyState.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/EmptyState.tsx src/__tests__/EmptyState.test.tsx
git commit -m "Add shared EmptyState component"
```

---

### Task 6: Restyle ChoiceGroup

**Files:**
- Modify: `src/components/ChoiceGroup.tsx`

**Interfaces:**
- Consumes: `colors`, `radius`, `shadow`, `spacing` (Task 1).
- Produces: same public API as before (`ChoiceGroup<T>({ options, value, onChange })`) — no signature change, so Onboarding (already using it) needs no code changes beyond the restyle in Task 10.

This is a pure visual restyle of an already-tested-by-usage component with no behavior change, so no new test is added — the existing selection behavior (press an option, `onChange` fires) is unchanged and is exercised indirectly by the Onboarding wizard tests in Task 10.

- [ ] **Step 1: Replace the component's styles**

```tsx
// src/components/ChoiceGroup.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/tokens';

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
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.pill, value === option.value && styles.pillSelected]}
        >
          <Text style={value === option.value ? styles.labelSelected : styles.label}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  pillSelected: {
    backgroundColor: colors.accentRed,
    shadowColor: colors.accentRed,
    shadowOpacity: 0.25,
  },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  labelSelected: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
```

- [ ] **Step 2: Verify existing tests/type-check still pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS (all existing tests — this file has no dedicated test but is exercised via other suites; nothing should break)

- [ ] **Step 3: Commit**

```bash
git add src/components/ChoiceGroup.tsx
git commit -m "Restyle ChoiceGroup with shared design tokens"
```

---

### Task 7: Tab bar navigation (move 5 screens into a `(tabs)` group)

**Files:**
- Create: `src/components/icons/KgIcon.tsx`
- Test: `src/__tests__/KgIcon.test.tsx`
- Create: `src/app/(tabs)/_layout.tsx`
- Move: `src/app/home.tsx` → `src/app/(tabs)/home.tsx`
- Move: `src/app/plan.tsx` → `src/app/(tabs)/plan.tsx`
- Move: `src/app/workout.tsx` → `src/app/(tabs)/workout.tsx`
- Move: `src/app/grocery-list.tsx` → `src/app/(tabs)/grocery-list.tsx`
- Move: `src/app/weight-log.tsx` → `src/app/(tabs)/weight-log.tsx`
- Modify: `package.json`, `package-lock.json` (new dependency)

**Interfaces:**
- Consumes: `colors` (Task 1).
- Produces: `KgIcon({ color, focused, size? })`. The 5 moved files keep their existing default exports and behavior — only their relative import depth changes (`../lib/...` → `../../lib/...`, `../components/...` → `../../components/...`). Their visual restyle happens in later tasks (11, 13, 15, 16, 17) — this task only relocates them and fixes imports so the app keeps working.

This task's deliverable is: the app builds, a bottom tab bar with 5 icons appears for Home/Plan/Workout/Grocery-list/Weight-log, and every existing route (`/home`, `/plan`, `/workout`, `/grocery-list`, `/weight-log`) still resolves and behaves exactly as before (Expo Router strips the `(tabs)` group segment from the URL, so no navigation call elsewhere in the app needs to change).

- [ ] **Step 1: Install `@expo/vector-icons`**

Run: `npx expo install @expo/vector-icons`
Expected: adds `@expo/vector-icons` to `package.json` `dependencies` at the SDK 57-compatible version and updates `package-lock.json`

- [ ] **Step 2: Write the failing KgIcon test**

```tsx
// src/__tests__/KgIcon.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { KgIcon } from '../components/icons/KgIcon';

describe('KgIcon', () => {
  it('renders the kg label', () => {
    const { getByText } = render(<KgIcon color="#DC2626" focused={false} />);
    expect(getByText('kg')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest KgIcon.test.tsx`
Expected: FAIL — `Cannot find module '../components/icons/KgIcon'`

- [ ] **Step 4: Implement KgIcon**

```tsx
// src/components/icons/KgIcon.tsx
import { View, Text, StyleSheet } from 'react-native';

type KgIconProps = {
  color: string;
  focused: boolean;
  size?: number;
};

export function KgIcon({ color, focused, size = 22 }: KgIconProps) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: focused ? color : 'transparent',
        },
      ]}
    >
      <Text style={[styles.label, { color: focused ? '#FFFFFF' : color, fontSize: size * 0.4 }]}>kg</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest KgIcon.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 6: Move the 5 screens into the `(tabs)` group**

```bash
mkdir -p "src/app/(tabs)"
git mv src/app/home.tsx "src/app/(tabs)/home.tsx"
git mv src/app/plan.tsx "src/app/(tabs)/plan.tsx"
git mv src/app/workout.tsx "src/app/(tabs)/workout.tsx"
git mv src/app/grocery-list.tsx "src/app/(tabs)/grocery-list.tsx"
git mv src/app/weight-log.tsx "src/app/(tabs)/weight-log.tsx"
```

- [ ] **Step 7: Fix the relative import paths in each moved file**

Each moved file is now one directory deeper, so `../lib/...` becomes `../../lib/...` (and, in `home.tsx`, `../lib/targets` too). Update the `import` lines at the top of each file:

`src/app/(tabs)/home.tsx` — change:
```ts
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../lib/targets';
```
to:
```ts
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
```

`src/app/(tabs)/plan.tsx` — change:
```ts
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../lib/mealPlanData';
import { pickReplacementRecipe, MEAL_TYPE_RATIOS, clampPortionMultiplier, type MealType } from '../lib/mealPlan';
```
to:
```ts
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../../lib/mealPlanData';
import { pickReplacementRecipe, MEAL_TYPE_RATIOS, clampPortionMultiplier, type MealType } from '../../lib/mealPlan';
```

`src/app/(tabs)/workout.tsx` — change:
```ts
import { useAuth } from '../lib/auth-context';
import { getTrainingProfile } from '../lib/profile';
import { selectTemplate } from '../lib/workoutTemplate';
import { generateWorkoutProgram } from '../lib/workoutProgram';
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchTemplateDaySlots,
  fetchExercisePool,
  saveGeneratedProgram,
  fetchProgramDetails,
  type WorkoutProgram,
} from '../lib/workoutProgramData';
```
to:
```ts
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile } from '../../lib/profile';
import { selectTemplate } from '../../lib/workoutTemplate';
import { generateWorkoutProgram } from '../../lib/workoutProgram';
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchTemplateDaySlots,
  fetchExercisePool,
  saveGeneratedProgram,
  fetchProgramDetails,
  type WorkoutProgram,
} from '../../lib/workoutProgramData';
```

`src/app/(tabs)/grocery-list.tsx` — change:
```ts
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../lib/mealPlanData';
```
to:
```ts
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../../lib/mealPlanData';
```

`src/app/(tabs)/weight-log.tsx` — change:
```ts
import { useAuth } from '../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';
```
to:
```ts
import { useAuth } from '../../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../../lib/weightLogData';
```

- [ ] **Step 8: Create the tab layout**

```tsx
// src/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KgIcon } from '../../components/icons/KgIcon';
import { colors } from '../../theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentRed,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.bgSurface, borderTopColor: colors.divider },
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

- [ ] **Step 9: Run the full test suite and type-check**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS — no import-resolution errors from the move

- [ ] **Step 10: Manually verify navigation**

Run: `npx expo start`, open the app, log in, and confirm: a bottom tab bar with 5 icons (home/calendar/barbell/cart/kg-circle) appears; tapping each tab navigates to the right screen; `router.replace('/onboarding')` (from Home/Workout when no profile exists) and `router.push('/recipe/...')` (from Plan) still work.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/components/icons/KgIcon.tsx src/__tests__/KgIcon.test.tsx "src/app/(tabs)"
git commit -m "Add bottom tab bar navigation for the authenticated area"
```

---

### Task 8: Restyle Login

**Files:**
- Modify: `src/app/login.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 3), `Button` (Task 2), `colors`, `spacing`, `radius`, `shadow` (Task 1).

No new test: this is a presentation-only change (same `signIn` call, same validation). The existing sign-in flow is exercised by `src/__tests__/auth-context.test.tsx`, which is unaffected.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/login.tsx
import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { colors, spacing, radius, shadow } from '../theme/tokens';

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace('/home');
    }
  }, [session]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
      </View>
      <Text style={styles.brand}>FitPro</Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Se connecter" onPress={handleSubmit} loading={submitting} />

      <Link href="/signup" style={styles.switchLink}>
        <Text style={styles.switchText}>
          Pas de compte ? <Text style={styles.switchTextAccent}>Créer un compte</Text>
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bgBase },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadow.card,
  },
  logo: { width: '100%', height: '100%' },
  brand: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  error: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  switchLink: { marginTop: spacing.lg, textAlign: 'center' },
  switchText: { textAlign: 'center', fontSize: 12, color: colors.textSecondary },
  switchTextAccent: { color: colors.accentRed, fontWeight: '700' },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open the Login screen, confirm the logo/brand header, styled fields, red primary button, and the link to Signup all render and that signing in with valid/invalid credentials still works.

- [ ] **Step 4: Commit**

```bash
git add src/app/login.tsx
git commit -m "Restyle Login screen with shared design system"
```

---

### Task 9: Restyle Signup

**Files:**
- Modify: `src/app/signup.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 3), `Button` (Task 2), `colors`, `spacing`, `radius`, `shadow` (Task 1).

No new test — presentation-only, same `signUp` call and confirmation flow.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/signup.tsx
import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { colors, spacing, radius, shadow } from '../theme/tokens';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setConfirmationSent(true);
  };

  if (confirmationSent) {
    return (
      <View style={styles.screen}>
        <Text style={styles.confirmText}>
          Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.
        </Text>
        <Link href="/login" style={styles.switchLink}>
          <Text style={styles.switchTextAccent}>Aller à la connexion</Text>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
      </View>
      <Text style={styles.brand}>FitPro</Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Créer un compte" onPress={handleSubmit} loading={submitting} />

      <Link href="/login" style={styles.switchLink}>
        <Text style={styles.switchText}>
          Déjà un compte ? <Text style={styles.switchTextAccent}>Se connecter</Text>
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bgBase },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadow.card,
  },
  logo: { width: '100%', height: '100%' },
  brand: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  error: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  switchLink: { marginTop: spacing.lg, textAlign: 'center' },
  switchText: { textAlign: 'center', fontSize: 12, color: colors.textSecondary },
  switchTextAccent: { color: colors.accentRed, fontWeight: '700' },
  confirmText: { textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.lg, fontSize: 14 },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open Signup, confirm styled fields/button and that both the error path and the "check your email" confirmation screen render correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/signup.tsx
git commit -m "Restyle Signup screen with shared design system"
```

---

### Task 10: Restyle Onboarding as a 4-step wizard + recap

**Files:**
- Modify: `src/app/onboarding.tsx`
- Test: `src/__tests__/onboarding-validate.test.ts`
- Test: `src/__tests__/onboarding-wizard.test.tsx`

**Interfaces:**
- Consumes: `ChoiceGroup` (Task 6), `TextField` (Task 3), `Button` (Task 2), `colors`, `spacing` (Task 1), `upsertProfile`/`upsertTrainingProfile` from `src/lib/profile.ts` (unchanged), `Sex`/`ActivityLevel`/`Goal` from `src/lib/nutrition.ts` (unchanged).
- Produces: an exported pure function `validateStep(step: number, fields: OnboardingFields): string | null` from `src/app/onboarding.tsx`, used directly by its own test file.

This is the one screen where behavior (not just style) changes: the single long scroll form becomes a 4-step wizard + recap, per the already-approved restructuring in the (superseded) `2026-07-20-onboarding-visual-design.md`. Because this introduces new logic (step navigation, per-step validation gating), it gets real tests.

- [ ] **Step 1: Write the failing validation tests**

```ts
// src/__tests__/onboarding-validate.test.ts
import { validateStep } from '../app/onboarding';

const baseFields = {
  sex: null,
  age: '',
  heightCm: '',
  weightKg: '',
  activityLevel: null,
  goal: null,
  daysPerWeek: '',
  experienceLevel: null,
  equipment: null,
};

describe('validateStep', () => {
  it('rejects step 0 without a sex selected', () => {
    expect(validateStep(0, baseFields)).toBe('Merci de choisir un sexe.');
  });

  it('rejects step 0 with an invalid age', () => {
    expect(
      validateStep(0, { ...baseFields, sex: 'male', age: '0', heightCm: '178', weightKg: '75' })
    ).toBe('Âge invalide.');
  });

  it('accepts a complete step 0', () => {
    expect(
      validateStep(0, { ...baseFields, sex: 'male', age: '28', heightCm: '178', weightKg: '75' })
    ).toBeNull();
  });

  it('rejects step 1 without an activity level', () => {
    expect(validateStep(1, baseFields)).toBe("Merci de choisir un niveau d'activité.");
  });

  it('rejects step 1 without a goal', () => {
    expect(validateStep(1, { ...baseFields, activityLevel: 'moderate' })).toBe('Merci de choisir un objectif.');
  });

  it('rejects step 2 with an out-of-range training days value', () => {
    expect(
      validateStep(2, { ...baseFields, daysPerWeek: '9', experienceLevel: 'beginner', equipment: 'bodyweight' })
    ).toBe("Jours d'entraînement invalides (0 à 7).");
  });

  it('accepts a complete step 2', () => {
    expect(
      validateStep(2, { ...baseFields, daysPerWeek: '4', experienceLevel: 'beginner', equipment: 'bodyweight' })
    ).toBeNull();
  });

  it('accepts step 3 (recap) unconditionally', () => {
    expect(validateStep(3, baseFields)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest onboarding-validate.test.ts`
Expected: FAIL — `validateStep is not a function` (or module has no exported member)

- [ ] **Step 3: Write the failing wizard navigation tests**

```tsx
// src/__tests__/onboarding-wizard.test.tsx
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

function fillStep1(getByText: any, getByTestId: any) {
  fireEvent.press(getByText('Homme'));
  fireEvent.changeText(getByTestId('age-input'), '28');
  fireEvent.changeText(getByTestId('height-input'), '178');
  fireEvent.changeText(getByTestId('weight-input'), '75');
}

function fillStep2(getByText: any) {
  fireEvent.press(getByText('Modérée'));
  fireEvent.press(getByText('Maintien'));
}

function fillStep3(getByText: any, getByTestId: any) {
  fireEvent.changeText(getByTestId('days-input'), '4');
  fireEvent.press(getByText('Intermédiaire'));
  fireEvent.press(getByText('Salle complète'));
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

  it('blocks advancing from step 1 when fields are missing', () => {
    const { getByText, queryByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Continuer'));
    expect(queryByText('Ton activité')).toBeNull();
    expect(getByText('Merci de choisir un sexe.')).toBeTruthy();
  });

  it('advances through all steps, shows the recap, and submits', async () => {
    const { getByText, getByTestId } = render(<OnboardingScreen />);

    fillStep1(getByText, getByTestId);
    fireEvent.press(getByText('Continuer'));
    expect(getByText('Ton activité')).toBeTruthy();

    fillStep2(getByText);
    fireEvent.press(getByText('Continuer'));
    expect(getByText('Ton entraînement')).toBeTruthy();

    fillStep3(getByText, getByTestId);
    fireEvent.press(getByText('Continuer'));
    expect(getByText('Récapitulatif')).toBeTruthy();
    expect(getByText('178 cm')).toBeTruthy();

    fireEvent.press(getByText('Valider'));

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

  it('returns to the previous step via the back link', () => {
    const { getByText, getByTestId } = render(<OnboardingScreen />);
    fillStep1(getByText, getByTestId);
    fireEvent.press(getByText('Continuer'));
    expect(getByText('Ton activité')).toBeTruthy();

    fireEvent.press(getByText('← Retour'));
    expect(getByText('Ton profil')).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx jest onboarding-wizard.test.tsx`
Expected: FAIL — the current single-scroll `onboarding.tsx` has no "Continuer" step-gating, no "← Retour", no recap screen

- [ ] **Step 5: Implement the wizard**

```tsx
// src/app/onboarding.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';
import type { ExperienceLevel, Equipment } from '../lib/profile';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { colors, spacing } from '../theme/tokens';
import type { Sex, ActivityLevel, Goal } from '../lib/nutrition';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light', label: 'Légère' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Très active' },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'cut', label: 'Sèche' },
  { value: 'maintain', label: 'Maintien' },
  { value: 'bulk', label: 'Prise de masse' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'full_gym', label: 'Salle complète' },
  { value: 'home_limited', label: 'Maison (matériel limité)' },
  { value: 'bodyweight', label: 'Poids du corps' },
];

const STEP_TITLES = ['Ton profil', 'Ton activité', 'Ton entraînement', 'Récapitulatif'];
const TOTAL_STEPS = 4;

export type OnboardingFields = {
  sex: Sex | null;
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  daysPerWeek: string;
  experienceLevel: ExperienceLevel | null;
  equipment: Equipment | null;
};

export function validateStep(step: number, fields: OnboardingFields): string | null {
  if (step === 0) {
    if (!fields.sex) return 'Merci de choisir un sexe.';
    const ageNum = Number(fields.age);
    if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum >= 120) return 'Âge invalide.';
    const heightNum = Number(fields.heightCm);
    if (!Number.isFinite(heightNum) || heightNum <= 0) return 'Taille invalide.';
    const weightNum = Number(fields.weightKg);
    if (!Number.isFinite(weightNum) || weightNum <= 0) return 'Poids invalide.';
    return null;
  }
  if (step === 1) {
    if (!fields.activityLevel) return "Merci de choisir un niveau d'activité.";
    if (!fields.goal) return 'Merci de choisir un objectif.';
    return null;
  }
  if (step === 2) {
    const daysNum = Number(fields.daysPerWeek);
    if (!Number.isInteger(daysNum) || daysNum < 0 || daysNum > 7) {
      return "Jours d'entraînement invalides (0 à 7).";
    }
    if (!fields.experienceLevel) return 'Merci de choisir un niveau.';
    if (!fields.equipment) return 'Merci de choisir un matériel.';
    return null;
  }
  return null;
}

export default function OnboardingScreen() {
  const { session, loading } = useAuth();
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

  const fields: OnboardingFields = {
    sex,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goal,
    daysPerWeek,
    experienceLevel,
    equipment,
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleContinue = () => {
    const validationError = validateStep(step, fields);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertProfile(session.user.id, {
        sex: sex!,
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel: activityLevel!,
        goal: goal!,
      });
      await upsertTrainingProfile(session.user.id, {
        daysPerWeek: Number(daysPerWeek),
        experienceLevel: experienceLevel!,
        equipment: equipment!,
      });
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View key={index} style={[styles.segment, index <= step && styles.segmentDone]} />
          ))}
        </View>
        <Text style={styles.stepCounter}>
          {step < TOTAL_STEPS - 1 ? `ÉTAPE ${step + 1}/${TOTAL_STEPS}` : 'RÉCAPITULATIF'}
        </Text>
        <Text style={styles.title}>{STEP_TITLES[step]}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {step === 0 && (
          <>
            <Text style={styles.label}>Sexe</Text>
            <ChoiceGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />
            <TextField label="Âge" value={age} onChangeText={setAge} keyboardType="numeric" testID="age-input" />
            <TextField
              label="Taille (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              testID="height-input"
            />
            <TextField
              label="Poids (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              testID="weight-input"
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.label}>Niveau d'activité quotidienne</Text>
            <ChoiceGroup options={ACTIVITY_OPTIONS} value={activityLevel} onChange={setActivityLevel} />
            <Text style={styles.label}>Objectif</Text>
            <ChoiceGroup options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
          </>
        )}

        {step === 2 && (
          <>
            <TextField
              label="Jours d'entraînement / semaine"
              value={daysPerWeek}
              onChangeText={setDaysPerWeek}
              keyboardType="numeric"
              testID="days-input"
            />
            <Text style={styles.label}>Niveau</Text>
            <ChoiceGroup options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={setExperienceLevel} />
            <Text style={styles.label}>Matériel disponible</Text>
            <ChoiceGroup options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.recapGroup}>Profil</Text>
            <RecapRow label="Sexe" value={SEX_OPTIONS.find((o) => o.value === sex)?.label ?? '—'} />
            <RecapRow label="Âge" value={`${age} ans`} />
            <RecapRow label="Taille" value={`${heightCm} cm`} />
            <RecapRow label="Poids" value={`${weightKg} kg`} />

            <Text style={styles.recapGroup}>Activité</Text>
            <RecapRow
              label="Niveau d'activité"
              value={ACTIVITY_OPTIONS.find((o) => o.value === activityLevel)?.label ?? '—'}
            />
            <RecapRow label="Objectif" value={GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? '—'} />

            <Text style={styles.recapGroup}>Entraînement</Text>
            <RecapRow label="Jours/semaine" value={daysPerWeek} />
            <RecapRow
              label="Niveau"
              value={EXPERIENCE_OPTIONS.find((o) => o.value === experienceLevel)?.label ?? '—'}
            />
            <RecapRow
              label="Matériel"
              value={EQUIPMENT_OPTIONS.find((o) => o.value === equipment)?.label ?? '—'}
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Pressable onPress={handleBack} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Retour</Text>
          </Pressable>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button title="Continuer" onPress={handleContinue} />
        ) : (
          <Button title="Valider" onPress={handleSubmit} loading={submitting} />
        )}
      </View>
    </View>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.divider },
  segmentDone: { backgroundColor: colors.accentRed },
  stepCounter: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.xs },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingTop: spacing.sm },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  error: { color: colors.error, marginTop: spacing.md },
  footer: { padding: spacing.lg },
  backLink: { alignSelf: 'flex-start', marginBottom: spacing.md },
  backLinkText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  recapGroup: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  recapLabel: { color: colors.textSecondary, fontSize: 12 },
  recapValue: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
});
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest onboarding-validate.test.ts onboarding-wizard.test.tsx`
Expected: PASS (8 + 3 tests)

- [ ] **Step 7: Run the full suite and type-check**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 8: Manually verify**

Run: `npx expo start`, open Onboarding as a fresh user, confirm all 4 steps + recap render correctly, back navigation works, and submitting the recap saves the profile and redirects to Home.

- [ ] **Step 9: Commit**

```bash
git add src/app/onboarding.tsx src/__tests__/onboarding-validate.test.ts src/__tests__/onboarding-wizard.test.tsx
git commit -m "Restructure Onboarding into a 4-step wizard with recap"
```

---

### Task 11: Restyle Home

**Files:**
- Modify: `src/app/(tabs)/home.tsx`

**Interfaces:**
- Consumes: `Card` (Task 4), `Button` (Task 2), `colors`, `spacing` (Task 1). Tab bar (Task 7) must already exist since this file lives under `(tabs)/`.

No new test — presentation-only; the profile/target-loading logic and redirects are unchanged. Quick actions are reduced to "Voir mon plan" and "Générer" since Workout/Grocery-list/Weight-log are now one tap away via the tab bar.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/(tabs)/home.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../theme/tokens';

export default function HomeScreen() {
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    let cancelled = false;

    (async () => {
      try {
        const [profile, trainingProfile] = await Promise.all([
          getProfile(session.user.id),
          getTrainingProfile(session.user.id),
        ]);

        if (cancelled) return;

        if (!profile || !trainingProfile) {
          router.replace('/onboarding');
          return;
        }

        setMacros(computeTargetsFromProfile(profile, trainingProfile));
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
        }
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, session]);

  if (loading || !session || checkingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Bonjour</Text>
      <Text style={styles.name}>{session.user.email}</Text>

      {loadError && <Text style={styles.error}>{loadError}</Text>}

      {macros && (
        <Card style={styles.macroCard}>
          <Text style={styles.sectionLabel}>Objectifs du jour</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, styles.macroValueAccent]}>{macros.proteinG}g</Text>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.fatG}g</Text>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.carbsG}g</Text>
              <Text style={styles.macroLabel}>Gluc</Text>
            </View>
          </View>
        </Card>
      )}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <Button title="Voir mon plan" variant="secondary" onPress={() => router.push('/plan')} />
        </View>
        <View style={styles.actionButton}>
          <Button title="Générer" onPress={() => router.push('/generate-plan')} />
        </View>
      </View>

      <View style={styles.signOut}>
        <Button title="Se déconnecter" variant="secondary" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  container: { padding: spacing.lg },
  greeting: { fontSize: 12, color: colors.textSecondary },
  name: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  error: { color: colors.error, marginBottom: spacing.md },
  macroCard: { marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  macroValueAccent: { color: colors.accentRed },
  macroLabel: { fontSize: 9, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  signOut: { marginTop: spacing.xl },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, log in, confirm the macro card, quick actions, and sign-out button render and work, and that the tab bar stays visible.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/home.tsx"
git commit -m "Restyle Home screen with shared design system"
```

---

### Task 12: Restyle Générer le plan (generate-plan)

**Files:**
- Modify: `src/app/generate-plan.tsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `colors`, `radius`, `shadow`, `spacing` (Task 1).

No new test — the day×meal selection grid logic and plan-generation call are unchanged.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/generate-plan.tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, saveWeeklyPlan } from '../lib/mealPlanData';
import { fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';
import { computeAdjustedTargets } from '../lib/progressTracking';
import { generateWeeklyPlan, type MealSlot, type MealType } from '../lib/mealPlan';
import { Button } from '../components/ui/Button';
import { colors, radius, shadow, spacing } from '../theme/tokens';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

function defaultSelection(): boolean[][] {
  return DAY_LABELS.map(() => MEAL_TYPES.map(() => true));
}

export default function GeneratePlanScreen() {
  const { session, loading } = useAuth();
  const [selected, setSelected] = useState<boolean[][]>(defaultSelection());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const toggle = (dayIndex: number, mealIndex: number) => {
    setSelected((prev) =>
      prev.map((row, d) => (d === dayIndex ? row.map((v, m) => (m === mealIndex ? !v : v)) : row))
    );
  };

  const handleGenerate = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setGenerating(true);
    try {
      const [profile, trainingProfile] = await Promise.all([
        getProfile(session.user.id),
        getTrainingProfile(session.user.id),
      ]);

      if (!profile || !trainingProfile) {
        router.replace('/onboarding');
        return;
      }

      const baseTargets = computeTargetsFromProfile(profile, trainingProfile);
      let weightLogs: WeightLogEntry[] = [];
      try {
        weightLogs = await fetchRecentWeightLogs(session.user.id);
      } catch {
        // Progress tracking is a strictly additive enhancement — if fetching weight
        // history fails for any reason, fall back to the base (unadjusted) targets
        // rather than aborting meal-plan generation entirely.
      }
      const targets = computeAdjustedTargets(baseTargets, profile.goal, profile.weightKg, weightLogs);
      const recipes = await fetchRecipes();
      const recipeOptions = recipes.map((r) => ({ id: r.id, mealType: r.mealType, baseCalories: r.baseCalories }));

      const slots: MealSlot[] = [];
      selected.forEach((row, dayIndex) => {
        row.forEach((isSelected, mealIndex) => {
          if (isSelected) slots.push({ dayIndex, mealType: MEAL_TYPES[mealIndex] });
        });
      });

      const entries = generateWeeklyPlan(targets.calories, slots, recipeOptions);
      await saveWeeklyPlan(session.user.id, targets, entries);
      router.replace('/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choisis les repas à générer</Text>
      {DAY_LABELS.map((dayLabel, dayIndex) => (
        <View key={dayLabel} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((mealType, mealIndex) => (
              <Pressable
                key={mealType}
                onPress={() => toggle(dayIndex, mealIndex)}
                style={[styles.cell, selected[dayIndex][mealIndex] && styles.cellSelected]}
              >
                <Text style={selected[dayIndex][mealIndex] ? styles.cellLabelSelected : styles.cellLabel}>
                  {MEAL_TYPE_LABELS[mealType]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Générer le plan" onPress={handleGenerate} loading={generating} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  container: { padding: spacing.lg },
  title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  dayRow: { marginBottom: spacing.md },
  dayLabel: {
    fontWeight: '700',
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  cellSelected: { backgroundColor: colors.accentRed, shadowColor: colors.accentRed, shadowOpacity: 0.25 },
  cellLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  cellLabelSelected: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  error: { color: colors.error, marginTop: spacing.md, marginBottom: spacing.sm },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open "Générer le plan" from Home, confirm the grid toggles correctly and generation still redirects to Plan.

- [ ] **Step 4: Commit**

```bash
git add src/app/generate-plan.tsx
git commit -m "Restyle Générer le plan screen with shared design system"
```

---

### Task 13: Restyle Plan

**Files:**
- Modify: `src/app/(tabs)/plan.tsx`

**Interfaces:**
- Consumes: `Card` (Task 4), `EmptyState` (Task 5), `colors`, `spacing` (Task 1).

No new test — the swap logic and plan loading are unchanged. The redundant "Voir la liste de courses" link is dropped since Grocery-list is now a dedicated tab.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/(tabs)/plan.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../../lib/mealPlanData';
import { pickReplacementRecipe, MEAL_TYPE_RATIOS, clampPortionMultiplier, type MealType } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing } from '../../theme/tokens';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

export default function PlanScreen() {
  const { session, loading } = useAuth();
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const [currentPlan, allRecipes] = await Promise.all([getCurrentPlan(session.user.id), fetchRecipes()]);
      setPlan(currentPlan);
      setRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du plan.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const recipeById = new Map(recipes.map((r) => [r.id, r]));

  const handleSwap = async (entryId: string, mealType: MealType, currentRecipeId: string) => {
    if (!plan) return;
    setSwappingId(entryId);
    setError(null);
    try {
      const recipeOptions = recipes.map((r) => ({ id: r.id, mealType: r.mealType, baseCalories: r.baseCalories }));
      const replacement = pickReplacementRecipe(mealType, currentRecipeId, recipeOptions);
      if (!replacement) {
        setError('Aucune autre recette disponible pour ce repas.');
        return;
      }

      const slotTarget = plan.targetCalories * MEAL_TYPE_RATIOS[mealType];
      const newMultiplier = clampPortionMultiplier(slotTarget / replacement.baseCalories);

      await updatePlanEntry(entryId, replacement.id, newMultiplier);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'échange.");
    } finally {
      setSwappingId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  if (!plan || plan.entries.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>📋</Text>}
          title="Aucun plan pour l'instant"
          message="Génère ton premier plan de repas de la semaine."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {DAY_LABELS.map((dayLabel, dayIndex) => {
        const dayEntries = plan.entries.filter((e) => e.dayIndex === dayIndex);
        if (dayEntries.length === 0) return null;
        return (
          <View key={dayLabel} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{dayLabel}</Text>
            {dayEntries.map((entry) => {
              const recipe = recipeById.get(entry.recipeId);
              return (
                <Card key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryRow}>
                    <Pressable style={styles.entryInfo} onPress={() => router.push(`/recipe/${entry.recipeId}`)}>
                      <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                      <Text style={styles.recipeName}>
                        {recipe ? recipe.name : entry.recipeId} ({Math.round(entry.portionMultiplier * 100)}%)
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSwap(entry.id, entry.mealType, entry.recipeId)}
                      disabled={swappingId === entry.id}
                    >
                      <Text style={styles.swapHint}>{swappingId === entry.id ? '...' : 'Échanger'}</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  container: { padding: spacing.lg },
  dayBlock: { marginBottom: spacing.lg },
  dayLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  entryCard: { marginBottom: spacing.sm },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mealTypeLabel: { width: 80, color: colors.textSecondary, fontSize: 11 },
  recipeName: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  swapHint: { color: colors.accentRed, marginLeft: spacing.md, fontSize: 12, fontWeight: '700' },
  error: { color: colors.error, marginBottom: spacing.md },
  emptyIcon: { fontSize: 32 },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open the Plan tab with and without an existing plan, confirm the empty state and the day-grouped cards with "Échanger" both work.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/plan.tsx"
git commit -m "Restyle Plan screen with shared design system"
```

---

### Task 14: Restyle Détail recette (recipe/[id])

**Files:**
- Modify: `src/app/recipe/[id].tsx`

**Interfaces:**
- Consumes: `Card` (Task 4), `colors`, `spacing` (Task 1).

No new test — data loading is unchanged.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/recipe/[id].tsx
import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  fetchRecipes,
  fetchRecipeIngredients,
  fetchRecipeInstructions,
  type Recipe,
  type RecipeIngredient,
} from '../../lib/mealPlanData';
import { Card } from '../../components/ui/Card';
import { colors, spacing } from '../../theme/tokens';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [allRecipes, allIngredients, steps] = await Promise.all([
        fetchRecipes(),
        fetchRecipeIngredients([id]),
        fetchRecipeInstructions(id),
      ]);
      setRecipe(allRecipes.find((r) => r.id === id) ?? null);
      setIngredients(allIngredients);
      setInstructions(steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la recette.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Recette introuvable.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.macros}>
        {recipe.baseCalories} kcal — {recipe.baseProteinG}g prot / {recipe.baseFatG}g lip / {recipe.baseCarbsG}g gluc (
        {recipe.baseServingG}g)
      </Text>

      <Text style={styles.sectionTitle}>Ingrédients</Text>
      <Card style={styles.card}>
        {ingredients.map((ing, index) => (
          <Text key={index} style={styles.ingredientLine}>
            {ing.ingredientName} — {ing.quantity}
            {ing.unit}
          </Text>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Préparation</Text>
      {instructions.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  container: { padding: spacing.lg },
  title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  macros: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: { marginBottom: spacing.sm },
  ingredientLine: { color: colors.textPrimary, fontSize: 13, marginBottom: spacing.xs },
  stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  stepText: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  error: { color: colors.error },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open a recipe from the Plan screen, confirm macros header, ingredients card, and numbered steps render correctly.

- [ ] **Step 4: Commit**

```bash
git add "src/app/recipe/[id].tsx"
git commit -m "Restyle Détail recette screen with shared design system"
```

---

### Task 15: Restyle Programme musculation (workout)

**Files:**
- Modify: `src/app/(tabs)/workout.tsx`

**Interfaces:**
- Consumes: `Card` (Task 4), `Button` (Task 2), `colors`, `spacing` (Task 1).

No new test — program assignment/generation/regeneration logic is unchanged.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/(tabs)/workout.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile } from '../../lib/profile';
import { selectTemplate } from '../../lib/workoutTemplate';
import { generateWorkoutProgram } from '../../lib/workoutProgram';
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchTemplateDaySlots,
  fetchExercisePool,
  saveGeneratedProgram,
  fetchProgramDetails,
  type WorkoutProgram,
} from '../../lib/workoutProgramData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../theme/tokens';

export default function WorkoutScreen() {
  const { session, loading } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [checking, setChecking] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExercise = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const assignAndLoad = useCallback(async (userId: string, forceRegenerate: boolean) => {
    const trainingProfile = await getTrainingProfile(userId);
    if (!trainingProfile) {
      router.replace('/onboarding');
      return;
    }

    const templates = await fetchWorkoutTemplates();
    let templateId = forceRegenerate ? null : await getAssignedTemplateId(userId);
    let needsGeneration = forceRegenerate;

    if (!templateId) {
      const selected = selectTemplate(trainingProfile, templates);
      if (!selected) {
        setError('Aucun programme disponible pour ton profil.');
        return;
      }
      await saveWorkoutProgram(userId, selected.id);
      templateId = selected.id;
      needsGeneration = true;
    }

    const generateAndSaveProgram = async (id: string) => {
      const template = templates.find((t) => t.id === id)!;
      const [archetypes, pool] = await Promise.all([
        fetchTemplateDaySlots(id),
        fetchExercisePool(template.equipment),
      ]);
      const generatedDays = generateWorkoutProgram(template.daysPerWeek, archetypes, pool);
      await saveGeneratedProgram(userId, generatedDays);
    };

    if (needsGeneration) {
      await generateAndSaveProgram(templateId);
    }

    let details = await fetchProgramDetails(userId, templateId);

    if (!needsGeneration && details.days.length === 0) {
      await generateAndSaveProgram(templateId);
      details = await fetchProgramDetails(userId, templateId);
    }

    setProgram(details);
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      await assignAndLoad(session.user.id, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du programme.');
    } finally {
      setChecking(false);
    }
  }, [session, assignAndLoad]);

  const handleRegenerate = async () => {
    if (!session) return;
    setRegenerating(true);
    setError(null);
    try {
      await assignAndLoad(session.user.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la régénération.');
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {program && (
        <>
          <Text style={styles.title}>{program.templateName}</Text>
          {program.days.map((day) => (
            <View key={day.dayNumber} style={styles.dayBlock}>
              <Text style={styles.dayLabel}>{day.name}</Text>
              {day.exercises.map((exercise, index) => {
                const key = `${day.dayNumber}-${index}`;
                const isExpanded = expanded.has(key);
                return (
                  <Pressable key={index} onPress={() => toggleExercise(key)}>
                    <Card style={styles.exerciseCard}>
                      <Text style={styles.exerciseName}>
                        {exercise.name} — {exercise.sets} x {exercise.repsMin}-{exercise.repsMax}
                      </Text>
                      <Text style={styles.exerciseMeta}>{exercise.muscleGroup}</Text>
                      {isExpanded && (
                        <View style={styles.instructionsBlock}>
                          {exercise.instructions.map((step, stepIndex) => (
                            <Text key={stepIndex} style={styles.instructionLine}>
                              {stepIndex + 1}. {step}
                            </Text>
                          ))}
                        </View>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}
      <View style={styles.regenerateWrap}>
        <Button title="Régénérer le programme" variant="secondary" onPress={handleRegenerate} loading={regenerating} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  container: { padding: spacing.lg },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  dayBlock: { marginBottom: spacing.lg },
  dayLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  exerciseCard: { marginBottom: spacing.sm },
  exerciseName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  exerciseMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  instructionsBlock: { marginTop: spacing.sm },
  instructionLine: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs },
  error: { color: colors.error, marginBottom: spacing.md },
  regenerateWrap: { marginTop: spacing.md },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open the Muscu tab, confirm exercises are grouped by day, tapping one expands its instructions, and "Régénérer le programme" still works.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/workout.tsx"
git commit -m "Restyle Programme musculation screen with shared design system"
```

---

### Task 16: Restyle Liste de courses (grocery-list)

**Files:**
- Modify: `src/app/(tabs)/grocery-list.tsx`

**Interfaces:**
- Consumes: `Card` (Task 4), `EmptyState` (Task 5), `colors`, `spacing` (Task 1).

No new test — ingredient aggregation logic is unchanged.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/(tabs)/grocery-list.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../../lib/mealPlanData';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing } from '../../theme/tokens';

type AggregatedIngredient = { name: string; quantity: number; unit: string };

export default function GroceryListScreen() {
  const { session, loading } = useAuth();
  const [items, setItems] = useState<AggregatedIngredient[]>([]);
  const [hasPlan, setHasPlan] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const plan = await getCurrentPlan(session.user.id);
      if (!plan || plan.entries.length === 0) {
        setHasPlan(false);
        setItems([]);
        return;
      }
      setHasPlan(true);

      const recipeIds = Array.from(new Set(plan.entries.map((e) => e.recipeId)));
      const ingredients = await fetchRecipeIngredients(recipeIds);

      const totals = new Map<string, AggregatedIngredient>();
      for (const entry of plan.entries) {
        const recipeIngredients = ingredients.filter((i) => i.recipeId === entry.recipeId);
        for (const ingredient of recipeIngredients) {
          const key = `${ingredient.ingredientName}|${ingredient.unit}`;
          const scaledQuantity = ingredient.quantity * entry.portionMultiplier;
          const existing = totals.get(key);
          if (existing) {
            existing.quantity += scaledQuantity;
          } else {
            totals.set(key, { name: ingredient.ingredientName, quantity: scaledQuantity, unit: ingredient.unit });
          }
        }
      }

      setItems(Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la liste de courses.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>🛒</Text>}
          title="Aucun plan pour l'instant"
          message="Génère un plan de repas pour obtenir ta liste de courses."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Liste de courses</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Card>
        {items.map((item, index) => (
          <View
            key={`${item.name}|${item.unit}`}
            style={[styles.row, index === items.length - 1 && styles.rowLast]}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.quantity}>
              {Math.round(item.quantity * 10) / 10} {item.unit}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  container: { padding: spacing.lg },
  title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  name: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  quantity: { color: colors.textSecondary, fontSize: 12 },
  error: { color: colors.error, marginBottom: spacing.md },
  emptyIcon: { fontSize: 32 },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open the Courses tab with and without an existing plan, confirm the empty state and the ingredient list both render correctly.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/grocery-list.tsx"
git commit -m "Restyle Liste de courses screen with shared design system"
```

---

### Task 17: Restyle Suivi de poids (weight-log)

**Files:**
- Modify: `src/app/(tabs)/weight-log.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 3), `Button` (Task 2), `Card` (Task 4), `colors`, `spacing` (Task 1).

No new test — weight logging/fetching logic is unchanged.

- [ ] **Step 1: Replace the screen**

```tsx
// src/app/(tabs)/weight-log.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../../lib/weightLogData';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors, spacing } from '../../theme/tokens';

export default function WeightLogScreen() {
  const { session, loading } = useAuth();
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const recent = await fetchRecentWeightLogs(session.user.id);
      setLogs(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSubmit = async () => {
    setError(null);
    const weightNum = Number(weightInput);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setError('Poids invalide.');
      return;
    }
    if (!session) return;

    setSubmitting(true);
    try {
      await logWeight(session.user.id, weightNum);
      setWeightInput('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Suivi de poids</Text>
      <TextField label="Poids (kg)" value={weightInput} onChangeText={setWeightInput} keyboardType="numeric" />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} />

      <Text style={styles.historyTitle}>Historique</Text>
      {logs.length === 0 ? (
        <Text style={styles.emptyText}>Aucune pesée enregistrée.</Text>
      ) : (
        <Card>
          {logs.map((log, index) => (
            <View key={log.id} style={[styles.row, index === logs.length - 1 && styles.rowLast]}>
              <Text style={styles.date}>{log.loggedAt}</Text>
              <Text style={styles.weight}>{log.weightKg} kg</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  container: { padding: spacing.lg },
  title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  historyTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  date: { color: colors.textPrimary, fontSize: 12 },
  weight: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  error: { color: colors.error, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 12 },
});
```

- [ ] **Step 2: Verify it type-checks and existing tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS

- [ ] **Step 3: Manually verify**

Run: `npx expo start`, open the Poids tab, log a new weight, confirm it appears in the history list styled as a card.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/weight-log.tsx"
git commit -m "Restyle Suivi de poids screen with shared design system"
```

---

### Task 18: Full end-to-end manual verification

**Files:** none (verification only)

**Interfaces:** none — this task exercises the whole app built by Tasks 1–17.

- [ ] **Step 1: Run the full automated suite one more time**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS, 0 failures

- [ ] **Step 2: Walk the full app manually**

Run: `npx expo start`, then on a simulator/device or web:
1. Sign up a new test account → confirm the styled Signup screen and confirmation message.
2. Log in → confirm the styled Login screen.
3. Complete Onboarding as a fresh user → confirm all 4 steps + recap, back navigation, and successful submission to Home.
4. On Home, confirm the macro card and the "Voir mon plan"/"Générer" quick actions.
5. Confirm the bottom tab bar (Accueil/Plan/Muscu/Courses/Poids) is visible and each tab icon (including the "kg" badge) renders and switches screens correctly.
6. Generate a plan from "Générer" → confirm the day×meal grid and redirect to Plan.
7. On Plan, tap a recipe → confirm the styled Détail recette screen; go back and tap "Échanger" → confirm it still swaps.
8. On Muscu, expand an exercise → confirm instructions show; tap "Régénérer le programme".
9. On Courses, confirm the aggregated ingredient list (or the empty state if no plan exists).
10. On Poids, log a weight and confirm it appears in the history card.

Expected: every screen matches the approved "Soft Neutral" mockups (colors, cards, buttons, tab bar with icons) and no existing functionality regresses.

- [ ] **Step 3: Report back**

If anything looks off versus the approved design, note it — do not fix silently; confirm with the user first since visual nuances (spacing, exact shade) are subjective and may need a follow-up tweak rather than a full redo.

---
