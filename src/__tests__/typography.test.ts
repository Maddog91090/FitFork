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
});
