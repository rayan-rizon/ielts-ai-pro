// Stands in for @supabase/supabase-js when ai_coach_test.ts runs the real Edge Function
// handler. The test installs the fake client on globalThis before importing the function.
export function createClient() {
  return (globalThis as any).__fakeSupabase();
}
