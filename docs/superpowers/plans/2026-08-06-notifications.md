# Notifications (rappel de séance / streak à risque) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a daily push notification — a workout reminder, or a
stronger "streak à risque" message if inactive ≥2 days — to every user who
has opted in, via a server-side scheduled job (not client-side scheduling),
so it fires even if the app hasn't been opened in days.

**Architecture:** A `push_tokens` table stores one Expo push token per
opted-in user. A pure function decides, from a user's last completion date
and today's date, which of three outcomes applies (nothing / reminder /
streak-at-risk). A Supabase Edge Function runs that decision for every
token-holding user once a day (triggered by `pg_cron` + `pg_net`) and sends
matching pushes through Expo's push API. Two client entry points — a new
onboarding step, and a toggle on the Home screen — both call the same
small registration library to request permission and store/remove the
token.

**Tech Stack:** `expo-notifications` (SDK 57), Supabase Postgres
(`pg_cron`, `pg_net`, `supabase_vault` — all available on this project,
none currently enabled), a Supabase Edge Function (Deno), Expo's push API.

## Global Constraints

- Server-triggered push only — no client-side local scheduling. The whole
  point is it must fire even if the app hasn't been opened in days.
- At most one push per user per day. Priority when both would apply:
  streak-à-risque (≥2 days inactive) beats the plain daily reminder.
- Cron fires once a day at **17:00 UTC** (18h Paris in winter/CET, 19h in
  summer/CEST — no per-user timezone in this version).
- Copy (tutoiement, no emoji, no exclamation mark):
  - Streak à risque : "Ça fait 2 jours — une petite séance aujourd'hui ?"
  - Rappel de séance : "Ta séance du jour t'attend."
- No new value inline outside `src/theme/tokens.ts` in any screen/component
  this plan touches (`.claude/skills/fitfork-design/SKILL.md`).
- Disabling notifications means **deleting** the `push_tokens` row — no
  separate `enabled` boolean column.
- Invalid/expired tokens (Expo push API reports `DeviceNotRegistered`) are
  deleted from `push_tokens` by the Edge Function itself, not retried.

---

### Task 1: `push_tokens` table

**Files:**
- Create: `supabase/migrations/0023_push_tokens.sql`

**Interfaces:**
- Produces: table `public.push_tokens (user_id uuid primary key
  references auth.users(id) on delete cascade, token text not null,
  updated_at timestamptz not null default now())` — consumed by Task 3
  (client upsert/delete) and Task 6 (Edge Function read).

No application code in this task — verified by inspection and by the
tasks that consume it later.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0023_push_tokens.sql`:

```sql
create table public.push_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "Users can insert own push token"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push token"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own push token"
  on public.push_tokens for delete
  using (auth.uid() = user_id);
```

No `select` policy — only the Edge Function reads this table, using the
service role key, which bypasses RLS entirely. A client-side `select`
would be denied, which is correct: nothing in this plan ever needs to
read another user's row, and the client's own "is notifications on"
check (Task 3) only needs to know whether ITS OWN row exists, which the
`insert`/`update`/`delete` policies already permit querying indirectly
(an `upsert` or `delete` naturally requires no separate read permission).

- [ ] **Step 2: Apply the migration to the live Supabase project**

This project has no local Supabase CLI (no `supabase/config.toml`) — apply
it the same way prior migrations in this repo were applied: directly
against the live project (Supabase dashboard SQL editor, or the Supabase
MCP tools' `apply_migration` if available in your environment). Verify
with:

```sql
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'push_tokens'
order by ordinal_position;
```

Expected: `user_id` (uuid), `token` (text), `updated_at` (timestamp with
time zone).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0023_push_tokens.sql
git commit -m "feat: add push_tokens table for notification registration"
```

---

### Task 2: `decideNotification` — pure decision function

**Files:**
- Create: `src/lib/notificationSchedule.ts`
- Test: `src/__tests__/notificationSchedule.test.ts`

