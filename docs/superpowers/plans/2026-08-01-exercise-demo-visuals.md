# Exercise Demonstration Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give users a way to see how to perform each exercise in the home workout program, by generating a consistent set of AI demonstration visuals (start pose + end pose) for the program's 16 canonical movements and wiring them into a tap-to-view modal on the workout screen, per `docs/superpowers/specs/2026-08-01-exercise-demo-visuals-design.md`.

**Architecture:** A locked reference character (generated once via Higgsfield's character-sheet workflow, brand palette/style) is reused as an image-to-image reference for 32 movement-pose generations (16 movements × start/end), keeping the whole set visually consistent. Assets are saved as local transparent PNGs under `assets/images/exercises/`. A new `src/lib/exerciseVisuals.ts` module maps every exercise string that appears in `homeWorkoutProgram.ts` to a canonical movement key, and each movement key to its two images — `homeWorkoutProgram.ts` itself is not modified. A new `ExerciseVisualModal` component looks up and displays the pair; `src/app/(tabs)/workout.tsx` is changed to make each exercise line tappable, opening the modal.

**Tech Stack:** Higgsfield MCP tools (`get_workflow_instructions`, `generate_image`, `job_status`, `remove_background`) for image generation; `curl` (via Bash) to download generated assets; PowerShell + `System.Drawing` for local dimension checks; React Native (`Modal`, `Image`, `Pressable`) — no new npm dependencies; Jest + `@testing-library/react-native` for the code tasks.

## Note on this plan's format

Tasks 1–4 produce binary image assets, not application code — their "test cycle" is generate → poll → clean up background → download → **show the result to the user and get explicit approval** → verify files exist → commit. This last point matters more here than in prior asset-generation plans (`2026-07-22-brand-visual-identity.md`): a squat image with an anatomically wrong knee angle is a real defect that no automated check can catch, so approval must come from an actual person looking at the image, not from a dimension check alone. If the user rejects an image, regenerate it with an adjusted prompt describing exactly what was wrong (e.g. "the knee bend read as ~45°, not ~90° — bend the front knee further") before moving on. Job IDs, media IDs, and download URLs are only known once the corresponding Higgsfield call actually runs; steps that reference "the id from Task N" are filling in a value produced earlier during execution, the same convention used in `2026-07-22-brand-visual-identity.md`.

Tasks 5–7 are ordinary TDD application code and follow the standard write-test → see-it-fail → implement → see-it-pass → commit cycle.

## Global Constraints

- `homeWorkoutProgram.ts` is not modified by this plan — exercises stay plain strings; visuals are wired through a separate mapping module — from spec (Scope).
- Brand palette for all generated visuals: red `#DC2626`-family, white, navy — from spec / `2026-07-22-brand-visual-identity-design.md`.
- Style treatment: flat/minimal base with targeted 3D relief and shading on the character (volume, shading, realistic proportions) — from spec, reusing the split established in `2026-07-31-onboarding-hero-illustration-design.md`.
- All generated exercise images: square (1:1) crop, `1k` resolution, fully transparent background — chosen for consistency with the existing transparent-PNG asset pattern (`android-icon-foreground.png`, and the planned onboarding hero illustration) and so they sit cleanly on the white modal card (`colors.bgSurface`, `#FFFFFF`).
- Model for all movement-pose generations: `nano_banana_pro`, using the locked reference character (Task 1) as the `medias` image-to-image reference — same consistency mechanism used for the app icon set in `2026-07-22-brand-visual-identity.md`.
- No files under `src/**` are touched by Tasks 1–4 — assets only. No `app.json` changes anywhere in this plan.
- 16 canonical movements and their exact exercise-string membership, copied verbatim from the spec:

| Movement key | Program exercise strings (exact) |
|---|---|
| `squat` | `Squats sur chaise (assis-debout, lent)`, `Squats à vide, rythme tranquille`, `Squats`, `Squats complets` |
| `squatJump` | `Squats sautés ou squats rapides`, `Squats sautés` |
| `squatBulgarian` | `Squats bulgares (pied arrière surélevé)` |
| `pushupFloor` | `Pompes (sur les genoux si besoin)`, `Pompes complètes (pieds surélevés pour durcir)`, `Pompes déclinées` |
| `pushupWall` | `Pompes contre un mur` |
| `lunge` | `Fentes statiques (une jambe puis l'autre, sans à-coup)`, `Fentes statiques`, `Fentes alternées`, `Fentes arrière` |
| `lungeJump` | `Fentes sautées alternées`, `Fentes sautées` |
| `plank` | `Gainage sur les genoux`, `Gainage planche`, `Gainage planche avec touches d'épaules` |
| `sidePlank` | `Gainage latéral`, `Gainage latéral dynamique` |
| `gluteBridge` | `Pont fessier`, `Pont fessier une jambe` |
| `jumpingJack` | `Jumping jacks doux (sans saut : un pied écarté à la fois)`, `Jumping jacks` |
| `highKnees` | `Montées de genoux sur place`, `Genoux hauts (course sur place)`, `Sprint sur place, genoux hauts` |
| `heelToButt` | `Talons-fesses` |
| `marchInPlace` | `Marche rapide sur place, genoux montés` |
| `mountainClimber` | `Mountain climbers`, `Mountain climbers rapides` |
| `burpee` | `Burpees (version sans saut si trop dur)`, `Burpees`, `Burpees avec saut` |

---

### Task 1: Lock the reference demo character

**Files:**
- Create: `docs/superpowers/specs/assets/2026-08-01-exercise-demo-character-reference.png`

**Interfaces:**
- Produces: `CHARACTER_JOB_ID` (a Higgsfield media/job id, recorded once Step 1 runs) — consumed by Tasks 2, 3, and 4 as the `medias` reference for every movement-pose generation.

- [ ] **Step 1: Fetch the character-sheet workflow instructions**

Call `mcp__claude_ai_Higgsfield__get_workflow_instructions` with:
```json
{ "workflow": "character-sheet" }
```
Follow the returned instructions to produce one clean reference image (the tool/parameters the instructions specify take precedence over the generic `generate_image` shape used elsewhere in this plan — follow what's returned). Use this brief as the character description, verbatim:

> A friendly, athletic, gender-neutral fitness character in their mid-20s, average athletic build, medium skin tone, short practical dark hair, wearing a fitted red (#DC2626) athletic top and navy shorts with white trim. Rendered in a flat, minimal color base with targeted 3D relief and shading on the character's form (volume, shading, realistic proportions) so a pose reads clearly at a glance. Standing in a simple neutral standing pose, facing slightly to the right (3/4 view), arms relaxed at the sides. No background elements, no props, no text. Fully transparent background, square crop, generous padding around the figure.

Record the resulting job/media id as `CHARACTER_JOB_ID`.

- [ ] **Step 2: Poll for completion and download**

Call `mcp__claude_ai_Higgsfield__job_status` with `jobId` = `CHARACTER_JOB_ID` and `sync: true`. Repeat until `status` is `completed`. Record `results.rawUrl` as `CHARACTER_URL`, then:
```bash
curl -sL -o "docs/superpowers/specs/assets/2026-08-01-exercise-demo-character-reference.png" "CHARACTER_URL"
```

- [ ] **Step 3: Show the character to the user for approval**

Present the downloaded image to the user (e.g. via `SendUserFile`) and ask them to confirm the character's design, proportions, and style match the brand direction before it's used as the reference for 32 more generations. If they ask for changes, adjust the brief in Step 1 accordingly and regenerate — do not proceed to Task 2 until approved, since every later image depends on this one for consistency.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/assets/2026-08-01-exercise-demo-character-reference.png
git commit -m "Add locked reference character for exercise demo visuals"
```

---

### Task 2: Lower-body movement visuals (squat, squat jump, Bulgarian split squat, lunge, jump lunge, glute bridge)

**Files:**
- Create: `assets/images/exercises/squat-start.png`, `squat-end.png`, `squat-jump-start.png`, `squat-jump-end.png`, `squat-bulgarian-start.png`, `squat-bulgarian-end.png`, `lunge-start.png`, `lunge-end.png`, `lunge-jump-start.png`, `lunge-jump-end.png`, `glute-bridge-start.png`, `glute-bridge-end.png`

**Interfaces:**
- Consumes: `CHARACTER_JOB_ID` from Task 1.
- Produces: the 12 files above — consumed by Task 5 (`movementAssets` entries for `squat`, `squatJump`, `squatBulgarian`, `lunge`, `lungeJump`, `gluteBridge`).

For each generation below: call `generate_image` with `model: "nano_banana_pro"`, `aspect_ratio: "1:1"`, `resolution: "1k"`, `medias: [{"value": "CHARACTER_JOB_ID", "role": "image"}]`, `count: 1`, and the prompt shown. Poll with `job_status` (`sync: true`) until `completed`, call `remove_background` on the result to force a clean transparent PNG, poll that job to completion, then download the final `rawUrl` with `curl -sL -o "<path>" "<url>"`.

- [ ] **Step 1: Squat (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: standing upright, feet shoulder-width apart, arms extended forward at chest height for balance, neutral spine, knees soft. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side or 3/4 view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: squatting down, hips pushed back and down, knees bent to roughly 90 degrees, thighs close to parallel with the ground, chest up, arms still extended forward for balance, weight visibly in the heels. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side or 3/4 view chosen to make the pose unambiguous.

Download to `assets/images/exercises/squat-start.png` and `assets/images/exercises/squat-end.png`.

- [ ] **Step 2: Squat jump (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: coiled at the bottom of a squat, hips low, knees bent to about 90 degrees, torso leaning slightly forward, arms swung back behind the hips, loaded and ready to explode upward. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side or 3/4 view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them airborne at the peak of a jump, legs extended and slightly tucked with both feet clearly off the ground, arms swung upward, torso upright, capturing mid-air explosive motion. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side or 3/4 view chosen to make the pose unambiguous.

Download to `assets/images/exercises/squat-jump-start.png` and `assets/images/exercises/squat-jump-end.png`.

- [ ] **Step 3: Bulgarian split squat (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: standing tall in a split stance, one foot planted forward flat on the ground, the other foot resting on top of a knee-height bench or surface behind them, torso upright, arms relaxed at the sides. Square crop, generous padding around the figure, plain fully transparent background, no floor line beyond the bench itself, no text, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: same split stance with the rear foot on a knee-height bench behind them, front knee bent to about 90 degrees, back knee dropped low toward the floor, torso still upright, weight visibly through the front heel. Square crop, generous padding around the figure, plain fully transparent background, no floor line beyond the bench itself, no text, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/squat-bulgarian-start.png` and `assets/images/exercises/squat-bulgarian-end.png`.

- [ ] **Step 4: Lunge (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: standing tall, feet together, arms relaxed at the sides, neutral spine, about to step into a lunge. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side or 3/4 view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: one leg stepped forward with the front knee bent to about 90 degrees directly over the ankle, back knee dropped toward the floor without touching it, torso upright, arms relaxed or slightly out for balance. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/lunge-start.png` and `assets/images/exercises/lunge-end.png`.

- [ ] **Step 5: Jump lunge (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: at the bottom of a lunge, front knee bent to about 90 degrees, back knee low, coiled and ready to push off the ground into a jump. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them airborne mid-jump switching legs — both feet clearly off the ground, both knees bent, the leg that was forward now moving back and the leg that was back now moving forward, arms driving for momentum. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/lunge-jump-start.png` and `assets/images/exercises/lunge-jump-end.png`.

- [ ] **Step 6: Glute bridge (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: lying on their back, knees bent, feet flat on the ground hip-width apart, arms flat on the ground at the sides, hips resting on the ground. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: same position on their back with knees bent and feet flat, but hips lifted up off the ground toward the ceiling, forming a straight line from shoulders to knees, glutes visibly engaged. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/glute-bridge-start.png` and `assets/images/exercises/glute-bridge-end.png`.

- [ ] **Step 7: Present all 12 images for review**

Show the 6 start/end pairs to the user (e.g. via `SendUserFile`, grouped by movement) and get explicit approval for each. For any rejected image, regenerate with a prompt adjustment that describes exactly what was wrong (angle, limb position, framing), then re-download to the same filename, before moving on.

- [ ] **Step 8: Verify all 12 files exist**

```powershell
$files = "squat-start.png","squat-end.png","squat-jump-start.png","squat-jump-end.png","squat-bulgarian-start.png","squat-bulgarian-end.png","lunge-start.png","lunge-end.png","lunge-jump-start.png","lunge-jump-end.png","glute-bridge-start.png","glute-bridge-end.png"
foreach ($f in $files) {
  $p = "assets\images\exercises\$f"
  if (-not (Test-Path $p)) { throw "Missing: $p" }
}
"All 12 lower-body files present."
```
Expected: prints the confirmation line with no thrown error.

- [ ] **Step 9: Commit**

```bash
git add assets/images/exercises/squat-start.png assets/images/exercises/squat-end.png assets/images/exercises/squat-jump-start.png assets/images/exercises/squat-jump-end.png assets/images/exercises/squat-bulgarian-start.png assets/images/exercises/squat-bulgarian-end.png assets/images/exercises/lunge-start.png assets/images/exercises/lunge-end.png assets/images/exercises/lunge-jump-start.png assets/images/exercises/lunge-jump-end.png assets/images/exercises/glute-bridge-start.png assets/images/exercises/glute-bridge-end.png
git commit -m "Add lower-body exercise demo visuals"
```

---

### Task 3: Upper-body / core movement visuals (push-up floor, push-up wall, plank, side plank)

**Files:**
- Create: `assets/images/exercises/pushup-floor-start.png`, `pushup-floor-end.png`, `pushup-wall-start.png`, `pushup-wall-end.png`, `plank-start.png`, `plank-end.png`, `side-plank-start.png`, `side-plank-end.png`

**Interfaces:**
- Consumes: `CHARACTER_JOB_ID` from Task 1.
- Produces: the 8 files above — consumed by Task 5 (`movementAssets` entries for `pushupFloor`, `pushupWall`, `plank`, `sidePlank`).

Same generation procedure as Task 2 (`generate_image` with `nano_banana_pro`, `1:1`, `1k`, `medias` = `CHARACTER_JOB_ID`; poll; `remove_background`; poll; download).

- [ ] **Step 1: Push-up, floor (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: high plank position on the floor, arms fully extended, hands directly under the shoulders, body in one straight line from head to heels. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: same plank position but lowered, chest close to the ground, elbows bent to about 45 degrees from the torso, body still in one straight line from head to heels. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/pushup-floor-start.png` and `assets/images/exercises/pushup-floor-end.png`.

- [ ] **Step 2: Push-up, wall (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: standing at arm's length from a wall, palms flat against the wall at shoulder height, arms fully extended, body leaning slightly forward in a straight diagonal line from head to heels. Include a simple flat vertical wall surface behind the hands only (not a full background), everything else transparent. Square crop, generous padding around the figure, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: same wall-facing stance, elbows bent, chest brought close to the wall, body still in a straight diagonal line from head to heels. Include a simple flat vertical wall surface behind the hands only (not a full background), everything else transparent. Square crop, generous padding around the figure, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/pushup-wall-start.png` and `assets/images/exercises/pushup-wall-end.png`.

- [ ] **Step 3: Plank (entry / held)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: setting up for a forearm plank — forearms on the ground with elbows under the shoulders, knees still resting on the ground, back flat, about to lift into the hold. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: full forearm plank hold, forearms on the ground with elbows under the shoulders, legs extended with weight on the toes, body in one straight line from head to heels, core visibly braced. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/plank-start.png` and `assets/images/exercises/plank-end.png`.

- [ ] **Step 4: Side plank (entry / held)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: lying on one side on the ground, forearm on the ground directly under the shoulder, knees bent and stacked, hips still resting on the ground, about to lift into a side plank. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, front-on view of the side of the body chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: full side plank, legs extended and stacked, forearm on the ground under the shoulder, hips lifted off the ground, body in one straight diagonal line from head to feet, top arm reaching straight up toward the ceiling. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, front-on view of the side of the body chosen to make the pose unambiguous.

Download to `assets/images/exercises/side-plank-start.png` and `assets/images/exercises/side-plank-end.png`.

- [ ] **Step 5: Present all 8 images for review**

Same review procedure as Task 2 Step 7: show the 4 start/end pairs to the user, get explicit approval, regenerate any rejected image with a corrective prompt adjustment.

- [ ] **Step 6: Verify all 8 files exist**

```powershell
$files = "pushup-floor-start.png","pushup-floor-end.png","pushup-wall-start.png","pushup-wall-end.png","plank-start.png","plank-end.png","side-plank-start.png","side-plank-end.png"
foreach ($f in $files) {
  $p = "assets\images\exercises\$f"
  if (-not (Test-Path $p)) { throw "Missing: $p" }
}
"All 8 upper-body/core files present."
```
Expected: prints the confirmation line with no thrown error.

- [ ] **Step 7: Commit**

```bash
git add assets/images/exercises/pushup-floor-start.png assets/images/exercises/pushup-floor-end.png assets/images/exercises/pushup-wall-start.png assets/images/exercises/pushup-wall-end.png assets/images/exercises/plank-start.png assets/images/exercises/plank-end.png assets/images/exercises/side-plank-start.png assets/images/exercises/side-plank-end.png
git commit -m "Add upper-body and core exercise demo visuals"
```

---

### Task 4: Cardio / whole-body movement visuals (jumping jack, high knees, heel-to-butt, march in place, mountain climber, burpee)

**Files:**
- Create: `assets/images/exercises/jumping-jack-start.png`, `jumping-jack-end.png`, `high-knees-start.png`, `high-knees-end.png`, `heel-to-butt-start.png`, `heel-to-butt-end.png`, `march-in-place-start.png`, `march-in-place-end.png`, `mountain-climber-start.png`, `mountain-climber-end.png`, `burpee-start.png`, `burpee-end.png`

**Interfaces:**
- Consumes: `CHARACTER_JOB_ID` from Task 1.
- Produces: the 12 files above — consumed by Task 5 (`movementAssets` entries for `jumpingJack`, `highKnees`, `heelToButt`, `marchInPlace`, `mountainClimber`, `burpee`).

Same generation procedure as Task 2 (`generate_image` with `nano_banana_pro`, `1:1`, `1k`, `medias` = `CHARACTER_JOB_ID`; poll; `remove_background`; poll; download).

- [ ] **Step 1: Jumping jack (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: standing tall, feet together, arms down at the sides, neutral spine. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, front-facing view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them airborne mid-jump, feet jumped out wide apart, arms raised overhead, capturing the open mid-air moment of a jumping jack. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, front-facing view chosen to make the pose unambiguous.

Download to `assets/images/exercises/jumping-jack-start.png` and `assets/images/exercises/jumping-jack-end.png`.

- [ ] **Step 2: High knees (alternating)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: running in place with the right knee driven up to about hip height, left foot planted on the ground, arms in an opposing running position (left arm forward, right arm back). Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: the opposite side of running in place, with the left knee driven up to about hip height, right foot planted on the ground, arms swapped to the opposing running position (right arm forward, left arm back). Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/high-knees-start.png` and `assets/images/exercises/high-knees-end.png`.

- [ ] **Step 3: Heel-to-butt (alternating)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: light jogging-in-place stance, right foot planted on the ground, torso upright, arms in a relaxed jogging position. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: left heel kicked up behind the body toward the glute, knee pointing straight down, right foot on the ground, capturing the flicking motion of a heel-to-butt kick. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/heel-to-butt-start.png` and `assets/images/exercises/heel-to-butt-end.png`.

- [ ] **Step 4: March in place (alternating)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: marching in place, right knee lifted to about hip height at a controlled, unhurried pace, left foot on the ground, left arm swung forward and right arm back in opposition. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: the opposite step of the same controlled march in place, left knee lifted to about hip height, right foot on the ground, right arm swung forward and left arm back in opposition. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/march-in-place-start.png` and `assets/images/exercises/march-in-place-end.png`.

- [ ] **Step 5: Mountain climber (alternating)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: high plank position, both hands under the shoulders, right knee driven up toward the chest, left leg extended straight back, body otherwise holding a straight plank line. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: same high plank position with legs switched, left knee now driven up toward the chest, right leg extended straight back, body still holding a straight plank line. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

Download to `assets/images/exercises/mountain-climber-start.png` and `assets/images/exercises/mountain-climber-end.png`.

- [ ] **Step 6: Burpee (start/end)**

Start prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them performing this exact pose: crouched down in a squat with both hands planted on the ground just outside the feet, about to kick the legs back into a plank. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side view chosen to make the pose unambiguous.

End prompt:
> Using the attached reference character (keep the same character design, proportions, outfit colors, and brand style — flat color base with targeted 3D relief/shading), show them airborne at the top of an explosive jump, body fully extended vertically, arms reaching straight overhead, both feet clearly off the ground — the finishing moment of a burpee. Square crop, generous padding around the figure, plain fully transparent background, no floor line, no text, no props, side or 3/4 view chosen to make the pose unambiguous.

Download to `assets/images/exercises/burpee-start.png` and `assets/images/exercises/burpee-end.png`.

- [ ] **Step 7: Present all 12 images for review**

Same review procedure as Task 2 Step 7: show the 6 start/end pairs to the user, get explicit approval, regenerate any rejected image with a corrective prompt adjustment.

- [ ] **Step 8: Verify all 12 files exist**

```powershell
$files = "jumping-jack-start.png","jumping-jack-end.png","high-knees-start.png","high-knees-end.png","heel-to-butt-start.png","heel-to-butt-end.png","march-in-place-start.png","march-in-place-end.png","mountain-climber-start.png","mountain-climber-end.png","burpee-start.png","burpee-end.png"
foreach ($f in $files) {
  $p = "assets\images\exercises\$f"
  if (-not (Test-Path $p)) { throw "Missing: $p" }
}
"All 12 cardio/whole-body files present."
```
Expected: prints the confirmation line with no thrown error.

- [ ] **Step 9: Commit**

```bash
git add assets/images/exercises/jumping-jack-start.png assets/images/exercises/jumping-jack-end.png assets/images/exercises/high-knees-start.png assets/images/exercises/high-knees-end.png assets/images/exercises/heel-to-butt-start.png assets/images/exercises/heel-to-butt-end.png assets/images/exercises/march-in-place-start.png assets/images/exercises/march-in-place-end.png assets/images/exercises/mountain-climber-start.png assets/images/exercises/mountain-climber-end.png assets/images/exercises/burpee-start.png assets/images/exercises/burpee-end.png
git commit -m "Add cardio and whole-body exercise demo visuals"
```

---

### Task 5: `exerciseVisuals.ts` mapping module

**Files:**
- Create: `src/lib/exerciseVisuals.ts`
- Test: `src/__tests__/exerciseVisuals.test.ts`

**Interfaces:**
- Consumes: all 32 PNG files from Tasks 2–4, at their exact paths under `assets/images/exercises/`; `homeWorkoutProgram` and `getLevelProgram` from `src/lib/homeWorkoutProgram.ts` (test only).
- Produces: `MovementKey` (union type), `MovementAsset` (`{ label: string; start: ImageSourcePropType; end: ImageSourcePropType }`), `movementAssets: Record<MovementKey, MovementAsset>`, `exerciseNameToMovementKey: Record<string, MovementKey>`, `getExerciseVisual(exerciseName: string): MovementAsset | undefined` — all consumed by Task 6.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/exerciseVisuals.test.ts`:

```typescript
import { homeWorkoutProgram } from '../lib/homeWorkoutProgram';
import { exerciseNameToMovementKey, movementAssets, getExerciseVisual } from '../lib/exerciseVisuals';

function allProgramExerciseNames(): string[] {
  const names: string[] = [];
  for (const level of homeWorkoutProgram.levels) {
    for (const session of level.sessions) {
      if (session.type === 'circuit') {
        names.push(...session.exercises);
      } else {
        names.push(...session.exercises.map((exercise) => exercise.name));
      }
    }
  }
  return names;
}

describe('exerciseVisuals', () => {
  it('maps every exercise name in the program to a known movement key', () => {
    for (const name of allProgramExerciseNames()) {
      expect(exerciseNameToMovementKey[name]).toBeDefined();
    }
  });

  it('has start and end visual assets for every movement key referenced by the mapping', () => {
    const usedKeys = new Set(Object.values(exerciseNameToMovementKey));
    expect(usedKeys.size).toBeGreaterThan(0);
    for (const key of usedKeys) {
      expect(movementAssets[key]).toBeDefined();
      expect(movementAssets[key].start).toBeTruthy();
      expect(movementAssets[key].end).toBeTruthy();
      expect(movementAssets[key].label.length).toBeGreaterThan(0);
    }
  });

  it('getExerciseVisual resolves a real program exercise to its movement visual', () => {
    const visual = getExerciseVisual('Squats');
    expect(visual).toBeDefined();
    expect(visual?.label).toBe('Squat');
  });

  it('getExerciseVisual returns undefined for a name not in the program', () => {
    expect(getExerciseVisual('Not a real exercise')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/exerciseVisuals.test.ts`
Expected: FAIL — `Cannot find module '../lib/exerciseVisuals'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/exerciseVisuals.ts`:

```typescript
import type { ImageSourcePropType } from 'react-native';

export type MovementKey =
  | 'squat'
  | 'squatJump'
  | 'squatBulgarian'
  | 'pushupFloor'
  | 'pushupWall'
  | 'lunge'
  | 'lungeJump'
  | 'plank'
  | 'sidePlank'
  | 'gluteBridge'
  | 'jumpingJack'
  | 'highKnees'
  | 'heelToButt'
  | 'marchInPlace'
  | 'mountainClimber'
  | 'burpee';

export type MovementAsset = {
  label: string;
  start: ImageSourcePropType;
  end: ImageSourcePropType;
};

export const movementAssets: Record<MovementKey, MovementAsset> = {
  squat: {
    label: 'Squat',
    start: require('../../assets/images/exercises/squat-start.png'),
    end: require('../../assets/images/exercises/squat-end.png'),
  },
  squatJump: {
    label: 'Squat sauté',
    start: require('../../assets/images/exercises/squat-jump-start.png'),
    end: require('../../assets/images/exercises/squat-jump-end.png'),
  },
  squatBulgarian: {
    label: 'Squat bulgare',
    start: require('../../assets/images/exercises/squat-bulgarian-start.png'),
    end: require('../../assets/images/exercises/squat-bulgarian-end.png'),
  },
  pushupFloor: {
    label: 'Pompe',
    start: require('../../assets/images/exercises/pushup-floor-start.png'),
    end: require('../../assets/images/exercises/pushup-floor-end.png'),
  },
  pushupWall: {
    label: 'Pompe contre un mur',
    start: require('../../assets/images/exercises/pushup-wall-start.png'),
    end: require('../../assets/images/exercises/pushup-wall-end.png'),
  },
  lunge: {
    label: 'Fente',
    start: require('../../assets/images/exercises/lunge-start.png'),
    end: require('../../assets/images/exercises/lunge-end.png'),
  },
  lungeJump: {
    label: 'Fente sautée',
    start: require('../../assets/images/exercises/lunge-jump-start.png'),
    end: require('../../assets/images/exercises/lunge-jump-end.png'),
  },
  plank: {
    label: 'Gainage planche',
    start: require('../../assets/images/exercises/plank-start.png'),
    end: require('../../assets/images/exercises/plank-end.png'),
  },
  sidePlank: {
    label: 'Gainage latéral',
    start: require('../../assets/images/exercises/side-plank-start.png'),
    end: require('../../assets/images/exercises/side-plank-end.png'),
  },
  gluteBridge: {
    label: 'Pont fessier',
    start: require('../../assets/images/exercises/glute-bridge-start.png'),
    end: require('../../assets/images/exercises/glute-bridge-end.png'),
  },
  jumpingJack: {
    label: 'Jumping jack',
    start: require('../../assets/images/exercises/jumping-jack-start.png'),
    end: require('../../assets/images/exercises/jumping-jack-end.png'),
  },
  highKnees: {
    label: 'Montées de genoux',
    start: require('../../assets/images/exercises/high-knees-start.png'),
    end: require('../../assets/images/exercises/high-knees-end.png'),
  },
  heelToButt: {
    label: 'Talons-fesses',
    start: require('../../assets/images/exercises/heel-to-butt-start.png'),
    end: require('../../assets/images/exercises/heel-to-butt-end.png'),
  },
  marchInPlace: {
    label: 'Marche sur place',
    start: require('../../assets/images/exercises/march-in-place-start.png'),
    end: require('../../assets/images/exercises/march-in-place-end.png'),
  },
  mountainClimber: {
    label: 'Mountain climber',
    start: require('../../assets/images/exercises/mountain-climber-start.png'),
    end: require('../../assets/images/exercises/mountain-climber-end.png'),
  },
  burpee: {
    label: 'Burpee',
    start: require('../../assets/images/exercises/burpee-start.png'),
    end: require('../../assets/images/exercises/burpee-end.png'),
  },
};

export const exerciseNameToMovementKey: Record<string, MovementKey> = {
  'Squats sur chaise (assis-debout, lent)': 'squat',
  'Squats à vide, rythme tranquille': 'squat',
  Squats: 'squat',
  'Squats complets': 'squat',
  'Squats sautés ou squats rapides': 'squatJump',
  'Squats sautés': 'squatJump',
  'Squats bulgares (pied arrière surélevé)': 'squatBulgarian',
  'Pompes (sur les genoux si besoin)': 'pushupFloor',
  'Pompes complètes (pieds surélevés pour durcir)': 'pushupFloor',
  'Pompes déclinées': 'pushupFloor',
  'Pompes contre un mur': 'pushupWall',
  "Fentes statiques (une jambe puis l'autre, sans à-coup)": 'lunge',
  'Fentes statiques': 'lunge',
  'Fentes alternées': 'lunge',
  'Fentes arrière': 'lunge',
  'Fentes sautées alternées': 'lungeJump',
  'Fentes sautées': 'lungeJump',
  'Gainage sur les genoux': 'plank',
  'Gainage planche': 'plank',
  "Gainage planche avec touches d'épaules": 'plank',
  'Gainage latéral': 'sidePlank',
  'Gainage latéral dynamique': 'sidePlank',
  'Pont fessier': 'gluteBridge',
  'Pont fessier une jambe': 'gluteBridge',
  'Jumping jacks doux (sans saut : un pied écarté à la fois)': 'jumpingJack',
  'Jumping jacks': 'jumpingJack',
  'Montées de genoux sur place': 'highKnees',
  'Genoux hauts (course sur place)': 'highKnees',
  'Sprint sur place, genoux hauts': 'highKnees',
  'Talons-fesses': 'heelToButt',
  'Marche rapide sur place, genoux montés': 'marchInPlace',
  'Mountain climbers': 'mountainClimber',
  'Mountain climbers rapides': 'mountainClimber',
  'Burpees (version sans saut si trop dur)': 'burpee',
  Burpees: 'burpee',
  'Burpees avec saut': 'burpee',
};

export function getExerciseVisual(exerciseName: string): MovementAsset | undefined {
  const key = exerciseNameToMovementKey[exerciseName];
  if (!key) {
    return undefined;
  }
  return movementAssets[key];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/exerciseVisuals.test.ts`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/exerciseVisuals.ts src/__tests__/exerciseVisuals.test.ts
git commit -m "Add exercise-to-movement-visual mapping module"
```

---

### Task 6: `ExerciseVisualModal` component

**Files:**
- Create: `src/components/ExerciseVisualModal.tsx`
- Test: `src/__tests__/ExerciseVisualModal.test.tsx`

**Interfaces:**
- Consumes: `getExerciseVisual` from `src/lib/exerciseVisuals.ts` (Task 5).
- Produces: `ExerciseVisualModal({ visible: boolean; exerciseName: string | null; onClose: () => void })` — consumed by Task 7 in `workout.tsx`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/ExerciseVisualModal.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseVisualModal } from '../components/ExerciseVisualModal';

describe('ExerciseVisualModal', () => {
  it('shows the movement label and Départ/Fin captions for a known exercise', async () => {
    const { getByText } = await render(
      <ExerciseVisualModal visible exerciseName="Squats" onClose={() => {}} />
    );
    expect(getByText('Squat')).toBeTruthy();
    expect(getByText('Départ')).toBeTruthy();
    expect(getByText('Fin')).toBeTruthy();
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <ExerciseVisualModal visible exerciseName="Squats" onClose={onClose} />
    );
    fireEvent.press(getByText('Fermer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for an exercise name with no known visual', () => {
    const { queryByText } = render(
      <ExerciseVisualModal visible exerciseName="Not a real exercise" onClose={() => {}} />
    );
    expect(queryByText('Fermer')).toBeNull();
  });

  it('renders nothing when exerciseName is null', () => {
    const { queryByText } = render(<ExerciseVisualModal visible exerciseName={null} onClose={() => {}} />);
    expect(queryByText('Fermer')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/ExerciseVisualModal.test.tsx`
Expected: FAIL — `Cannot find module '../components/ExerciseVisualModal'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/ExerciseVisualModal.tsx`:

```typescript
import { Modal, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { getExerciseVisual } from '../lib/exerciseVisuals';
import { colors, radius, spacing } from '../theme/tokens';

type ExerciseVisualModalProps = {
  visible: boolean;
  exerciseName: string | null;
  onClose: () => void;
};

export function ExerciseVisualModal({ visible, exerciseName, onClose }: ExerciseVisualModalProps) {
  const visual = exerciseName ? getExerciseVisual(exerciseName) : undefined;

  if (!visual) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{visual.label}</Text>
          <View style={styles.imageRow}>
            <View style={styles.imageBlock}>
              <Image source={visual.start} style={styles.image} resizeMode="contain" />
              <Text style={styles.imageLabel}>Départ</Text>
            </View>
            <View style={styles.imageBlock}>
              <Image source={visual.end} style={styles.image} resizeMode="contain" />
              <Text style={styles.imageLabel}>Fin</Text>
            </View>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  imageRow: { flexDirection: 'row', gap: spacing.md },
  imageBlock: { flex: 1, alignItems: 'center' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.bgBase, borderRadius: radius.sm },
  imageLabel: { marginTop: spacing.xs, fontSize: 12, color: colors.textSecondary },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.bgBase,
  },
  closeButtonText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/ExerciseVisualModal.test.tsx`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExerciseVisualModal.tsx src/__tests__/ExerciseVisualModal.test.tsx
git commit -m "Add ExerciseVisualModal component"
```

---

### Task 7: Wire tappable exercise rows into the workout screen

**Files:**
- Modify: `src/app/(tabs)/workout.tsx`

**Interfaces:**
- Consumes: `ExerciseVisualModal` from `src/components/ExerciseVisualModal.tsx` (Task 6).

- [ ] **Step 1: Add modal state and import**

In `src/app/(tabs)/workout.tsx`, add the import (after the existing `Card` import on line 10):

```typescript
import { ExerciseVisualModal } from '../../components/ExerciseVisualModal';
```

Inside `WorkoutScreen`, alongside the existing `useState` calls (after the `expanded` state on line 21), add:

```typescript
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
```

- [ ] **Step 2: Make circuit and series exercise lines tappable**

In `SessionDetail` (lines 146–173), change the signature to accept a callback, and wrap each exercise `<Text>` in a `<Pressable>`:

```typescript
function SessionDetail({ session, onSelectExercise }: { session: Session; onSelectExercise: (name: string) => void }) {
  if (session.type === 'circuit') {
    return (
      <View style={styles.sessionDetail}>
        <Text style={styles.sessionMeta}>
          Circuit : {session.workSeconds} s d'effort / {session.restSeconds} s de repos. {session.rounds} tours,{' '}
          {session.recoveryLabel}.
        </Text>
        {session.exercises.map((exercise) => (
          <Pressable key={exercise} onPress={() => onSelectExercise(exercise)}>
            <Text style={styles.exerciseLine}>• {exercise}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.sessionDetail}>
      <Text style={styles.sessionMeta}>En séries, {session.restLabel}.</Text>
      {session.exercises.map((exercise) => (
        <Pressable key={exercise.name} onPress={() => onSelectExercise(exercise.name)}>
          <Text style={styles.exerciseLine}>
            • {exercise.name} : {exercise.detail}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

(This replaces the existing `SessionDetail` function body and signature entirely.)

- [ ] **Step 3: Pass the callback from the session card and render the modal**

Update the session-card render block (lines 113–125) to pass `onSelectExercise`:

```typescript
      {levelProgram.sessions.map((sessionItem, index) => {
        const isExpanded = expanded.has(index);
        return (
          <Pressable key={sessionItem.name} onPress={() => toggleSession(index)}>
            <Card style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>
                Séance {index + 1} — {sessionItem.name}
              </Text>
              {isExpanded && <SessionDetail session={sessionItem} onSelectExercise={setSelectedExercise} />}
            </Card>
          </Pressable>
        );
      })}
```

Add the modal render just before the closing `</ScrollView>` (after the coach-notes `<View style={styles.block}>` block, line 141, before line 142's `</ScrollView>`):

```typescript
      <ExerciseVisualModal
        visible={selectedExercise !== null}
        exerciseName={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </ScrollView>
```

(replaces the bare `</ScrollView>` that previously closed the component)

- [ ] **Step 4: Run the full test suite**

Run: `npx jest`
Expected: PASS — no test targets `workout.tsx` directly (consistent with the rest of `src/app/`, which has no screen-level tests), but this confirms the change didn't break `exerciseVisuals.test.ts`, `ExerciseVisualModal.test.tsx`, or any other existing test via a shared import.

- [ ] **Step 5: Manual verification in the simulator**

```bash
npx expo start
```
Open the app, sign in, go to the Workout tab, expand a session for each of the three levels (beginner/intermediate/advanced — switch levels via the level picker at the top), and tap one exercise per level. Confirm: the modal opens, shows the correct movement label, both start/end images render (no broken-image icon), and "Fermer" closes it. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/workout.tsx"
git commit -m "Make exercise rows tappable to show demo visuals"
```
