// End-to-end test of the real ai-coach handler against a fake database and a fake
// OpenRouter. Nothing here touches a real project, key or model.
//
//   deno test --no-check --import-map=supabase/functions/ai-coach/test_import_map.json \
//     --allow-env --allow-net --allow-read supabase/functions/ai-coach/ai_coach_test.ts
import assert from 'node:assert/strict';

const SESSION_ID = '0f7d3b5e-9a52-4c1d-8d7e-3a1b2c4d5e6f';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ── fake Supabase ────────────────────────────────────────────────────────────
type Op = [string, ...unknown[]];
type Call = { kind: 'rpc' | 'from'; name: string; args?: any; ops: Op[] };

const world: {
  calls: Call[];
  sourceSession: any;
  questions: any[];
  memory: any[] | null;
  practice: any;
  history: any[];
  preferredLanguage: string | null;
  finishFailsWith: string | null;
  leaseEvents: string[];
} = {
  calls: [],
  sourceSession: null,
  questions: [],
  memory: null,
  practice: { total: 0, correct: 0, missedPrompts: [] },
  history: [],
  preferredLanguage: null,
  finishFailsWith: null,
  leaseEvents: [],
};

function reset() {
  world.calls = [];
  world.sourceSession = null;
  world.questions = [];
  world.memory = null;
  world.practice = { total: 0, correct: 0, missedPrompts: [] };
  world.history = [];
  world.preferredLanguage = null;
  world.leaseEvents = [];
  fetchQueue.length = 0;
  fetchBodies.length = 0;
}

function resolveCall(call: Call, single: boolean): { data: any; error: any } {
  const has = (op: string, column?: string) =>
    call.ops.some(([name, first]) => name === op && (column === undefined || first === column));
  if (call.kind === 'rpc') {
    switch (call.name) {
      case 'acquire_text_ai_lease':
        world.leaseEvents.push('acquire');
        return { data: { allowed: true, leaseId: 'lease-1' }, error: null };
      case 'release_text_ai_lease':
        world.leaseEvents.push('release');
        return { data: true, error: null };
      case 'get_institution_learner_profile':
        return {
          data: { id: 'user-1', role: 'learner', subscription_tier: 'free', target_band_score: 7 },
          error: null,
        };
      case 'ai_coach_reserve':
        return {
          data: {
            state: 'reserved',
            conversationId: 'conv-1',
            reservedCostUsd: 0.005,
            remainingDailyReplies: 4,
            quotaResetsAt: '2026-10-24T00:00:00Z',
          },
          error: null,
        };
      case 'ai_coach_finish': {
        const args = call.args;
        if (!args.p_ok || !args.p_response) return { data: {}, error: null };
        return {
          data: {
            ...args.p_response,
            messageId: 'msg-1',
            conversationId: 'conv-1',
            actions: [],
          },
          error: null,
        };
      }
      case 'ai_coach_practice_summary':
        return { data: world.practice, error: null };
      case 'ai_coach_status':
        return { data: { remainingDailyReplies: 4, quotaResetsAt: 'x' }, error: null };
      default:
        return { data: null, error: null };
    }
  }
  switch (call.name) {
    case 'test_sessions':
      if (has('eq', 'id')) return { data: world.sourceSession, error: null };
      return { data: [], error: null };
    case 'questions':
      return { data: world.questions, error: null };
    case 'ai_coach_preferences':
      return {
        data: world.preferredLanguage ? { explanation_language: world.preferredLanguage } : null,
        error: null,
      };
    case 'ai_coach_messages':
      return { data: world.history, error: null };
    case 'ai_coach_memory':
      return {
        data: world.memory ? { items: world.memory } : null,
        error: null,
      };
    default:
      return { data: single ? null : [], error: null };
  }
}

