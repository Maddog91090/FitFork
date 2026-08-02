/**
 * Supabase auth errors arrive as raw English strings (`AuthError.message`) and, for network
 * failures, as a plain `Error` from `fetch` itself. Both were previously shown to the user
 * verbatim -- an English "Failed to fetch" or "Invalid login credentials" inside an otherwise
 * fully French UI. This maps the known cases to warm, French, actionable copy.
 */
export function translateAuthError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Impossible de se connecter. Vérifie ta connexion internet et réessaie.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (lower.includes('user already registered')) {
    return 'Un compte existe déjà avec cet email. Essaie de te connecter.';
  }
  if (lower.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (lower.includes('email not confirmed')) {
    return "Confirme ton adresse email avant de te connecter — vérifie ta boîte mail.";
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return "Cette adresse email n'est pas valide.";
  }

  return "Une erreur est survenue. Réessaie dans un instant.";
}
