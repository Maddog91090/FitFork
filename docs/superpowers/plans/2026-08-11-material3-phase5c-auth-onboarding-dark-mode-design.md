# Material 3 Phase 5c — Auth/Onboarding, Orphaned Components, Dark Mode Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the last 11 files still on the claymorphic token system (7 auth/onboarding screens + `ErrorNotice`/`TextField`/`Sparkline`) onto Material 3, delete the dead `KgIcon.tsx`, make root `_layout.tsx` scheme-aware, then flip `app.json`'s `userInterfaceStyle` to `"automatic"` — activating dark mode across the entire app for the first time.

**Architecture:** Same mechanical token-remapping approach as Phases 5a/5b: each file swaps `useThemeColors()`/`typography` for `useMaterialColors()`/`useMaterialTertiary('progress')`/`materialTypography` via the shared color-mapping table below. No component's public prop API changes. No new components. The final two tasks are the actual "activation" (root layout + config) and a mandatory manual device check — everything before that is invisible in light mode until those land.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router, `react-native-reanimated`, `expo-image`, Jest + `jest-expo` + `@testing-library/react-native`.

## Global Constraints

- `npx tsc --noEmit` and `npx jest` must be clean (zero new errors/failures) before any task is considered done. Re-verify the exact pre-existing error/failure count at the start of execution — do not reuse a number from a previous phase.
- No EAS build is triggered by any task in this plan.
- Every interactive element keeps (or gains, where currently missing) `accessibilityRole` and a minimum 48dp touch target (`state.minTouchSize`, `state.hitSlop` where the visual target is smaller).
- No existing route changes URL.
- **Fixed domain rule:** every auth/onboarding screen uses `useMaterialTertiary('progress')` — none of these screens use the nutrition/sport/neutral domain system. `Button`, `ChoiceGroup`, and `TextField` already default to `'progress'` when no `domain` prop is passed (verified in `src/theme/tokens.ts:428` and `src/components/ui/Button.tsx:39`), so call sites that don't pass a domain need no change on that account.
- **Color/typography mapping table** (identical to Phases 5a/5b):

  | Old (`useThemeColors()` field / `typography.*`) | New | Note |
  | --- | --- | --- |
  | `colors.bgBase` | `useMaterialColors().background` | |
  | `colors.bgSurface` | `useMaterialColors().surface` | |
  | `colors.bgSunken` | `useMaterialColors().surfaceVariant` | |
  | `colors.textPrimary` | `useMaterialColors().onSurface` | |
  | `colors.textSecondary` | `useMaterialColors().onSurfaceVariant` | |
  | `colors.divider` / `colors.border` | `useMaterialColors().outlineVariant` | |
  | `colors.borderStrong` | `useMaterialColors().outline` | |
  | `colors.error` | `useMaterialColors().error` | |
  | `colors.textOnAccent` | `useMaterialTertiary('progress').onTertiary` | |
  | `colors.accentRed` (fills) | `useMaterialTertiary('progress').tertiary` | |
  | `colors.accentRedDeep` (colored body-sized text) | `useMaterialTertiary('progress').tertiaryContainer` | same hex as before |
  | `shadow.card` (on a raw `View`) | `materialElevation` | |
  | `typography.hero` | `materialTypography.displayLarge` | |
  | `typography.display` | `materialTypography.displayMedium` | |
  | `typography.title` | `materialTypography.titleLarge` | |
  | `typography.metric` | `materialTypography.headlineLarge` | |
  | `typography.heading` | `materialTypography.titleMedium` | |
  | `typography.subheading` | `materialTypography.titleSmall` | |
  | `typography.body` | `materialTypography.bodyLarge` | |
  | `typography.bodyStrong` | `materialTypography.bodyMedium` | |
  | `typography.label` | `materialTypography.labelLarge` | |
  | `typography.caption` | `materialTypography.labelMedium` | |
  | `typography.captionStrong` | `materialTypography.labelSmall` | |
  | `typography.overline` | `materialTypography.overline` | same key name |

  `spacing`, `radius`, `centeredContent`, `motion`, `state`, `fontFamily` are unchanged legacy exports — keep using them as-is.
- **Ripple convention** (established in Phases 4/5a/5b, applies to any `Pressable` this plan touches): `android_ripple={{ color: withRippleAlpha(hex) }}` — domain-tinted (`useMaterialTertiary('progress')`'s matching field) for domain-branded elements, `colors.onSurfaceVariant`-tinted for neutral text links (matches `BackLink.tsx`'s existing pattern). Pair with `style={({ pressed }) => [styles.x, pressed && styles.xPressed]}` (`opacity: 0.85`) as the iOS/web fallback, and `accessibilityRole="button"`.
- The final task's manual on-device verification (light AND forced-dark) is a hard blocker before this plan's PR can be proposed for merge — not a recommendation. See Task 12.

