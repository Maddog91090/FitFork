# Mascot — the Coral Rush cheetah

One file per pose. All transparent PNG, ≥1024×1024, generated per the prompt
recorded in `docs/superpowers/plans/2026-08-06-coral-rush-design-system.md`
(Task 4).

| File | Pose | Used by |
| --- | --- | --- |
| `cheetah-idle.png` | Idle / welcoming | `src/app/onboarding.tsx` |
| `cheetah-running.png` | Running / mid-transition | not yet wired (available for future loading states) |
| `cheetah-celebrating.png` | Celebration | `src/app/workout-session.tsx` (end of session) |
| `cheetah-encouraging.png` | Encouraging after a setback | not yet wired (reserved for a future error/failure moment) |

Being transparent, each pose works on both `colors.bgBase` and
`colors.bgSurface` with no seam — no need for per-surface variants like the
old baked-background illustrations required.
