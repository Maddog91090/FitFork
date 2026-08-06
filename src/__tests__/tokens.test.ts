import { lightColors } from '../theme/tokens';

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('lightColors contrast (WCAG AA, 4.5:1)', () => {
  it.each([
    ['textPrimary on bgBase', lightColors.textPrimary, lightColors.bgBase],
    ['textPrimary on bgSurface', lightColors.textPrimary, lightColors.bgSurface],
    ['textSecondary on bgBase', lightColors.textSecondary, lightColors.bgBase],
    ['textSecondary on bgSurface', lightColors.textSecondary, lightColors.bgSurface],
    ['accentRedDeep on bgBase', lightColors.accentRedDeep, lightColors.bgBase],
    ['accentTealDeep on bgBase', lightColors.accentTealDeep, lightColors.bgBase],
    ['textOnAccent on accentRed', lightColors.textOnAccent, lightColors.accentRed],
  ])('%s is at least 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('textTertiary intentionally fails AA on bgBase (decorative use only)', () => {
    expect(contrastRatio(lightColors.textTertiary, lightColors.bgBase)).toBeLessThan(4.5);
  });
});