---

### Task 1: Delete dead code (`KgIcon.tsx`) and confirm `index.tsx` needs no migration

**Files:**
- Delete: `src/components/icons/KgIcon.tsx`
- Delete: `src/__tests__/KgIcon.test.tsx`
- Verify only (no change): `src/app/index.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing later tasks depend on. This task only removes dead code and establishes the tsc/jest baseline the rest of the plan is measured against.

- [ ] **Step 1: Confirm `KgIcon` has zero consumers**

Run: `grep -rn "KgIcon" src --include="*.tsx" --include="*.ts"`
Expected: only `src/components/icons/KgIcon.tsx` (definition) and `src/__tests__/KgIcon.test.tsx` (its test) appear. If any other file appears, STOP and report — do not delete, the dead-code premise would be wrong.

- [ ] **Step 2: Delete the two files**

```bash
git rm src/components/icons/KgIcon.tsx src/__tests__/KgIcon.test.tsx
```

- [ ] **Step 3: Confirm `src/app/index.tsx` has no theme tokens to migrate**

Open `src/app/index.tsx` and confirm it contains no import from `../theme/tokens` and no `useThemeColors`/`typography` usage — it should be exactly this trivial redirect screen:

```tsx
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(session ? '/home' : '/login');
    }
  }, [loading, session]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }}>
      <ActivityIndicator />
    </View>
  );
}
```

If it matches (or is otherwise confirmed token-free), no change is needed — do not add one. If it has drifted and now uses theme tokens, STOP and report to the human partner: the plan's scope assumption for this file is wrong.

- [ ] **Step 4: Establish the tsc/jest baseline**

Run: `npx tsc --noEmit` — record the exact error count (expect it to shrink by the errors that were only in `KgIcon.test.tsx`, if any; the plan's Global Constraints refer to this fresh count, not any number from a previous phase).
Run: `npx jest` — record the exact suite/test counts (expect exactly one fewer suite than before, since `KgIcon.test.tsx` is gone).
Expected: no failures beyond the pre-existing baseline.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete dead KgIcon component and its test

Exhaustive grep confirms zero consumers anywhere in src/ besides its
own file and test — the tab icon before TabIcon was rebuilt on
MaterialIcons in Phase 4."
```

---

### Task 2: Migrate `ErrorNotice.tsx`

**Files:**
- Modify: `src/components/ui/ErrorNotice.tsx`
- Test (no changes expected, verify only): `src/__tests__/ErrorNotice.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors`, `materialTypography`, `spacing` from `../../theme/tokens`; `Button` from `./Button` (unchanged).
- Produces: `ErrorNotice({ message, onRetry })` — same public API as before. Rendered (unchanged call sites) by 8 already-Material-ized screens plus this phase's auth screens.

- [ ] **Step 1: Replace the file's content**

Full new content for `src/components/ui/ErrorNotice.tsx`:

```tsx
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { materialTypography, spacing, useMaterialColors, type MaterialColorScheme } from '../../theme/tokens';

type ErrorNoticeProps = { message: string; onRetry: () => void; };

export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Button title="Réessayer" variant="secondary" onPress={onRetry} />
    </View>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    message: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.sm },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Run the existing test**

Run: `npx jest ErrorNotice`
Expected: PASS, unchanged (`ErrorNotice.test.tsx` asserts on rendered text and the retry callback, not on colors — no test edit needed).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ErrorNotice.tsx
git commit -m "feat: migrate ErrorNotice to Material 3 tokens"
```

---

### Task 3: Migrate `TextField.tsx`

**Files:**
- Modify: `src/components/ui/TextField.tsx`
- Test (no changes expected, verify only): `src/__tests__/TextField.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors`, `useMaterialTertiary`, `materialTypography`, `materialElevation`, `radius`, `spacing` from `../../theme/tokens`.
- Produces: `TextField(props)` — same public API as before (no `domain` prop added). Focus-ring color is fixed to `useMaterialTertiary('progress').tertiary`, which is the exact color every current caller already gets today (both `weight-log.tsx` and every auth screen render through the legacy `accentRed` token, itself already repointed to `domainProgress` — this migration changes nothing about which color renders for any existing caller).

- [ ] **Step 1: Replace the file's content**

