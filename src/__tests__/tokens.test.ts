import { fontFamily, lightColors, radius } from '../theme/tokens';

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
    ['textPrimary on bgSunken', lightColors.textPrimary, lightColors.bgSunken],
    ['textSecondary on bgBase', lightColors.textSecondary, lightColors.bgBase],
    ['textSecondary on bgSurface', lightColors.textSecondary, lightColors.bgSurface],
    ['textSecondary on bgSunken', lightColors.textSecondary, lightColors.bgSunken],
    ['domainNutritionDeep on bgBase', lightColors.domainNutritionDeep, lightColors.bgBase],
    ['domainSportDeep on bgBase', lightColors.domainSportDeep, lightColors.bgBase],
    ['domainProgressDeep on bgBase', lightColors.domainProgressDeep, lightColors.bgBase],
    ['domainNeutralDeep on bgBase', lightColors.domainNeutralDeep, lightColors.bgBase],
    ['textOnAccent on domainNutrition (fill)', lightColors.textOnAccent, lightColors.domainNutrition],
    ['textOnAccent on domainSport (fill)', lightColors.textOnAccent, lightColors.domainSport],
    ['textOnAccent on domainProgress (fill)', lightColors.textOnAccent, lightColors.domainProgress],
    ['textOnAccent on domainNeutral (fill)', lightColors.textOnAccent, lightColors.domainNeutral],
  ])('%s is at least 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('textTertiary intentionally fails AA on bgBase (decorative use only)', () => {
    expect(contrastRatio(lightColors.textTertiary, lightColors.bgBase)).toBeLessThan(4.5);
  });
});

describe('radius', () => {
  it('is generous everywhere — no small corners in the claymorphic direction', () => {
    expect(radius.xs).toBeGreaterThanOrEqual(10);
    expect(radius.sm).toBeGreaterThanOrEqual(16);
    expect(radius.md).toBeGreaterThanOrEqual(20);
    expect(radius.lg).toBeGreaterThanOrEqual(24);
  });
});

describe('fontFamily', () => {
  it('uses a single rounded family for both display and body weights', () => {
    expect(fontFamily.displayBold).toBe('Fredoka_700Bold');
    expect(fontFamily.displaySemiBold).toBe('Fredoka_600SemiBold');
    expect(fontFamily.bodyRegular).toBe('Fredoka_400Regular');
    expect(fontFamily.bodyMedium).toBe('Fredoka_500Medium');
    expect(fontFamily.bodySemiBold).toBe('Fredoka_600SemiBold');
    expect(fontFamily.bodyBold).toBe('Fredoka_700Bold');
  });

  it('has no leftover Fraunces or Plus Jakarta Sans reference', () => {
    const values = Object.values(fontFamily);
    expect(values.some((v) => v.includes('Fraunces'))).toBe(false);
    expect(values.some((v) => v.includes('PlusJakartaSans'))).toBe(false);
  });
});
