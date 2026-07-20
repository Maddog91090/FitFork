# Onboarding Visual Design (Figma) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Athletic Dark" onboarding design (design system + 5 connected frames) as an editable Figma file, per `docs/superpowers/specs/2026-07-20-onboarding-visual-design.md`.

**Architecture:** One new Figma design file with two pages — "Design System" (color/text styles + reusable components) built first, then "Onboarding" (5 frames assembled from those components, connected with flow arrows). No app code changes.

**Tech Stack:** Figma (via the `claude.ai Figma` MCP server — `use_figma`, `create_new_file`, `get_screenshot`, `get_figma_skill`, `whoami`).

## Note on this plan's format

This plan produces a Figma file, not source code, so tasks don't have
`Create`/`Modify` code files — instead each task specifies exactly what to
build in Figma (names, hex values, copy, dimensions) and how to verify it
with a screenshot. The executor must still write the actual JavaScript
passed to `use_figma` at run time (per the mandatory `figma-use` skill) —
that code depends on live node IDs Figma assigns during the session, so it
cannot be pre-written here. What *is* fixed and non-negotiable is every
value below: colors, copy, spacing, and names must match exactly.

**Before this plan's first `use_figma` or `create_new_file` call**, load:
- `skill://figma/figma-use/SKILL.md` (mandatory before any `use_figma` call)
- `skill://figma/figma-create-new-file/SKILL.md` (mandatory before `create_new_file`)
- `skill://figma/figma-generate-library/SKILL.md` (guidance on build order for a token/component library — Task 2 and Task 3 follow it)

Load each once per session (not once per call) via `mcp__claude_ai_Figma__get_figma_skill`.

## Global Constraints

- Dark-only design (no light mode variant) — from spec.
- French copy only, matching `src/app/onboarding.tsx` option labels exactly — from spec.
- 6px corner radius throughout — from spec.
- Font: Inter (fallback -apple-system); titles/labels bold+uppercase, body regular sentence case — from spec.
- Frame size: 393×852 (iPhone gabarit) for all 5 onboarding frames — from spec.
- Color tokens (exact hex): `bg/base` #0E0E12, `bg/surface` #18181D, `border/default` #2A2A32, `accent/lime` #C6FF3D, `text/primary` #FFFFFF, `text/secondary` #8A8A94 — from spec.
- File has exactly two pages: "Design System" and "Onboarding" — from spec.
- No app code (`src/**`) is modified by this plan.

---

### Task 1: Create the Figma file

**Figma target:** a new Figma design file to hold this work.

