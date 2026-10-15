import { describe, expect, it, vi } from 'vitest';
import {
  generateAiReadingDraft,
  AiReadingGenerationError,
} from '../../../supabase/functions/_shared/aiReadingProvider';
import { validateAiReadingInput } from '../../../supabase/functions/_shared/aiReadingInput';
import { createAiReadingHandler } from '../../../supabase/functions/admin-reading-draft/handler';
import { aiReadingFixture, aiReadingInput } from '../helpers/aiReadingFixture';

const draftInput = () => {
  const input = validateAiReadingInput(aiReadingInput());
  if (!('sectionCounts' in input)) throw new Error('Expected a Reading draft input.');
  return input;
};

const response = (draft = aiReadingFixture()) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(draft) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300, cost: 0.002 },
    }),
    { status: 200 }
  );
describe('cheap Reading model route', () => {
  it('uses Luna first with a bounded budget and keeps screenshots attached to their roles', async () => {
    const fetcher = vi.fn().mockImplementation((url, options) => {
      new Request(url, options);
      return Promise.resolve(response());
    });
    const input = {
      ...draftInput(),
      images: [{ role: 'questions', dataUrl: 'data:image/jpeg;base64,/9j/AAAA' }],
    };
    const result = await generateAiReadingDraft(input, 'test-secret', fetcher);
    const sent = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(sent.model).toBe('openai/gpt-6-luna');
    expect(sent.max_tokens).toBe(28000);
    expect(sent.messages[1].content.at(-1).image_url.url).toBe(input.images[0].dataUrl);
    expect(result.usage.estimatedProviderCostUsd).toBe(0.002);
    expect(result.fallbackUsed).toBe(false);
  });
  it('falls back once to GLM and accounts for rejected output', async () => {
    const invalid = aiReadingFixture();
    invalid.sections[0].groups[0].items[0].answer = 'FALSE';
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(invalid))
      .mockResolvedValueOnce(response());
    const result = await generateAiReadingDraft(draftInput(), 'secret', fetcher);
    expect(JSON.parse(fetcher.mock.calls[1][1].body).model).toBe('z-ai/glm-5.3-flash');
    expect(JSON.parse(fetcher.mock.calls[1][1].body).reasoning.effort).toBe('low');
    expect(result.fallbackUsed).toBe(true);
    expect(result.usage.tokensUsed).toBe(600);
    expect(result.usage.estimatedProviderCostUsd).toBe(0.004);
  });
  it('rejects two bad responses without more paid retries', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}'));
    await expect(generateAiReadingDraft(draftInput(), 'secret', fetcher)).rejects.toBeInstanceOf(
      AiReadingGenerationError
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('keeps the first failure visible and redacts a key echoed by a provider', async () => {
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Response(JSON.stringify({ error: { message: 'Rejected test-secret parameter' } }), {
          status: 400,
        })
    );
    await expect(generateAiReadingDraft(draftInput(), 'test-secret', fetcher)).rejects.toThrow(
      'openai/gpt-6-luna: Provider returned HTTP 400: Rejected [redacted] parameter; z-ai/glm-5.3-flash:'
    );
  });
});

describe('admin Reading generation boundary', () => {
  const setup = (admin: any = { authId: 'admin' }) => {
    const generate = vi.fn().mockResolvedValue({
      draft: aiReadingFixture(),
      usage: { tokensUsed: 300, estimatedProviderCostUsd: 0.002 },
    });
    const recordUsage = vi.fn().mockResolvedValue(true);
    const authenticate = vi.fn().mockResolvedValue(admin);
    const admit = vi.fn().mockReturnValue(true);
    return {
      generate,
      recordUsage,
      authenticate,
      admit,
      handler: createAiReadingHandler({
        headers: () => ({}),
        authenticate,
        admit,
        generate,
        recordUsage,
      }),
    };
  };
  const request = (body: any = aiReadingInput(), token = 'admin-token') =>
    new Request('https://example.test', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(body),
    });
  it('rejects unsigned and non-admin requests before reading sources or spending tokens', async () => {
    const unsigned = setup();
    expect((await unsigned.handler(request({}, ''))).status).toBe(401);
    expect(unsigned.authenticate).not.toHaveBeenCalled();
    const learner = setup(null);
    expect((await learner.handler(request())).status).toBe(403);
    expect(learner.generate).not.toHaveBeenCalled();
  });
  it('rejects incomplete inputs and burst-limited requests before generation', async () => {
    const state = setup();
    expect((await state.handler(request({}))).status).toBe(400);
    expect(state.generate).not.toHaveBeenCalled();
    state.admit.mockReturnValue(false);
    expect((await state.handler(request())).status).toBe(429);
    expect(state.generate).not.toHaveBeenCalled();
  });
  it('returns only a preview and records usage without any test-saving dependency', async () => {
    const state = setup();
    const result = await state.handler(request());
    expect(result.status).toBe(200);
    expect((await result.json()).draft.title).toBe('Garden Reading');
    expect(state.recordUsage).toHaveBeenCalledWith(
      'admin',
      expect.objectContaining({ tokensUsed: 300 })
    );
    expect(result.headers.get('Cache-Control')).toBe('no-store');
  });
  it('prevents a concurrent duplicate import and releases the lock after failure', async () => {
    const state = setup();
    let reject!: (error: Error) => void;
    state.generate.mockImplementationOnce(
      () =>
        new Promise((_resolve, rejectPromise) => {
          reject = rejectPromise;
        })
    );
    const first = state.handler(request());
    await vi.waitFor(() => expect(state.generate).toHaveBeenCalledTimes(1));
    expect((await state.handler(request())).status).toBe(409);
    reject(new Error('failure'));
    expect((await first).status).toBe(503);
    expect((await state.handler(request())).status).toBe(200);
  });
});
