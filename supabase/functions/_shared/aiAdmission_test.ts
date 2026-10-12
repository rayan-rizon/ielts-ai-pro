import assert from 'node:assert/strict';
import { checkSharedRateLimit, getAdmittedUser, withTextAiAdmission } from './aiAdmission.ts';
import { processWritingJob } from './writingJobsWorkflow.ts';

Deno.test('shared burst admission fails closed when database verification fails', async () => {
  await assert.rejects(
    checkSharedRateLimit({ rpc: async () => ({ error: new Error('offline') }) }, 'user', {
      maxRequests: 3,
      windowMs: 60000,
    })
  );
});
Deno.test(
  'AI read operations bypass provider leases and retain their original handler',
  async () => {
    const response = await withTextAiAdmission('coach', async () => new Response('history'), [
      'history',
    ])(
      new Request('https://ieltsai.pro', {
        method: 'POST',
        headers: { Origin: 'https://ieltsai.pro', 'x-requested-with': 'XMLHttpRequest' },
        body: '{"operation":"history"}',
      })
    );
    assert.equal(await response.text(), 'history');
  }
);
Deno.test(
  'job completion preserves the exact evaluator output and acknowledges its lease',
  async () => {
    const calls: Array<[string, any]> = [];
    const output = {
      success: true,
      data: {
        overallBand: 7.5,
        criteriaScores: { TaskResponse: 7 },
        annotations: [{ explanation: 'unchanged' }],
      },
    };
    const job = {
      id: 'job',
      authId: 'learner',
      reservationId: 'reservation',
      inputHash: 'fingerprint',
      attempts: 1,
      payload: { writingText: 'Essay', taskType: 'Task 2' },
    };
    const db = {
      auth: { admin: { getUserById: async () => ({ data: { user: { id: 'learner' } } }) } },
      rpc: async (name: string, args: any) => {
        calls.push([name, args]);
        return { data: name === 'claim_writing_feedback' ? job : true };
      },
    };
    await processWritingJob(db, 'lease', async (req, context) => {
      assert.equal(context?.reservationId, 'reservation');
      assert.equal((await req.json()).writingText, 'Essay');
      return new Response(JSON.stringify(output));
    });
    const finish = calls.find(([name]) => name === 'finish_writing_feedback')?.[1];
    assert.deepEqual(finish.p_response, output);
    assert.equal(finish.p_retry, false);
    assert.equal(finish.p_slot_token, 'lease');
    assert.equal(calls.filter(([name]) => name === 'finalize_ai_api_usage').length, 0);
  }
);
Deno.test('provider failure retries are bounded, while invalid inputs are terminal', async () => {
  const cases: Array<[number, number, boolean]> = [
    [1, 503, true],
    [3, 503, false],
    [1, 400, false],
    [1, 401, false],
  ];
  for (const [attempts, status, retry] of cases) {
    let finish: any;
    const db = {
      auth: { admin: { getUserById: async () => ({ data: { user: { id: 'learner' } } }) } },
      rpc: async (name: string, args: any) => {
        if (name === 'finish_writing_feedback') finish = args;
        return {
          data:
            name === 'claim_writing_feedback'
              ? {
                  id: 'job',
                  authId: 'learner',
                  reservationId: 'quota',
                  inputHash: 'hash',
                  attempts,
                  payload: {},
                }
              : true,
        };
      },
    };
    await processWritingJob(
      db,
      'lease',
      async () => new Response('{"error":"failure"}', { status })
    );
    assert.equal(finish.p_retry, retry);
  }
});
Deno.test('an unacknowledged result leaves the durable message to lease recovery', async () => {
  const db = {
    auth: { admin: { getUserById: async () => ({ data: { user: { id: 'learner' } } }) } },
    rpc: async (name: string) => ({
      data:
        name === 'claim_writing_feedback'
          ? {
              id: 'job',
              authId: 'learner',
              reservationId: 'quota',
              inputHash: 'hash',
              attempts: 1,
              payload: {},
            }
          : false,
    }),
  };
  await assert.rejects(
    processWritingJob(db, 'lease', async () => new Response('{"success":true,"data":{}}')),
    /not acknowledged/
  );
});

Deno.test(
  'verified identity is request-local and lease cleanup cannot discard a result',
  async () => {
    const previousFetch = globalThis.fetch;
    const previousUrl = Deno.env.get('SUPABASE_URL');
    const previousKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    Deno.env.set('SUPABASE_URL', 'https://local-test.example');
    Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'local-test-only');
    let authCalls = 0;
    const req = new Request('https://ieltsai.pro', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer local-test-token',
        Origin: 'https://ieltsai.pro',
        'x-requested-with': 'XMLHttpRequest',
      },
      body: '{}',
    });
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('/auth/v1/user')) {
        authCalls += 1;
        return new Response(
          '{"id":"00000000-0000-0000-0000-000000000001","app_metadata":{},"user_metadata":{}}',
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('acquire_text_ai_lease'))
        return new Response('{"allowed":true,"leaseId":"lease"}', {
          headers: { 'Content-Type': 'application/json' },
        });
      if (url.includes('release_text_ai_lease'))
        return new Response('{"message":"temporarily unavailable"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      throw new Error('Unexpected request');
    }) as typeof fetch;
    try {
      const result = await withTextAiAdmission('test', async (request) => {
        assert.equal(getAdmittedUser(request)?.id, '00000000-0000-0000-0000-000000000001');
        return new Response('completed');
      })(req);
      assert.equal(await result.text(), 'completed');
      assert.equal(authCalls, 1);
      assert.equal(getAdmittedUser(req), undefined);
    } finally {
      globalThis.fetch = previousFetch;
      if (previousUrl) Deno.env.set('SUPABASE_URL', previousUrl);
      else Deno.env.delete('SUPABASE_URL');
      if (previousKey) Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', previousKey);
      else Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    }
  }
);