Full new content for `src/components/ui/TextField.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import {
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

type TextFieldProps = {
  label?: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean; autoCapitalize?: TextInputProps['autoCapitalize']; testID?: string;
};

export function TextField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, testID }: TextFieldProps) {
  const colors = useMaterialColors();
  const focus = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, focus.tertiary), [colors, focus]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        testID={testID}
        style={[styles.input, focused && styles.inputFocused]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, focusColor: string) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
    input: {
      ...materialTypography.bodyLarge, backgroundColor: colors.surface, borderRadius: radius.sm,
      paddingVertical: spacing.md, paddingHorizontal: spacing.md,
      borderWidth: 1, borderColor: colors.outlineVariant, color: colors.onSurface, ...materialElevation,
    },
    inputFocused: {
      borderWidth: 2, borderColor: focusColor,
      paddingVertical: spacing.md - 1, paddingHorizontal: spacing.md - 1,
    },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Run the existing test**

Run: `npx jest TextField`
Expected: PASS, unchanged (`TextField.test.tsx` asserts on label/value rendering and `onChangeText`, not colors — no test edit needed).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/TextField.tsx
git commit -m "feat: migrate TextField to Material 3 tokens"
```

---

### Task 4: Migrate `Sparkline.tsx`

**Files:**
- Modify: `src/components/ui/Sparkline.tsx`
- Test (no changes expected, verify only): `src/__tests__/Sparkline.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors` from `../../theme/tokens`.
- Produces: `Sparkline(props)` — same public API as before. Only consumer: `weight-log.tsx` (already Material-ized).

- [ ] **Step 1: Replace the file's content**

Full new content for `src/components/ui/Sparkline.tsx`:

```tsx
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useMaterialColors, type MaterialColorScheme } from '../../theme/tokens';

const STROKE = 2;
const MARKER = 8;
/** Marker radius plus its surface ring, so the last point is never clipped. */
const PADDING = MARKER / 2 + 2;

type SparklineProps = {
  /** Chronological, oldest first. Fewer than two points renders nothing. */
  values: number[];
  width: number;
  height?: number;
  accessibilityLabel?: string;
};

/**
 * A single-series trend line, drawn with rotated views rather than a charting
 * dependency — at ten points that is cheaper than pulling in SVG.
 *
 * The line is secondary ink and the current point is primary: emphasis without
 * spending the brand red, which belongs to the screen's one primary action.
 * The history list underneath is the accessible table view of the same data.
 */
export function Sparkline({ values, width, height = 64, accessibilityLabel }: SparklineProps) {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (values.length < 2 || width <= 0) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const plotHeight = height - PADDING * 2;

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    // A flat series sits on the middle rather than collapsing onto an edge.
    y: PADDING + (span === 0 ? plotHeight / 2 : (1 - (value - min) / span) * plotHeight),
  }));

  const last = points[points.length - 1];

  return (
    <View
      style={[styles.container, { width, height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {points.slice(0, -1).map((from, index) => {
        const to = points[index + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                left: from.x,
                top: from.y - STROKE / 2,
                width: Math.hypot(dx, dy),
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
              },
            ]}
          />
        );
      })}
      <View style={[styles.marker, { left: last.x - MARKER / 2, top: last.y - MARKER / 2 }]} />
    </View>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    container: {
      position: 'relative',
    },
    segment: {
      position: 'absolute',
      height: STROKE,
      backgroundColor: colors.onSurfaceVariant,
      transformOrigin: 'left center',
    },
    marker: {
      position: 'absolute',
      width: MARKER,
      height: MARKER,
      borderRadius: MARKER / 2,
      backgroundColor: colors.onSurface,
      // Surface ring so the point stays legible where the line runs under it.
      borderWidth: 2,
      borderColor: colors.surface,
    },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Run the existing test**

Run: `npx jest Sparkline`
Expected: PASS, unchanged (`Sparkline.test.tsx` asserts on segment count/positions, not colors — no test edit needed).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Sparkline.tsx
git commit -m "feat: migrate Sparkline to Material 3 tokens"
```

---

### Task 5: Migrate `login.tsx`

**Files:**
- Modify: `src/app/login.tsx`
- Test: none exists for this screen — verify via `npx tsc --noEmit` only.

**Interfaces:**
- Consumes: `useMaterialColors`, `useMaterialTertiary`, `materialTypography`, `centeredContent`, `spacing`, `radius`, `materialElevation` from `../theme/tokens`. `TextField`/`Button` unchanged (Tasks 3 and pre-existing).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the file's content**

