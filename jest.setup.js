// Provide dummy Supabase env vars for tests that import `src/lib/supabase.ts`
// transitively (e.g. via `useAuth`) without mocking it directly. No real
// network calls are made in tests that don't mock `../lib/supabase`.
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
