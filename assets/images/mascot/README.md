# Mascot — base pose set

Two files, both transparent PNG, ≥1024×1024. The mascot is a stylized
cartoon broccoli character (arms, legs, coral-orange sneakers, big
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
and both poses below were generated from it.

**Validated prompt** (shared foundation both poses were generated from,
with only the pose-specific clause changed):

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

Being transparent, each pose works on `bgBase`, `bgSurface`, or `bgSunken`
with no seam.

Two more poses are planned but not part of this base set — see "Follow-up
work" in the plan above: a moving/transition pose and an
encouraging-after-a-setback pose (never mocking, never sad-looking).
