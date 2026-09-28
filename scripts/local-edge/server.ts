// Run selected Supabase Edge Functions from this checkout on your machine,
// without Docker, so a change can be tried in the local app before deploying.
//
//   npm run edge:local            # terminal 1
//   npm run dev                   # terminal 2, with LOCAL_EDGE_FUNCTIONS_URL set
//
// Vite sends only the functions listed in LOCAL_EDGE_FUNCTIONS here; every
// other call still goes to the hosted project. The functions use the real
// Supabase project and keys from .env, so data they write is real data: test
// with your own account.

declare const Deno: any;

const env = Deno.env;
const setDefault = (name: string, value: string | undefined) => {
  if (!env.get(name) && value) env.set(name, value);
};
setDefault('SUPABASE_URL', env.get('VITE_SUPABASE_URL'));
setDefault('SUPABASE_ANON_KEY', env.get('VITE_SUPABASE_ANON_KEY'));
// Locally the new practice features are on for everyone signed in; deployed
// functions keep reading their own secrets (default off).
setDefault('PRACTICE_TTS_ROLLOUT', 'all');
setDefault('PRACTICE_COACH_ROLLOUT', 'all');

const port = Number(env.get('LOCAL_EDGE_PORT') || 8787);
const names = (
  env.get('LOCAL_EDGE_FUNCTIONS') || 'processSpeakingSessionV2,synthesizePracticeSpeech'
)
  .split(',')
  .map((name: string) => name.trim())
  .filter(Boolean);

const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENROUTER_API_KEY'].filter(
  (name) => !env.get(name)
);
if (missing.length) {
  console.error(`Missing ${missing.join(', ')}. Add them to .env or supabase/functions/.env.`);
  Deno.exit(1);
}

type Handler = (request: Request) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
for (const name of names) {
  (globalThis as any).__registerLocalEdgeHandler = (handler: Handler) =>
    handlers.set(name, handler);
  await import(new URL(`../../supabase/functions/${name}/index.ts`, import.meta.url).href);
  if (!handlers.has(name)) throw new Error(`${name} did not register a handler`);
}

console.log(`Local Edge Functions on http://127.0.0.1:${port}/functions/v1/{${names.join(',')}}`);
console.log(
  `PRACTICE_TTS_ROLLOUT=${env.get('PRACTICE_TTS_ROLLOUT')} PRACTICE_COACH_ROLLOUT=${env.get('PRACTICE_COACH_ROLLOUT')} PRACTICE_TTS_MODEL=${env.get('PRACTICE_TTS_MODEL') || '(default)'}`
);

Deno.serve({ hostname: '127.0.0.1', port }, async (request: Request) => {
  const name = new URL(request.url).pathname.match(/^\/functions\/v1\/([^/]+)/)?.[1] || '';
  const handler = handlers.get(name);
  if (!handler) return new Response(`Unknown local function ${name}`, { status: 404 });
  const startedAt = performance.now();
  const response = await handler(request);
  console.log(
    `${request.method} ${name} ${response.status} ${Math.round(performance.now() - startedAt)}ms ${response.headers.get('Server-Timing') || ''}`
  );
  return response;
});
