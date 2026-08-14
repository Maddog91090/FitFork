# FitFork — Phase 5a: Navigation and Daily Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 6 daily/tab screens (`home`, `plan`, `recipes`, `workout`, `grocery-list`, `weight-log`) and the tab bar layout onto the Material 3 tokens and components built in Phase 4, remove the mascot from all of them, and restructure the tab bar from 6 to 5 destinations by moving `weight-log` out of the tab group.

**Architecture:** Each screen swaps its color/typography source from the claymorphic `useThemeColors()`/`typography` to the Material `useMaterialColors()`/`useMaterialTertiary()`/`materialTypography` (all already in `src/theme/tokens.ts` since Phase 4) using one fixed, consistent mapping table (below) — no screen invents its own convention. `Button`/`Card`/`EmptyState`/`ChoiceGroup`/`TagFilterGroup` are already Material-ized (Phase 4) and need no changes, only new call-site usage. `PressableScale` and `motion.spring.snappy` are explicitly NOT touched — they still back `workout.tsx`'s exercise-link cells and `home.tsx`'s gamification card, and stay exactly as they are.

**Tech Stack:** Expo Router (file-based routing — moving a file out of the `(tabs)` route group does not change its URL), `@expo/vector-icons`'s `MaterialIcons` (already used by `TabIcon`, Phase 4).

## Global Constraints

- `npx tsc --noEmit` and `npx jest` must both be clean before any task is considered done. The repo has ~1225-1245 pre-existing `tsc` errors confined to `*.test.ts(x)` files (a jest-globals typing gap, confirmed to predate this entire branch) — do not treat those as a regression; only new errors in files this plan touches count.
- No EAS build is triggered automatically.
- Every touchable element keeps a 48dp minimum size (`state.minTouchSize`) and an explicit `accessibilityRole`.
- `useReducedMotion` must keep working for everything that stays animated (`PressableScale`, untouched by this plan).
- `PressableScale`, `motion.spring.snappy`, `MacroIcon` are not modified, removed, or renamed by any task in this plan.
- Every route's URL stays the same. Moving `weight-log.tsx` out of `src/app/(tabs)/` does not change `/weight-log` — Expo Router route groups (parenthesized directory names) never appear in the URL.

## Color and typography mapping — apply identically in every task