Full new content for `src/app/login.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import {
  centeredContent,
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../theme/tokens';

export default function LoginScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer), [colors, accent]);
  const insets = useSafeAreaInsets();
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
      setError(translateAuthError(error));
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />
        </View>
        <Text style={styles.brand}>FitPro</Text>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Se connecter" onPress={handleSubmit} loading={submitting} />

        <Link href="/signup" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Pas de compte ? <Text style={styles.switchTextAccent}>Créer un compte</Text>
          </Text>
        </Link>

        <Link href="/forgot-password" style={styles.forgotLink}>
          <Text style={styles.switchText}>
            Mot de passe oublié ? <Text style={styles.switchTextAccent}>Réinitialiser</Text>
          </Text>
        </Link>
      </View>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, accentDeep: string) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent },
    logoWrap: {
      width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
      marginBottom: spacing.sm, padding: spacing.sm, ...materialElevation,
    },
    logo: { width: '100%', height: '100%' },
    brand: { ...materialTypography.displayMedium, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.xl },
    forgotLink: { marginTop: spacing.sm, textAlign: 'center' },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...materialTypography.labelMedium, textAlign: 'center', color: colors.onSurfaceVariant },
    switchTextAccent: { ...materialTypography.labelSmall, color: accentDeep },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Commit**

```bash
git add src/app/login.tsx
git commit -m "feat: migrate login screen to Material 3 tokens"
```

---

### Task 6: Migrate `signup.tsx`

**Files:**
- Modify: `src/app/signup.tsx`
- Test: none exists for this screen — verify via `npx tsc --noEmit` only.

**Interfaces:**
- Consumes: same as Task 5.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the file's content**

Full new content for `src/app/signup.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import {
  centeredContent,
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../theme/tokens';

export default function SignupScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer), [colors, accent]);
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
      return;
    }
    setConfirmationSent(true);
  };

  if (confirmationSent) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.confirmText}>
            Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.
          </Text>
          <Link href="/login" style={styles.switchLink}>
            <Text style={styles.switchTextAccent}>Aller à la connexion</Text>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />
        </View>
        <Text style={styles.brand}>FitPro</Text>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
        <TextField label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Créer un compte" onPress={handleSubmit} loading={submitting} />

        <Link href="/login" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Déjà un compte ? <Text style={styles.switchTextAccent}>Se connecter</Text>
          </Text>
        </Link>
      </View>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, accentDeep: string) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent },
    logoWrap: {
      width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
      marginBottom: spacing.sm, padding: spacing.sm, ...materialElevation,
    },
    logo: { width: '100%', height: '100%' },
    brand: { ...materialTypography.displayMedium, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.xl },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...materialTypography.labelMedium, textAlign: 'center', color: colors.onSurfaceVariant },
    switchTextAccent: { ...materialTypography.labelSmall, color: accentDeep },
    confirmText: { ...materialTypography.bodyLarge, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.lg },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Commit**

```bash
git add src/app/signup.tsx
git commit -m "feat: migrate signup screen to Material 3 tokens"
```

---

### Task 7: Migrate `forgot-password.tsx`

**Files:**
- Modify: `src/app/forgot-password.tsx`
- Test: none exists for this screen — verify via `npx tsc --noEmit` only.

**Interfaces:**
- Consumes: same as Task 5.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the file's content**

Full new content for `src/app/forgot-password.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { translateAuthError } from '../lib/authErrors';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import {
  centeredContent,
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../theme/tokens';

export default function ForgotPasswordScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer), [colors, accent]);
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Entre ton email ci-dessus.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.confirmText}>Email envoyé si ce compte existe. Vérifie ta boîte mail.</Text>
          <Link href="/login" style={styles.switchLink}>
            <Text style={styles.switchTextAccent}>Aller à la connexion</Text>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />
        </View>
        <Text style={styles.brand}>Mot de passe oublié</Text>
        <Text style={styles.hint}>Entre ton email, on t'envoie un lien pour choisir un nouveau mot de passe.</Text>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Envoyer le lien" onPress={handleSubmit} loading={submitting} />

        <Link href="/login" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Retour à la <Text style={styles.switchTextAccent}>connexion</Text>
          </Text>
        </Link>
      </View>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, accentDeep: string) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent },
    logoWrap: {
      width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
      marginBottom: spacing.sm, padding: spacing.sm, ...materialElevation,
    },
    logo: { width: '100%', height: '100%' },
    brand: { ...materialTypography.displayMedium, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.sm },
    hint: { ...materialTypography.bodyLarge, textAlign: 'center', color: colors.onSurfaceVariant, marginBottom: spacing.xl },
    confirmText: { ...materialTypography.bodyLarge, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.lg },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
    switchLink: { marginTop: spacing.lg, textAlign: 'center' },
    switchText: { ...materialTypography.labelMedium, textAlign: 'center', color: colors.onSurfaceVariant },
    switchTextAccent: { ...materialTypography.labelSmall, color: accentDeep },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Commit**

```bash
git add src/app/forgot-password.tsx
git commit -m "feat: migrate forgot-password screen to Material 3 tokens"
```

---

### Task 8: Migrate `auth/reset-password.tsx`

**Files:**
- Modify: `src/app/auth/reset-password.tsx`
- Test: none exists for this screen — verify via `npx tsc --noEmit` only.

**Interfaces:**
- Consumes: `useMaterialColors`, `materialTypography`, `centeredContent`, `spacing` from `../../theme/tokens`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the file's content**

Full new content for `src/app/auth/reset-password.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { translateAuthError } from '../../lib/authErrors';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import {
  centeredContent,
  materialTypography,
  spacing,
  useMaterialColors,
  type MaterialColorScheme,
} from '../../theme/tokens';

