import type { AuthError } from '@supabase/supabase-js';

/**
 * supabase-js surfaces raw English error messages (`error.message`); this app's
 * copy is French everywhere else, so login/signup must translate rather than
 * pass them through. Keyed on `error.code` (stable) rather than `error.message`
 * (wording Supabase can change) — see `@supabase/auth-js`'s `ErrorCode` union.
 */
const MESSAGES_FR: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: "Confirme d'abord ton adresse email : vérifie ta boîte de réception.",
  user_already_exists: 'Un compte existe déjà avec cet email.',
  email_exists: 'Un compte existe déjà avec cet email.',
  weak_password: 'Le mot de passe doit contenir au moins 6 caractères.',
  email_address_invalid: 'Adresse email invalide.',
  validation_failed: 'Adresse email invalide.',
  over_email_send_rate_limit: 'Trop de tentatives. Réessaie dans quelques minutes.',
  over_request_rate_limit: 'Trop de tentatives. Réessaie dans quelques minutes.',
  user_banned: 'Ce compte est suspendu.',
  signup_disabled: 'Les inscriptions sont temporairement désactivées.',
};

export function translateAuthError(error: AuthError): string {
  return MESSAGES_FR[error.code ?? ''] ?? 'Une erreur est survenue. Réessaie.';
}
