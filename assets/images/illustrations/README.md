# Illustrations

Brand illustrations, one file per slot. Direction, subjects and the palette
reasoning live in
`docs/superpowers/specs/2026-08-02-illustrations-soft-neutral-design.md`.

Drop the approved exports here under these exact names — the code that
consumes them requires these paths:

| File | Ratio | Expected size | Background it is generated on |
| --- | --- | --- | --- |
| `onboarding-hero.png` | 3:2 | 2528×1696 | `#F7F5F2` (`colors.bgBase`) |
| `empty-plan.png` | 1:1 | 2048×2048 | `#FFFFFF` (`colors.bgSurface`) |
| `empty-grocery.png` | 1:1 | 2048×2048 | `#FFFFFF` (`colors.bgSurface`) |

The background color is not decoration: each illustration is generated on
the exact color it sits over, so it blends with no visible edge. An
illustration placed inside a `Card` needs the white version, one placed
directly on a screen needs the off-white one. Swapping them will show a
seam.

No `@2x`/`@3x` variants — these resolutions downscale cleanly, and
`expo-image` handles the fit.
