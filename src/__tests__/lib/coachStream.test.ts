import { describe, expect, it, vi } from 'vitest';

import {
  CoachAnswerStreamer,
  decodePartialJsonString,
  lastSentenceEnd,
} from '../../../supabase/functions/_shared/coachStream';
import {
  requestOpenRouterJsonStream,
  TextAiProviderError,
} from '../../../supabase/functions/_shared/textAiProvider';
import { readCoachStream } from '@/features/ai-coach/services/aiCoachService';

const encoder = new TextEncoder();

/** A fetch whose body arrives in the given chunks, like a real SSE response. */
function sseFetch(chunks: string[], init: ResponseInit = { status: 200 }) {
  return vi.fn(async () => {
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });
    return new Response(stream, init);
  }) as unknown as typeof fetch;
}

const sseEvent = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;
const delta = (content: string) =>
  sseEvent({ model: 'openai/gpt-oss-120b', choices: [{ delta: { content } }] });

describe('decodePartialJsonString', () => {
  it('decodes escapes and stops at the closing quote', () => {
    const raw = '{"answer":"Line one.\\nSay \\"hi\\" \\u00e9 done.","x":1}';
    const start = raw.indexOf('"answer":"') + '"answer":"'.length;
    expect(decodePartialJsonString(raw, start)).toEqual({
      text: 'Line one.\nSay "hi" é done.',
      closed: true,
    });
  });

  it('does not emit half an escape sequence', () => {
    expect(decodePartialJsonString('abc\\', 0)).toEqual({ text: 'abc', closed: false });
    expect(decodePartialJsonString('abc\\u00', 0)).toEqual({ text: 'abc', closed: false });
    expect(decodePartialJsonString('abc\\u00e9', 0).text).toBe('abcé');
  });
});

describe('lastSentenceEnd', () => {
  it('finds complete sentences and ignores decimals and unfinished text', () => {
    expect(lastSentenceEnd('Band 6.5 is good')).toBe(0);
    expect(lastSentenceEnd('Band 6.5 is good. Next')).toBe('Band 6.5 is good. '.length);
    expect(lastSentenceEnd('One. Two! Three? Four')).toBe('One. Two! Three? '.length);
    expect(lastSentenceEnd('আপনি ভালো করছেন। পরের')).toBe('আপনি ভালো করছেন। '.length);
    expect(lastSentenceEnd('这是一个句子。下一句')).toBe('这是一个句子。'.length);
  });
});