Every screen task below replaces `useThemeColors()` with `useMaterialColors()` (and, for domain-tinted values, `useMaterialTertiary(domain)`) using this exact table. Two color families have **no Material role** (Phase 4 deliberately left them out of `MaterialColorScheme` — they're shared status/domain vocabulary, unchanged since before the claymorphic system existed) and stay sourced from the static `lightColors` export instead of a hook:

| Old (`useThemeColors()` field) | New | Notes |
| --- | --- | --- |
| `bgBase` | `useMaterialColors().background` | |
| `bgSurface` | `useMaterialColors().surface` | |
| `bgSunken` | `useMaterialColors().surfaceVariant` | |
| `textPrimary` | `useMaterialColors().onSurface` | |
| `textSecondary` | `useMaterialColors().onSurfaceVariant` | |
| `textTertiary` | `lightColors.textTertiary` (static) | no Material role |
| `divider` / `border` | `useMaterialColors().outlineVariant` | Material collapses both to one role |
| `borderStrong` | `useMaterialColors().outline` | |
| `error` | `useMaterialColors().error` | Material models this |
| `success` / `successSoft` | `lightColors.success` / `lightColors.successSoft` (static) | no Material role |
| `domainX` (base tone — fills, spinners) | `useMaterialTertiary('X').tertiary` | same hex, direct role rename |
| `domainXDeep` (body-text-sized color) | `useMaterialTertiary('X').tertiaryContainer` | same hex — `tertiaryContainer`'s value IS the old `*Deep` hex |
| `macroProtein` / `macroFat` / `macroCarbs` | `lightColors.macroProtein` etc. (static) | no Material role, unchanged vocabulary |

`typography.*` → `materialTypography.*` follows Phase 4's role renaming exactly: `hero→displayLarge`, `display→displayMedium`, `title→titleLarge`, `metric→headlineLarge`, `heading→titleMedium`, `subheading→titleSmall`, `body→bodyLarge`, `bodyStrong→bodyMedium`, `label→labelLarge`, `caption→labelMedium`, `captionStrong→labelSmall`, `overline→overline`.

Import pattern each task uses (adjust the relative path depth per file — `../../theme/tokens` for screens still under `(tabs)/`, `../theme/tokens` for `weight-log.tsx` after it moves):
```ts
import { centeredContent, spacing, materialTypography, useMaterialColors, useMaterialTertiary, lightColors, type MaterialColorScheme } from '../../theme/tokens';
```

MaterialIcons glyph names for empty-state icons (same glyphs `TabIcon` already uses, verified present in the installed `@expo/vector-icons` MaterialIcons glyph map in Phase 4):

| Screen | Glyph |
| --- | --- |
| `plan.tsx` | `event` |
| `recipes.tsx` | `restaurant-menu` |
| `grocery-list.tsx` | `shopping-cart` |
| `weight-log.tsx` | `monitor-weight` |

Import: `import { MaterialIcons } from '@expo/vector-icons';`. Each empty-state icon is `<MaterialIcons testID="empty-state-icon" name="X" size={64} color={colors.onSurfaceVariant} />` — the `testID` lets tests assert the right glyph was chosen (mirrors how `TabIcon.test.tsx` asserts on real behavior, not just "something rendered").

---

### Task 1: Tab bar — 5 destinations, Material colors

**Files:**
- Modify: `src/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `materialTypography` (Phase 4, `src/theme/tokens.ts`). `TabIcon` (Phase 4, unchanged, already self-tints from its own `focused` prop).
- Produces: nothing new — this is a leaf config file no other task depends on.

There is no dedicated test file for this layout (verified: `src/__tests__/` has no `*layout*` file). Verification is the app actually rendering 5 tabs — confirmed by every other task's screen tests still passing (they render each screen standalone, not through this layout) plus the manual `npx expo start` check in Step 3.

- [ ] **Step 1: Rewrite `src/app/(tabs)/_layout.tsx` in full**

```tsx
import { Tabs } from 'expo-router';
import { TabIcon } from '../../components/icons/TabIcon';
import { materialTypography, useMaterialColors } from '../../theme/tokens';

export default function TabsLayout() {
  const colors = useMaterialColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant },
        tabBarLabelStyle: { ...materialTypography.labelMedium, fontSize: 11 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon name="plan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recettes',
          tabBarIcon: ({ focused }) => <TabIcon name="recipes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Muscu',
          tabBarIcon: ({ focused }) => <TabIcon name="workout" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Courses',
          tabBarIcon: ({ focused }) => <TabIcon name="grocery" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
```

Note `tabBarActiveTintColor` is now `colors.primary` — matching what `TabIcon` itself already renders for the focused state since Phase 4 (previously it was `colors.textPrimary`, a different, non-corresponding claymorphic value). The `weight-log` `Tabs.Screen` entry is gone entirely — Task 7 moves that file out of this route group.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `(tabs)/_layout.tsx`. (Errors mentioning `weight-log` are expected until Task 7 moves that file — treat those as this plan's known transient state, not a regression to chase in this task.)

- [ ] **Step 3: Manual verification**

Run: `npx expo start` (or your usual dev flow), open the app, confirm the tab bar shows exactly 5 destinations (Accueil/Plan/Recettes/Muscu/Courses) and the active tab's icon and label both read in `colors.primary`. Stop the dev server after confirming — this step is not automatable via `jest`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/_layout.tsx"
git commit -m "feat: tab bar — 5 destinations, Material colors"
```

---

### Task 2: Migrate `home.tsx` — Material tokens, remove header mascot, add weight quick-action

**Files:**
- Modify: `src/app/(tabs)/home.tsx`
- Modify: `src/__tests__/home.test.tsx`
- Modify: `src/__tests__/home-progression-card.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `lightColors`, `MaterialColorScheme` (Phase 4). `Button`, `Card`, `PressableScale`, `ErrorNotice`, `MacroIcon` — unchanged, same props as before.
- Produces: nothing new for later tasks — `home.tsx` is a leaf screen.

- [ ] **Step 1: Update the failing tests first**

In `src/__tests__/home.test.tsx`, delete this test entirely (the header mascot is removed with no replacement, so there's nothing left to assert):

```tsx
  it('shows the idle mascot in the header', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    const { getByTestId } = await render(<HomeScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

In `src/__tests__/home-progression-card.test.tsx`, add a new test alongside the existing ones (same file, same mocks — `mockPush` is already defined) verifying the new quick-action button:

```tsx
  it('navigates to /weight-log when "Suivre mon poids" is pressed', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([]);

    const { findByText } = await render(<HomeScreen />);

    await fireEvent.press(await findByText('Suivre mon poids'));
    expect(mockPush).toHaveBeenCalledWith('/weight-log');
  });
```

- [ ] **Step 2: Run the tests to see the new one fail**

Run: `npx jest src/__tests__/home.test.tsx src/__tests__/home-progression-card.test.tsx`
Expected: the new "Suivre mon poids" test FAILS (`findByText` never finds it — the button doesn't exist yet); the deleted mascot test is gone so nothing runs for it; every other existing test still passes against the current (unmigrated) component.

- [ ] **Step 3: Rewrite `src/app/(tabs)/home.tsx` in full**

```tsx
import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getProfile, getTrainingProfile } from '../../lib/profile';
import { computeTargetsFromProfile, type MacroTargets } from '../../lib/targets';
import { getCurrentPlan, fetchRecipes, type Recipe, type SavedPlanEntry } from '../../lib/mealPlanData';
import { fetchMyCompletions } from '../../lib/workoutCompletionsData';
import { getNotificationStatus, enableNotifications, disableNotifications } from '../../lib/pushNotifications';
import { computeStats, type GamificationStats } from '../../lib/workoutGamification';
import { todayDayIndex, type MealType } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { MacroIcon } from '../../components/icons/MacroIcon';
import {
  centeredContent,
  lightColors,
  materialTypography,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function HomeScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading, signOut } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [todayMeals, setTodayMeals] = useState<SavedPlanEntry[]>([]);
  const [recipesById, setRecipesById] = useState<Map<string, Recipe>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsBusy, setNotificationsBusy] = useState(false);

  const load = useCallback(async () => {
    if (!loading && !session) {
      router.replace('/login');
      return;
    }
    if (!session) return;

    const userId = session.user.id;
    setLoadError(null);

    try {
      const [profile, trainingProfile, plan, recipes] = await Promise.all([
        getProfile(userId),
        getTrainingProfile(userId),
        getCurrentPlan(userId),
        fetchRecipes(),
      ]);

      if (!profile || !trainingProfile) {
        router.replace('/onboarding');
        return;
      }

      setMacros(computeTargetsFromProfile(profile));
      setRecipesById(new Map(recipes.map((r) => [r.id, r])));
      if (plan) {
        const dayIndex = todayDayIndex();
        const entriesToday = plan.entries
          .filter((e) => e.dayIndex === dayIndex)
          .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
        setTodayMeals(entriesToday);
      } else {
        setTodayMeals([]);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
    } finally {
      setCheckingProfile(false);
    }

    // La gamification est un bonus par-dessus l'accueil : elle est chargée
    // hors du Promise.all ci-dessus pour qu'un échec ici ne fasse pas
    // disparaître les macros et les repas du jour, qui ne dépendent pas
    // d'elle. En cas d'échec, la carte Progression ne s'affiche simplement pas.
    try {
      const myCompletions = await fetchMyCompletions(userId);
      // Bonus d'équipe volontairement désactivé : sans système de binôme
      // (demande d'ami), on ne sait pas qui est le partenaire, et n'importe
      // quel autre compte serait compté comme tel. Réactivable en repassant
      // les semaines bonus ici une fois ce système en place.
      setGamification(computeStats(myCompletions, [], new Date().toISOString().slice(0, 10)));
    } catch {
      // Pas de carte Progression plutôt qu'un accueil vide.
    }

    try {
      const status = await getNotificationStatus(userId);
      setNotificationsEnabled(status.enabled);
    } catch {
      // Toggle just stays in its last known state rather than blocking the screen.
    }
  }, [loading, session]);

  // useFocusEffect plutôt que useEffect : les écrans d'onglets restent montés,
  // donc sans ça l'accueil afficherait encore la série et les repas d'avant en
  // revenant de l'onglet Sport où l'on vient justement de valider une séance.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

  if (loading || !session || checkingProfile) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.name} numberOfLines={1}>
            {session.user.email}
          </Text>
        </View>
      </View>

      {loadError && <ErrorNotice message={loadError} onRetry={load} />}

      {macros && (
        <Card style={styles.macroCard}>
          <Text style={styles.sectionLabel}>Objectifs du jour</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="protein" size={16} />
                <Text style={[styles.macroValue, styles.macroProtein]}>{macros.proteinG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="fat" size={16} />
                <Text style={[styles.macroValue, styles.macroFat]}>{macros.fatG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Lip</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroValueRow}>
                <MacroIcon name="carbs" size={16} />
                <Text style={[styles.macroValue, styles.macroCarbs]}>{macros.carbsG}g</Text>
              </View>
              <Text style={styles.macroLabel}>Gluc</Text>
            </View>
          </View>
        </Card>
      )}

      {gamification && (
        <PressableScale onPress={() => router.push('/progression')} accessibilityRole="button">
          <Card style={styles.gamificationCard}>
            <Text style={styles.sectionLabel}>Progression</Text>
            <View style={styles.gamificationRow}>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>🔥 {gamification.streak}</Text>
                <Text style={styles.macroLabel}>Série</Text>
              </View>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>Niv. {gamification.level}</Text>
                <Text style={styles.macroLabel}>Niveau</Text>
              </View>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>{gamification.thisWeekDays}/3</Text>
                <Text style={styles.macroLabel}>Cette semaine</Text>
              </View>
            </View>
          </Card>
        </PressableScale>
      )}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <Button title="Voir mon plan" variant="secondary" onPress={() => router.push('/plan')} />
        </View>
        <View style={styles.actionButton}>
          <Button title="Générer" onPress={() => router.push('/generate-plan')} domain="nutrition" />
        </View>
      </View>
      <View style={styles.actionsRowSecondary}>
        <Button title="Suivre mon poids" variant="secondary" onPress={() => router.push('/weight-log')} domain="neutral" />
      </View>

      <Text style={styles.sectionLabel}>Repas du jour</Text>
      {todayMeals.length > 0 ? (
        <Card style={styles.mealsCard}>
          {todayMeals.map((entry, index) => {
            const recipe = recipesById.get(entry.recipeId);
            return (
              <Pressable
                key={entry.id}
                onPress={() =>
                  router.push({
                    pathname: '/recipe/[id]',
                    params: { id: entry.recipeId, portion: String(entry.portionMultiplier) },
                  })
                }
                accessibilityRole="button"
                style={[styles.mealRow, index === todayMeals.length - 1 && styles.mealRowLast]}
              >
                <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                <Text style={styles.mealRecipeName}>{recipe ? recipe.name : entry.recipeId}</Text>
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card style={styles.mealsCard}>
          <Text style={styles.mealsEmptyText}>
            Pas de plan pour aujourd'hui. Génère ton plan de la semaine pour voir tes repas ici.
          </Text>
        </Card>
      )}

      <View style={styles.notificationsRow}>
        <Text style={styles.notificationsLabel}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          disabled={notificationsBusy}
          trackColor={{ true: nutrition.tertiary, false: colors.outline }}
          thumbColor={colors.surface}
          accessibilityLabel="Notifications de rappel d'entraînement"
        />
      </View>

      <View style={styles.signOut}>
        <Button title="Se déconnecter" variant="secondary" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerText: { flex: 1, marginRight: spacing.md },
    greeting: { ...materialTypography.displayLarge, color: colors.onSurface },
    name: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginBottom: spacing.lg },
    macroCard: { marginBottom: spacing.lg },
    gamificationCard: { marginBottom: spacing.lg },
    gamificationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    gamificationItem: { alignItems: 'center', flex: 1 },
    gamificationValue: { ...materialTypography.titleLarge, color: colors.onSurface },
    sectionLabel: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    macroItem: { alignItems: 'center', flex: 1 },
    macroValue: { ...materialTypography.titleLarge, color: colors.onSurface },
    macroProtein: { color: lightColors.macroProtein },
    macroFat: { color: lightColors.macroFat },
    macroCarbs: { color: lightColors.macroCarbs },
    macroLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    macroValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    actionButton: { flex: 1 },
    actionsRowSecondary: { marginBottom: spacing.lg },
    mealsCard: { marginBottom: spacing.lg },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    mealRowLast: { borderBottomWidth: 0 },
    mealTypeLabel: { ...materialTypography.labelMedium, width: 80, color: colors.onSurfaceVariant },
    mealRecipeName: { ...materialTypography.bodyMedium, flex: 1, color: colors.onSurface, textAlign: 'right' },
    mealsEmptyText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant },
    notificationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    notificationsLabel: { ...materialTypography.bodyMedium, color: colors.onSurface },
    signOut: { marginTop: spacing.xl },
  });
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx jest src/__tests__/home.test.tsx src/__tests__/home-progression-card.test.tsx`
Expected: PASS — all notification-toggle tests, both progression-card tests, and the new "Suivre mon poids" navigation test.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `home.tsx` or its test files.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/home.tsx" src/__tests__/home.test.tsx src/__tests__/home-progression-card.test.tsx
git commit -m "feat: migrate home screen to Material tokens, remove mascot, add weight quick-action"
```

---

### Task 3: Migrate `plan.tsx` — Material tokens, empty-state icon

**Files:**
- Modify: `src/app/(tabs)/plan.tsx`
- Modify: `src/__tests__/plan-screen.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `MaterialColorScheme` (Phase 4). `MaterialIcons` from `@expo/vector-icons`. `ChoiceGroup`, `Card`, `EmptyState`, `ErrorNotice` — unchanged props.
- Produces: nothing new — leaf screen.

- [ ] **Step 1: Update the test**

Replace the test in `src/__tests__/plan-screen.test.tsx`:

```tsx
  it('shows the empty-plan icon', async () => {
    const { getByTestId } = await render(<PlanScreen />);
    await waitFor(() => expect(getByTestId('empty-state-icon').props.name).toBe('event'));
  });
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/plan-screen.test.tsx`
Expected: FAIL — `getByTestId('empty-state-icon')` doesn't exist yet (still `mascot-image`).

- [ ] **Step 3: Rewrite `src/app/(tabs)/plan.tsx` in full**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../../lib/mealPlanData';
import {
  pickReplacementRecipe,
  MEAL_TYPE_RATIOS,
  clampPortionMultiplier,
  DAY_LABELS,
  todayDayIndex,
  type MealType,
} from '../../lib/mealPlan';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import {
  centeredContent,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

const DAY_TAB_OPTIONS = DAY_LABELS.map((label, index) => ({ value: String(index), label }));

export default function PlanScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors, nutrition), [colors, nutrition]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(todayDayIndex());

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
      const recipeOptions = recipes.map((r) => ({
        id: r.id,
        mealType: r.mealType,
        baseCalories: r.baseCalories,
        baseProteinG: r.baseProteinG,
        baseFatG: r.baseFatG,
        baseCarbsG: r.baseCarbsG,
      }));
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  if (error && !plan) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ErrorNotice message={error} onRetry={load} />
      </View>
    );
  }

  if (!plan || plan.entries.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<MaterialIcons testID="empty-state-icon" name="event" size={64} color={colors.onSurfaceVariant} />}
          title="Aucun plan pour l'instant"
          message="Génère ton premier plan de repas de la semaine."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
          domain="nutrition"
        />
      </View>
    );
  }

  const dayEntries = plan.entries.filter((e) => e.dayIndex === activeDayIndex);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      {error && <ErrorNotice message={error} onRetry={load} />}

      <ChoiceGroup
        options={DAY_TAB_OPTIONS}
        value={String(activeDayIndex)}
        onChange={(value) => setActiveDayIndex(Number(value))}
        domain="nutrition"
      />

      {dayEntries.length === 0 ? (
        <Text style={styles.emptyDayText}>Rien de prévu ce jour-là.</Text>
      ) : (
        dayEntries.map((entry) => {
          const recipe = recipeById.get(entry.recipeId);
          return (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryRow}>
                <Pressable
                  style={styles.entryInfo}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/recipe/[id]',
                      params: { id: entry.recipeId, portion: String(entry.portionMultiplier) },
                    })
                  }
                >
                  <View style={styles.thumbFrame}>
                    {recipe?.imageUrl && <Image source={{ uri: recipe.imageUrl }} style={styles.thumb} />}
                  </View>
                  <View style={styles.entryText}>
                    <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                    <Text style={styles.recipeName}>
                      {recipe ? recipe.name : entry.recipeId} ({Math.round(entry.portionMultiplier * 100)}%)
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleSwap(entry.id, entry.mealType, entry.recipeId)}
                  disabled={swappingId === entry.id}
                  accessibilityRole="button"
                >
                  {swappingId === entry.id ? (
                    <ActivityIndicator size="small" color={nutrition.tertiary} />
                  ) : (
                    <Text style={styles.swapHint}>Échanger</Text>
                  )}
                </Pressable>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme, nutrition: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    container: { padding: spacing.lg, ...centeredContent },
    emptyDayText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant, marginTop: spacing.md },
    entryCard: { marginBottom: spacing.sm },
    entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
    thumbFrame: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceVariant,
      overflow: 'hidden',
    },
    thumb: { width: '100%', height: '100%' },
    entryText: { flex: 1 },
    mealTypeLabel: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant },
    recipeName: { ...materialTypography.bodyMedium, color: colors.onSurface },
    swapHint: { ...materialTypography.labelSmall, color: nutrition.tertiaryContainer, marginLeft: spacing.md },
  });
}
```

Note `swapHint` reads `nutrition.tertiaryContainer` (not `.tertiary`) — per the color-mapping table, the old `domainNutritionDeep` hex (body-text-sized color, used directly on the screen background) is exactly `tertiaryContainer`'s value now, while `.tertiary` is the base fill tone used for the `ActivityIndicator` spinners above.

- [ ] **Step 4: Run the test to see it pass**

Run: `npx jest src/__tests__/plan-screen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `plan.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/plan.tsx" src/__tests__/plan-screen.test.tsx
git commit -m "feat: migrate plan screen to Material tokens, replace mascot with an event icon"
```

