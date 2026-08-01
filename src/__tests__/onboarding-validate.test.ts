import { validateStep } from '../app/onboarding';

const baseFields = {
  sex: null,
  age: '',
  heightCm: '',
  weightKg: '',
  activityLevel: null,
  goal: null,
  daysPerWeek: '',
  experienceLevel: null,
  equipment: null,
};

describe('validateStep', () => {
  it('rejects step 0 without a sex selected', () => {
    expect(validateStep(0, baseFields)).toBe('Merci de choisir un sexe.');
  });

  it('rejects step 0 with an invalid age', () => {
    expect(
      validateStep(0, { ...baseFields, sex: 'male', age: '0', heightCm: '178', weightKg: '75' })
    ).toBe('Âge invalide.');
  });

  it('accepts a complete step 0', () => {
    expect(
      validateStep(0, { ...baseFields, sex: 'male', age: '28', heightCm: '178', weightKg: '75' })
    ).toBeNull();
  });

  it('rejects step 1 without an activity level', () => {
    expect(validateStep(1, baseFields)).toBe("Merci de choisir un niveau d'activité.");
  });

  it('rejects step 1 without a goal', () => {
    expect(validateStep(1, { ...baseFields, activityLevel: 'moderate' })).toBe('Merci de choisir un objectif.');
  });

  it('rejects step 2 with an out-of-range training days value', () => {
    expect(
      validateStep(2, { ...baseFields, daysPerWeek: '9', experienceLevel: 'beginner', equipment: 'bodyweight' })
    ).toBe("Jours d'entraînement invalides (0 à 7).");
  });

  it('accepts a complete step 2', () => {
    expect(
      validateStep(2, { ...baseFields, daysPerWeek: '4', experienceLevel: 'beginner', equipment: 'bodyweight' })
    ).toBeNull();
  });

  it('accepts step 3 (recap) unconditionally', () => {
    expect(validateStep(3, baseFields)).toBeNull();
  });
});