describe('CoachAnswerStreamer', () => {
  const evidenceById = new Map<string, unknown>([
    ['result:1', { category: 'completed_result', value: { score: 6.5 } }],
  ]);
  const run = (
    pieces: string[],
    context: { personalQuestion?: boolean; evidence?: Map<string, unknown> } = {}
  ) => {
    const segments: string[] = [];
    const streamer = new CoachAnswerStreamer(
      {
        language: 'en',
        evidenceById: context.evidence ?? evidenceById,
        personalQuestion: context.personalQuestion ?? false,
      },
      (segment) => segments.push(segment)
    );
    let raw = '';
    for (const piece of pieces) {
      raw += piece;
      streamer.push(raw);
    }
    return { segments, streamer };
  };
  const head = '{"responseLanguage":"en","groundingStatus":"general","evidenceRefs":[],"answer":"';

  it('releases only complete sentences, in order, and nothing twice', () => {
    const { segments, streamer } = run([
      head,
      'Start with a clear',
      ' position. Then add one',
      ' idea per paragraph. Fin',
      'ally conclude.","exercise":null}',
    ]);
    expect(segments).toEqual([
      'Start with a clear position. ',
      'Then add one idea per paragraph. ',
      'Finally conclude.',
    ]);
    expect(segments.join('')).toBe(
      'Start with a clear position. Then add one idea per paragraph. Finally conclude.'
    );
    expect(streamer.stopped).toBe(false);
  });

  it('stops for good when a sentence promises a band', () => {
    const { segments, streamer } = run([
      head,
      'Practise topic sentences daily. You will definitely reach band 7 soon. Keep going.","exercise":null}',
    ]);
    expect(segments).toEqual([]);
    expect(streamer.stopped).toBe(true);
  });

  it('releases the safe sentences before an unsafe one, then stops', () => {
    const { segments, streamer } = run([
      head,
      'Practise topic sentences daily. ',
      'You will definitely reach band 7 soon. ',
      'Keep going. ',
    ]);
    expect(segments).toEqual(['Practise topic sentences daily. ']);
    expect(streamer.stopped).toBe(true);
  });

  it('never streams when the answer key arrives before the grounding fields', () => {
    const { segments, streamer } = run([
      '{"answer":"Hello there. More.","groundingStatus":"general"}',
    ]);
    expect(segments).toEqual([]);
    expect(streamer.stopped).toBe(true);
  });

  it('never streams under an unknown evidence id', () => {
    const { segments } = run([
      '{"responseLanguage":"en","groundingStatus":"supported","evidenceRefs":[{"id":"made:up","claim":"x"}],"answer":"Your score is fine. Next."}',
    ]);
    expect(segments).toEqual([]);
  });

  it('never streams a reply in the wrong language', () => {
    const { segments } = run([
      '{"responseLanguage":"bn","groundingStatus":"general","evidenceRefs":[],"answer":"Hello there. More."}',
    ]);
    expect(segments).toEqual([]);
  });

  it('requires supported evidence before streaming a personal answer', () => {
    const personalHead = (status: string, refs: string) =>
      `{"responseLanguage":"en","groundingStatus":"${status}","evidenceRefs":${refs},"answer":"`;
    const unsupported = run([personalHead('general', '[]'), 'Your score is fine. Next.'], {
      personalQuestion: true,
    });
    expect(unsupported.segments).toEqual([]);
    const supported = run(
      [
        personalHead('supported', '[{"id":"result:1","claim":"c"}]'),
        'Your latest result is 6.5. Next.',
      ],
      { personalQuestion: true }
    );
    expect(supported.segments).toEqual(['Your latest result is 6.5. ']);
  });

  it('stops a personal answer that quotes a number the cited evidence does not contain', () => {
    const { segments, streamer } = run(
      [
        '{"responseLanguage":"en","groundingStatus":"supported","evidenceRefs":[{"id":"result:1","claim":"c"}],"answer":"Your latest result is 6.5. You scored 8.0 in Writing. Next."}',
      ],
      { personalQuestion: true }
    );
    expect(segments).toEqual([]);
    expect(streamer.stopped).toBe(true);
  });

  it('asks for the insufficient status when a personal question has no evidence at all', () => {
    const empty = new Map<string, unknown>();
    const ok = run(
      [
        '{"responseLanguage":"en","groundingStatus":"insufficient","evidenceRefs":[],"answer":"I do not have a completed result yet. Take a test first."}',
      ],
      { personalQuestion: true, evidence: empty }
    );
    expect(ok.segments.join('')).toContain('I do not have a completed result yet.');
    const invented = run(
      [
        '{"responseLanguage":"en","groundingStatus":"insufficient","evidenceRefs":[],"answer":"Your score is band 6.5 now. Next."}',
      ],
      { personalQuestion: true, evidence: empty }
    );
    expect(invented.segments).toEqual([]);
  });

  it('handles escaped quotes and newlines inside the answer', () => {
    const { segments } = run([
      head,
      'Use \\"however\\" carefully.\\n- Point one.\\n- Point two.","x":1}',
    ]);
    expect(segments.join('')).toBe('Use "however" carefully.\n- Point one.\n- Point two.');
  });
});