---

### Task 4: Migrate `recipes.tsx` — Material tokens, empty-state icon

**Files:**
- Modify: `src/app/(tabs)/recipes.tsx`
- Modify: `src/__tests__/recipes-screen.test.tsx`

**Interfaces:**
- Consumes: same as Task 3, plus `TagFilterGroup` (Phase 4, unchanged props).
- Produces: nothing new — leaf screen.

- [ ] **Step 1: Update the test**

Replace this test in `src/__tests__/recipes-screen.test.tsx`:

```tsx
  it('shows the idle mascot when no recipe matches the filters', async () => {
    const { findByText, getByText, getByTestId } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('Poulet'));
    await fireEvent.press(getByText('Végétarien'));

    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

with:

```tsx
  it('shows the empty-results icon when no recipe matches the filters', async () => {
    const { findByText, getByText, getByTestId } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('Poulet'));
    await fireEvent.press(getByText('Végétarien'));

    await waitFor(() => expect(getByTestId('empty-state-icon').props.name).toBe('restaurant-menu'));
  });
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/recipes-screen.test.tsx`
Expected: FAIL on the renamed test — `empty-state-icon` doesn't exist yet.

- [ ] **Step 3: Rewrite `src/app/(tabs)/recipes.tsx` in full**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { fetchRecipes, type Recipe } from '../../lib/mealPlanData';
import type { MealType } from '../../lib/mealPlan';
import { filterRecipes, type RecipeFilters, type PrepTimeFilter } from '../../lib/recipeFilters';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { TagFilterGroup } from '../../components/TagFilterGroup';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import {
  centeredContent,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

const MEAL_TYPE_OPTIONS: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'breakfast', label: 'Petit déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
];

const TAG_OPTIONS: { value: string; label: string }[] = [
  { value: 'poulet', label: 'Poulet' },
  { value: 'boeuf', label: 'Bœuf' },
  { value: 'porc', label: 'Porc' },
  { value: 'dinde', label: 'Dinde' },
  { value: 'poisson_fruits_de_mer', label: 'Poisson & fruits de mer' },
  { value: 'oeuf', label: 'Œuf' },
  { value: 'vegetarien', label: 'Végétarien' },
];

const PREP_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: '15', label: '≤ 15 min' },
  { value: '30', label: '≤ 30 min' },
  { value: '45', label: '≤ 45 min' },
];

function parsePrepTimeFilter(value: string): PrepTimeFilter {
  return value === 'all' ? 'all' : (Number(value) as PrepTimeFilter);
}

export default function RecipesScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType | 'all'>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [prepTimeValue, setPrepTimeValue] = useState('all');

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const allRecipes = await fetchRecipes();
      setRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des recettes.');
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

  const filters: RecipeFilters = {
    mealType,
    tags,
    maxPrepTimeMinutes: parsePrepTimeFilter(prepTimeValue),
  };
  const filteredRecipes = filterRecipes(recipes, filters);

  if (loading || !session || checking) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      {error && <ErrorNotice message={error} onRetry={load} />}

      <ChoiceGroup options={MEAL_TYPE_OPTIONS} value={mealType} onChange={setMealType} domain="nutrition" />
      <TagFilterGroup options={TAG_OPTIONS} value={tags} onChange={setTags} domain="nutrition" />
      <ChoiceGroup options={PREP_TIME_OPTIONS} value={prepTimeValue} onChange={setPrepTimeValue} domain="nutrition" />

      {filteredRecipes.length === 0 ? (
        <EmptyState
          icon={
            <MaterialIcons testID="empty-state-icon" name="restaurant-menu" size={64} color={colors.onSurfaceVariant} />
          }
          title="Aucune recette ne correspond"
          message="Essaie d'assouplir tes filtres pour voir plus de résultats."
        />
      ) : (
        filteredRecipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
          >
            <Card style={styles.recipeCard}>
              <View style={styles.recipeRow}>
                <View style={styles.thumbFrame}>
                  {recipe.imageUrl && <Image source={{ uri: recipe.imageUrl }} style={styles.thumb} />}
                </View>
                <View style={styles.recipeText}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <Text style={styles.recipeMeta}>{Math.round(recipe.baseCalories)} kcal</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    recipeCard: { marginBottom: spacing.sm },
    recipeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    thumbFrame: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceVariant,
      overflow: 'hidden',
    },
    thumb: { width: '100%', height: '100%' },
    recipeText: { flex: 1 },
    recipeName: { ...materialTypography.bodyMedium, color: colors.onSurface },
    recipeMeta: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant },
  });
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx jest src/__tests__/recipes-screen.test.tsx`
Expected: PASS (all 5 tests, including the renamed one).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `recipes.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/recipes.tsx" src/__tests__/recipes-screen.test.tsx
git commit -m "feat: migrate recipes screen to Material tokens, replace mascot with a restaurant-menu icon"
```

