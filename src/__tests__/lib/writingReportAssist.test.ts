import { describe, expect, it, vi } from 'vitest';
import {
  TRANSLATE_MAX_OUTPUT_TOKENS,
  createReportGenerator,
  handleReportAssist,
} from '../../../supabase/functions/_shared/writingReportAssist';
import { AI_ROUTES, MODELS } from '../../../supabase/functions/_shared/aiModelRegistry';

const SESSION = '3f0c1c52-8f1e-4c7a-9c55-0d9d6c1a2b3c';

const paragraph = (lead: string) =>
  `${lead}, free education give more people the chance to study and tuition fees are a heavy burden for many poor families, so the country loses talented workers because they cannot go to university.`;

const essay = [
  'Some people believe university should be free for every student while others think students should pay for it. In my opinion governments should pay because it helps the whole society.',
  paragraph('Firstly'),
  paragraph('Secondly'),
  'In conclusion I strongly believe university should be free because it pays for itself over time and gives everyone an equal chance to succeed in their life.',
]
  .map((p) => `<p>${p}</p>`)
  .join('');

const feedback = {
  taskType: 'Task 2',
  taskPrompt: 'Should university be free?',
  originalSource: essay,
  summary: 'Your position is clear, but grammar limits the score.',
  priorities: [
    { criterion: 'Grammar', issue: 'Agreement errors recur.', action: 'Check each verb.' },
  ],
  annotations: [],
  strengths: ['A clear position is kept throughout.'],
};

const savedRow = (session: Record<string, unknown> | null) =>
  session && {
    id: SESSION,
    user_id: 'user-1',
    test_type: 'writing',
    content_data: { ai_feedbacks: { 'Task 2': feedback } },
    user_responses: [],
    ...session,
  };

type Row = Record<string, any>;

/** What each table the function may read returns for the given filters. */
function readableTables({
  row,
  cache,
  ledger,
}: {
  row: Row | null;
  cache: Map<string, any>;
  ledger: Map<string, any>;
}): Record<string, (filters: Row) => unknown> {
  return {
    users: (f: Row) => (f.auth_id === 'auth-1' ? { id: 'user-1' } : null),
    test_sessions: (f: Row) => (row && f.id === row.id && f.user_id === row.user_id ? row : null),
    ai_feedback_cache: (f: Row) => cache.get(f.input_hash as string) ?? null,
    ai_api_usage: (f: Row) => ledger.get(f['request_metadata->>idempotencyKey'] as string) ?? null,
  };
}

function fakeDb({ session = {} as Record<string, unknown> | null } = {}) {
  const cache = new Map<string, any>();
  const ledger = new Map<string, any>();
  const row = savedRow(session);
  const rows = readableTables({ row, cache, ledger });
  return {
    cache,
    ledger,
    tables: [] as string[],
    from(table: string) {
      // ai_api_usage feeds learner quotas: only the quota functions may write it.
      if (!rows[table]) throw new Error(`unexpected table ${table}`);
      this.tables.push(table);
      const filters: Record<string, unknown> = {};
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters[column] = value;
          return query;
        },
        maybeSingle: async () => ({ data: rows[table](filters), error: null }),
        upsert: async (value: any) => {
          if (table !== 'ai_feedback_cache') throw new Error('unexpected write');
          cache.set(value.input_hash, value);
          return { error: null };
        },
      };
      return query;
    },
  };
}

const translation = (request: any) => {
  const { items } = JSON.parse(request.prompt);
  return {
    items: Object.fromEntries(Object.keys(items).map((key) => [key, `বাংলা অনুবাদ ${key}`])),
  };
};

const bandModel = (request: any) => ({
  paragraphs: JSON.parse(request.prompt).paragraphs.map(({ index }: any) => ({
    index,
    model:
      'To begin with, free education gives far more people the opportunity to study. Tuition fees place a heavy burden on poor families, so capable people never reach university and the country loses talent.',
    notes: [
      {
        criterion: 'coherence',
        phrase: 'To begin with',
        why: 'It signals the first argument clearly.',
      },
      {
        criterion: 'vocabulary',
        phrase: 'place a heavy burden on',
        why: 'This is a precise collocation here.',
      },
    ],
  })),
});