**Interfaces:**
- Produces: `export type NotificationDecision = 'none' | 'reminder' | 'streak-risk';`
  `export function decideNotification(lastCompletedDate: string | null, todayStr: string): NotificationDecision`
  — consumed by Task 6's Edge Function (as a hand-kept-in-sync copy — Edge
  Functions deploy standalone and can't import from this app's `src/lib`,
  see Task 6's note).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/notificationSchedule.test.ts`:

```ts
import { decideNotification } from '../lib/notificationSchedule';

describe('decideNotification', () => {
  it('returns none when a session was already completed today', () => {
    expect(decideNotification('2026-08-06', '2026-08-06')).toBe('none');
  });

  it('returns reminder when the last session was yesterday', () => {
    expect(decideNotification('2026-08-05', '2026-08-06')).toBe('reminder');
  });

  it('returns streak-risk when the last session was 2 days ago', () => {
    expect(decideNotification('2026-08-04', '2026-08-06')).toBe('streak-risk');
  });

  it('returns streak-risk when the last session was 5 days ago', () => {
    expect(decideNotification('2026-08-01', '2026-08-06')).toBe('streak-risk');
  });

  it('returns streak-risk when no session has ever been completed', () => {
    expect(decideNotification(null, '2026-08-06')).toBe('streak-risk');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest notificationSchedule.test.ts`
Expected: FAIL with "Cannot find module '../lib/notificationSchedule'".

- [ ] **Step 3: Implement**

Create `src/lib/notificationSchedule.ts`:

```ts
export type NotificationDecision = 'none' | 'reminder' | 'streak-risk';

const STREAK_RISK_THRESHOLD_DAYS = 2;

export function decideNotification(lastCompletedDate: string | null, todayStr: string): NotificationDecision {
  if (lastCompletedDate === todayStr) return 'none';
  if (lastCompletedDate === null) return 'streak-risk';

  const daysSince = daysBetween(lastCompletedDate, todayStr);
  if (daysSince >= STREAK_RISK_THRESHOLD_DAYS) return 'streak-risk';
  return 'reminder';
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00Z`).getTime();
  const to = new Date(`${toDateStr}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86400000);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest notificationSchedule.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/notificationSchedule.ts src/__tests__/notificationSchedule.test.ts
git commit -m "feat: add decideNotification pure scheduling logic"
```

---

### Task 3: `pushNotifications.ts` — client registration library

**Files:**
- Create: `src/lib/pushNotifications.ts`
- Test: `src/__tests__/pushNotifications.test.ts`
- Modify: `package.json`, `app.json` (new dependency + plugin)

**Interfaces:**
- Consumes: `supabase` client from `src/lib/supabase.ts` (already exists,
  same import used throughout `src/lib/*Data.ts` files); `push_tokens`
  table from Task 1.
- Produces:
  `export type NotificationStatus = { enabled: boolean; canAskAgain: boolean };`
  `export async function getNotificationStatus(userId: string): Promise<NotificationStatus>`
  `export async function enableNotifications(userId: string): Promise<boolean>`
  `export async function disableNotifications(userId: string): Promise<void>`
  — consumed by Task 4 (onboarding step) and Task 5 (Home toggle).

- [ ] **Step 1: Install the dependency**

Run: `npx expo install expo-notifications`

In `app.json`, add `"expo-notifications"` to the `plugins` array (after
`"expo-splash-screen"`'s block, before `"experiments"`):

```json
      "expo-notifications"
```

(as a plain string entry in the array, same style as `"expo-router"` at
the top of that array — no icon/color config needed for this app, which
has no custom notification icon yet).

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/pushNotifications.test.ts`:

```ts
import {
  getNotificationStatus,
  enableNotifications,
  disableNotifications,
} from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { eas: { projectId: 'test-project-id' } } } },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getNotificationStatus', () => {
  it('is enabled only when permission is granted AND a token row exists', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true, canAskAgain: true });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getNotificationStatus('user-1');

    expect(result).toEqual({ enabled: true, canAskAgain: true });
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('is disabled when permission is granted but no token row exists', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true, canAskAgain: true });
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getNotificationStatus('user-1');

    expect(result.enabled).toBe(false);
  });

  it('is disabled when permission is not granted, even with a token row', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false, canAskAgain: true });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getNotificationStatus('user-1');

    expect(result.enabled).toBe(false);
  });
});

