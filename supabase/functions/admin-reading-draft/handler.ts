import { validateAiReadingInput, AI_READING_LIMITS } from '../_shared/aiReadingInput.js';
import { AiReadingGenerationError } from '../_shared/aiReadingProvider.ts';

type Dependencies = {
  headers: (request: Request) => Record<string, string>;
  authenticate: (request: Request) => Promise<{ authId: string } | null>;
  admit: (authId: string) => boolean;
  generate: (input: any) => Promise<any>;
  validateInput?: (body: any) => any;
  recordUsage: (authId: string, usage: any) => Promise<unknown>;
};

async function readLimitedBody(req: Request) {
  if (!req.body) throw new Error('Request body is missing.');
  const reader = req.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > AI_READING_LIMITS.bodyBytes) throw new Error('Import is too large.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('Invalid JSON request.');
  }
}

export function createAiReadingHandler(deps: Dependencies) {
  const inFlight = new Set<string>();
  return async (req: Request) => {
    const reply = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          ...deps.headers(req),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    if (req.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: deps.headers(req) });
    if (req.method !== 'POST') return reply({ error: 'Use POST.' }, 405);
    if (!req.headers.get('Authorization')?.startsWith('Bearer '))
      return reply({ error: 'Sign in as an admin.' }, 401);
    const admin = await deps.authenticate(req).catch(() => null);
    if (!admin) return reply({ error: 'Admin access required.' }, 403);
    let input;
    try {
      input = (deps.validateInput || validateAiReadingInput)(await readLimitedBody(req));
    } catch (error) {
      return reply({ error: error instanceof Error ? error.message : 'Invalid input.' }, 400);
    }
    if (inFlight.has(admin.authId))
      return reply({ error: 'Your previous import is still running.' }, 409);
    if (!deps.admit(admin.authId))
      return reply({ error: 'Please wait a minute before creating another draft.' }, 429);
    inFlight.add(admin.authId);
    try {
      const result = await deps.generate(input);
      await deps
        .recordUsage(admin.authId, {
          ...result.usage,
          model: result.model,
          fallbackUsed: result.fallbackUsed,
        })
        .catch(() => {});
      return reply(result);
    } catch (error) {
      if (error instanceof AiReadingGenerationError) {
        await deps.recordUsage(admin.authId, { ...error.usage, failed: true }).catch(() => {});
        return reply({ error: error.message }, 422);
      }
      return reply(
        { error: 'Test AI is temporarily unavailable. Your input has been kept; try again.' },
        503
      );
    } finally {
      inFlight.delete(admin.authId);
    }
  };
}