function setup(
  options: Parameters<typeof fakeDb>[0] = {},
  replies: Array<(request: any) => unknown> = [translation]
) {
  const db = fakeDb(options);
  let call = 0;
  const generate = vi.fn(async (request: any) => {
    const reply = replies[Math.min(call++, replies.length - 1)](request);
    if (!request.validate(reply)) throw new Error('invalid reply');
    return {
      parsed: reply,
      model: 'openai/gpt-6-luna',
      provider: 'openrouter-luna',
      usage: { tokensUsed: 900, estimatedProviderCostUsd: 0.0003 },
    };
  });
  const deps = { db, allow: vi.fn(async () => true), generate, credits: fakeCredits(db) };
  const ask = (body: Record<string, unknown>, authId = 'auth-1') =>
    handleReportAssist(body, { id: authId }, deps as any);
  return { db, deps, ask };
}

const translate = {
  sessionId: SESSION,
  taskType: 'Task 2',
  operation: 'translate',
  language: 'bn',
  useCredit: true,
};
const model = { sessionId: SESSION, taskType: 'Task 2', operation: 'model', band: 7 };

describe('writing-report-assist: who may ask and for what', () => {
  it.each([
    ['a session id that is not a UUID', { ...translate, sessionId: 'abc' }],
    ['an unknown task', { ...translate, taskType: 'Task 3' }],
    ['an unknown operation', { ...translate, operation: 'summarise' }],
    ['a language that is not offered', { ...translate, language: 'de' }],
    ['translating into English', { ...translate, language: 'en' }],
    ['a band other than 7 or 8', { ...model, band: 9 }],
    ['no body', null],
  ])('rejects %s', async (_, body) => {
    const { deps, ask } = setup();
    expect((await ask(body as never)).status).toBe(400);
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('only reads a report that belongs to the signed-in learner', async () => {
    const { deps, ask } = setup({ session: { user_id: 'someone-else' } });
    expect((await ask(translate)).status).toBe(404);
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('refuses an account without a profile', async () => {
    const { ask } = setup();
    expect((await ask(translate, 'auth-unknown')).status).toBe(403);
  });

  it('answers 404 when that task has no saved feedback', async () => {
    const { ask } = setup();
    expect((await ask({ ...translate, taskType: 'Task 1' })).status).toBe(404);
  });
});

describe('writing-report-assist: translating the explanations', () => {
  it('sends only the explanation text, never the essay, and returns it keyed by field', async () => {
    const { deps, ask } = setup();
    const result = await ask(translate);

    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({
      operation: 'translate',
      language: 'bn',
      cached: false,
    });
    expect(result.body.data.translations.summary).toBe('বাংলা অনুবাদ t0');
    expect(Object.keys(result.body.data.translations)).toEqual([
      'summary',
      'priorities.0.issue',
      'priorities.0.action',
      'strengths.0',
    ]);
    const sent = deps.generate.mock.calls[0][0];
    expect(sent.prompt).not.toContain('university');
    expect(sent.systemPrompt).toContain('Bengali (Bangla)');
  });

  it('names the target language beside the text, so the model cannot just echo the English', async () => {
    const { deps, ask } = setup();
    await ask(translate);

    const sent = deps.generate.mock.calls[0][0];
    expect(JSON.parse(sent.prompt).targetLanguage).toBe('Bengali (Bangla)');
    expect(sent.systemPrompt).toMatch(/never return a value in English/i);
  });

  it('gives the fallback model the exact shape to answer in, so its JSON stays valid', async () => {
    const { deps, ask } = setup();
    await ask(translate);

    expect(deps.generate.mock.calls[0][0].responseSchema).toEqual({
      type: 'OBJECT',
      properties: {
        items: {
          type: 'OBJECT',
          properties: Object.fromEntries(
            ['t0', 't1', 't2', 't3'].map((key) => [key, { type: 'STRING' }])
          ),
          required: ['t0', 't1', 't2', 't3'],
        },
      },
      required: ['items'],
    });
  });

  it('keeps quoted essay words in English by never showing them to the translator', async () => {
    const quoted = {
      ...feedback,
      summary: 'Change "give more people" so the verb agrees with its subject.',
    };
    const { deps, ask } = setup(
      {
        session: { content_data: { ai_feedbacks: { 'Task 2': quoted } } },
      },
      [
        (request: any) => ({
          items: Object.fromEntries(
            Object.entries(JSON.parse(request.prompt).items as Record<string, string>).map(
              ([key, text]) => [
                key,
                `বাংলা অনুবাদ ${(text.match(/\[\[Q\d+\]\]/g) || []).join(' ')}`,
              ]
            )
          ),
        }),
      ]
    );

    const result = await ask(translate);

    expect(deps.generate.mock.calls[0][0].prompt).not.toContain('give more people');
    expect(result.body.data.translations.summary).toBe('বাংলা অনুবাদ "give more people"');
  });

  it('keeps the model and cost with the cached result and never writes usage rows itself', async () => {
    const { db, ask } = setup();
    await ask(translate);

    const [saved] = [...db.cache.values()];
    expect(saved.feedback_json.meta).toEqual({
      model: 'openai/gpt-6-luna',
      provider: 'openrouter-luna',
      tokensUsed: 900,
      costUsd: 0.0003,
    });
    expect(new Date(saved.expires_at).getTime()).toBeGreaterThan(Date.now() + 90 * 86_400_000);
    // Only the quota functions write usage; the fake rejects any other write.
    expect(db.ledger.size).toBe(1);
  });

  it('serves the saved translation again without a model call or a rate-limit hit', async () => {
    const { deps, ask } = setup();
    await ask(translate);
    deps.allow.mockClear();

    const again = await ask(translate);

    expect(again.body.data.cached).toBe(true);
    expect(again.body.data.translations.summary).toBe('বাংলা অনুবাদ t0');
    expect(deps.generate).toHaveBeenCalledTimes(1);
    expect(deps.allow).not.toHaveBeenCalled();
  });

  it('keeps one cache entry per language', async () => {
    const { db, ask } = setup();
    await ask(translate);
    const hindi = setup({}, [
      (request: any) => ({
        items: Object.fromEntries(
          Object.keys(JSON.parse(request.prompt).items).map((k) => [k, 'हिन्दी अनुवाद है'])
        ),
      }),
    ]);
    await hindi.ask({ ...translate, language: 'hi' });
    expect([...db.cache.keys()][0]).not.toBe([...hindi.db.cache.keys()][0]);
    expect([...db.cache.keys()][0]).toMatch(/^wra:/);
  });

  it('limits new translations per learner and across all learners', async () => {
    const { deps, ask } = setup();
    deps.allow.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await ask(translate);

    expect(result.status).toBe(429);
    expect(deps.allow.mock.calls.map((c: unknown[]) => c[0])).toEqual([
      'wra:gen:auth-1',
      'wra:gen:all',
    ]);
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('refuses a reply that left most fields untranslated and caches nothing', async () => {
    const { db, deps, ask } = setup({}, [
      (request: any) => ({ items: JSON.parse(request.prompt).items }),
    ]);

    const result = await ask(translate);

    expect(result.status).toBe(502);
    expect(result.body.code).toBe('provider_failed');
    expect(db.cache.size).toBe(0);
    expect(deps.generate).toHaveBeenCalledTimes(1);
  });
});

describe('writing-report-assist: Band 7 and 8 paragraphs', () => {
  it('rewrites the body paragraphs and returns English notes for an English reader', async () => {
    const { deps, ask } = setup({}, [bandModel]);
    const result = await ask({ ...model, language: 'en' });

    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({ operation: 'model', band: 7, notesTranslated: false });
    expect(result.body.data.paragraphs.map((p: any) => p.index)).toEqual([1, 2]);
    expect(result.body.data.paragraphs[0].notes[0]).toMatchObject({
      n: 1,
      phrase: 'To begin with',
    });
    expect(deps.generate).toHaveBeenCalledTimes(1);
  });

  it('translates only the notes for another language and keeps the paragraph in English', async () => {
    const { deps, ask } = setup({}, [bandModel, translation]);
    const result = await ask({ ...model, language: 'bn' });

    const [first] = result.body.data.paragraphs;
    expect(result.body.data.notesTranslated).toBe(true);
    expect(first.model).toMatch(/^To begin with/);
    expect(first.notes[0].phrase).toBe('To begin with');
    expect(first.notes[0].why).toMatch(/^বাংলা/);
    expect(deps.generate).toHaveBeenCalledTimes(2);
  });

  it('still shows the paragraphs in English if translating the notes fails', async () => {
    const { ask } = setup({}, [
      bandModel,
      () => {
        throw new Error('provider down');
      },
    ]);
    const result = await ask({ ...model, language: 'bn' });

    expect(result.status).toBe(200);
    expect(result.body.data.notesTranslated).toBe(false);
    expect(result.body.data.paragraphs[0].notes[0].why).toBe(
      'It signals the first argument clearly.'
    );
  });

  it('writes the English paragraphs once and reuses them for every language', async () => {
    const { deps, ask } = setup({}, [bandModel, translation]);
    await ask({ ...model, language: 'en' });
    const second = await ask({ ...model, language: 'bn' });

    expect(second.body.data.paragraphs[0].model).toMatch(/^To begin with/);
    expect(deps.generate).toHaveBeenCalledTimes(2);
  });

  it('gives the fallback model the exact paragraph shape to answer in', async () => {
    const { deps, ask } = setup({}, [bandModel]);
    await ask({ ...model, language: 'en' });

    const schema = deps.generate.mock.calls[0][0].responseSchema as any;
    const paragraphSchema = schema.properties.paragraphs.items;
    expect(paragraphSchema.required).toEqual(['index', 'model', 'notes']);
    expect(paragraphSchema.properties.notes.items.properties.criterion.enum).toEqual([
      'task',
      'coherence',
      'vocabulary',
      'grammar',
    ]);
  });

  it('asks for the requested band', async () => {
    const { deps, ask } = setup({}, [bandModel]);
    await ask({ ...model, band: 8, language: 'en' });
    expect(deps.generate.mock.calls[0][0].systemPrompt).toContain('Band 8');
  });

  it('explains when the essay has no paragraph that can be compared', async () => {
    const block = `<p>${paragraph('Firstly').repeat(10)}</p>`;
    const { deps, ask } = setup({
      session: {
        content_data: { ai_feedbacks: { 'Task 2': { ...feedback, originalSource: block } } },
      },
    });
    const result = await ask(model);

    expect(result.status).toBe(422);
    expect(result.body.code).toBe('no_comparable_paragraph');
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('reads the saved answer when an older report did not keep the essay', async () => {
    const older = { ...feedback, originalSource: undefined };
    const { ask } = setup(
      {
        session: {
          content_data: { ai_feedbacks: { 'Task 2': older } },
          user_responses: [{ task2_response: essay }],
        },
      },
      [bandModel]
    );
    expect((await ask(model)).status).toBe(200);
  });
});

describe('writing-report-assist: the model chain', () => {
  const reply = (provider: 'openrouter' | 'gemini', content: unknown) =>
    new Response(
      JSON.stringify(
        provider === 'gemini'
          ? {
              candidates: [{ content: { parts: [{ text: JSON.stringify(content) }] } }],
              usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
            }
          : {
              choices: [{ message: { content: JSON.stringify(content) } }],
              usage: { prompt_tokens: 100, completion_tokens: 50, cost: 0.0002 },
            }
      ),
      { status: 200 }
    );

  const request = {
    systemPrompt: 'translate',
    prompt: '{}',
    maxOutputTokens: 100,
    validate: (value: any) => value?.ok === true,
  };

  it('uses GPT-6 Luna first', async () => {
    const fetchImpl = vi.fn(async () => reply('openrouter', { ok: true }));
    const generate = createReportGenerator({ openRouterKey: 'o', geminiKey: 'g', fetchImpl });

    const result = await generate(request);

    expect(result.provider).toBe('openrouter-luna');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls back to Gemini when Luna’s reply is unusable and counts both costs', async () => {
    const fetchImpl = vi.fn(async (url: any) =>
      String(url).includes('openrouter')
        ? reply('openrouter', { ok: false })
        : reply('gemini', { ok: true })
    );
    const generate = createReportGenerator({ openRouterKey: 'o', geminiKey: 'g', fetchImpl });

    const result = await generate(request);

    expect(result.provider).toBe('gemini');
    expect(result.model).toBe('gemini-2.5-flash-lite');
    expect(result.usage.estimatedProviderCostUsd).toBeGreaterThan(0.0002);
  });

  it('passes the reply schema to Gemini', async () => {
    const bodies: any[] = [];
    const fetchImpl = vi.fn(async (_url: any, init: any) => {
      bodies.push(JSON.parse(init.body));
      return reply('gemini', { ok: true });
    });
    const responseSchema = { type: 'OBJECT', properties: { ok: { type: 'BOOLEAN' } } };

    await createReportGenerator({ geminiKey: 'g', fetchImpl })({ ...request, responseSchema });

    expect(bodies[0].generationConfig.responseSchema).toEqual(responseSchema);
  });

  it('retries the last model once, more strictly, when its reply is broken JSON', async () => {
    const bodies: any[] = [];
    const fetchImpl = vi.fn(async (_url: any, init: any) => {
      bodies.push(JSON.parse(init.body));
      return bodies.length === 1
        ? new Response(
            JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok": tru' }] } }] }),
            { status: 200 }
          )
        : reply('gemini', { ok: true });
    });

    const result = await createReportGenerator({ geminiKey: 'g', fetchImpl })(request);

    expect(result.parsed).toEqual({ ok: true });
    expect(bodies.map((body) => body.generationConfig.temperature)).toEqual([0.3, 0]);
  });

  it('does not retry when the provider itself is failing', async () => {
    const fetchImpl = vi.fn(async () => new Response('busy', { status: 503 }));

    await expect(createReportGenerator({ geminiKey: 'g', fetchImpl })(request)).rejects.toThrow(
      /503/
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails when no provider is configured', async () => {
    await expect(createReportGenerator({})(request)).rejects.toThrow(/not configured/i);
  });
});

describe('writing-report-assist in the model registry', () => {
  it('lists the models and output budget the function really uses', () => {
    const route = AI_ROUTES.find((entry) => entry.id === 'writing-report-assist');
    expect(route?.steps.map((step) => [step.role, step.model])).toEqual([
      ['primary', 'openai/gpt-6-luna'],
      ['fallback', 'gemini-2.5-flash-lite'],
      ['repair', 'gemini-2.5-flash-lite'],
    ]);
    expect(route?.maxOutputTokens).toBe(TRANSLATE_MAX_OUTPUT_TOKENS);
    for (const step of route?.steps ?? []) expect(MODELS).toHaveProperty([step.model]);
  });
});

describe('Band 7 and Band 8 instructions', () => {
  const promptFor = async (band: number) => {
    const generate = vi.fn(async (request: any) => {
      const parsed = bandModel(request);
      request.validate(parsed);
      return {
        parsed,
        model: 'test-model',
        provider: 'test',
        usage: { tokensUsed: 1, estimatedProviderCostUsd: 0 },
      };
    });
    await handleReportAssist(
      { sessionId: SESSION, taskType: 'Task 2', operation: 'model', band },
      { id: 'auth-1' },
      { db: fakeDb(), allow: async () => true, generate } as any
    );
    return String(generate.mock.calls[0][0].systemPrompt);
  };

  it('describes each band with its own concrete traits', async () => {
    const [seven, eight] = [await promptFor(7), await promptFor(8)];
    expect(seven).toContain('plain linking');
    expect(seven).not.toContain('cause, result and wider effect');
    expect(eight).toContain('cause, result and wider effect');
    expect(eight).toContain('refer back');
    expect(eight).not.toContain('plain linking');
  });

  it.each([7, 8])('bans stiff openers and empty emphasis at Band %i', async (band) => {
    const prompt = await promptFor(band);
    for (const word of ['Primarily', 'Moreover', 'Furthermore', 'undoubtedly', 'invariably'])
      expect(prompt).toContain(word);
    expect(prompt).toContain('Never use');
  });
});

/** Behaves like reserve/finalize_ai_api_usage over the fake ledger. */
function fakeCredits(db: ReturnType<typeof fakeDb>, { allowed = true } = {}) {
  const spent: string[] = [];
  return {
    spent,
    charged: () =>
      [...db.ledger.values()].filter(
        (row) => row.request_metadata.reservationStatus === 'completed'
      ).length,
    reserve: vi.fn(async (_authId: string, key: string) => {
      if (!allowed) return { allowed: false };
      spent.push(key);
      db.ledger.set(key, { id: key, request_metadata: { reservationStatus: 'reserved' } });
      return { allowed: true, reservationId: key, alreadyReserved: false };
    }),
    finalize: vi.fn(async (id: string, ok: boolean) => {
      db.ledger.get(id).request_metadata.reservationStatus = ok ? 'completed' : 'failed';
    }),
  };
}

const answering = (reply: (request: any) => any) =>
  vi.fn(async (request: any) => {
    const parsed = reply(request);
    if (!request.validate(parsed)) throw new Error('unusable');
    return {
      parsed,
      model: 'm',
      provider: 'p',
      usage: { tokensUsed: 9, estimatedProviderCostUsd: 0.001 },
    };
  });

describe('a translation costs one writing task review', () => {
  const ask = (deps: any, extra: Record<string, unknown> = {}) =>
    handleReportAssist(
      { sessionId: SESSION, taskType: 'Task 2', operation: 'translate', language: 'bn', ...extra },
      { id: 'auth-1' },
      deps
    );
  const setup = (options = {}) => {
    const db = fakeDb();
    const credits = fakeCredits(db, options);
    const generate = answering(translation);
    return { db, credits, generate, deps: { db, allow: async () => true, generate, credits } };
  };

  it('asks first, and neither charges nor calls the AI until the learner agrees', async () => {
    const { deps, credits, generate } = setup();
    const reply = await ask(deps);
    expect([reply.status, reply.body.code]).toEqual([402, 'credit_required']);
    expect(credits.reserve).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it('charges once, then shows the same translation for free', async () => {
    const { deps, credits, generate } = setup();
    expect((await ask(deps, { useCredit: true })).status).toBe(200);
    expect((await ask(deps)).status).toBe(200);
    expect((await ask(deps, { useCredit: true })).status).toBe(200);
    expect(credits.reserve).toHaveBeenCalledTimes(1);
    expect(credits.charged()).toBe(1);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not give another learner a cached translation for free', async () => {
    const { deps, db } = setup();
    await ask(deps, { useCredit: true });
    db.ledger.clear();
    expect((await ask(deps)).body.code).toBe('credit_required');
  });

  it('charges each language separately', async () => {
    const { deps, credits } = setup();
    await ask(deps, { useCredit: true });
    expect((await ask(deps, { language: 'hi' })).body.code).toBe('credit_required');
    expect(credits.charged()).toBe(1);
  });

  it('says so when no review is left, without calling the AI', async () => {
    const { deps, generate } = setup({ allowed: false });
    const reply = await ask(deps, { useCredit: true });
    expect([reply.status, reply.body.code]).toEqual([429, 'no_credit']);
    expect(generate).not.toHaveBeenCalled();
  });

  it('gives the review back when the translation fails', async () => {
    const { deps, credits } = setup();
    deps.generate = vi.fn().mockRejectedValue(new Error('down'));
    expect((await ask(deps, { useCredit: true })).body.code).toBe('provider_failed');
    expect(credits.finalize).toHaveBeenCalledWith(expect.any(String), false, expect.anything());
    expect(credits.charged()).toBe(0);
  });

  it('refuses an oversized report before spending anything', async () => {
    const db = fakeDb({
      session: {
        content_data: {
          ai_feedbacks: {
            'Task 2': {
              ...feedback,
              strengths: Array.from(
                { length: 30 },
                (_, i) => `Clear point ${i} ` + 'x'.repeat(1_200)
              ),
            },
          },
        },
      },
    });
    const credits = fakeCredits(db as any);
    const reply = await ask(
      { db, allow: async () => true, generate: vi.fn(), credits },
      { useCredit: true }
    );
    expect(reply.status).toBe(400);
    expect(credits.reserve).not.toHaveBeenCalled();
  });
});

describe('only bands above the learner’s score', () => {
  const compare = async (overallBand: number, band: number) => {
    const db = fakeDb({
      session: { content_data: { ai_feedbacks: { 'Task 2': { ...feedback, overallBand } } } },
    });
    const reply = await handleReportAssist(
      { sessionId: SESSION, taskType: 'Task 2', operation: 'model', band },
      { id: 'auth-1' },
      {
        db,
        allow: async () => true,
        generate: answering(bandModel) as any,
        credits: fakeCredits(db as any),
      }
    );
    return reply.status;
  };

  it.each([
    [6, 7, 200],
    [6.5, 8, 200],
    [7, 7, 400],
    [7.5, 8, 200],
    [8, 7, 400],
    [8, 8, 400],
  ])('score %s asking for Band %i answers %i', async (score, band, status) => {
    expect(await compare(score, band)).toBe(status);
  });
});