describe('enableNotifications', () => {
  it('requests permission, fetches an Expo push token, and upserts it', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true, canAskAgain: true });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    const result = await enableNotifications('user-1');

    expect(result).toBe(true);
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'test-project-id' });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', token: 'ExponentPushToken[abc]' })
    );
  });

  it('returns false without fetching a token when permission is denied', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false, canAskAgain: false });

    const result = await enableNotifications('user-1');

    expect(result).toBe(false);
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('disableNotifications', () => {
  it('deletes the push token row for the user', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await disableNotifications('user-1');

    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest pushNotifications.test.ts`
Expected: FAIL with "Cannot find module '../lib/pushNotifications'".

- [ ] **Step 4: Implement**

Create `src/lib/pushNotifications.ts`:

```ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export type NotificationStatus = { enabled: boolean; canAskAgain: boolean };

export async function getNotificationStatus(userId: string): Promise<NotificationStatus> {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();

  const { data } = await supabase.from('push_tokens').select('user_id').eq('user_id', userId).maybeSingle();

  return { enabled: granted && data !== null, canAskAgain };
}

export async function enableNotifications(userId: string): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
  if (error) throw error;

  return true;
}

export async function disableNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').delete().eq('user_id', userId);
  if (error) throw error;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest pushNotifications.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app.json src/lib/pushNotifications.ts src/__tests__/pushNotifications.test.ts
git commit -m "feat: add pushNotifications client registration library"
```

(Substitute `yarn.lock`/`pnpm-lock.yaml` for `package-lock.json` if the
project uses a different package manager — check which lockfile exists at
the repo root.)

---

### Task 4: Onboarding step — "Activer les notifications ?"

**Files:**
- Modify: `src/app/onboarding.tsx`
- Test: `src/__tests__/onboarding.test.tsx` (create if it doesn't already
  exist; check first — if it exists, add to it instead of replacing it)

**Interfaces:**
- Consumes: `enableNotifications(userId: string): Promise<boolean>` from
  `src/lib/pushNotifications.ts` (Task 3).

- [ ] **Step 1: Check for an existing onboarding test file**

Run: `ls src/__tests__/onboarding*`. If a file already exists, read it
fully before writing Step 2 so the new test matches its existing mocking
conventions (session/profile mocks in particular) instead of duplicating
a different mock shape.

- [ ] **Step 2: Write the failing test**

Add to (or create) `src/__tests__/onboarding.test.tsx` — this test
assumes the wizard's four existing steps are already filled and
submitted, and only exercises the new post-submit prompt. Adjust the
mock shape to match whatever `src/app/onboarding.tsx` already imports
(`useAuth`, `upsertProfile`, `upsertTrainingProfile`) if an existing test
file shows a different convention than guessed here:

```tsx
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
  fireEvent.press(getByText('Homme'));
  fireEvent.changeText(getByTestId('age-input'), '30');
  fireEvent.changeText(getByTestId('height-input'), '180');
  fireEvent.changeText(getByTestId('weight-input'), '80');
  fireEvent.press(getByText('Continuer'));
  fireEvent.press(getByText('Sédentaire'));
  fireEvent.press(getByText('Maintien'));
  fireEvent.press(getByText('Continuer'));
  fireEvent.changeText(getByTestId('days-input'), '3');
  fireEvent.press(getByText('Débutant'));
  fireEvent.press(getByText('Poids du corps'));
  fireEvent.press(getByText('Continuer'));
  fireEvent.press(getByText('Valider'));
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest onboarding.test.tsx`
Expected: FAIL — no text "Activer les notifications ?" exists yet.

- [ ] **Step 4: Implement**

In `src/app/onboarding.tsx`:

1. Add the import: `import { enableNotifications } from '../lib/pushNotifications';`

2. Add new state right after the existing `submitting` state declaration
   (line 110, `const [submitting, setSubmitting] = useState(false);`):

```tsx
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [requestingNotifications, setRequestingNotifications] = useState(false);
```

3. In `handleSubmit`, replace the line `router.replace('/home');` (line
   167, inside the `try` block after both upserts) with:

```tsx
      setShowNotificationPrompt(true);
```

4. Add two new handlers right after `handleSubmit` (after its closing
   `};`):

```tsx
  const handleEnableNotifications = async () => {
    if (!session) return;
    setRequestingNotifications(true);
    try {
      await enableNotifications(session.user.id);
    } finally {
      setRequestingNotifications(false);
      router.replace('/home');
    }
  };

  const handleSkipNotifications = () => {
    router.replace('/home');
  };
```

5. Change the top-level render guard (line 175-177,
   `if (loading || !session) { return null; }`) to also short-circuit into
   the new prompt when it's active — replace those three lines with:

```tsx
  if (loading || !session) {
    return null;
  }

  if (showNotificationPrompt) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.notificationPrompt}>
            <Text style={styles.title}>Activer les notifications ?</Text>
            <View style={styles.notificationActions}>
              <Button
                title="Activer les notifications"
                onPress={handleEnableNotifications}
                loading={requestingNotifications}
              />
              <Pressable onPress={handleSkipNotifications} style={styles.backLink}>
                <Text style={styles.backLinkText}>Plus tard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }
```

6. Add two styles to `createStyles`'s returned object (near `footer`):

```ts
    notificationPrompt: { flex: 1, justifyContent: 'center', padding: spacing.lg },
    notificationActions: { gap: spacing.md, alignItems: 'center' },
```

`Button`, `Pressable`, `Text`, `View` are already imported in this file;
`styles.backLink`/`styles.backLinkText` already exist (reused from the
wizard's existing "← Retour" link) and don't need new entries.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest onboarding.test.tsx`
Expected: PASS (all tests in the file, including the 3 new ones).

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding.tsx src/__tests__/onboarding.test.tsx
git commit -m "feat: prompt for notification permission after onboarding"
```

---

### Task 5: Home screen — Notifications toggle

**Files:**
- Modify: `src/app/(tabs)/home.tsx`
- Test: `src/__tests__/home.test.tsx` (create if it doesn't already exist
  — check first, same as Task 4)

**Interfaces:**
- Consumes: `getNotificationStatus`, `enableNotifications`,
  `disableNotifications` from `src/lib/pushNotifications.ts` (Task 3).

- [ ] **Step 1: Check for an existing home screen test file**

Run: `ls src/__tests__/home*`. If one exists, read it fully first and
match its mocking conventions instead of the ones guessed in Step 2.

- [ ] **Step 2: Write the failing test**

Add to (or create) `src/__tests__/home.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/home';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { getCurrentPlan, fetchRecipes } from '../lib/mealPlanData';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
import { getNotificationStatus, enableNotifications, disableNotifications } from '../lib/pushNotifications';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/profile', () => ({
  getProfile: jest.fn(),
  getTrainingProfile: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  getCurrentPlan: jest.fn(),
  fetchRecipes: jest.fn(),
}));

jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
}));