**Interfaces:**
- Produces: `FILE_KEY` (the created file's key) and `FILE_URL` — every later task's `use_figma`/`get_screenshot` calls use this `FILE_KEY`.

- [ ] **Step 1: Identify the plan/team to create the file under**

Call `mcp__claude_ai_Figma__whoami`. If the response lists exactly one plan, use its `key` field as `PLAN_KEY`. If it lists more than one, stop and ask the user which team/organization to use before continuing.

- [ ] **Step 2: Load the figma-create-new-file skill**

Call `mcp__claude_ai_Figma__get_figma_skill` with `uri: "skill://figma/figma-create-new-file/SKILL.md"`. Follow its guidance for the next step.

- [ ] **Step 3: Create the file**

Call `mcp__claude_ai_Figma__create_new_file` with:
- `fileName`: `"Fitpro — Onboarding (Athletic Dark)"`
- `planKey`: `PLAN_KEY` from Step 1
- `editorType`: `"design"`

Record the returned file key as `FILE_KEY` and the URL as `FILE_URL`.

- [ ] **Step 4: Verify the file exists**

Open `FILE_URL` conceptually via `mcp__claude_ai_Figma__get_screenshot` — this requires a `nodeId`, so instead verify by calling `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `description: "List root pages to confirm the file is empty and ready"`, and code that reads `figma.root.children` and returns each page's name and id.
Expected: a single default page (Figma names new files' first page "Page 1").

- [ ] **Step 5: No commit**

This task only creates a remote Figma file; there is no local file to commit.

---

### Task 2: Design tokens — color and text styles

**Figma target:** the "Design System" page, holding Figma color styles and text styles for every token in Global Constraints.

**Interfaces:**
- Consumes: `FILE_KEY` from Task 1.
- Produces: named Figma styles that Task 3–7 reference by name:
  - Color styles: `bg/base`, `bg/surface`, `border/default`, `accent/lime`, `text/primary`, `text/secondary`
  - Text styles: `Title` (Inter Bold 19px, uppercase, +0.3 letter-spacing, `text/primary`), `Field Label` (Inter Bold 11px, uppercase, +0.4 letter-spacing, `text/secondary`), `Step Counter` (Inter Semi Bold 11px, uppercase, +0.5 letter-spacing, `text/secondary`), `Body` (Inter Regular 12px, `text/secondary`), `Pill Label` (Inter Bold 13px, uppercase, +0.3 letter-spacing), `Button Label` (Inter Bold 13px, uppercase, +0.5 letter-spacing), `Input Value` (Inter Regular 16px, `text/primary`)

- [ ] **Step 1: Load the figma-use and figma-generate-library skills**

Call `mcp__claude_ai_Figma__get_figma_skill` with `uri: "skill://figma/figma-use/SKILL.md"`, then again with `uri: "skill://figma/figma-generate-library/SKILL.md"`. Follow their guidance for token/style setup for the remaining steps of this task.

- [ ] **Step 2: Rename "Page 1" to "Design System" and create the page structure**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use,figma-generate-library"`, `description: "Rename default page to Design System and lay out sections for color styles, text styles, and components"`, and code that: renames the first page to `"Design System"`, and creates three section frames on it named `"Colors"`, `"Typography"`, `"Components"` (stacked vertically with spacing, auto-layout, so later tasks can append into `"Components"`).

- [ ] **Step 3: Create the 6 color styles**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use,figma-generate-library"`, `description: "Create the 6 onboarding color styles as Figma paint styles, with a labeled swatch for each in the Colors section"`, and code that creates paint styles named exactly `bg/base` (#0E0E12), `bg/surface` (#18181D), `border/default` (#2A2A32), `accent/lime` (#C6FF3D), `text/primary` (#FFFFFF), `text/secondary` (#8A8A94), and places one labeled swatch rectangle per color inside the `"Colors"` section frame for visual reference.

- [ ] **Step 4: Verify color styles**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and the `"Colors"` section's node id, `maxDimension: 1024`.
Expected: 6 labeled swatches, colors visually matching the hex values above.

- [ ] **Step 5: Create the 7 text styles**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use,figma-generate-library"`, `description: "Create the 7 onboarding text styles as Figma text styles, with a labeled sample for each in the Typography section"`, and code that creates text styles named exactly `Title`, `Field Label`, `Step Counter`, `Body`, `Pill Label`, `Button Label`, `Input Value` with the font, size, weight, case, and letter-spacing values listed in this task's Interfaces block, each bound to the matching color style from Step 3, and places one sample text node per style inside the `"Typography"` section frame.

- [ ] **Step 6: Verify text styles**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and the `"Typography"` section's node id, `maxDimension: 1024`.
Expected: 7 labeled text samples, visually distinguishable by size/weight/case per the spec (titles bold uppercase, body regular sentence case, etc).

- [ ] **Step 7: No commit**

Figma-only change; nothing to commit locally.

---

### Task 3: Components — ProgressBar, ChoicePill, TextFieldUnderline, PrimaryButton, BackLink

**Figma target:** the "Components" section of the "Design System" page.

**Interfaces:**
- Consumes: color/text styles from Task 2 (`FILE_KEY` from Task 1).
- Produces: 5 named Figma components that Tasks 4–7 place as instances:
  - `ProgressBar` — variant property `activeStep` = `1` | `2` | `3` | `4`. Horizontal auto-layout, 4 children, each a 22×4px rect radius 2px. Segments at position ≤ `activeStep` filled `accent/lime`; segments after it filled `border/default`.
  - `ChoicePill` — variant property `selected` = `true` | `false`. Horizontal auto-layout, padding 12/14, radius 6px, text style `Pill Label`. `selected=true`: fill `accent/lime` at 12% opacity, 1.5px border `accent/lime`, text color `accent/lime`. `selected=false`: fill `bg/surface`, 1.5px border `border/default`, text color `text/secondary`.
  - `TextFieldUnderline` — variant property `focused` = `true` | `false`. Vertical auto-layout: a `Field Label`-styled label on top, then a row with 2px bottom border only (no other border, no fill) and 8px vertical / 2px horizontal padding, containing an `Input Value`-styled text node. `focused=false`: border `border/default`, text `text/secondary` (placeholder look). `focused=true`: border `accent/lime`, text `text/primary`.
  - `PrimaryButton` — fill `accent/lime`, radius 6px, full-width auto-layout (fill container), centered `Button Label`-styled text colored `bg/base`. Text content is overridden per instance (`CONTINUER` / `VALIDER`).
  - `BackLink` — horizontal auto-layout, small `←` glyph + `"Retour"` text, both colored `text/secondary`, `Body` text style.

  Note: the spec's "ChoicePillGroup" is not built as its own Figma component here — its child count (2, 3, or 5 pills) and orientation vary per field, so a fixed-variant component doesn't fit. It's realized instead as a plain vertical auto-layout frame (8px gap) that Tasks 4–6 create directly and fill with `ChoicePill` instances — same visual result, no separate library entry needed.

- [ ] **Step 1: Build ProgressBar and ChoicePill**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use,figma-generate-library"`, `description: "Create ProgressBar (4 variants: activeStep 1-4) and ChoicePill (2 variants: selected true/false) components in the Components section, bound to the Design System's color and text styles"`, and code implementing the exact specs in this task's Interfaces block, as proper Figma components with variant properties (not one-off frames), placed inside the `"Components"` section.

- [ ] **Step 2: Verify ProgressBar and ChoicePill**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and the node id covering both new component sets, `maxDimension: 1024`.
Expected: 4 ProgressBar variants showing 1, 2, 3, then 4 lime segments (rest gray); 2 ChoicePill variants showing the selected (lime-tinted, lime border/text) vs unselected (gray) look.

- [ ] **Step 3: Build TextFieldUnderline, PrimaryButton, BackLink**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use,figma-generate-library"`, `description: "Create TextFieldUnderline (2 variants: focused true/false), PrimaryButton, and BackLink components in the Components section"`, and code implementing the exact specs in this task's Interfaces block.

- [ ] **Step 4: Verify TextFieldUnderline, PrimaryButton, BackLink**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and the node id covering the three new components, `maxDimension: 1024`.
Expected: TextFieldUnderline unfocused (gray bottom border) vs focused (lime bottom border) side by side; a full-width lime PrimaryButton with dark uppercase label; a small gray "← Retour" BackLink.

- [ ] **Step 5: No commit**

Figma-only change; nothing to commit locally.

---

### Task 4: Frame 1 — "Ton profil"

**Figma target:** a 393×852 frame named `"1 — Ton profil"` on the "Onboarding" page.

**Interfaces:**
- Consumes: `ProgressBar`, `ChoicePill`, `TextFieldUnderline`, `PrimaryButton` components from Task 3; color/text styles from Task 2.
- Produces: this frame is the flow's start node — Task 8 draws the flow arrow from it to Frame 2.

**Content (top to bottom, `bg/base` background, 20px padding):**
1. `ProgressBar` instance, `activeStep = 1`
2. `Step Counter`-styled text: `"ÉTAPE 1/4"`
3. `Title`-styled text: `"TON PROFIL"`
4. `Field Label` `"Sexe"` + a horizontal pair of `ChoicePill` instances: `"HOMME"` (selected=true) and `"FEMME"` (selected=false)
5. `TextFieldUnderline` instance — label `"Âge"`, value `"28"`, `focused=false`
6. `TextFieldUnderline` instance — label `"Taille (cm)"`, value `"175"`, `focused=false`
7. `TextFieldUnderline` instance — label `"Poids (kg)"`, value `"72"`, `focused=false`
8. `PrimaryButton` instance at the bottom, text `"CONTINUER"`

- [ ] **Step 1: Create the "Onboarding" page and Frame 1**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use"`, `description: "Create the Onboarding page and build Frame 1 (Ton profil) at 393x852 using the Design System components"`, and code that: creates a new page named `"Onboarding"` (order: after "Design System"), switches to it with `await figma.setCurrentPageAsync(page)`, creates a 393×852 frame named `"1 — Ton profil"` filled `bg/base`, and places the content listed above using instances of the Task 2/3 styles and components (not new hardcoded shapes).

- [ ] **Step 2: Verify Frame 1**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and Frame 1's node id, `maxDimension: 1024`.
Expected: dark frame, first progress segment lime, "Sexe" pills with Homme selected, three underline fields (Âge/Taille/Poids) with sample values, lime "CONTINUER" button at the bottom — matching the approved mockup's layout.

- [ ] **Step 3: No commit**

Figma-only change; nothing to commit locally.

---

### Task 5: Frame 2 — "Ton activité"

**Figma target:** a 393×852 frame named `"2 — Ton activité"` on the "Onboarding" page, placed to the right of Frame 1.

**Interfaces:**
- Consumes: `ProgressBar`, `ChoicePill`, `PrimaryButton`, `BackLink` components from Task 3.
- Produces: Task 8 draws flow arrows Frame 1→Frame 2 and Frame 2→Frame 3.

**Content (top to bottom, `bg/base` background, 20px padding):**
1. `BackLink` instance, top-left
2. `ProgressBar` instance, `activeStep = 2`
3. `Step Counter`-styled text: `"ÉTAPE 2/4"`
4. `Title`-styled text: `"TON ACTIVITÉ"`
5. `Field Label` `"Niveau d'activité quotidienne"` + a vertical stack (8px gap) of 5 `ChoicePill` instances, all `selected=false` except `"MODÉRÉE"` (`selected=true`): `"SÉDENTAIRE"`, `"LÉGÈRE"`, `"MODÉRÉE"`, `"ACTIVE"`, `"TRÈS ACTIVE"`
6. `Field Label` `"Objectif"` + a vertical stack (8px gap) of 3 `ChoicePill` instances, `"MAINTIEN"` selected: `"SÈCHE"`, `"MAINTIEN"`, `"PRISE DE MASSE"`
7. `PrimaryButton` instance at the bottom, text `"CONTINUER"`

- [ ] **Step 1: Build Frame 2**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use"`, `description: "Build Frame 2 (Ton activité) at 393x852 on the Onboarding page, positioned to the right of Frame 1"`, and code implementing the content list above using Task 2/3 styles and components.

- [ ] **Step 2: Verify Frame 2**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and Frame 2's node id, `maxDimension: 1024`.
Expected: dark frame, back link top-left, second progress segment lime (first also lime — cumulative), 5-option activity pill list with one selected, 3-option goal pill list with one selected, lime "CONTINUER" button.

- [ ] **Step 3: No commit**

Figma-only change; nothing to commit locally.

---

### Task 6: Frame 3 — "Ton entraînement"

**Figma target:** a 393×852 frame named `"3 — Ton entraînement"` on the "Onboarding" page, placed to the right of Frame 2.

**Interfaces:**
- Consumes: `ProgressBar`, `ChoicePill`, `TextFieldUnderline`, `PrimaryButton`, `BackLink` components from Task 3.
- Produces: Task 8 draws flow arrow Frame 3→Frame 4.

**Content (top to bottom, `bg/base` background, 20px padding):**
1. `BackLink` instance, top-left
2. `ProgressBar` instance, `activeStep = 3`
3. `Step Counter`-styled text: `"ÉTAPE 3/4"`
4. `Title`-styled text: `"TON ENTRAÎNEMENT"`
5. `TextFieldUnderline` instance — label `"Jours d'entraînement / semaine"`, value `"4"`, `focused=false`
6. `Field Label` `"Niveau"` + a vertical stack (8px gap) of 3 `ChoicePill` instances, `"INTERMÉDIAIRE"` selected: `"DÉBUTANT"`, `"INTERMÉDIAIRE"`, `"AVANCÉ"`
7. `Field Label` `"Matériel disponible"` + a vertical stack (8px gap) of 3 `ChoicePill` instances, `"SALLE COMPLÈTE"` selected: `"SALLE COMPLÈTE"`, `"MAISON (MATÉRIEL LIMITÉ)"`, `"POIDS DU CORPS"`
8. `PrimaryButton` instance at the bottom, text `"CONTINUER"`

- [ ] **Step 1: Build Frame 3**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use"`, `description: "Build Frame 3 (Ton entraînement) at 393x852 on the Onboarding page, positioned to the right of Frame 2"`, and code implementing the content list above using Task 2/3 styles and components.

- [ ] **Step 2: Verify Frame 3**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and Frame 3's node id, `maxDimension: 1024`.
Expected: dark frame, back link, third progress segment lime (1–3 lit), one underline numeric field, two 3-option pill lists each with a selection, lime "CONTINUER" button.

- [ ] **Step 3: No commit**

Figma-only change; nothing to commit locally.

---

### Task 7: Frame 4 — "Récap"

**Figma target:** a 393×852 frame named `"4 — Récap"` on the "Onboarding" page, placed to the right of Frame 3.

**Interfaces:**
- Consumes: `PrimaryButton`, `BackLink` components and text styles from Task 3/2. Does not use `ProgressBar` or `ChoicePill`.
- Produces: this frame is the flow's end node.

**Content (top to bottom, `bg/base` background, 20px padding):**
1. `BackLink` instance, top-left
2. `Title`-styled text: `"RÉCAP"`
3. Three summary sections, each with a `Field Label`-styled section heading and a small `"Modifier"` link (Body style, `accent/lime` color, right-aligned) that jumps back to the corresponding frame, followed by label/value rows (label = `Body` style in `text/secondary`, value = `Body` style in `text/primary`):
   - **"Profil"** (→ Frame 1): Sexe: Homme · Âge: 28 · Taille: 175 cm · Poids: 72 kg
   - **"Activité"** (→ Frame 2): Activité: Modérée · Objectif: Maintien
   - **"Entraînement"** (→ Frame 3): Jours/semaine: 4 · Niveau: Intermédiaire · Matériel: Salle complète
4. `PrimaryButton` instance at the bottom, text `"VALIDER"`

- [ ] **Step 1: Build Frame 4**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use"`, `description: "Build Frame 4 (Récap) at 393x852 on the Onboarding page, positioned to the right of Frame 3"`, and code implementing the content list above using Task 2/3 styles and components.

- [ ] **Step 2: Verify Frame 4**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and Frame 4's node id, `maxDimension: 1024`.
Expected: dark frame, back link, "RÉCAP" title, three labeled sections each with sample values and a "Modifier" link, lime "VALIDER" button.

- [ ] **Step 3: No commit**

Figma-only change; nothing to commit locally.

---

### Task 8: Connect the flow and record the deliverable

**Figma target:** flow arrows on the "Onboarding" page; `docs/superpowers/specs/2026-07-20-onboarding-visual-design.md` gets a "Delivered" section appended.

**Interfaces:**
- Consumes: Frames 1–4 from Tasks 4–7 (`FILE_KEY`, `FILE_URL` from Task 1).

- [ ] **Step 1: Draw flow arrows**

Call `mcp__claude_ai_Figma__use_figma` with `fileKey: FILE_KEY`, `skillNames: "figma-use"`, `description: "Connect Frame 1 -> 2 -> 3 -> 4 with Figma flow starting point and prototype connections, in sequence"`, and code that sets Frame 1 as a prototype flow starting point named `"Onboarding"`, and adds prototype reactions so each frame's `PrimaryButton` instance navigates to the next frame (Frame 4's `VALIDER` has no outgoing connection — it's the end).

- [ ] **Step 2: Verify the full flow**

Call `mcp__claude_ai_Figma__get_screenshot` with `fileKey: FILE_KEY` and the "Onboarding" page's node id, `maxDimension: 2048`.
Expected: all 4 frames visible left-to-right in order, connector arrows 1→2→3→4 visible between them.

- [ ] **Step 3: Record the file URL in the spec**

Append this section to the end of `docs/superpowers/specs/2026-07-20-onboarding-visual-design.md`:

```markdown

## Delivered

Figma file: `FILE_URL` (replace `FILE_URL` with the actual URL from Task 1, Step 3).
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-07-20-onboarding-visual-design.md
git commit -m "Record Figma file URL for onboarding visual design"
```