class Query {
  ops: Op[] = [];
  private wantsOne = false;
  constructor(private call: Call) {
    this.call.ops = this.ops;
    world.calls.push(call);
  }
  private add(name: string, args: unknown[]) {
    this.ops.push([name, ...args]);
    return this;
  }
  select(...a: unknown[]) {
    return this.add('select', a);
  }
  eq(...a: unknown[]) {
    return this.add('eq', a);
  }
  gte(...a: unknown[]) {
    return this.add('gte', a);
  }
  lt(...a: unknown[]) {
    return this.add('lt', a);
  }
  in(...a: unknown[]) {
    return this.add('in', a);
  }
  ilike(...a: unknown[]) {
    return this.add('ilike', a);
  }
  order(...a: unknown[]) {
    return this.add('order', a);
  }
  limit(...a: unknown[]) {
    return this.add('limit', a);
  }
  insert(...a: unknown[]) {
    return this.add('insert', a);
  }
  update(...a: unknown[]) {
    return this.add('update', a);
  }
  upsert(...a: unknown[]) {
    const [row] = a as [any];
    if (this.call.name === 'ai_coach_memory') world.memory = row.items;
    return this.add('upsert', a);
  }
  delete(...a: unknown[]) {
    return this.add('delete', a);
  }
  maybeSingle() {
    this.wantsOne = true;
    return this;
  }
  // deno-lint-ignore no-explicit-any
  then(resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) {
    return Promise.resolve(resolveCall(this.call, this.wantsOne)).then(resolve, reject);
  }
}
// `.single()` shares maybeSingle's behaviour.
(Query.prototype as any).single = Query.prototype.maybeSingle;

(globalThis as any).__fakeSupabase = () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'auth-1' } }, error: null }) },
  rpc: (name: string, args: unknown) => new Query({ kind: 'rpc', name, args, ops: [] }),
  from: (name: string) => new Query({ kind: 'from', name, ops: [] }),
});

// ── fake OpenRouter ──────────────────────────────────────────────────────────
type Planned = (init: RequestInit) => Response | Promise<Response>;
const fetchQueue: Planned[] = [];
const fetchBodies: any[] = [];

globalThis.fetch = (async (_url: string, init: RequestInit) => {
  fetchBodies.push(JSON.parse(String(init.body)));
  const next = fetchQueue.shift();
  if (!next) throw new Error('Unexpected provider call');
  return next(init);
}) as typeof fetch;

const USAGE = { prompt_tokens: 1200, completion_tokens: 150, total_tokens: 1350, cost: 0.0003 };

function reply(fields: Record<string, unknown> = {}) {
  return {
    responseLanguage: 'en',
    groundingStatus: 'general',
    evidenceRefs: [],
    answer: 'Start with a clear position. Then give one reason per paragraph.',
    exercise: null,
    actions: [],
    followUps: ['How can I practise this?'],
    memory: [],
    ...fields,
  };
}

