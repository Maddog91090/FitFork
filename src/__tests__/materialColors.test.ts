import {
  lightMaterialColors,
  darkMaterialColors,
  lightTertiaryByDomain,
  darkTertiaryByDomain,
  type MaterialDomain,
} from '../theme/tokens';

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function contrastRatio(hex1: string, hex2: string) {
  const l1 = relLuminance(hexToRgb(hex1));
  const l2 = relLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const DOMAINS: MaterialDomain[] = ['nutrition', 'sport', 'progress', 'neutral'];

describe('Material color contrast (WCAG AA)', () => {
  it.each([
    ['light', lightMaterialColors],
    ['dark', darkMaterialColors],
  ] as const)('%s: text pairs clear 4.5:1', (_name, scheme) => {
    expect(contrastRatio(scheme.onBackground, scheme.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onSurface, scheme.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onSurfaceVariant, scheme.surfaceVariant)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onPrimaryContainer, scheme.primaryContainer)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onErrorContainer, scheme.errorContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['light', lightMaterialColors],
    ['dark', darkMaterialColors],
  ] as const)('%s: outline and primary clear 3:1 against background', (_name, scheme) => {
    expect(contrastRatio(scheme.outline, scheme.background)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(scheme.primary, scheme.background)).toBeGreaterThanOrEqual(3);
  });

  it.each(DOMAINS)('light %s: onTertiaryContainer clears 4.5:1 on tertiaryContainer', (domain) => {
    const t = lightTertiaryByDomain[domain];
    expect(contrastRatio(t.onTertiaryContainer, t.tertiaryContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(DOMAINS)('dark %s: onTertiaryContainer clears 4.5:1 on tertiaryContainer', (domain) => {
    const t = darkTertiaryByDomain[domain];
    expect(contrastRatio(t.onTertiaryContainer, t.tertiaryContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(DOMAINS)('dark %s: tertiary clears 3:1 against dark background', (domain) => {
    const t = darkTertiaryByDomain[domain];
    expect(contrastRatio(t.tertiary, darkMaterialColors.background)).toBeGreaterThanOrEqual(3);
  });

  // The pair that actually ships: Button/ChoiceGroup/TagFilterGroup all paint
  // a `tertiary` fill with `onTertiary` text/ripple on top — never
  // `tertiaryContainer`/`onTertiaryContainer`.
  it.each(DOMAINS)('light %s: onTertiary clears 4.5:1 on tertiary', (domain) => {
    const t = lightTertiaryByDomain[domain];
    expect(contrastRatio(t.onTertiary, t.tertiary)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(DOMAINS)('dark %s: onTertiary clears 4.5:1 on tertiary', (domain) => {
    const t = darkTertiaryByDomain[domain];
    expect(contrastRatio(t.onTertiary, t.tertiary)).toBeGreaterThanOrEqual(4.5);
  });

  // The outlined/unselected chip variant paints `tertiary` as text/border
  // color directly against the screen background — 14px bold labelLarge text
  // does not qualify as WCAG "large text", so this must clear 4.5:1, not 3.0.
  it.each(DOMAINS)('light %s: tertiary (as text) clears 4.5:1 against background', (domain) => {
    const t = lightTertiaryByDomain[domain];
    expect(contrastRatio(t.tertiary, lightMaterialColors.background)).toBeGreaterThanOrEqual(4.5);
  });
});
