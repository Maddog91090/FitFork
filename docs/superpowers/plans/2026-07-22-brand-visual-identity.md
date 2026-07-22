# Brand Visual Identity (Logo, App Icon, Splash) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's default Expo template icon/splash assets with the approved FitPro logo mark (plate + athletics-track rim, relief-detailed cutlery and sport objects), per `docs/superpowers/specs/2026-07-22-brand-visual-identity-design.md`, and wire the results into `app.json`.

**Architecture:** Each platform asset (top-level icon, Android adaptive-icon set, web favicon, splash image) is generated as its own composition from the same approved logo reference via the Higgsfield `nano_banana_pro` model (image-to-image, keeping the mark itself unchanged, only recomposing background/padding/crop per asset's requirements), except the Android background (solid color — created deterministically, not generated) and the favicon (a deterministic resize of the new icon, not a fresh generation, so the mark stays pixel-identical at a smaller size). `app.json` is then updated to point at the new files and new colors.

**Tech Stack:** Higgsfield MCP tools (`generate_image`, `job_status`, `remove_background`) for image generation; PowerShell + `System.Drawing` for deterministic local raster operations (dimension checks, resize, solid-color fill) — no new npm dependencies; `curl` (via Bash) to download generated assets; `npx expo config` to validate the resulting `app.json`.

## Note on this plan's format

This plan produces binary image assets and an `app.json` edit, not application source code, so tasks don't have unit tests in the pytest/jest sense. Each task's "test cycle" is: generate/produce the asset, verify its exact pixel dimensions (and, for the monochrome icon, verify it's actually a single flat color) with a PowerShell check, then commit. Prompts given to `generate_image` are written out in full below — the executor sends them verbatim. Job IDs and generated asset URLs are only known once a `generate_image`/`job_status` call actually runs (Higgsfield assigns them at request time), so steps that reference "the job id from Step N" are filling in a value the previous step just produced, the same way earlier work in this repo's `2026-07-20-onboarding-visual-design.md` plan referenced Figma node IDs it couldn't know in advance.

## Global Constraints

- Approved logo reference (do not regenerate the mark itself — only recompose padding/background/crop around it): Higgsfield job `4aa86341-59cb-4db4-98e8-13ea2233cb96`, also saved at `docs/superpowers/specs/assets/2026-07-22-fitpro-logo-reference.png` — from spec.
- Background color for all icon/splash assets: white, `#FFFFFF` — from spec (chosen over navy-dark and the app's current blue `#208AEF`).
- Splash screen shows the logo mark **and** the "FitPro" wordmark below it — from spec.
- Top-level `icon` and Android `adaptiveIcon.foregroundImage`/`backgroundImage`/`monochromeImage`: 1024×1024 PNG — per Expo v57 docs (`docs.expo.dev/versions/v57.0.0/config/app/`: top-level icon "Specifications require a 1024x1024 PNG file"; adaptive icon foreground/background must match dimensions).
- `ios.icon` accepts a plain PNG path as a fallback (no Icon Composer `.icon` bundle required) — per the same v57 docs page.
- No files under `src/**` are modified by this plan — assets and `app.json` only.
- No new npm dependencies are added for image processing — use PowerShell `System.Drawing` for local raster work (no ImageMagick/PIL/sharp available in this environment).

---

### Task 1: Master app icon (`assets/images/icon.png`) and drop the iOS Icon Composer override

**Files:**
- Modify: `assets/images/icon.png` (overwrite, 1024×1024)
- Modify: `app.json:10-12` (remove the `ios.icon` override)

**Interfaces:**
- Produces: `assets/images/icon.png` at 1024×1024 — consumed by Task 3 (favicon resize source) and referenced by the top-level `icon` field (unchanged path, no `app.json` edit needed for this field itself).

- [ ] **Step 1: Generate the master icon**

Call `mcp__claude_ai_Higgsfield__generate_image` with:
```json
{
  "model": "nano_banana_pro",
  "prompt": "Recompose this exact logo mark — same plate, same red athletics running track rim with white lane lines, same fork and knife with metallic 3D relief, same colored 3D sport objects (stopwatch, dumbbell, running shoe) inside the plate — as a clean, centered app icon composition: pure solid white (#FFFFFF) background, the mark centered and sized to fill about 80% of the frame with balanced padding on all sides, square crop, no drop shadow beyond the mark's own existing shading, no text, no additional elements.",
  "aspect_ratio": "1:1",
  "resolution": "1k",
  "medias": [{"value": "4aa86341-59cb-4db4-98e8-13ea2233cb96", "role": "image"}],
  "count": 1
}
```

- [ ] **Step 2: Poll for completion and record the URL**

Call `mcp__claude_ai_Higgsfield__job_status` with `jobId` = the id returned by Step 1 and `sync: true`. Repeat if `status` is not yet `completed`. Record `results.rawUrl` as `ICON_URL`.

- [ ] **Step 3: Download the result**

```bash
curl -sL -o "assets/images/icon.png" "ICON_URL"
```
(replace `ICON_URL` with the value from Step 2)

- [ ] **Step 4: Verify dimensions**

```powershell
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$PWD\assets\images\icon.png")
"$($img.Width)x$($img.Height)"
$img.Dispose()
```
Expected: `1024x1024`. If not, re-run Step 1 with the same prompt (generation size can vary slightly by model — if it's not exactly 1024×1024, use the resize snippet from Task 3 Step 1 to correct it to 1024×1024 before proceeding).

- [ ] **Step 5: Remove the iOS Icon Composer override**

In `app.json`, change:
```json
    "ios": {
      "icon": "./assets/expo.icon"
    },
```
to: delete this `"ios": { ... },` block entirely (the top-level `icon` field now covers iOS too, per the Global Constraints doc note — `assets/expo.icon` becomes unreferenced dead weight but is left in place, not deleted, since removing files outside this plan's asset scope isn't necessary).

- [ ] **Step 6: Commit**

```bash
git add assets/images/icon.png app.json
git commit -m "Replace default app icon with FitPro logo mark"
```

---

### Task 2: Android adaptive icon (foreground, background, monochrome)

**Files:**
- Modify: `assets/images/android-icon-foreground.png` (overwrite, 1024×1024)
- Modify: `assets/images/android-icon-background.png` (overwrite, 1024×1024)
- Modify: `assets/images/android-icon-monochrome.png` (overwrite, 1024×1024)
- Modify: `app.json` (`android.adaptiveIcon.backgroundColor`)

**Interfaces:**
- Consumes: approved logo reference job id from Global Constraints.
- Produces: the three PNG files above at 1024×1024, referenced by the already-correct `app.json` paths (only `backgroundColor` needs editing).

- [ ] **Step 1: Generate the foreground (transparent, safe-zone padded)**

Call `mcp__claude_ai_Higgsfield__generate_image` with:
```json
{
  "model": "nano_banana_pro",
  "prompt": "Recompose this exact logo mark — same plate, same red athletics running track rim, same fork and knife with metallic 3D relief, same colored 3D sport objects inside the plate — on a fully transparent background, centered, sized to fill about 65% of the frame (generous even padding on all sides) so it survives being cropped into a circle or rounded-square mask, square crop, no background color, no text.",
  "aspect_ratio": "1:1",
  "resolution": "1k",
  "medias": [{"value": "4aa86341-59cb-4db4-98e8-13ea2233cb96", "role": "image"}],
  "count": 1
}
```

- [ ] **Step 2: Poll, remove background, download**

Call `mcp__claude_ai_Higgsfield__job_status` with `sync: true` until `completed`; record the job id as `FOREGROUND_JOB_ID`. Call `mcp__claude_ai_Higgsfield__remove_background` with `{"media_id": "FOREGROUND_JOB_ID", "media_type": "image"}` to force a clean alpha channel. Poll that job with `job_status`/`sync: true`, record `results.rawUrl` as `FOREGROUND_URL`, then:
```bash
curl -sL -o "assets/images/android-icon-foreground.png" "FOREGROUND_URL"
```

- [ ] **Step 3: Generate the monochrome silhouette from the foreground**

Call `mcp__claude_ai_Higgsfield__generate_image` with:
```json
{
  "model": "nano_banana_pro",
  "prompt": "Take this exact shape's silhouette — same plate and track-rim outline, same fork/knife outline, same sport-object outlines, same position and padding — and render it as a single flat solid white (#FFFFFF) shape with no shading, no gradient, and no internal color detail, on a fully transparent background.",
  "aspect_ratio": "1:1",
  "resolution": "1k",
  "medias": [{"value": "FOREGROUND_JOB_ID", "role": "image"}],
  "count": 1
}
```
(use the background-removed foreground job id from Step 2 as `FOREGROUND_JOB_ID`)

- [ ] **Step 4: Poll, remove background, download the monochrome asset**

Same pattern as Step 2: poll to completion, call `remove_background` on the result, poll that, download to:
```bash
curl -sL -o "assets/images/android-icon-monochrome.png" "MONOCHROME_URL"
```

- [ ] **Step 5: Verify the monochrome asset is actually single-color**

```powershell
Add-Type -AssemblyName System.Drawing
$img = New-Object System.Drawing.Bitmap "$PWD\assets\images\android-icon-monochrome.png"
$nonWhite = 0
for ($x = 0; $x -lt $img.Width; $x += 16) {
  for ($y = 0; $y -lt $img.Height; $y += 16) {
    $p = $img.GetPixel($x, $y)
    if ($p.A -gt 10 -and ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245)) { $nonWhite++ }
  }
}
"$nonWhite non-white opaque samples out of $([math]::Ceiling($img.Width/16) * [math]::Ceiling($img.Height/16))"
$img.Dispose()
```
Expected: a low count (isolated anti-aliased edge pixels are fine; a high count means the model left color/shading in and Step 3 must be re-run with a stricter prompt, e.g. adding "absolutely no gray, no red, no metallic color — pure white silhouette only").

- [ ] **Step 6: Create the solid white background deterministically**

```powershell
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 1024, 1024
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.ColorTranslator]::FromHtml("#FFFFFF"))
$bmp.Save("$PWD\assets\images\android-icon-background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
```

- [ ] **Step 7: Verify all three dimensions**

```powershell
Add-Type -AssemblyName System.Drawing
foreach ($f in "android-icon-foreground.png","android-icon-background.png","android-icon-monochrome.png") {
  $img = [System.Drawing.Image]::FromFile("$PWD\assets\images\$f")
  "$f -> $($img.Width)x$($img.Height)"
  $img.Dispose()
}
```
Expected: all three report `1024x1024`.

- [ ] **Step 8: Update the adaptive icon background color**

In `app.json`, change:
```json
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
```
to:
```json
      "adaptiveIcon": {
        "backgroundColor": "#FFFFFF",
```

- [ ] **Step 9: Commit**

```bash
git add assets/images/android-icon-foreground.png assets/images/android-icon-background.png assets/images/android-icon-monochrome.png app.json
git commit -m "Replace Android adaptive icon set with FitPro logo mark"
```

---

### Task 3: Favicon (resized from the new master icon, not regenerated)

**Files:**
- Modify: `assets/images/favicon.png` (overwrite, 512×512)

**Interfaces:**
- Consumes: `assets/images/icon.png` from Task 1 (must be committed/present before this task runs).

- [ ] **Step 1: Resize the master icon down to a favicon**

```powershell
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("$PWD\assets\images\icon.png")
$bmp = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 512, 512)
$bmp.Save("$PWD\assets\images\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$src.Dispose()
```

- [ ] **Step 2: Verify dimensions**

```powershell
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$PWD\assets\images\favicon.png")
"$($img.Width)x$($img.Height)"
$img.Dispose()
```
Expected: `512x512`.

- [ ] **Step 3: Commit**

```bash
git add assets/images/favicon.png
git commit -m "Regenerate favicon from the new FitPro app icon"
```

---

### Task 4: Splash screen (logo + "FitPro" wordmark) and `app.json` wiring

**Files:**
- Modify: `assets/images/splash-icon.png` (overwrite)
- Modify: `app.json` (`expo-splash-screen` plugin config: `backgroundColor`, `imageWidth`)

**Interfaces:**
- Consumes: approved logo reference job id from Global Constraints.

- [ ] **Step 1: Generate the splash composition**

Call `mcp__claude_ai_Higgsfield__generate_image` with:
```json
{
  "model": "nano_banana_pro",
  "prompt": "Recompose this exact logo mark — same plate, same red athletics running track rim, same fork and knife with metallic 3D relief, same colored 3D sport objects inside the plate — centered in the upper portion of a vertical card on a solid white (#FFFFFF) background, with the text \"FitPro\" below it in a clean modern bold sans-serif, dark navy colored, centered horizontally, comfortable spacing between the mark and the text, generous padding on all sides, no other elements.",
  "aspect_ratio": "3:4",
  "resolution": "1k",
  "medias": [{"value": "4aa86341-59cb-4db4-98e8-13ea2233cb96", "role": "image"}],
  "count": 1
}
```

- [ ] **Step 2: Poll for completion and record both the URL and the actual pixel size**

Call `mcp__claude_ai_Higgsfield__job_status` with `sync: true` until `completed`. From the response, record `results.rawUrl` as `SPLASH_URL`, and record `params.width`/`params.height` (the generation's actual output size — non-square aspect ratios don't always land on a round number) as `SPLASH_WIDTH`/`SPLASH_HEIGHT`.

- [ ] **Step 3: Download**

```bash
curl -sL -o "assets/images/splash-icon.png" "SPLASH_URL"
```

- [ ] **Step 4: Verify dimensions match what was recorded**

```powershell
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$PWD\assets\images\splash-icon.png")
"$($img.Width)x$($img.Height)"
$img.Dispose()
```
Expected: matches `SPLASH_WIDTH`x`SPLASH_HEIGHT` from Step 2.

- [ ] **Step 5: Compute the display width**

The existing `expo-splash-screen` plugin config treats the source image as an `@3x` asset (confirmed empirically: the previous `splash-icon.png` was 228×213 with `imageWidth: 76`, and `228 / 76 = 3` exactly). Compute:
```
imageWidth = round(SPLASH_WIDTH / 3)
```
using the `SPLASH_WIDTH` recorded in Step 2. Call this value `NEW_IMAGE_WIDTH`.

- [ ] **Step 6: Update `app.json`**

Change:
```json
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#208AEF",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 76
        }
      ]
```
to:
```json
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FFFFFF",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": NEW_IMAGE_WIDTH
        }
      ]
```
(replace `NEW_IMAGE_WIDTH` with the integer computed in Step 5 — the `image` path is unchanged since the filename stays the same)

- [ ] **Step 7: Commit**

```bash
git add assets/images/splash-icon.png app.json
git commit -m "Replace splash screen with FitPro logo + wordmark"
```

---

### Task 5: Validate the full configuration

**Files:** none created or modified — verification only.

**Interfaces:**
- Consumes: all changes from Tasks 1–4.

- [ ] **Step 1: Validate `app.json` parses and resolves**

```bash
npx expo config --type public
```
Expected: exits 0 and prints a resolved config; `icon` resolves to `assets/images/icon.png`, `android.adaptiveIcon.backgroundColor` is `#FFFFFF`, `android.adaptiveIcon.foregroundImage`/`backgroundImage`/`monochromeImage` resolve to the Task 2 files, and the `expo-splash-screen` plugin entry shows `backgroundColor: "#FFFFFF"` and the `imageWidth` computed in Task 4. No "file not found" errors for any asset path (this would catch a leftover reference to the now-removed `./assets/expo.icon`).

- [ ] **Step 2: Visually confirm in the web dev server**

```bash
npx expo start --web
```
Open the printed local URL in a browser; confirm the browser tab shows the new favicon (the plate/track mark, not the default Expo favicon). Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 3: No commit**

Verification only — nothing to commit unless Step 1 or Step 2 surfaced a problem that required going back to fix a prior task (in which case, commit that fix in the task it belongs to, not here).
