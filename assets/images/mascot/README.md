# Mascot — base pose set

Three files, all transparent PNG, exactly 1024×1024. The mascot is a
stylized cartoon broccoli character (arms, legs, coral-orange sneakers, big
Pixar-style eyes).

## Concept history

The design spec originally called for a species-neutral "generic sporty
creature," deliberately leaving the exact silhouette undecided. During
implementation, 3 concept options (a round blob, a pill-shaped critter, a
star-shaped sprite) were generated and shown to the user — all three were
rejected. Several iterations on the pill-creature direction followed (chibi
proportions, a warm sand/tan body, a sporty coral accessory) and were also
rejected as the look drifted worse with each pass. The user then pivoted to
a new direction not in the original spec: a stylized cartoon broccoli
character with arms and legs, explicitly **not** photorealistic and
**not** textured like hand-molded clay — smooth, polished, 3D-cartoon
shading with big expressive Pixar-style eyes. That direction was approved
and all three poses below were generated from it (`idle` and `celebrating`
first; `encouraging` followed in a later pass, reusing the same validated
prompt with only the pose-specific clause swapped).

**Validated prompt** (shared foundation all three poses were generated
from, with only the pose-specific clause changed):

> A cute stylized cartoon broccoli character mascot with simple cartoon
> arms and legs, [pose-specific clause], for a fitness and nutrition app,
> in a modern 3D Pixar-style animation look. Simplified, rounded,
> cartoon-illustrated broccoli shape (soft rounded floret bumps, not
> photorealistic texture), deep green color on top with a paler green stem
> below, smooth clean 3D cartoon shading, soft studio lighting from the
> upper left. Simple stubby cartoon arms and legs with small rounded hands
> and feet, wearing only small coral orange sneakers as a minimal sporty
> accent. Large expressive Pixar-style eyes: big round glossy eyes with
> bright catchlight reflections, expressive eyebrows, and a warm cheerful
> smile. Plain background, one single centered character, no text, no
> logos.

This deliberately overrides the design spec's "not a food, generic
creature" guidance (see
`docs/superpowers/specs/2026-08-09-claymorphic-mascot-design-system-design.md`)
— that guidance is stale on this one point; the choice above is the one
that shipped.

| File | Pose | Used by |
| --- | --- | --- |
| `mascot-idle.png` | Idle / at-rest, shown continuously | Not yet wired into a screen — this is the foundation component; screen placements are a follow-up plan. |
| `mascot-celebrating.png` | Celebration (milestone, streak, completion) | Not yet wired into a screen — same as above. |
| `mascot-encouraging.png` | Encouraging (after a setback — never mocking, never sad-looking) | Used on `generate-plan.tsx`'s generation-failure state (Phase 3). |

**Accepted deviations on `mascot-encouraging.png`.** The user reviewed
`mascot-idle.png` and `mascot-encouraging.png` side by side and confirmed
two small differences that are unique to `mascot-encouraging.png`: a small
nose bump between the eyes (absent on the other two poses) and a white
shoe-sole strip (vs. solid coral soles on the other two). Both were
explicitly accepted as-is — barely perceptible at the pose's actual
~75px render size, and the pose itself still reads as warm/reassuring
rather than sad or mocking, which is the one hard requirement. This asset
was **not** regenerated to fix them. `mascot-idle.png` and
`mascot-celebrating.png` remain the stricter reference for "no nose" and
"solid coral soles" when generating future poses — don't treat
`mascot-encouraging.png` as that reference for those two details.

Being transparent, each pose works on `bgBase`, `bgSurface`, or `bgSunken`
with no seam.

One more pose is planned but not part of this set — see "Follow-up work"
in the Phase 2 plan: a moving/transition pose.
