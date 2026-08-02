import { translateAuthError } from '../lib/authErrors';

describe('translateAuthError', () => {
  it('translates a network failure', () => {
    expect(translateAuthError(new Error('Failed to fetch'))).toBe(
      'Impossible de se connecter. Vérifie ta connexion internet et réessaie.'
    );
  });

  it('translates invalid login credentials', () => {
    expect(translateAuthError(new Error('Invalid login credentials'))).toBe(
      'Email ou mot de passe incorrect.'
    );
  });

  it('translates an already-registered email', () => {
    expect(translateAuthError(new Error('User already registered'))).toBe(
      'Un compte existe déjà avec cet email. Essaie de te connecter.'
    );
  });

  it('translates a too-short password', () => {
    expect(translateAuthError(new Error('Password should be at least 6 characters'))).toBe(
      'Le mot de passe doit contenir au moins 6 caractères.'
    );
  });

  it('falls back to a generic French message for an unrecognized error', () => {
    expect(translateAuthError(new Error('some unmapped Supabase error'))).toBe(
      'Une erreur est survenue. Réessaie dans un instant.'
    );
  });

  it('handles a non-Error value', () => {
    expect(translateAuthError('Failed to fetch')).toBe(
      'Impossible de se connecter. Vérifie ta connexion internet et réessaie.'
    );
  });
});
