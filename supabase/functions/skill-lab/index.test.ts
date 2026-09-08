import assert from 'node:assert/strict';
let handler: (request: Request) => Promise<Response>;
const originalServe = Deno.serve;
// Capture the actual production handler without opening a listener.
Deno.serve = ((callback: (request: Request) => Promise<Response>) => {
  handler = callback;
  return {};
}) as typeof Deno.serve;
const keys = {
  SUPABASE_URL: 'https://skill-lab-fixture.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-key',
  OPENROUTER_API_KEY: 'fixture-openrouter-key',
  GEMINI_API_KEY: 'fixture-gemini-key',
};
for (const [key, value] of Object.entries(keys)) Deno.env.set(key, value);
await import('./index.ts');
Deno.serve = originalServe;
const originalFetch = globalThis.fetch;
const good = {
  type: 'help',
  explanation: 'Look for a detail that contradicts the statement.',
  result: 'not_assessed',
  next_step: 'Try the worked example.',
};
function setup(mode: string) {
  const calls: string[] = [];
  const receipts: any[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const response = (value: unknown, status = 200) =>
      new Response(JSON.stringify(value), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    if (url.includes('/auth/v1/user'))
      return mode === 'unauthorized'
        ? response({ message: 'bad token' }, 401)
        : response({ id: 'b8100000-0000-4000-8000-000000000001', aud: 'authenticated' });
    if (url.includes('/rpc/skill_lab_ai_reserve')) {
      if (mode === 'quota')
        return response(
          { message: 'You have used the three questions included in this lesson' },
          400
        );
      if (mode === 'duplicate') return response({ state: 'complete', result: good });
      return response({
        state: 'reserved',
        user_id: 'a8100000-0000-4000-8000-000000000001',
        context: {
          title: 'False or Not Given?',
          strategy: 'Check what the text says.',
          previous_progress: [],
        },
      });
    }
    if (url.includes('/rpc/skill_lab_ai_finish')) {
      receipts.push(body);
      return response(null);
    }
    if (url.includes('openrouter.ai')) {
      assert.equal(body.model, 'z-ai/glm-5.3-flash');
      assert.equal(body.max_tokens, 1200);
      assert.match(body.messages[0].content, /never invent memory/);
      return response({
        choices: [
          {
            message: {
              content:
                mode === 'fallback' || mode === 'failed' ? 'invalid JSON' : JSON.stringify(good),
            },
          },
        ],
        model: body.model,
        usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300, cost: 0.001 },
      });
    }
    if (url.includes('generativelanguage.googleapis.com'))
      return response({
        candidates: [
          {
            content: {
              parts: [{ text: mode === 'failed' ? 'invalid JSON' : JSON.stringify(good) }],
            },
          },
        ],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 100, totalTokenCount: 200 },
      });
    throw new Error('Unexpected network request in isolated test');
  }) as typeof fetch;
  return { calls, receipts };
}
function request(token = true, answer = 'Can you explain this?') {
  return new Request('https://skill-lab-fixture.invalid/functions/v1/skill-lab', {
    method: 'POST',
    headers: {
      Origin: 'https://ieltsai.pro',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer fixture-token' } : {}),
    },
    body: JSON.stringify({
      sessionId: 'c8100000-0000-4000-8000-000000000001',
      requestId: 'd8100000-0000-4000-8000-000000000001',
      kind: 'help',
      answer,
    }),
  });
}
Deno.test('Skill Lab rejects missing auth before any provider work', async () => {
  const { calls } = setup('unauthorized');
  try {
    assert.equal((await handler(request(false))).status, 401);
    assert.equal(calls.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test('Skill Lab starts with GLM 5.3 Flash and saves one receipt', async () => {
  const { calls, receipts } = setup('primary');
  try {
    const r = await handler(request());
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), good);
    assert.equal(calls.filter((c) => c.includes('openrouter.ai')).length, 1);
    assert.equal(calls.filter((c) => c.includes('generativelanguage')).length, 0);
    assert.equal(receipts.length, 1);
    assert.equal(receipts[0].p_ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test('Skill Lab repairs invalid primary output with one fallback only', async () => {
  const { calls, receipts } = setup('fallback');
  try {
    assert.equal((await handler(request())).status, 200);
    assert.equal(
      calls.filter((c) => c.includes('openrouter.ai') || c.includes('generativelanguage')).length,
      2
    );
    assert.equal(receipts[0].p_ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test('Skill Lab returns ungraded failure after both providers fail', async () => {
  const { calls, receipts } = setup('failed');
  try {
    assert.equal((await handler(request())).status, 503);
    assert.equal(
      calls.filter((c) => c.includes('openrouter.ai') || c.includes('generativelanguage')).length,
      2
    );
    assert.equal(receipts[0].p_ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test('Skill Lab replays saved feedback without charging or calling AI again', async () => {
  const { calls, receipts } = setup('duplicate');
  try {
    assert.equal((await handler(request())).status, 200);
    assert.equal(calls.filter((c) => c.includes('openrouter.ai')).length, 0);
    assert.equal(receipts.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test('Skill Lab stops at the server quota before calling AI', async () => {
  const { calls } = setup('quota');
  try {
    assert.equal((await handler(request())).status, 429);
    assert.equal(calls.filter((c) => c.includes('openrouter.ai')).length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test('Skill Lab bounds questions before reserving paid work', async () => {
  const { calls } = setup('primary');
  try {
    assert.equal((await handler(request(true, 'x'.repeat(601)))).status, 400);
    assert.equal(calls.filter((c) => c.includes('/rpc/')).length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
