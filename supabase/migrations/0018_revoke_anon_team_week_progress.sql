-- supabase/migrations/0018_revoke_anon_team_week_progress.sql

-- Postgres accorde EXECUTE à PUBLIC par défaut à la création d'une fonction,
-- et `anon` hérite de PUBLIC. Comme team_week_progress est `security definer`
-- (elle contourne donc la RLS de workout_completions), un appelant anonyme
-- muni de la seule clé publique de l'app pouvait lister les UUID de tous les
-- utilisateurs et leur nombre de jours d'entraînement par semaine.
-- On révoque PUBLIC/anon ; seul `authenticated` (grant explicite du 0017)
-- conserve le droit d'exécution.
revoke execute on function public.team_week_progress(int) from public, anon;