export default function ResetPasswordScreen() {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error));
      return;
    }
    router.replace('/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.brand}>Nouveau mot de passe</Text>

        <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
        <TextField label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} />
      </View>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent },
    brand: { ...materialTypography.displayMedium, textAlign: 'center', color: colors.onSurface, marginBottom: spacing.xl },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/reset-password.tsx
git commit -m "feat: migrate reset-password screen to Material 3 tokens"
```

---

### Task 9: Migrate `auth/callback.tsx`

**Files:**
- Modify: `src/app/auth/callback.tsx`
- Test: none exists for this screen — verify via `npx tsc --noEmit` only.

**Interfaces:**
- Consumes: `useMaterialColors`, `useMaterialTertiary`, `materialTypography`, `centeredContent`, `spacing` from `../../theme/tokens`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the file's content**

Full new content for `src/app/auth/callback.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useLinkingURL } from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../../lib/supabase';
import { translateAuthError } from '../../lib/authErrors';
import {
  centeredContent,
  materialTypography,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

export default function AuthCallbackScreen() {
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent.tertiaryContainer), [colors, accent]);
  const insets = useSafeAreaInsets();
  const url = useLinkingURL();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode || params.error) {
      setError(
        params.error_code === 'otp_expired'
          ? 'Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.'
          : 'Lien invalide ou expiré.'
      );
      return;
    }
    if (!params.access_token || !params.refresh_token) {
      setError("Lien invalide : jetons de session manquants.");
      return;
    }
    supabase.auth
      .setSession({ access_token: params.access_token, refresh_token: params.refresh_token })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError(translateAuthError(sessionError));
          return;
        }
        router.replace(params.type === 'recovery' ? '/auth/reset-password' : '/home');
      });
  }, [url]);

  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.error}>{error}</Text>
          <Link href="/login" style={styles.link}>
            <Text style={styles.linkText}>Aller à la connexion</Text>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={accent.tertiary} />
      <Text style={styles.message}>Confirmation en cours…</Text>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, accentDeep: string) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.background },
    content: { ...centeredContent, alignItems: 'center' },
    message: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant, marginTop: spacing.md },
    error: { ...materialTypography.bodyLarge, color: colors.error, textAlign: 'center', marginBottom: spacing.lg },
    link: { marginTop: spacing.sm },
    linkText: { ...materialTypography.labelSmall, color: accentDeep },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/callback.tsx