const jsonResponse = (content: unknown, usage = USAGE) =>
  new Response(
    JSON.stringify({
      model: 'openai/gpt-oss-120b',
      choices: [{ message: { content: JSON.stringify(content) } }],
      usage,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );

function streamResponse(content: unknown, { split = 12, usage = USAGE } = {}) {
  const text = JSON.stringify(content);
  const stream = new ReadableStream({
    start(controller) {
      for (let index = 0; index < text.length; index += split) {
        const part = text.slice(index, index + split);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ model: 'openai/gpt-oss-120b', choices: [{ delta: { content: part } }] })}\n\n`
          )
        );
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [], usage })}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

// ── load the real handler ────────────────────────────────────────────────────
Deno.env.set('SUPABASE_URL', 'https://fake.supabase.test');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role');
Deno.env.set('OPENROUTER_API_KEY', 'test-key');

let handler: (req: Request) => Promise<Response>;
Object.defineProperty(Deno, 'serve', {
  value: (fn: typeof handler) => {
    handler = fn;
    return {};
  },
  configurable: true,
});
await import('./index.ts');

function post(body: Record<string, unknown>) {
  return handler(
    new Request('https://fake.supabase.test/functions/v1/ai-coach', {
      method: 'POST',
      headers: {
        Origin: 'https://ieltsai.pro',
        'x-requested-with': 'XMLHttpRequest',
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  );
}

let counter = 0;
const send = (message: string, extra: Record<string, unknown> = {}) =>
  post({
    operation: 'send',
    requestId: `6a2c3432-6f1b-47a7-87e3-${String(++counter).padStart(12, '0')}`,
    message,
    preferredLanguage: 'en',
    ...extra,
  });

async function readEvents(response: Response) {
  const raw = await response.text();
  return raw
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const event = /^event: (.+)$/m.exec(block)?.[1] || '';
      const data = JSON.parse(/^data: (.+)$/m.exec(block)?.[1] || 'null');
      return { event, data };
    });
}

const finishCalls = () => world.calls.filter((call) => call.name === 'ai_coach_finish');
const reserveCall = () => world.calls.find((call) => call.name === 'ai_coach_reserve')!;

// ── tests ────────────────────────────────────────────────────────────────────
Deno.test(
  'a normal teaching answer about a band is delivered, not replaced by a canned reply',
  async () => {
    reset();
    // The old guardrail rejected this exact sentence (a band number plus "can" / "get").
    fetchQueue.push(() =>
      jsonResponse(
        reply({
          answer:
            'For Band 7 Writing, you can use a range of complex sentences. To get there, check each clause for tense.',
        })
      )
    );
    const response = await send('How is the IELTS Writing score calculated?');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.match(body.answer, /Band 7 Writing, you can use/);
    assert.equal(fetchBodies.length, 1, 'no second (fallback) provider call was needed');
    assert.equal(finishCalls()[0].args.p_ok, true);
    assert.equal(finishCalls()[0].args.p_model, 'openai/gpt-oss-120b');
  }
);

Deno.test(
  'a real score promise is still rejected, the fallback model answers, both billed',
  async () => {
    reset();
    fetchQueue.push(
      () => jsonResponse(reply({ answer: 'You will definitely reach Band 7 if you practise.' })),
      () =>
        jsonResponse(reply({ answer: 'Practise one Task 2 essay a week and review it.' }), {
          ...USAGE,
          cost: 0.0002,
        })
    );
    const response = await send('Will I get band 7?');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.match(body.answer, /Practise one Task 2 essay/);
    assert.equal(fetchBodies.length, 2);
    assert.equal(fetchBodies[1].model, 'openai/gpt-6-luna');
    const cost = finishCalls()[0].args.p_cost;
    assert.ok(Math.abs(cost - 0.0005) < 1e-9, `both attempts are billed, got ${cost}`);
  }
);

Deno.test(
  'when no model gives a verifiable answer the learner gets an honest error, not a spent reply',
  async () => {
    reset();
    const promise = () => jsonResponse(reply({ answer: 'I guarantee Band 8 for you.' }));
    fetchQueue.push(promise, promise);
    const response = await send('Tell me my future band');
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.match(body.error, /did not use one of your daily replies/);
    const finish = finishCalls().at(-1)!;
    assert.equal(
      finish.args.p_ok,
      false,
      'the operation is closed as failed, so it is not counted'
    );
    assert.ok(finish.args.p_cost > 0, 'the provider spend is still recorded');
  }
);

Deno.test(
  'streamed reply: validated sentences arrive first and match the saved final answer',
  async () => {
    reset();
    fetchQueue.push(() => streamResponse(reply()));
    const response = await send('How do I plan a Task 2 essay?', { stream: true });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /text\/event-stream/);
    const events = await readEvents(response);
    const deltas = events.filter((item) => item.event === 'delta').map((item) => item.data.text);
    const final = events.find((item) => item.event === 'final')!;
    assert.ok(deltas.length >= 2, `expected several sentence chunks, got ${deltas.length}`);
    assert.equal(deltas.join(''), final.data.answer);
    assert.equal(events.at(-1)!.event, 'final');
    assert.equal(final.data.messageId, 'msg-1');
    assert.equal(fetchBodies[0].stream, true);
    assert.equal(finishCalls()[0].args.p_ok, true);
  }
);

Deno.test(
  'streamed reply with a score promise: unsafe text is never shown and a clean reply replaces it',
  async () => {
    reset();
    fetchQueue.push(
      () =>
        streamResponse(
          reply({
            answer:
              'Practise topic sentences daily. You will definitely reach Band 7 soon. Keep going.',
          })
        ),
      () => jsonResponse(reply({ answer: 'Review one essay each week. Fix the top error.' }))
    );
    const events = await readEvents(await send('Help me improve', { stream: true }));
    const shown = events
      .filter((item) => item.event === 'delta')
      .map((item) => item.data.text)
      .join('');
    assert.ok(!/Band 7/.test(shown), `the promise must never be streamed, saw: ${shown}`);
    const names = events.map((item) => item.event);
    assert.equal(names.at(-1), 'final');
    if (shown)
      assert.ok(names.includes('reset'), 'a shown draft is retracted before the replacement');
    assert.match(events.at(-1)!.data.answer, /Review one essay/);
  }
);

Deno.test(
  'a streamed request that fails completely ends with an error event and a failed operation',
  async () => {
    reset();
    const bad = () => jsonResponse(reply({ answer: 'I guarantee Band 9.' }));
    fetchQueue.push(() => streamResponse(reply({ answer: 'I guarantee Band 9.' })), bad);
    const events = await readEvents(await send('Promise me a score', { stream: true }));
    const last = events.at(-1)!;
    assert.equal(last.event, 'error');
    assert.equal(last.data.status, 502);
    assert.equal(finishCalls().at(-1)!.args.p_ok, false);
  }
);

Deno.test('the concurrency lease is held until a streamed reply has been fully read', async () => {
  reset();
  fetchQueue.push(() => streamResponse(reply()));
  const response = await send('Explain topic sentences', { stream: true });
  assert.deepEqual(world.leaseEvents, ['acquire'], 'not released while the stream is still open');
  await response.text();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(world.leaseEvents, ['acquire', 'release']);
});

Deno.test('a plain reply releases its lease as soon as it returns', async () => {
  reset();
  fetchQueue.push(() => jsonResponse(reply()));
  await (await send('Explain topic sentences')).json();
  assert.deepEqual(world.leaseEvents, ['acquire', 'release']);
});

Deno.test(
  'memory: a learner-stated fact is saved and never leaks into the saved reply',
  async () => {
    reset();
    fetchQueue.push(() =>
      jsonResponse(reply({ memory: ['Sitting UKVI Academic', 'Scored band 6.5 last month'] }))
    );
    await (await send('I am sitting UKVI. How do I plan Task 2?')).json();
    assert.deepEqual(
      (world.memory || []).map((item: any) => item.text),
      ['Sitting UKVI Academic'],
      'the score-bearing note is dropped'
    );
    assert.equal('memory' in finishCalls()[0].args.p_response, false);
  }
);

Deno.test('memory: saved facts are replayed to the model as untrusted learner memory', async () => {
  reset();
  world.memory = [{ text: 'Prefers examples in Bangla', savedAt: new Date().toISOString() }];
  fetchQueue.push(() => jsonResponse(reply()));
  await (await send('Explain linking words')).json();
  const prompt = JSON.parse(fetchBodies[0].messages[1].content);
  assert.deepEqual(prompt.learnerMemory, ['Prefers examples in Bangla']);
});

Deno.test('memory: a stored fact that has expired is not replayed', async () => {
  reset();
  world.memory = [{ text: 'Old fact', savedAt: '2025-01-01T00:00:00.000Z' }];
  fetchQueue.push(() => jsonResponse(reply()));
  await (await send('Explain linking words')).json();
  assert.deepEqual(JSON.parse(fetchBodies[0].messages[1].content).learnerMemory, []);
});

Deno.test(
  'prompt layout: stable context first, the new message last, system prompt shared',
  async () => {
    reset();
    fetchQueue.push(
      () => jsonResponse(reply()),
      () => jsonResponse(reply())
    );
    await (await send('Explain linking words')).json();
    await (await send('ami linking words ta bujhiye den')).json();
    const keys = Object.keys(JSON.parse(fetchBodies[0].messages[1].content));
    assert.equal(keys[0], 'studentEvidence');
    assert.equal(keys.at(-1), 'studentMessage');
    assert.ok(keys.indexOf('eligibleActions') < keys.indexOf('recentConversation'));
    const [englishSystem, banglaSystem] = fetchBodies.map(
      (body) => body.messages[0].content as string
    );
    const head = (text: string) => text.split('\n').slice(0, -1).join('\n');
    assert.equal(head(englishSystem), head(banglaSystem), 'the cacheable prefix is identical');
    assert.match(banglaSystem, /Reply in Bangla/);
  }
);

Deno.test(
  'Banglish is answered in Bangla; a canned English draft follows the saved language',
  async () => {
    reset();
    fetchQueue.push(() => jsonResponse(reply({ responseLanguage: 'bn' })));
    await (await send('Writing task 2 te ki likhbo bujhi na')).json();
    assert.equal(reserveCall().args.p_language, 'bn');

    reset();
    world.preferredLanguage = 'bn';
    fetchQueue.push(() => jsonResponse(reply({ responseLanguage: 'bn' })));
    await (
      await send('What should I practise in my next 15 minutes?', {
        languageHint: 'preference',
        preferredLanguage: 'bn',
      })
    ).json();
    assert.equal(reserveCall().args.p_language, 'bn', 'an English chip still gets a Bangla reply');

    reset();
    world.preferredLanguage = 'bn';
    fetchQueue.push(() => jsonResponse(reply({ responseLanguage: 'en' })));
    await (await send('How do I improve my vocabulary?', { preferredLanguage: 'bn' })).json();
    assert.equal(reserveCall().args.p_language, 'en', 'typed English without a hint is detected');
  }
);

const readingSession = () => ({
  id: SESSION_ID,
  test_type: 'reading',
  test_mode: 'practice',
  score: 6.5,
  is_completed: true,
  passage_id: 'passage-1',
  actual_duration_seconds: 2400,
  content_data: {
    totalQuestions: 4,
    correctAnswers: 2,
    typeStats: { true_false_not_given: { correct: 0, total: 2 } },
    responseDetails: [
      {
        questionNumber: 1,
        type: 'multiple_choice',
        userAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
      },
      {
        questionNumber: 2,
        type: 'multiple_choice',
        userAnswer: 'C',
        correctAnswer: 'C',
        isCorrect: true,
      },
      {
        questionNumber: 3,
        type: 'true_false_not_given',
        userAnswer: 'TRUE',
        correctAnswer: 'NOT GIVEN',
        isCorrect: false,
      },
      {
        questionNumber: 4,
        type: 'true_false_not_given',
        userAnswer: 'FALSE',
        correctAnswer: 'TRUE',
        isCorrect: false,
      },
    ],
    passageTimes: Array.from({ length: 300 }, (_, index) => index),
  },
});
const answerKey = () => [
  {
    question_number: 3,
    question_count: 2,
    question_text: 'Do the statements agree with the passage?',
    type: 'true_false_not_given',
    explanation_data: {
      blanks: {
        '3': {
          why_correct: 'Funding is never mentioned, so NOT GIVEN.',
          trap: 'Assuming a funder.',
        },
        '4': { why_correct: 'Paragraph D says the opposite.' },
      },
    },
  },
];

Deno.test(
  'source: the model receives a structured digest with the answer-key explanation, not raw JSON',
  async () => {
    reset();
    world.sourceSession = readingSession();
    world.questions = answerKey();
    fetchQueue.push(() =>
      jsonResponse(
        reply({
          groundingStatus: 'supported',
          evidenceRefs: [{ id: `source:${SESSION_ID}`, claim: 'x' }],
          answer: 'Question 3 is NOT GIVEN. Funding is never mentioned in the passage.',
        })
      )
    );
    const response = await send('Explain question 3 and what I should learn from my answer.', {
      sourceReference: { type: 'test_session', id: SESSION_ID, questionNumber: 3 },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.match(body.answer, /NOT GIVEN/);
    const sent = JSON.parse(fetchBodies[0].messages[1].content);
    assert.equal(sent.source.digest.focusQuestion.number, 3);
    assert.match(sent.source.digest.focusQuestion.whyCorrect, /never mentioned/);
    assert.equal(sent.source.excerpt, undefined);
    assert.ok(!JSON.stringify(sent).includes('passageTimes'));
    const questionRead = world.calls.find((call) => call.name === 'questions')!;
    assert.deepEqual(questionRead.ops.find(([op]) => op === 'eq')!.slice(1), [
      'passage_id',
      'passage-1',
    ]);
  }
);

Deno.test(
  'source: a personal answer may quote question numbers and answers from the digest',
  async () => {
    reset();
    world.sourceSession = readingSession();
    world.questions = answerKey();
    fetchQueue.push(() =>
      jsonResponse(
        reply({
          groundingStatus: 'supported',
          evidenceRefs: [{ id: `source:${SESSION_ID}`, claim: 'x' }],
          answer:
            'In your latest result you wrote TRUE for question 3, but the answer is NOT GIVEN.',
        })
      )
    );
    const response = await send('Explain my latest result.', {
      sourceReference: { type: 'test_session', id: SESSION_ID },
    });
    assert.equal(response.status, 200, 'question number 3 is present in the cited digest');
    assert.equal(fetchBodies.length, 1);
  }
);

Deno.test(
  'source: an unfinished Exam-mode result is refused and no provider is called',
  async () => {
    reset();
    world.sourceSession = { ...readingSession(), is_completed: false, test_mode: 'exam' };
    const response = await send('Explain question 3', {
      sourceReference: { type: 'test_session', id: SESSION_ID },
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /unfinished Exam-mode/);
    assert.equal(fetchBodies.length, 0);
  }
);

Deno.test(
  'source_preview returns a deterministic summary with no provider call and no reply spent',
  async () => {
    reset();
    world.sourceSession = readingSession();
    world.questions = answerKey();
    const response = await post({ operation: 'source_preview', sessionId: SESSION_ID });
    assert.equal(response.status, 200);
    const { preview } = await response.json();
    assert.equal(preview.title, 'Reading result');
    assert.ok(preview.facts.some((fact: any) => fact.label === 'Correct' && fact.value === '2/4'));
    assert.equal(preview.suggestions[0].questionNumber, 3);
    assert.equal(fetchBodies.length, 0);
    assert.equal(
      world.calls.some((call) => call.name === 'ai_coach_reserve'),
      false
    );
    assert.equal(world.leaseEvents.length, 0, 'read-only operations take no AI lease');
  }
);

Deno.test('chat drills show up as a tentative signal and memory forgets on request', async () => {
  reset();
  world.practice = {
    total: 4,
    correct: 3,
    missedPrompts: ['Choose the correct article.'],
    lastAt: '2026-10-22T00:00:00Z',
  };
  fetchQueue.push(() => jsonResponse(reply()));
  await (await send('Give me a quick drill')).json();
  const sent = JSON.parse(fetchBodies[0].messages[1].content);
  const drill = sent.studentEvidence.find((item: any) => item.id === 'coach:practice');
  assert.equal(drill.confidence, 'tentative');
  assert.deepEqual(drill.value.missedPrompts, ['Choose the correct article.']);

  world.memory = [
    { text: 'one', savedAt: new Date().toISOString() },
    { text: 'two', savedAt: new Date().toISOString() },
  ];
  const forgotten = await (await post({ operation: 'memory_forget', index: 0 })).json();
  assert.deepEqual(forgotten.memory, ['two']);
  const cleared = await (await post({ operation: 'memory_forget', all: true })).json();
  assert.deepEqual(cleared.memory, []);
});

Deno.test('a missing migration (memory table / practice RPC) never blocks a reply', async () => {
  reset();
  const original = (globalThis as any).__fakeSupabase;
  (globalThis as any).__fakeSupabase = () => {
    const client = original();
    const from = client.from;
    const rpc = client.rpc;
    client.from = (name: string) =>
      name === 'ai_coach_memory'
        ? {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.reject(new Error('relation does not exist')),
              }),
            }),
            upsert: () => Promise.reject(new Error('no table')),
          }
        : from(name);
    client.rpc = (name: string, args: unknown) =>
      name === 'ai_coach_practice_summary'
        ? Promise.reject(new Error('function does not exist'))
        : rpc(name, args);
    return client;
  };
  try {
    fetchQueue.push(() => jsonResponse(reply({ memory: ['Sitting UKVI'] })));
    const response = await send('Explain linking words');
    assert.equal(response.status, 200);
    assert.match((await response.json()).answer, /clear position/);
  } finally {
    (globalThis as any).__fakeSupabase = original;
  }
});
