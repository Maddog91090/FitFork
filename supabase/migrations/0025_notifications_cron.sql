-- Migration numbers intentionally jump from 0023 to 0025: 0024 was never
-- created, this is not a missing/lost migration.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The service role key used below to authenticate the cron -> Edge Function
-- call is NOT set by this migration (never commit a real key to a migration
-- file). Before this job can succeed, run once, directly against the live
-- project (not committed to git):
--   select vault.create_secret('<the real service_role key>', 'service_role_key');

select cron.schedule(
  'send-workout-reminders',
  '0 17 * * *',
  $$
  select net.http_post(
    url := 'https://xewpbovlhoxovaydpuzh.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