git commit -m "feat: migrate auth callback screen to Material 3 tokens"
```

---

### Task 10: Migrate `onboarding.tsx`

**Files:**
- Modify: `src/app/onboarding.tsx`
- Test (no color/style assertions, verify only — do not edit): `src/__tests__/onboarding.test.tsx`, `src/__tests__/onboarding-wizard.test.tsx`, `src/__tests__/onboarding-validate.test.ts`

**Interfaces:**
- Consumes: `useMaterialColors`, `useMaterialTertiary`, `materialTypography`, `materialElevation` is NOT needed here (no raw-View shadow in this screen), `centeredContent`, `spacing`, `motion`, `state`, `withRippleAlpha` from `../theme/tokens`. `ChoiceGroup`, `TextField`, `Button` unchanged (no `domain` prop passed anywhere in this file — all three already default to `'progress'`, matching this screen's fixed domain).
- Produces: `OnboardingFields` type and `validateStep` function — **unchanged**, both are pure logic with zero tokens; do not touch them. `Styles = ReturnType<typeof createStyles>` — the type `ProgressSegment` and `RecapRow` destructure `styles` from — must still resolve correctly after `createStyles`'s parameter type changes from `ThemeColors` to `MaterialColorScheme`; no other change needed to those two sub-components' signatures since they take `styles: Styles`, not `colors` directly.

**Note on the two in-file `Pressable` links** ("← Retour" and "Plus tard"): the current file has neither `accessibilityRole` nor `android_ripple` on either. This plan's Global Constraints require `accessibilityRole` on every interactive element, and the established ripple convention (already applied identically to `BackLink.tsx`'s "‹ Retour" and `workout-session.tsx`'s "Quitter") is a neutral, `onSurfaceVariant`-tinted ripple with an opacity-fallback for iOS/web. Bring both `Pressable`s in this file up to that same standard while migrating their colors — this is applying an existing, already-decided convention, not new scope.

- [ ] **Step 1: Replace the file's content**

Full new content for `src/app/onboarding.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth-context';
import { upsertProfile, upsertTrainingProfile } from '../lib/profile';
import { enableNotifications } from '../lib/pushNotifications';
import type { ExperienceLevel, Equipment } from '../lib/profile';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import {
  centeredContent,
  materialTypography,
  motion,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  withRippleAlpha,
  type MaterialColorScheme,
} from '../theme/tokens';
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
    if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum >= 120) return 'Âge invalide (1 à 119 ans).';
    const heightNum = Number(fields.heightCm);
    if (!Number.isFinite(heightNum) || heightNum <= 0) return 'Taille invalide (supérieure à 0 cm).';
    const weightNum = Number(fields.weightKg);
    if (!Number.isFinite(weightNum) || weightNum <= 0) return 'Poids invalide (supérieur à 0 kg).';
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
  const colors = useMaterialColors();
  const accent = useMaterialTertiary('progress');
  const styles = useMemo(() => createStyles(colors, accent), [colors, accent]);
  const insets = useSafeAreaInsets();
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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [requestingNotifications, setRequestingNotifications] = useState(false);

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
      setShowNotificationPrompt(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'enregistrer ton profil. Réessaie.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!session) return;
    setRequestingNotifications(true);
    try {
      await enableNotifications(session.user.id);
    } catch {
      // Non-blocking: notification setup failing here (e.g. push token
      // registration error) must not stop account creation. The user gets
      // another chance to enable notifications from the Home toggle.
    } finally {
      setRequestingNotifications(false);
      router.replace('/home');
    }
  };

  const handleSkipNotifications = () => {
    router.replace('/home');
  };

  if (loading || !session) {
    return null;
  }

  if (showNotificationPrompt) {
    return (
      <View style={styles.screen}>
        <View style={[styles.content, { paddingTop: insets.top }]}>
          <View style={styles.notificationPrompt}>
            <Text style={styles.title}>Activer les notifications ?</Text>
            <View style={styles.notificationActions}>
              <Button
                title="Activer les notifications"
                onPress={handleEnableNotifications}
                loading={requestingNotifications}
              />
              <Pressable
                onPress={handleSkipNotifications}
                accessibilityRole="button"
                hitSlop={state.hitSlop}
                android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant) }}
                style={({ pressed }) => [styles.backLink, pressed && styles.backLinkPressed]}
              >
                <Text style={styles.backLinkText}>Plus tard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Image
        source={require('../../assets/images/illustrations/onboarding-hero.png')}
        style={styles.hero}
        contentFit="contain"
      />
      <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <ProgressSegment key={index} done={index <= step} styles={styles} />
          ))}
        </View>
        <Text style={styles.stepCounter}>
          {step < TOTAL_STEPS - 1 ? `ÉTAPE ${step + 1}/${TOTAL_STEPS}` : 'RÉCAPITULATIF'}
        </Text>
        <Text style={styles.title}>{STEP_TITLES[step]}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Keyed by step so each transition remounts and replays the entrance. */}
        <Animated.View
          key={step}
          entering={FadeInDown.duration(motion.duration.base).easing(Easing.bezier(...motion.curve.entrance))}
        >
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
            <Text style={styles.hint}>
              Sport inclus. Sédentaire : peu ou pas de sport. Légère : 1 à 3 jours/semaine. Modérée : 3 à 5
              jours/semaine. Active : 6 à 7 jours/semaine. Très active : sport quotidien intense ou métier
              physique.
            </Text>
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
            <RecapRow label="Sexe" value={SEX_OPTIONS.find((o) => o.value === sex)?.label ?? '—'} styles={styles} />
            <RecapRow label="Âge" value={`${age} ans`} styles={styles} />
            <RecapRow label="Taille" value={`${heightCm} cm`} styles={styles} />
            <RecapRow label="Poids" value={`${weightKg} kg`} styles={styles} />

            <Text style={styles.recapGroup}>Activité</Text>
            <RecapRow
              label="Niveau d'activité"
              value={ACTIVITY_OPTIONS.find((o) => o.value === activityLevel)?.label ?? '—'}
              styles={styles}
            />
            <RecapRow label="Objectif" value={GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? '—'} styles={styles} />

            <Text style={styles.recapGroup}>Entraînement</Text>
            <RecapRow label="Jours/semaine" value={daysPerWeek} styles={styles} />
            <RecapRow
              label="Niveau"
              value={EXPERIENCE_OPTIONS.find((o) => o.value === experienceLevel)?.label ?? '—'}
              styles={styles}
            />
            <RecapRow
              label="Matériel"
              value={EQUIPMENT_OPTIONS.find((o) => o.value === equipment)?.label ?? '—'}
              styles={styles}
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            hitSlop={state.hitSlop}
            android_ripple={{ color: withRippleAlpha(colors.onSurfaceVariant) }}
            style={({ pressed }) => [styles.backLink, pressed && styles.backLinkPressed]}
          >
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
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

