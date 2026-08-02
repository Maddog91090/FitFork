export const typography = {
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  body: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  subtitle: { fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  title: { fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  // Reserved for the one hero numeral per screen that should be unmistakable at a glance
  // (home's calorie target) -- not a general-purpose "extra large" step. Continues the
  // Size-Specific Tracking Rule: tracking goes more negative as size grows past title.
  display: { fontSize: 44, lineHeight: 48, letterSpacing: -0.9 },
} as const;
