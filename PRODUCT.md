# Product

## Register

product

## Platform

adaptive

## Users

People managing their own nutrition and training toward a body-composition goal (cut, bulk, or maintain), without a coach or nutritionist. Each has a personal account with a profile capturing sex, age, height, weight, activity level, training days per week, experience level, and equipment access. The primary usage pattern is weekly: generate or adjust the week's plan once, then consult and check off day-to-day — recipes, the grocery list, workout sessions, and the weight log.

## Product Purpose

Generates a weekly meal plan and strength-training program together, matched to the user's TDEE and macro targets and their training profile, so cutting, bulking, or maintaining doesn't require manually researching macros or building a workout split by hand. Includes an auto-generated grocery list and a weight-trend-based recalibration of next week's targets. Success looks like the user actually reaching their body-composition goal, tracked through the weight log.

## Positioning

The only planner that generates matched nutrition *and* training plans from one profile — not a food-logging app, not a standalone workout tracker: a single weekly plan with the shopping list already built.

## Brand Personality

Warm, motivating, approachable — an in-house coach, not a clinical calculator. The material and motion language draws on Apple Fitness / Apple Health: native materials, clean cards, springs, restraint. What it explicitly avoids is the noise of free fitness apps — streak badges, aggressive notifications, loud gamification — and the opposite failure mode of a dense logging tool like MyFitnessPal, where the burden of building the plan sits on the user. This app plans; the user reviews, adjusts, and executes.

## Anti-references

Gamification-heavy fitness apps (streak badges, aggressive push notifications, flashy stat walls). Dense manual-logging tools (MyFitnessPal-style tables) — the app generates the plan rather than asking the user to log or search for everything themselves.

## Design Principles

Plan, don't log — the app generates the week; the user reviews, adjusts, and executes rather than building it up entry by entry. Warmth over clinical precision — calorie and macro numbers are present but never the loudest thing on screen; tone and materials carry the coaching feel. One coherent weekly rhythm — the meal plan, grocery list, and workout program are one connected week, not three disconnected features. Apple-grade craft is the default material language today, with a genuine Material 3 adaptation on Android as a real target, not a permanent capability fallback. The plan must never feel fragile — offline viewing of the last generated plan, graceful degradation on thin data, and approximate results flagged rather than silently wrong.

## Accessibility & Inclusion

Standard mobile accessibility: sufficient contrast, and respect for the OS-level reduced-motion and reduced-transparency settings (already implemented in the shared UI kit). No formal WCAG level is targeted beyond these existing practices.
