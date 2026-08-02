import { typography } from '../theme/typography';

describe('typography scale', () => {
  it('uses positive tracking on the small uppercase label and near-zero on body/caption', () => {
    expect(typography.label.letterSpacing).toBeGreaterThan(0);
    expect(typography.body.letterSpacing).toBe(0);
    expect(typography.caption.letterSpacing).toBeGreaterThan(0);
  });

  it('orders line-height with font size (body > caption > label)', () => {
    expect(typography.body.lineHeight).toBeGreaterThan(typography.caption.lineHeight);
    expect(typography.caption.lineHeight).toBeGreaterThan(typography.label.lineHeight);
  });

  it('orders font size across all five steps (title > subtitle > body > caption > label)', () => {
    expect(typography.title.fontSize).toBeGreaterThan(typography.subtitle.fontSize);
    expect(typography.subtitle.fontSize).toBeGreaterThan(typography.body.fontSize);
    expect(typography.body.fontSize).toBeGreaterThan(typography.caption.fontSize);
    expect(typography.caption.fontSize).toBeGreaterThan(typography.label.fontSize);
  });

  it('uses negative tracking on the large title, matching the size-specific tracking rule', () => {
    expect(typography.title.letterSpacing).toBeLessThan(0);
    expect(typography.subtitle.letterSpacing).toBeLessThanOrEqual(0);
  });
});
