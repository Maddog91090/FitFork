import { lightColors } from '../theme/tokens';

/**
 * The design system promises WCAG AA (4.5:1) on every foreground token, and the
 * FitFork palette has one trap that is very easy to reintroduce: the brand
 * orange is light, so white on it is ~2:1. These tests are the guard — they
 * fail the moment a color is retuned without re-checking the pairing it is
 * used in. See `.claude/skills/fitfork-design/SKILL.md`.
 */
const AA = 4.5;

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('contrast', () => {
  const { bgBase, bgSurface } = lightColors;

  it.each([
    'textPrimary',
    'textSecondary',
    'accentOrangeDeep',
    'accentTealDeep',
    'error',
    'success',
    'warning',
    'macroProtein',
    'macroCarbs',
    'macroFat',
    'effort',
    'rest',
  ] as const)('%s clears AA on both backgrounds', (token) => {
    expect(contrast(lightColors[token], bgBase)).toBeGreaterThanOrEqual(AA);
    expect(contrast(lightColors[token], bgSurface)).toBeGreaterThanOrEqual(AA);
  });

  it('puts ink — not white — on an orange fill', () => {
    expect(contrast(lightColors.textOnWarm, lightColors.accentOrange)).toBeGreaterThanOrEqual(AA);
    // The rule this file exists for: white on orange is nowhere near AA, so if
    // someone "simplifies" textOnWarm back to textOnAccent, this catches it.
    expect(contrast(lightColors.textOnAccent, lightColors.accentOrange)).toBeLessThan(AA);
  });

  it('keeps ink legible on a pressed orange fill', () => {
    expect(contrast(lightColors.textOnWarm, lightColors.accentOrangePressed)).toBeGreaterThanOrEqual(AA);
  });

  it('puts white on a teal fill', () => {
    expect(contrast(lightColors.textOnAccent, lightColors.accentTeal)).toBeGreaterThanOrEqual(AA);
  });

  it('keeps textTertiary below AA, so it is never reached for as a text color', () => {
    expect(contrast(lightColors.textTertiary, bgBase)).toBeLessThan(AA);
  });
});
