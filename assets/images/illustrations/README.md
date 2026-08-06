# Illustrations

Brand illustrations, one file per slot. Direction, subjects and the palette
reasoning live in
`docs/superpowers/specs/2026-08-02-illustrations-soft-neutral-design.md`.

| File | Size | Background | Used by |
| --- | --- | --- | --- |
| `onboarding-hero.png` | 1200×499 | `#F7F5F2` (`colors.bgBase`) | `src/app/onboarding.tsx` |
| `empty-plan.png` | 512×512 | `#FFFFFF` (`colors.bgSurface`) | `src/app/(tabs)/plan.tsx` |
| `empty-grocery.png` | 512×512 | `#FFFFFF` (`colors.bgSurface`) | `src/app/(tabs)/grocery-list.tsx` |

The background color is not decoration: each illustration is generated on the
exact color it sits over, so it blends with no visible edge. An illustration
placed inside a `Card` needs the white version, one placed directly on a screen
needs the off-white one. Swapping them shows a seam.

These are the app-sized exports, not the masters. Sizes cover the largest
rendered size at @3x with no visible softness — a 2048px source for a 160pt
slot is megabytes of bundle for nothing. The 2k originals stay in the
Higgsfield gallery; their job IDs are recorded in the spec, so any of them can
be re-exported.

Replacing one: match the size and background above, or update this table and
the consuming screen together.