jest.mock('../lib/pushNotifications', () => ({
  getNotificationStatus: jest.fn(),
  enableNotifications: jest.fn(),
  disableNotifications: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('HomeScreen notifications toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1', email: 'test@example.com' } },
      loading: false,
      signOut: jest.fn(),
    });
    (getProfile as jest.Mock).mockResolvedValue({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'sedentary',
      goal: 'maintain',
    });
    (getTrainingProfile as jest.Mock).mockResolvedValue({ daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'bodyweight' });
    (getCurrentPlan as jest.Mock).mockResolvedValue(null);
    (fetchRecipes as jest.Mock).mockResolvedValue([]);
    (fetchMyCompletions as jest.Mock).mockResolvedValue([]);
  });

  it('shows the toggle off when notifications are disabled', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    expect(toggle.props.value).toBe(false);
  });

  it('shows the toggle on when notifications are enabled', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: true, canAskAgain: true });
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    expect(toggle.props.value).toBe(true);
  });

  it('calls enableNotifications when switched on', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    (enableNotifications as jest.Mock).mockResolvedValue(true);
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    await fireEvent(toggle, 'valueChange', true);

    await waitFor(() => expect(enableNotifications).toHaveBeenCalledWith('user-1'));
  });

  it('calls disableNotifications when switched off', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: true, canAskAgain: true });
    (disableNotifications as jest.Mock).mockResolvedValue(undefined);
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    await fireEvent(toggle, 'valueChange', false);

    await waitFor(() => expect(disableNotifications).toHaveBeenCalledWith('user-1'));
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest home.test.tsx`
Expected: FAIL — no element with `accessibilityRole="switch"` exists yet.

- [ ] **Step 4: Implement**

In `src/app/(tabs)/home.tsx`:

1. Add imports:

```tsx
import { Switch } from 'react-native';
import { getNotificationStatus, enableNotifications, disableNotifications } from '../../lib/pushNotifications';
```

(add `Switch` to the existing `import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';`
line rather than a separate import statement)

2. Add state right after `const [gamification, setGamification] = useState<GamificationStats | null>(null);`:

```tsx
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
```

3. Inside `load()`, after the existing gamification `try`/`catch` block
   (after its closing `}`), add:

```tsx
    try {
      const status = await getNotificationStatus(userId);
      setNotificationsEnabled(status.enabled);
    } catch {
      // Toggle just stays in its last known state rather than blocking the screen.
    }
```

4. Add a handler function before the `if (loading || ...)` guard:

```tsx
  const handleToggleNotifications = async (value: boolean) => {
    if (!session) return;
    setNotificationsBusy(true);
    try {
      if (value) {
        const granted = await enableNotifications(session.user.id);
        setNotificationsEnabled(granted);
      } else {
        await disableNotifications(session.user.id);
        setNotificationsEnabled(false);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur avec les notifications.');
    } finally {
      setNotificationsBusy(false);
    }
  };
```

5. Add the toggle row right before the existing `<View style={styles.signOut}>` block:

```tsx
      <View style={styles.notificationsRow}>
        <Text style={styles.notificationsLabel}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          disabled={notificationsBusy}
          trackColor={{ true: colors.accentRed, false: colors.border }}
          thumbColor={colors.bgSurface}
        />
      </View>

```

6. Add two styles to `createStyles`'s returned object (near `signOut`):

```ts
    notificationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    notificationsLabel: { ...typography.bodyStrong, color: colors.textPrimary },
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest home.test.tsx`
Expected: PASS (all tests in the file, including the 4 new ones).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/home.tsx" src/__tests__/home.test.tsx
git commit -m "feat: add notifications toggle to Home screen"
```

---

### Task 6: Edge Function — `send-reminders`

**Files:**
- Create: `supabase/functions/send-reminders/index.ts`

**Interfaces:**
- Consumes: `push_tokens` and `workout_completions` tables (service-role
  read, bypasses RLS). Duplicates `decideNotification` from Task 2's
  `src/lib/notificationSchedule.ts` inline (Edge Functions deploy
  standalone via the Supabase API and cannot import from this repo's
  `src/lib` at deploy time) — the logic must be kept in sync by hand if
  either copy ever changes; a comment in the function says so.
- Produces: an HTTPS endpoint at
  `https://xewpbovlhoxovaydpuzh.supabase.co/functions/v1/send-reminders`
  (this project's ref), invoked by Task 7's cron job.

This task has no Jest test — it's Deno code with no local Deno tooling in
this environment (verified: no `deno` binary available). It's verified by
deploying it for real and invoking it against seeded data, per Steps 3-4
below — this is the actual runtime surface, not a substitute for one.

- [ ] **Step 1: Write the function**

Create `supabase/functions/send-reminders/index.ts`:

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type NotificationDecision = "none" | "reminder" | "streak-risk";

// Hand-kept in sync with src/lib/notificationSchedule.ts's decideNotification
// (unit-tested there via Jest) — Edge Functions deploy standalone and can't
// import from the React Native app's src/lib.
function decideNotification(lastCompletedDate: string | null, todayStr: string): NotificationDecision {
  if (lastCompletedDate === todayStr) return "none";
  if (lastCompletedDate === null) return "streak-risk";

  const daysSince = daysBetween(lastCompletedDate, todayStr);
  if (daysSince >= 2) return "streak-risk";
  return "reminder";
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00Z`).getTime();
  const to = new Date(`${toDateStr}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86400000);
}