/**
 * A progress segment whose red fill grows left-to-right when its step is
 * reached, rather than snapping on. The track underneath stays visible, so an
 * in-progress fill reads as "getting there".
 */
function ProgressSegment({ done, styles }: { done: boolean; styles: Styles }) {
  const fill = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(done ? 1 : 0, {
      duration: motion.duration.base,
      easing: Easing.bezier(...motion.curve.standard),
    });
  }, [done, fill]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fillStyle]} />
    </View>
  );
}

function RecapRow({ label, value, styles }: { label: string; value: string; styles: Styles }) {
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, accent: { tertiary: string }) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    // Full bleed: the illustration is generated on the background color, so it
    // blends into the screen with no seam — which is also why `contain` is
    // safe here, any letterbox is the same color as the screen. maxHeight
    // keeps the form above the fold on a small phone. Same banner on all four
    // steps.
    hero: { width: '100%', aspectRatio: 2.4, maxHeight: 150 },
    // Everything below the full-bleed hero is capped and centered; the hero
    // itself stays outside this wrapper so it keeps spanning edge to edge.
    content: { flex: 1, ...centeredContent },
    header: { padding: spacing.lg, paddingBottom: spacing.sm },
    progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, overflow: 'hidden' },
    segmentFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 2,
      backgroundColor: accent.tertiary,
      transformOrigin: 'left',
    },
    stepCounter: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
    title: { ...materialTypography.titleLarge, color: colors.onSurface },
    body: { flex: 1 },
    bodyContent: { padding: spacing.lg, paddingTop: spacing.sm },
    label: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    hint: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginTop: spacing.md },
    footer: { padding: spacing.lg },
    notificationPrompt: { flex: 1, justifyContent: 'center', padding: spacing.lg },
    notificationActions: { gap: spacing.md, alignItems: 'center' },
    backLink: {
      alignSelf: 'flex-start',
      marginBottom: spacing.md,
      minHeight: state.minTouchSize,
      justifyContent: 'center',
    },
    backLinkPressed: { opacity: 0.85 },
    backLinkText: { ...materialTypography.titleSmall, color: colors.onSurfaceVariant },
    recapGroup: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    recapRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    recapLabel: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant },
    recapValue: { ...materialTypography.labelSmall, color: colors.onSurface },
  });
}
```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 3: Run the existing tests**

Run: `npx jest onboarding`
Expected: PASS, unchanged — `onboarding.test.tsx`, `onboarding-wizard.test.tsx`, and `onboarding-validate.test.ts` all assert on text content, form behavior, navigation calls, and the pure `validateStep` function, never on colors or styles. No test edits needed. (The "← Retour"/"Plus tard" `Pressable`s gaining `accessibilityRole="button"` does not change how `fireEvent.press(getByText(...))` locates and presses them.)

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding.tsx
git commit -m "feat: migrate onboarding wizard to Material 3 tokens

Also brings the in-file back-link/skip Pressables up to the
established ripple + accessibilityRole convention already used by
BackLink.tsx and workout-session.tsx's Quitter link."
```

---

### Task 11: Activate dark mode — root `_layout.tsx` and `app.json`

**Files:**
- Modify: `src/app/_layout.tsx`
- Modify: `app.json`