describe('requestOpenRouterJsonStream', () => {
  const base = {
    apiKey: 'test-key',
    model: 'openai/gpt-oss-120b',
    prompt: '{}',
    systemPrompt: 'system',
    maxOutputTokens: 100,
  };
  const reply = JSON.stringify({ answer: 'Hi there. More.', responseLanguage: 'en' });

  it('streams text to the callback, then returns the parsed reply with billed cost', async () => {
    const seen: string[] = [];
    const fetchImpl = sseFetch([
      ': OPENROUTER PROCESSING\n\n',
      delta(reply.slice(0, 20)),
      // A chunk boundary can land in the middle of an SSE line.
      `data: ${JSON.stringify({ model: 'openai/gpt-oss-120b', choices: [{ delta: { content: reply.slice(20) } }] })}`.slice(
        0,
        30
      ),
      `${`data: ${JSON.stringify({ model: 'openai/gpt-oss-120b', choices: [{ delta: { content: reply.slice(20) } }] })}`.slice(30)}\n\n`,
      sseEvent({
        choices: [],
        usage: { prompt_tokens: 1000, completion_tokens: 50, total_tokens: 1050, cost: 0.0002 },
      }),
      'data: [DONE]\n\n',
    ]);
    const result = await requestOpenRouterJsonStream({
      ...base,
      fetchImpl,
      onText: (text) => seen.push(text),
      validateJson: (value) => typeof value.answer === 'string',
    });
    expect(result.parsed.answer).toBe('Hi there. More.');
    expect(result.usage).toMatchObject({
      promptTokens: 1000,
      outputTokens: 50,
      estimatedProviderCostUsd: 0.0002,
    });
    expect(seen.at(-1)).toBe(reply);
    expect(seen.length).toBeGreaterThanOrEqual(2);
    const body = JSON.parse((fetchImpl as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ stream: true, stream_options: { include_usage: true } });
  });

  it('prices a stream that never reports usage instead of recording it as free', async () => {
    const result = await requestOpenRouterJsonStream({
      ...base,
      fetchImpl: sseFetch([delta(reply), 'data: [DONE]\n\n']),
    });
    expect(result.usage.tokensUsed).toBeGreaterThan(0);
    expect(result.usage.estimatedProviderCostUsd).toBeGreaterThan(0);
  });

  it('attaches the billed cost to a reply that fails validation', async () => {
    const fetchImpl = sseFetch([
      delta(reply),
      sseEvent({
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, cost: 0.0004 },
      }),
      'data: [DONE]\n\n',
    ]);
    await expect(
      requestOpenRouterJsonStream({ ...base, fetchImpl, validateJson: () => false })
    ).rejects.toMatchObject({
      code: 'invalid_schema',
      usage: { estimatedProviderCostUsd: 0.0004 },
    });
  });

  it('a throwing display callback never breaks generation', async () => {
    const result = await requestOpenRouterJsonStream({
      ...base,
      fetchImpl: sseFetch([delta(reply), 'data: [DONE]\n\n']),
      onText: () => {
        throw new Error('render failed');
      },
    });
    expect(result.parsed.answer).toBe('Hi there. More.');
  });

  it('turns an upstream stream error and an HTTP error into provider errors', async () => {
    await expect(
      requestOpenRouterJsonStream({
        ...base,
        fetchImpl: sseFetch([
          delta('{"answer":'),
          sseEvent({ error: { code: 502, message: 'upstream' } }),
        ]),
      })
    ).rejects.toMatchObject({ code: 'stream_error' });
    await expect(
      requestOpenRouterJsonStream({
        ...base,
        fetchImpl: sseFetch(['nope'], { status: 429 }),
      })
    ).rejects.toMatchObject({ code: 'http_error', status: 429 });
  });

  it('enforces the deadline on the whole stream, not just the headers', async () => {
    const hanging = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((resolve) => {
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(delta('{"answer":"slow')));
              init.signal?.addEventListener('abort', () =>
                controller.error(Object.assign(new Error('aborted'), { name: 'AbortError' }))
              );
            },
          });
          resolve(new Response(stream, { status: 200 }));
        })
    ) as unknown as typeof fetch;
    await expect(
      requestOpenRouterJsonStream({ ...base, fetchImpl: hanging, timeoutMs: 40 })
    ).rejects.toMatchObject({ code: 'timeout' });
    await expect(
      requestOpenRouterJsonStream({ ...base, fetchImpl: hanging, timeoutMs: 40 })
    ).rejects.toBeInstanceOf(TextAiProviderError);
  });
});

describe('readCoachStream (browser side)', () => {
  const frame = (event: string, data: unknown) =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const response = (chunks: string[]) =>
    new Response(
      new ReadableStream({
        start(controller) {
          chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
          controller.close();
        },
      })
    );

  it('delivers deltas as they arrive and resolves with the final reply', async () => {
    const onDelta = vi.fn();
    const result = await readCoachStream(
      response([
        frame('delta', { text: 'One. ' }),
        // A frame split across two network chunks.
        frame('delta', { text: 'Two. ' }).slice(0, 15),
        frame('delta', { text: 'Two. ' }).slice(15),
        frame('final', { answer: 'One. Two. ', messageId: 'm1' }),
      ]),
      { onDelta }
    );
    expect(onDelta.mock.calls.map(([text]) => text)).toEqual(['One. ', 'Two. ']);
    expect(result).toEqual({ answer: 'One. Two. ', messageId: 'm1' });
  });

  it('calls onReset when a draft is superseded', async () => {
    const onReset = vi.fn();
    const result = await readCoachStream(
      response([
        frame('delta', { text: 'Draft. ' }),
        frame('reset', {}),
        frame('final', { answer: 'Final' }),
      ]),
      { onReset }
    );
    expect(onReset).toHaveBeenCalledTimes(1);
    expect((result as any).answer).toBe('Final');
  });

  it('surfaces a server error without asking the page to retry the same request', async () => {
    await expect(
      readCoachStream(
        response([frame('error', { error: 'Ava could not verify an answer to that.' })])
      )
    ).rejects.toMatchObject({
      message: 'Ava could not verify an answer to that.',
      requestOutcomeUnknown: false,
    });
  });

  it('marks a dropped connection as an unknown outcome so the retry reuses the request id', async () => {
    await expect(
      readCoachStream(response([frame('delta', { text: 'Half' })]))
    ).rejects.toMatchObject({
      requestOutcomeUnknown: true,
    });
  });
});
