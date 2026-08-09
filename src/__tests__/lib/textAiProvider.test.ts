import { describe, expect, it, vi } from 'vitest';
import {
  DEEPSEEK_TEXT_MODEL,
  GEMINI_SCORING_MODEL,
  GEMINI_TEXT_FALLBACK_MODEL,
  OPENROUTER_DEEPSEEK_MODEL,
  OPENROUTER_LUNA_MODEL,
  VERCEL_GATEWAY_LUNA_MODEL,
  requestJsonWithGeminiFallback,
  requestGeminiJson,
  requestOpenRouterLunaJson,
  requestVercelGatewayLunaJson,
} from '../../../supabase/functions/_shared/textAiProvider';

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('text AI provider routing', () => {
  it('requests Luna through the Vercel AI Gateway OpenAI-compatible endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: VERCEL_GATEWAY_LUNA_MODEL,
        choices: [{ message: { content: '{"fluency":7}' } }],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
          cost: 0.0004,
        },
      })
    );

    const result = await requestVercelGatewayLunaJson({
      prompt: 'Score this speaking test.',
      apiKey: 'vercel-gateway-test-key',
      maxOutputTokens: 4096,
      fetchImpl,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://ai-gateway.vercel.sh/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer vercel-gateway-test-key');
    expect(JSON.parse(init.body)).toMatchObject({
      model: VERCEL_GATEWAY_LUNA_MODEL,
      messages: [{ role: 'user', content: 'Score this speaking test.' }],
      reasoning: { effort: 'none', exclude: true },
      max_tokens: 4096,
    });
    expect(JSON.parse(init.body)).not.toHaveProperty('response_format');
    expect(result).toMatchObject({
      provider: 'vercel-ai-gateway-luna',
      model: VERCEL_GATEWAY_LUNA_MODEL,
      parsed: { fluency: 7 },
      usage: { estimatedProviderCostUsd: 0.0004 },
    });
  });

  it('requests Luna through OpenRouter in latency-sorted non-reasoning JSON mode', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: OPENROUTER_LUNA_MODEL,
        choices: [{ message: { content: '{"fluency":7}' } }],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
          cost: 0.0004,
        },
      })
    );

    const result = await requestOpenRouterLunaJson({
      prompt: 'Score this speaking test.',
      apiKey: 'openrouter-test-key',
      maxOutputTokens: 4096,
      fetchImpl,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer openrouter-test-key');
    expect(JSON.parse(init.body)).toMatchObject({
      model: OPENROUTER_LUNA_MODEL,
      messages: [{ role: 'user', content: 'Score this speaking test.' }],
      response_format: { type: 'json_object' },
      reasoning: { effort: 'none', exclude: true },
      provider: { sort: 'latency', require_parameters: true },
      max_tokens: 4096,
    });
    expect(JSON.parse(init.body)).not.toHaveProperty('temperature');
    expect(result).toMatchObject({
      provider: 'openrouter-luna',
      model: OPENROUTER_LUNA_MODEL,
      parsed: { fluency: 7 },
      usage: { estimatedProviderCostUsd: 0.0004 },
    });
  });

  it('uses OpenRouter DeepSeek V4 Flash 0731 first with reasoning disabled and no exposed reasoning text', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: OPENROUTER_DEEPSEEK_MODEL,
        choices: [{ message: { content: '{"headline":"OpenRouter route"}' } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      })
    );

    const result = await requestJsonWithGeminiFallback({
      prompt: 'Return json.',
      openRouterApiKey: 'openrouter-test-key',
      deepseekApiKey: 'deepseek-test-key',
      geminiApiKey: 'gemini-test-key',
      maxOutputTokens: 300,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer openrouter-test-key');
    expect(JSON.parse(init.body)).toMatchObject({
      model: OPENROUTER_DEEPSEEK_MODEL,
      response_format: { type: 'json_object' },
      reasoning: { effort: 'none', exclude: true },
      provider: { sort: 'latency', require_parameters: true },
      max_tokens: 300,
    });
    expect(result).toMatchObject({
      provider: 'openrouter-deepseek',
      model: OPENROUTER_DEEPSEEK_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      parsed: { headline: 'OpenRouter route' },
    });
  });

  it('falls back from OpenRouter to direct DeepSeek, then Gemini if needed', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, 503))
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [{ message: { content: '{"headline":"Direct fallback"}' } }],
          usage: {},
        })
      );

    const result = await requestJsonWithGeminiFallback({
      prompt: 'Return json.',
      openRouterApiKey: 'openrouter-test-key',
      deepseekApiKey: 'deepseek-test-key',
      geminiApiKey: 'gemini-test-key',
      maxOutputTokens: 300,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][0]).toBe('https://api.deepseek.com/chat/completions');
    expect(result).toMatchObject({
      provider: 'deepseek',
      fallbackUsed: true,
      fallbackReason: 'openrouter_deepseek_http_error_http_503',
      parsed: { headline: 'Direct fallback' },
    });
  });

  it('uses DeepSeek V4 Flash in non-thinking JSON mode without calling Gemini', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: '{"headline":"Focus on accuracy"}' } }],
        usage: {
          prompt_tokens: 1000,
          prompt_cache_hit_tokens: 200,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      })
    );

    const result = await requestJsonWithGeminiFallback({
      prompt: 'Return json for this safe IELTS plan.',
      deepseekApiKey: 'deepseek-test-key',
      geminiApiKey: 'gemini-test-key',
      maxOutputTokens: 300,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    expect(JSON.parse(init.body)).toMatchObject({
      model: DEEPSEEK_TEXT_MODEL,
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
      max_tokens: 300,
    });
    expect(result).toMatchObject({
      provider: 'deepseek',
      model: DEEPSEEK_TEXT_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      parsed: { headline: 'Focus on accuracy' },
    });
    expect(result.usage.estimatedProviderCostUsd).toBeCloseTo(0.00025256, 10);
  });

  it('falls back once to Gemini when DeepSeek returns an error', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, 503))
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ content: { parts: [{ text: '{"headline":"Gemini fallback"}' }] } }],
          usageMetadata: {
            promptTokenCount: 900,
            candidatesTokenCount: 200,
            totalTokenCount: 1100,
          },
        })
      );

    const result = await requestJsonWithGeminiFallback({
      prompt: 'Return json.',
      deepseekApiKey: 'deepseek-test-key',
      geminiApiKey: 'gemini-test-key',
      maxOutputTokens: 300,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][0]).toContain(GEMINI_TEXT_FALLBACK_MODEL);
    expect(fetchImpl.mock.calls[1][0]).not.toContain('key=');
    expect(fetchImpl.mock.calls[1][1].headers['x-goog-api-key']).toBe('gemini-test-key');
    expect(result).toMatchObject({
      provider: 'gemini',
      model: GEMINI_TEXT_FALLBACK_MODEL,
      fallbackUsed: true,
      fallbackReason: 'deepseek_http_error_http_503',
      parsed: { headline: 'Gemini fallback' },
    });
  });

  it('uses Gemini Flash scoring rates when the scoring model is requested', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
        usageMetadata: {
          promptTokenCount: 1000,
          candidatesTokenCount: 500,
          totalTokenCount: 1500,
        },
      })
    );

    const result = await requestGeminiJson({
      prompt: 'Return JSON.',
      apiKey: 'gemini-test-key',
      geminiModel: GEMINI_SCORING_MODEL,
      maxOutputTokens: 300,
      fetchImpl,
    });

    expect(result.usage.estimatedProviderCostUsd).toBeCloseTo(0.00155, 10);
  });

  it('falls back to Gemini when DeepSeek returns malformed JSON', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: 'not json' } }], usage: {} })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ content: { parts: [{ text: '```json\n{"ok":true}\n```' }] } }],
          usageMetadata: {},
        })
      );

    const result = await requestJsonWithGeminiFallback({
      prompt: 'Return json.',
      deepseekApiKey: 'deepseek-test-key',
      geminiApiKey: 'gemini-test-key',
      maxOutputTokens: 300,
      fetchImpl,
    });

    expect(result.parsed).toEqual({ ok: true });
    expect(result.fallbackReason).toBe('deepseek_malformed_json');
  });

  it('falls back when DeepSeek JSON does not match the task schema', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: '{"unexpected":true}' } }], usage: {} })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ content: { parts: [{ text: '{"headline":"Valid fallback"}' }] } }],
          usageMetadata: {},
        })
      );

    const result = await requestJsonWithGeminiFallback({
      prompt: 'Return json.',
      deepseekApiKey: 'deepseek-test-key',
      geminiApiKey: 'gemini-test-key',
      maxOutputTokens: 300,
      validateJson: (value) => typeof value?.headline === 'string',
      fetchImpl,
    });

    expect(result.parsed).toEqual({ headline: 'Valid fallback' });
    expect(result.fallbackReason).toBe('deepseek_invalid_schema');
  });

  it('fails without making a request when neither provider is configured', async () => {
    const fetchImpl = vi.fn();
    await expect(
      requestJsonWithGeminiFallback({
        prompt: 'Return json.',
        maxOutputTokens: 300,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: 'provider_not_configured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