**Interfaces:**
- Consumes: `useMaterialColors` from `../theme/tokens` (replaces `useThemeColors`).
- Produces: this is the activation step every prior task in this plan (and Phases 4/5a/5b) was preparing for. After this task, `useColorScheme()` driving `useMaterialColors()`/`useMaterialTertiary()` actually changes what renders on a real device.

- [ ] **Step 1: Update `src/app/_layout.tsx`**

Replace the two token-related lines. Full new content:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Fredoka_400Regular } from '@expo-google-fonts/fredoka/400Regular';
import { Fredoka_500Medium } from '@expo-google-fonts/fredoka/500Medium';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { AuthProvider } from '../lib/auth-context';
import { useMaterialColors } from '../theme/tokens';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colors = useMaterialColors();
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Flip `app.json`'s `userInterfaceStyle`**

In `app.json`, change:

```json
"userInterfaceStyle": "light",
```

to:

```json
"userInterfaceStyle": "automatic",
```

Leave every other key untouched — in particular, do not touch the `expo-splash-screen` plugin's existing `dark: { backgroundColor: "#17120C" }` block (added inert in Phase 4; this task is what makes it take effect) or `android.predictiveBackGestureEnabled`.

- [ ] **Step 3: Run tsc**

Run: `npx tsc --noEmit`
Expected: no new errors versus Task 1's baseline.

- [ ] **Step 4: Run the full test suite**

Run: `npx jest`
Expected: every suite that was passing before this task still passes — this task touches no component under direct test, but confirm nothing in the render tree broke (e.g. via any smoke test that mounts `_layout.tsx` or a screen through it).

- [ ] **Step 5: Commit**

```bash
git add src/app/_layout.tsx app.json
git commit -m "feat: activate dark mode

Root layout now reads useMaterialColors() (scheme-aware) instead of
the static light-only useThemeColors(), and the StatusBar switches
with the system instead of being hardcoded to 'dark'. app.json's
userInterfaceStyle flips from 'light' to 'automatic' — the last
remaining lock on the Material 3 dark scheme built and WCAG-verified
since Phase 4. Every screen in the app is now Material 3 and
theme-aware; this is the final wiring step, not new visual work."
```

---

### Task 12: Mandatory manual device verification (light + forced dark) — BLOCKING

**Files:** none — this task produces no code change. It is a gate, not an implementation step.

**Interfaces:**
- Consumes: the fully migrated app from Tasks 1-11.
- Produces: explicit human-verified confirmation that dark mode renders correctly, recorded in this task's completion note. **This task cannot be marked complete by an agent alone** — it requires a human (or a screenshot-capable device/emulator walkthrough the human reviews) to actually look at the app in both modes.

This is the one hard gate of this entire "20/20 audit" initiative that automated tests cannot cover: `npx tsc --noEmit` and `npx jest` passing green proves the code compiles and existing behavior didn't regress, but neither can tell you whether `#17120C` on `#2C2217` actually looks right, whether an icon is invisible against its new background, or whether a screen has a stray hardcoded light-mode color this plan's mapping table missed.

- [ ] **Step 1: Start the app**

Run: `npx expo start` (Expo Go or a dev client, whichever this project normally uses).

- [ ] **Step 2: Walk through in light mode**

With the device/emulator in its normal (light) system appearance, visit: Accueil (`/home`), Plan (`/plan`), and one auth screen (`/login` — log out first if needed, or use a fresh session). Confirm nothing looks different from before this plan (light values are unchanged by design).

- [ ] **Step 3: Force dark mode and walk through the same screens**

Switch the device/emulator's system appearance to dark (Android: Settings → Display → Dark theme; iOS: Settings → Display & Brightness; Android emulator: `adb shell "cmd uimode night yes"`). Revisit Accueil, Plan, and the auth screen (`/login`, plus at least one more auth screen, e.g. `/signup` or `/onboarding` if reachable from a fresh account). Confirm:
- Every screen actually renders in dark colors (not stuck in light).
- Text stays legible against its background (this was WCAG-verified at the token level in Phase 4, but confirm it holds visually).
- No icon, image, or hardcoded color reads as a light-mode leftover (a white card floating on a dark screen, black text on a dark background, etc).
- The status bar and splash screen (relaunch the app to see the splash) both match dark mode.

- [ ] **Step 4: Report and gate**

If everything above holds: this task is complete, and the plan as a whole is done — proceed to the final whole-branch review.
If anything looks wrong: file it as a finding (screen + what's wrong), fix it in a follow-up commit on this same branch, and repeat Steps 2-3 for the affected screen before considering this task — and the plan — complete. Do not propose this branch's PR for merge until this task has passed both light and dark walkthroughs.