---

### Task 5: Migrate `workout.tsx` — Material tokens, remove header mascot (keep `PressableScale`)

**Files:**
- Modify: `src/app/(tabs)/workout.tsx`
- Modify: `src/__tests__/workout-completion.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `lightColors`, `MaterialColorScheme` (Phase 4). `Card`, `Button` (Phase 4, unchanged props). `PressableScale` (Phase 4, **unchanged, still imported and used** — this task does not touch its interaction/animation behavior, only its container's colors via the surrounding `exerciseCard`/`completionUndoTouchable` styles).
- Produces: nothing new — leaf screen.

- [ ] **Step 1: Update the test**

Delete this test from `src/__tests__/workout-completion.test.tsx` (the header mascot is removed with no replacement):

```tsx
  it('shows the idle mascot in the header', async () => {
    const { getByTestId } = await render(<WorkoutScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
```

- [ ] **Step 2: Run the tests to confirm the rest still pass against the current component**

Run: `npx jest src/__tests__/workout-completion.test.tsx`
Expected: PASS (3 remaining tests) — this step only confirms the deletion didn't break anything; the real verification of the migration is Step 4.

- [ ] **Step 3: Rewrite `src/app/(tabs)/workout.tsx` in full**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile, upsertTrainingProfile } from '../../lib/profile';
import type { ExperienceLevel, TrainingProfile } from '../../lib/profile';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { homeWorkoutProgram, getLevelProgram } from '../../lib/homeWorkoutProgram';
import type { Session } from '../../lib/homeWorkoutProgram';
import {
  logSessionCompletion,
  undoSessionCompletion,
  fetchCompletionForToday,
  type WorkoutCompletionRow,
} from '../../lib/workoutCompletionsData';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { Button } from '../../components/ui/Button';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import {
  centeredContent,
  lightColors,
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';

const LEVEL_OPTIONS = homeWorkoutProgram.levels.map((entry) => ({ value: entry.level, label: entry.label }));

const SESSION_TAB_OPTIONS = homeWorkoutProgram.levels[0].sessions.map((_, index) => ({
  value: String(index),
  label: `Séance ${index + 1}`,
}));

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkoutScreen() {
  const colors = useMaterialColors();
  const sport = useMaterialTertiary('sport');
  const styles = useMemo(() => createStyles(colors, sport), [colors, sport]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [savingLevel, setSavingLevel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletionRow | null>(null);
  const [loggingCompletion, setLoggingCompletion] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const profile = await getTrainingProfile(session.user.id);
      if (!profile) {
        router.replace('/onboarding');
        return;
      }
      setTrainingProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
    } finally {
      setChecking(false);
    }
  }, [session]);

  const loadTodayCompletion = useCallback(async () => {
    if (!session) return;
    try {
      const completion = await fetchCompletionForToday(session.user.id, activeSessionIndex, todayDateString());
      setTodayCompletion(completion);
    } catch {
      // Non-blocking: the button just falls back to its "not completed" state.
      setTodayCompletion(null);
    }
  }, [session, activeSessionIndex]);

  const handleLevelChange = async (level: ExperienceLevel) => {
    if (!session || !trainingProfile || level === trainingProfile.experienceLevel) return;
    const previous = trainingProfile;
    const next = { ...trainingProfile, experienceLevel: level };
    setTrainingProfile(next);
    setActiveSessionIndex(0);
    setSavingLevel(true);
    setError(null);
    try {
      await upsertTrainingProfile(session.user.id, next);
    } catch (err) {
      setTrainingProfile(previous);
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de niveau.');
    } finally {
      setSavingLevel(false);
    }
  };

  const handleStartSession = (index: number) => {
    if (!trainingProfile) return;
    router.push({
      pathname: '/workout-session',
      params: { level: trainingProfile.experienceLevel, sessionIndex: String(index) },
    });
  };

  const handleToggleCompletion = async () => {
    if (!session) return;
    setError(null);

    if (todayCompletion) {
      const previous = todayCompletion;
      setTodayCompletion(null);
      setLoggingCompletion(true);
      try {
        await undoSessionCompletion(session.user.id, activeSessionIndex, previous.completedDate);
      } catch (err) {
        setTodayCompletion(previous);
        setError(err instanceof Error ? err.message : "Erreur lors de l'annulation.");
      } finally {
        setLoggingCompletion(false);
      }
      return;
    }

    const optimistic: WorkoutCompletionRow = {
      id: 'optimistic',
      sessionIndex: activeSessionIndex,
      completedDate: todayDateString(),
    };
    setTodayCompletion(optimistic);
    setLoggingCompletion(true);
    try {
      await logSessionCompletion(session.user.id, activeSessionIndex);
      const completion = await fetchCompletionForToday(session.user.id, activeSessionIndex, todayDateString());
      setTodayCompletion(completion);
    } catch (err) {
      setTodayCompletion(null);
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setLoggingCompletion(false);
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

  useFocusEffect(
    useCallback(() => {
      loadTodayCompletion();
    }, [loadTodayCompletion])
  );

  if (loading || !session || checking) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={sport.tertiary} />
      </View>
    );
  }

  if (!trainingProfile) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ErrorNotice message={error ?? 'Impossible de charger ton profil sportif.'} onRetry={load} />
      </View>
    );
  }

  const levelProgram = getLevelProgram(trainingProfile.experienceLevel);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{homeWorkoutProgram.title}</Text>
          <Text style={styles.subtitle}>{homeWorkoutProgram.subtitle}</Text>
        </View>
      </View>
      <Text style={styles.blockText}>{homeWorkoutProgram.guidance}</Text>

      <ChoiceGroup
        options={LEVEL_OPTIONS}
        value={trainingProfile.experienceLevel}
        onChange={handleLevelChange}
        domain="sport"
      />
      {savingLevel && <ActivityIndicator size="small" color={sport.tertiary} />}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {homeWorkoutProgram.warmup.title} ({homeWorkoutProgram.warmup.durationLabel})
        </Text>
        <Text style={styles.blockText}>{homeWorkoutProgram.warmup.description}</Text>
      </View>

      <Text style={styles.levelSummary}>{levelProgram.summary}</Text>
      <Text style={styles.levelDuration}>Durée par séance : {levelProgram.sessionDurationLabel}</Text>

      <ChoiceGroup
        options={SESSION_TAB_OPTIONS}
        value={String(activeSessionIndex)}
        onChange={(value) => setActiveSessionIndex(Number(value))}
        domain="sport"
      />

      {levelProgram.sessions.map((sessionItem, index) => {
        if (index !== activeSessionIndex) return null;
        return (
          <Card key={sessionItem.name} style={styles.sessionCard}>
            <View style={styles.sessionPhotoFrame}>
              <Image source={sessionItem.image} style={styles.sessionPhoto} accessibilityLabel={sessionItem.name} />
            </View>
            <Text style={styles.sessionTitle}>
              Séance {index + 1} — {sessionItem.name}
            </Text>
            <View style={styles.startRow}>
              <Button title="Commencer" onPress={() => handleStartSession(index)} domain="sport" />
            </View>
            <SessionDetail session={sessionItem} styles={styles} />
            <View style={styles.completionRow}>
              {todayCompletion ? (
                <>
                  <View style={styles.completionDoneBadge}>
                    <Text style={styles.completionDoneText}>Fait aujourd'hui ✓</Text>
                  </View>
                  <PressableScale
                    onPress={handleToggleCompletion}
                    disabled={loggingCompletion}
                    hitSlop={state.hitSlop}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: loggingCompletion }}
                    style={styles.completionUndoTouchable}
                  >
                    <Text style={styles.completionUndoLink}>Annuler</Text>
                  </PressableScale>
                </>
              ) : (
                <Button
                  title="Marquer comme terminée"
                  onPress={handleToggleCompletion}
                  loading={loggingCompletion}
                  domain="sport"
                />
              )}
            </View>
          </Card>
        );
      })}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {homeWorkoutProgram.cooldown.title} ({homeWorkoutProgram.cooldown.durationLabel})
        </Text>
        <Text style={styles.blockText}>{homeWorkoutProgram.cooldown.description}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Repères de coach</Text>
        {homeWorkoutProgram.coachNotes.map((note) => (
          <Text key={note} style={styles.coachNote}>
            • {note}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof createStyles>;

function SessionDetail({ session, styles }: { session: Session; styles: Styles }) {
  if (session.type === 'circuit') {
    return (
      <View style={styles.sessionDetail}>
        <Text style={styles.exerciseListLabel}>Aperçu des exercices</Text>
        <Text style={styles.sessionMeta}>
          Circuit : {session.workSeconds} s d'effort / {session.restSeconds} s de repos. {session.rounds} tours,{' '}
          {session.recoveryLabel}.
        </Text>
        {session.exercises.map((exercise) => (
          <PressableScale
            key={exercise.name}
            onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
            accessibilityRole="link"
            hitSlop={4}
            style={styles.exerciseCard}
          >
            <Text style={styles.exerciseLine}>{exercise.name}</Text>
          </PressableScale>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.sessionDetail}>
      <Text style={styles.exerciseListLabel}>Aperçu des exercices</Text>
      <Text style={styles.sessionMeta}>En séries, {session.restLabel}.</Text>
      {session.exercises.map((exercise) => (
        <PressableScale
          key={exercise.name}
          onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}
          accessibilityRole="link"
          hitSlop={4}
          style={styles.exerciseCard}
        >
          <Text style={styles.exerciseLine}>{exercise.name}</Text>
          <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

function createStyles(colors: MaterialColorScheme, sport: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerText: { flex: 1, marginRight: spacing.md },
    title: { ...materialTypography.displayMedium, color: colors.onSurface },
    subtitle: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant, marginBottom: spacing.lg },
    block: { marginVertical: spacing.lg },
    blockTitle: { ...materialTypography.titleMedium, color: colors.onSurface, marginBottom: spacing.xs },
    blockText: { ...materialTypography.bodyLarge, color: colors.onSurfaceVariant },
    levelSummary: { ...materialTypography.bodyLarge, marginTop: spacing.sm, color: colors.onSurfaceVariant },
    levelDuration: { ...materialTypography.labelMedium, marginBottom: spacing.lg, color: colors.onSurfaceVariant },
    sessionCard: { marginBottom: spacing.sm },
    sessionPhotoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    sessionPhoto: {
      width: '100%',
      height: '100%',
    },
    sessionTitle: { ...materialTypography.titleSmall, color: colors.onSurface },
    startRow: { marginTop: spacing.sm, marginBottom: spacing.md },
    exerciseListLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
    sessionDetail: { marginTop: spacing.sm },
    sessionMeta: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
    exerciseCard: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    exerciseLine: { ...materialTypography.bodyMedium, color: colors.onSurface },
    exerciseDetail: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: 2 },
    coachNote: { ...materialTypography.bodyLarge, marginBottom: spacing.xs, color: colors.onSurfaceVariant },
    completionRow: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    completionDoneBadge: {
      backgroundColor: lightColors.successSoft,
      borderRadius: radius.pill,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    completionDoneText: { ...materialTypography.labelSmall, color: lightColors.success },
    completionUndoTouchable: {
      minHeight: state.minTouchSize,
      paddingHorizontal: spacing.sm,
      justifyContent: 'center',
    },
    completionUndoLink: { ...materialTypography.labelMedium, color: sport.tertiaryContainer },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.md },
  });
}
```

Note `completionDoneBadge`/`completionDoneText` keep reading `lightColors.successSoft`/`lightColors.success` directly (the color-mapping table's rule for status colors with no Material role) — **not** `colors.X`, since `useMaterialColors()`'s return type has no `success`/`successSoft` field at all.

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx jest src/__tests__/workout-completion.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `workout.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/workout.tsx" src/__tests__/workout-completion.test.tsx
git commit -m "feat: migrate workout screen to Material tokens, remove mascot (keep PressableScale)"
```

---

### Task 6: Migrate `grocery-list.tsx` — Material tokens, empty-state icon

**Files:**
- Modify: `src/app/(tabs)/grocery-list.tsx`
- Modify: `src/__tests__/grocery-list-screen.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `MaterialColorScheme` (Phase 4). `Card`, `EmptyState`, `ErrorNotice` — unchanged props.
- Produces: nothing new — leaf screen.

- [ ] **Step 1: Update the test**

Replace the test in `src/__tests__/grocery-list-screen.test.tsx`:

```tsx
  it('shows the empty-plan icon', async () => {
    const { getByTestId } = await render(<GroceryListScreen />);
    await waitFor(() => expect(getByTestId('empty-state-icon').props.name).toBe('shopping-cart'));
  });
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/grocery-list-screen.test.tsx`
Expected: FAIL — `empty-state-icon` doesn't exist yet.

- [ ] **Step 3: Rewrite `src/app/(tabs)/grocery-list.tsx` in full**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../../lib/mealPlanData';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import {
  centeredContent,
  materialTypography,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../../theme/tokens';

type AggregatedIngredient = { name: string; quantity: number; unit: string };

export default function GroceryListScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          icon={
            <MaterialIcons testID="empty-state-icon" name="shopping-cart" size={64} color={colors.onSurfaceVariant} />
          }
          title="Aucun plan pour l'instant"
          message="Génère un plan de repas pour obtenir ta liste de courses."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
          domain="nutrition"
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Liste de courses</Text>
      {error && <ErrorNotice message={error} onRetry={load} />}
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

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    rowLast: { borderBottomWidth: 0 },
    name: { ...materialTypography.bodyLarge, flex: 1, color: colors.onSurface },
    quantity: { ...materialTypography.labelSmall, color: colors.onSurfaceVariant },
  });
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npx jest src/__tests__/grocery-list-screen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `grocery-list.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/grocery-list.tsx" src/__tests__/grocery-list-screen.test.tsx
git commit -m "feat: migrate grocery-list screen to Material tokens, replace mascot with a shopping-cart icon"
```

---

### Task 7: Move `weight-log.tsx` out of `(tabs)`, migrate to Material tokens

**Files:**
- Create: `src/app/weight-log.tsx` (full content — the migrated screen)
- Delete: `src/app/(tabs)/weight-log.tsx`
- Modify: `src/__tests__/weight-log-screen.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors()`, `useMaterialTertiary()`, `materialTypography`, `lightColors`, `MaterialColorScheme` (Phase 4). `TextField`, `Button`, `Card`, `EmptyState`, `Sparkline` — unchanged props.
- Produces: nothing new — leaf screen. The route `/weight-log` keeps working: Expo Router's `(tabs)` segment never appears in the URL, so moving the file one level up (out of that group) does not change how `router.push('/weight-log')` resolves (already used by `home.tsx`'s new button from Task 2).

- [ ] **Step 1: Update the test — new import path, new assertion**

Replace `src/__tests__/weight-log-screen.test.tsx` in full (note the import path change on line 3):

```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import WeightLogScreen from '../app/weight-log';
import { useAuth } from '../lib/auth-context';
import { fetchRecentWeightLogs } from '../lib/weightLogData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/weightLogData', () => ({
  logWeight: jest.fn(),
  fetchRecentWeightLogs: jest.fn(),
}));

jest.mock('../lib/progressTracking', () => ({
  calculateWeeklyTrendPercent: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('WeightLogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (fetchRecentWeightLogs as jest.Mock).mockResolvedValue([]);
  });

  it('shows the empty-history icon when there is no weight history yet', async () => {
    const { getByTestId } = await render(<WeightLogScreen />);
    await waitFor(() => expect(getByTestId('empty-state-icon').props.name).toBe('monitor-weight'));
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/weight-log-screen.test.tsx`
Expected: FAIL — `../app/weight-log` doesn't exist yet (the file hasn't moved), so this fails on the import itself.

- [ ] **Step 3: Create `src/app/weight-log.tsx` with the migrated content — note the relative import depth is now `../` not `../../`**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { logWeight, fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';
import { calculateWeeklyTrendPercent } from '../lib/progressTracking';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Sparkline } from '../components/ui/Sparkline';
import {
  centeredContent,
  fontFamily,
  lightColors,
  materialTypography,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
} from '../theme/tokens';

/** French decimals, without depending on Intl being built into the JS engine. */
function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

function formatDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return month && day ? `${day}/${month}` : isoDate;
}

/**
 * The trend is stated as a rate, not judged. Whether losing weight counts as
 * progress depends on the user's goal, which this screen does not load — so the
 * delta carries a direction and a period, and no success/warning color.
 */
function formatTrend(percentPerWeek: number): string {
  const sign = percentPerWeek > 0 ? '+' : '−';
  return `${sign}${formatNumber(Math.abs(percentPerWeek), 2)} % par semaine`;
}

export default function WeightLogScreen() {
  const colors = useMaterialColors();
  const neutral = useMaterialTertiary('neutral');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const recent = await fetchRecentWeightLogs(session.user.id);
      setLogs(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement de l'historique de poids.");
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
      setError('Poids invalide (supérieur à 0 kg).');
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={neutral.tertiary} />
      </View>
    );
  }

  // The API returns newest first; a trend line reads left to right.
  const chronological = [...logs].reverse();
  const current = chronological[chronological.length - 1];
  const trendPercent = calculateWeeklyTrendPercent(chronological);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Suivi de poids</Text>
      <TextField label="Poids (kg)" value={weightInput} onChangeText={setWeightInput} keyboardType="numeric" />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} domain="neutral" />

      {current && (
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Poids actuel</Text>
          <Text style={styles.statValue}>{formatNumber(current.weightKg)} kg</Text>
          <Text style={styles.statDelta}>
            {trendPercent === null
              ? `Première pesée le ${formatDate(current.loggedAt)}`
              : `${formatTrend(trendPercent)} sur ${chronological.length} pesées`}
          </Text>

          <View style={styles.chart} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
            <Sparkline
              values={chronological.map((log) => log.weightKg)}
              width={chartWidth}
              accessibilityLabel={`Évolution du poids sur ${chronological.length} pesées, de ${formatNumber(
                chronological[0].weightKg
              )} à ${formatNumber(current.weightKg)} kilos.`}
            />
          </View>

          {chronological.length > 1 && (
            <View style={styles.chartAxis}>
              <Text style={styles.axisLabel}>{formatDate(chronological[0].loggedAt)}</Text>
              <Text style={styles.axisLabel}>{formatDate(current.loggedAt)}</Text>
            </View>
          )}
        </Card>
      )}

      <Text style={styles.historyTitle}>Historique</Text>
      {logs.length === 0 ? (
        <EmptyState
          icon={
            <MaterialIcons testID="empty-state-icon" name="monitor-weight" size={64} color={colors.onSurfaceVariant} />
          }
          title="Aucune pesée"
          message="Enregistre ton poids ci-dessus pour voir ta courbe se construire."
        />
      ) : (
        <Card>
          {logs.map((log, index) => (
            <View key={log.id} style={[styles.row, index === logs.length - 1 && styles.rowLast]}>
              <Text style={styles.date}>{log.loggedAt}</Text>
              <Text style={styles.weight}>{formatNumber(log.weightKg)} kg</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    statCard: { marginTop: spacing.xl },
    statLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant },
    statValue: { ...materialTypography.headlineLarge, color: colors.onSurface, marginTop: spacing.xs },
    statDelta: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    chart: { marginTop: spacing.lg },
    chartAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
    axisLabel: { ...materialTypography.labelMedium, color: lightColors.textTertiary },
    historyTitle: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    rowLast: { borderBottomWidth: 0 },
    date: { ...materialTypography.labelMedium, color: colors.onSurface },
    // The number is the point of this screen — serif, and darker than its date.
    weight: { ...materialTypography.bodyMedium, color: colors.onSurface, fontFamily: fontFamily.displayBold },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginBottom: spacing.md },
  });
}
```

- [ ] **Step 4: Delete the old file**

```bash
git rm "src/app/(tabs)/weight-log.tsx"
```

- [ ] **Step 5: Run the test to see it pass**

Run: `npx jest src/__tests__/weight-log-screen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors traceable to `weight-log.tsx` or its test. This also confirms Expo Router's generated route types (`.expo/types/router.d.ts`) still resolve `router.push('/weight-log')` correctly after the move — if they don't, run `npx expo start` once to let Expo Router regenerate its type file, then re-run this check.

- [ ] **Step 7: Manual route verification**

Run: `npx expo start`, open the app, confirm: (a) "Poids" is gone from the tab bar (already true since Task 1), (b) tapping "Suivre mon poids" on Accueil navigates to the weight screen and it renders correctly, (c) the URL/route is `/weight-log` (visible in Expo Router's dev tools or by checking `router.push('/weight-log')` in `home.tsx` resolves without a "route not found" error).

- [ ] **Step 8: Commit**

```bash
git add src/app/weight-log.tsx src/__tests__/weight-log-screen.test.tsx
git commit -m "feat: move weight-log out of the tab group, migrate to Material tokens"
```

---

### Task 8: Final verification pass

**Files:** none modified — verification only.

**Interfaces:** none.

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: the only errors are the pre-existing `*.test.ts(x)` jest-globals ones (confirm the count is close to the ~1225-1245 baseline noted in this plan's Global Constraints — a handful more is expected from any new test files/cases this plan added, same as every Phase 4 task saw). Zero errors in `src/app/(tabs)/_layout.tsx`, `home.tsx`, `plan.tsx`, `recipes.tsx`, `workout.tsx`, `grocery-list.tsx`, or `src/app/weight-log.tsx`.

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: every suite passes.

- [ ] **Step 3: Confirm no touched screen still imports the old claymorphic hook or `Mascot`**

Run: `grep -n "useThemeColors\|from '.*ui/Mascot'" "src/app/(tabs)/_layout.tsx" "src/app/(tabs)/home.tsx" "src/app/(tabs)/plan.tsx" "src/app/(tabs)/recipes.tsx" "src/app/(tabs)/workout.tsx" "src/app/(tabs)/grocery-list.tsx" "src/app/weight-log.tsx"`
Expected: no output.

- [ ] **Step 4: Confirm `weight-log.tsx` really moved and the old path is gone**

Run: `git status --short "src/app/(tabs)/weight-log.tsx" src/app/weight-log.tsx`
Expected: shows `src/app/weight-log.tsx` as a tracked, committed file (no `??` or `A ` marker left uncommitted) and nothing for the old `(tabs)` path (it no longer exists).

- [ ] **Step 5: Confirm `PressableScale` and `motion.spring.snappy` still exist and still have the same consumer set as before this plan (plus `workout.tsx`, unchanged)**

Run: `grep -rl "PressableScale" src/`
Expected: `src/components/ui/PressableScale.tsx` (the file itself), `src/components/ui/BackLink.tsx`, `src/app/generate-plan.tsx`, `src/app/workout-session.tsx`, and `src/app/(tabs)/workout.tsx` — the same set as before Phase 5a, since this plan explicitly does not touch `PressableScale`'s usage anywhere it already existed. `home.tsx` still appears too (its gamification-card wrapper, untouched by this plan).

- [ ] **Step 6: Confirm the tab bar has exactly 5 `Tabs.Screen` entries**

Run: `grep -c "Tabs.Screen" "src/app/(tabs)/_layout.tsx"`
Expected: `5`.

- [ ] **Step 7: No commit for this task** — verification-only. If any check above fails, fix the specific regression it points to, re-run Steps 1-2, and only then consider this plan complete.
