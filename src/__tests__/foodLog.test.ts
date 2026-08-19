import { scaleProductMacros, sumMacros, remainingMacros } from '../lib/foodLog';

describe('scaleProductMacros', () => {
  it('scales per-100g macros to the consumed quantity', () => {
    const product = { caloriesPer100g: 200, proteinGPer100g: 10, fatGPer100g: 8, carbsGPer100g: 20 };
    expect(scaleProductMacros(product, 150)).toEqual({ calories: 300, proteinG: 15, fatG: 12, carbsG: 30 });
  });

  it('rounds to whole units', () => {
    const product = { caloriesPer100g: 333, proteinGPer100g: 7, fatGPer100g: 3, carbsGPer100g: 11 };
    expect(scaleProductMacros(product, 30)).toEqual({ calories: 100, proteinG: 2, fatG: 1, carbsG: 3 });
  });

  it('returns zero for a zero quantity', () => {
    const product = { caloriesPer100g: 200, proteinGPer100g: 10, fatGPer100g: 8, carbsGPer100g: 20 };
    expect(scaleProductMacros(product, 0)).toEqual({ calories: 0, proteinG: 0, fatG: 0, carbsG: 0 });
  });
});

describe('sumMacros', () => {
  it('sums an empty list to zero', () => {
    expect(sumMacros([])).toEqual({ calories: 0, proteinG: 0, fatG: 0, carbsG: 0 });
  });

  it('sums multiple entries field by field', () => {
    const entries = [
      { calories: 300, proteinG: 20, fatG: 10, carbsG: 30 },
      { calories: 450, proteinG: 25, fatG: 15, carbsG: 40 },
    ];
    expect(sumMacros(entries)).toEqual({ calories: 750, proteinG: 45, fatG: 25, carbsG: 70 });
  });
});

describe('remainingMacros', () => {
  it('subtracts consumed from target', () => {
    const target = { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 };
    const consumed = { calories: 1200, proteinG: 90, fatG: 40, carbsG: 120 };
    expect(remainingMacros(target, consumed)).toEqual({ calories: 800, proteinG: 60, fatG: 20, carbsG: 80 });
  });

  it('goes negative when the day is over target', () => {
    const target = { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 };
    const consumed = { calories: 2400, proteinG: 150, fatG: 60, carbsG: 200 };
    expect(remainingMacros(target, consumed)).toEqual({ calories: -400, proteinG: 0, fatG: 0, carbsG: 0 });
  });
});