const MESSAGES: Record<Exclude<NotificationDecision, "none">, { title: string; body: string }> = {
  reminder: { title: "FitFork", body: "Ta séance du jour t'attend." },
  "streak-risk": { title: "FitFork", body: "Ça fait 2 jours — une petite séance aujourd'hui ?" },
};

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: tokenRows, error: tokensError } = await supabase
    .from("push_tokens")
    .select("user_id, token");
  if (tokensError) {
    return new Response(JSON.stringify({ error: tokensError.message }), { status: 500 });
  }

  const { data: completionRows, error: completionsError } = await supabase
    .from("workout_completions")
    .select("user_id, completed_date")
    .order("completed_date", { ascending: false });
  if (completionsError) {
    return new Response(JSON.stringify({ error: completionsError.message }), { status: 500 });
  }

  // Rows are ordered newest-first, so the first row seen per user is their
  // most recent completion — a single pass gives "last completion per user"
  // without a second query per user.
  const lastCompletionByUser = new Map<string, string>();
  for (const row of completionRows ?? []) {
    if (!lastCompletionByUser.has(row.user_id)) {
      lastCompletionByUser.set(row.user_id, row.completed_date);
    }
  }

  const messages: { to: string; title: string; body: string }[] = [];
  const messageUserIds: string[] = [];

  for (const row of tokenRows ?? []) {
    const lastCompletedDate = lastCompletionByUser.get(row.user_id) ?? null;
    const decision = decideNotification(lastCompletedDate, todayStr);
    if (decision === "none") continue;

    messages.push({ to: row.token, ...MESSAGES[decision] });
    messageUserIds.push(row.user_id);
  }

  const invalidUserIds: string[] = [];

  if (messages.length > 0) {
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    const pushResult = await pushResponse.json();
    const tickets = Array.isArray(pushResult?.data) ? pushResult.data : [];

    tickets.forEach((ticket: { status: string; details?: { error?: string } }, index: number) => {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        invalidUserIds.push(messageUserIds[index]);
      }
    });
  }

  if (invalidUserIds.length > 0) {
    await supabase.from("push_tokens").delete().in("user_id", invalidUserIds);
  }

  return new Response(
    JSON.stringify({ notified: messages.length, cleaned: invalidUserIds.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

- [ ] **Step 2: Deploy the function**

Deploy `supabase/functions/send-reminders/index.ts` as a function named
`send-reminders` to project `xewpbovlhoxovaydpuzh`, with `verify_jwt: true`
(this function is only ever called by the cron job in Task 7, which
authenticates with the service role key — never make this function
public). If you have the Supabase MCP tools available, use
`deploy_edge_function` with `entrypoint_path: "index.ts"` and the file's
content; otherwise use `supabase functions deploy send-reminders` from an
environment with the Supabase CLI logged into this project.

- [ ] **Step 3: Seed several test profiles and verify the deployed function directly**

Create three throwaway test users (e.g. via the app's own signup flow, or
directly in `auth.users`) covering the three decision branches, each with
a `push_tokens` row using a syntactically-valid but fake Expo token
(`ExponentPushToken[test-verify-N]`) and a `workout_completions` row dated
accordingly:

- User A: `completed_date` = today → expect `none` (should NOT be counted
  in the response's `notified`).
- User B: `completed_date` = yesterday → expect `reminder`.
- User C: `completed_date` = 3 days ago (or no `workout_completions` row
  at all) → expect `streak-risk`.

Invoke the deployed function directly with an HTTP request carrying
`Authorization: Bearer <service-role-key>`, and confirm the JSON response
reports `notified: 2` (B and C, not A — the fake tokens will fail at
Expo's push API with an error status, which is fine and expected here:
the point of this check is that the function's own query/decision logic
picked exactly the right users, not that a real device receives a push).
Then delete all three temporary test users and their `push_tokens` /
`workout_completions` rows so no test data is left behind. (The
`DeviceNotRegistered` token-cleanup branch is not exercised by this
check — Expo's push API doesn't reliably return that specific error code
for a syntactically-fake token, so it isn't a trustworthy live probe;
that branch is a small, low-risk defensive path, reviewed by inspection
instead.)

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/send-reminders/index.ts
git commit -m "feat: add send-reminders Edge Function"
```

---

### Task 7: Schedule the daily cron job

**Files:**
- Create: `supabase/migrations/0025_notifications_cron.sql`

**Interfaces:**
- Consumes: the deployed Edge Function URL from Task 6
  (`https://xewpbovlhoxovaydpuzh.supabase.co/functions/v1/send-reminders`).
- Produces: a `pg_cron` job named `send-workout-reminders` that fires
  daily at 17:00 UTC.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0025_notifications_cron.sql`:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The service role key used below to authenticate the cron -> Edge Function
-- call is NOT set by this migration (never commit a real key to a migration
-- file). Before this job can succeed, run once, directly against the live
-- project (not committed to git):
--   select vault.create_secret('<the real service_role key>', 'service_role_key');

select cron.schedule(
  'send-workout-reminders',
  '0 17 * * *',
  $$
  select net.http_post(
    url := 'https://xewpbovlhoxovaydpuzh.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

- [ ] **Step 2: Apply the migration and insert the secret**

Apply the migration to the live project (same manual process as every
other migration in this repo — no local CLI). Then, **separately and only
directly against the live project, never in a committed file**, run:

```sql
select vault.create_secret('<the real service_role key value>', 'service_role_key');
```

Get the real service role key from the Supabase project's API settings
(Project Settings → API). This step has no automated verification here
because the key itself must never appear in any file this plan writes —
confirm success by checking `select name from vault.decrypted_secrets;`
includes `service_role_key`, without printing the decrypted value anywhere
that gets logged or committed.

- [ ] **Step 3: Verify the schedule is registered**

```sql
select jobname, schedule, active from cron.job where jobname = 'send-workout-reminders';
```

Expected: one row, `schedule = '0 17 * * *'`, `active = true`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0025_notifications_cron.sql
git commit -m "feat: schedule daily cron job for workout reminder notifications"
```

---

## Final check

- [ ] Run the full test suite: `npx jest --testPathIgnorePatterns "/node_modules/" "\.claude"`
  (this repo can accumulate stale copies of itself under `.claude/worktrees/`
  from past sessions with their own possibly-broken `node_modules` — a bare
  `npx jest` sweeps those in as unrelated spurious failures. Check
  `.claude/worktrees/` for stale entries and skip the pattern if none exist.)
  Expected: all tests pass, including the new/updated
  `notificationSchedule.test.ts`, `pushNotifications.test.ts`,
  `onboarding.test.tsx`, and `home.test.tsx`.
- [ ] Confirm with the human partner that:
  - Migrations `0023`, `0025` have been applied to the live Supabase project.
  - The `send-reminders` Edge Function has been deployed.
  - The `service_role_key` vault secret has been inserted (Task 7, Step 2)
    — without this, the cron job's HTTP call to the Edge Function will fail
    with a 401, silently, once a day, until it's set.
