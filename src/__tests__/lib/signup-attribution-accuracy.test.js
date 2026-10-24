import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureSignupAttribution,
  signupAttributionScript,
} from '../../../shared/signupAttributionCapture.js';
import {
  classifyChannel,
  getAIProvider,
  getMissingSignupProfileFields,
  getSignupAttribution,
} from '@/lib/attribution';

const key = 'attribution_first_touch';
const land = (path, referrer = '') => {
  window.history.replaceState({}, '', path);
  Object.defineProperty(document, 'referrer', { configurable: true, value: referrer });
  // Exercise the serialized code actually embedded in both HTML renderers.
  Function(signupAttributionScript)();
  return JSON.parse(window.localStorage.getItem(key));
};
beforeEach(() => {
  window.localStorage.clear();
  delete window.__signupAttribution;
});
afterEach(() => {
  vi.restoreAllMocks();
  delete document.referrer;
  window.history.replaceState({}, '', '/');
});

describe('landing page capture in older browsers', () => {
  it('keeps the campaign query when URLSearchParams.size is unsupported', () => {
    const original = Object.getOwnPropertyDescriptor(URLSearchParams.prototype, 'size');
    Object.defineProperty(URLSearchParams.prototype, 'size', {
      configurable: true,
      get: () => undefined,
    });
    try {
      const stored = land('/?utm_source=facebook&utm_medium=paid_social&email=a@b.co');
      expect(stored.landing_page).toBe('/?utm_source=facebook&utm_medium=paid_social');
    } finally {
      if (original) Object.defineProperty(URLSearchParams.prototype, 'size', original);
    }
  });
});

describe('evidence-based signup channels', () => {
  it.each([
    [{ fbclid: 'click' }, 'social'],
    [{ utm_source: 'fb' }, 'social'],
    [{ utm_source: 'facebook', utm_medium: 'paid_social' }, 'paid_social'],
    [{ utm_source: 'ig', utm_medium: 'social', fbclid: 'click' }, 'organic_social'],
    [{ utm_source: 'google', utm_medium: 'organic' }, 'organic_search'],
    [{ utm_source: 'bing', utm_medium: 'cpc' }, 'paid_search'],
    [{ referrer: 'android-app://com.google.android.gm/' }, 'email'],
    [{ referrer: 'https://mail.google.com/' }, 'email'],
    [{ referrer: 'android-app://com.google.android.googlequicksearchbox/' }, 'organic_search'],
    [{ referrer: 'https://www.google.com.bd/' }, 'organic_search'],
    [{ referrer: 'https://notgoogle.com/' }, 'referral'],
    [{ referrer: 'https://google.com.attacker.test/' }, 'referral'],
    [{ referrer: 'https://facebook.com.attacker.test/' }, 'referral'],
    [{ referrer: 'https://l.facebook.com/' }, 'social'],
    [{ utm_medium: 'ai', utm_source: 'new-assistant' }, 'ai_referral'],
    [{ utm_source: 'chatgpt.com' }, 'ai_referral'],
  ])('classifies %j as %s', (input, channel) => expect(classifyChannel(input)).toBe(channel));

  it.each([
    ['https://chatgpt.com/', 'ChatGPT'],
    ['https://chat.openai.com/', 'ChatGPT'],
    ['https://claude.ai/chat/123', 'Claude'],
    ['https://gemini.google.com/app', 'Gemini'],
    ['https://www.perplexity.ai/', 'Perplexity'],
    ['https://copilot.microsoft.com/', 'Copilot'],
    ['https://www.bing.com/chat', 'Copilot'],
    ['https://grok.com/', 'Grok'],
    ['https://chat.deepseek.com/', 'DeepSeek'],
    ['https://chat.qwen.ai/', 'Qwen'],
    ['https://kimi.com/', 'Kimi'],
    ['https://chat.mistral.ai/', 'Mistral'],
    ['https://www.meta.ai/', 'Meta AI'],
    ['https://poe.com/', 'Poe'],
    ['https://you.com/', 'You.com'],
    ['https://phind.com/', 'Phind'],
    ['https://duck.ai/', 'Duck.ai'],
    ['https://huggingface.co/chat/', 'HuggingChat'],
  ])('identifies %s without calling it search', (referrer, provider) => {
    expect(classifyChannel({ referrer })).toBe('ai_referral');
    expect(getAIProvider({ referrer })).toBe(provider);
  });

  it('does not accept lookalike AI domains', () => {
    expect(classifyChannel({ referrer: 'https://chatgpt.com.attacker.test/' })).toBe('referral');
  });
});

describe('first landing through signup', () => {
  it('preserves AI blog entry through internal navigation and OAuth', () => {
    const first = land(
      '/blog/reading?email=private@example.com',
      'https://chatgpt.com/?private=secret'
    );
    land('/signup', `${window.location.origin}/blog/reading`);
    land('/auth/callback?code=secret', 'https://accounts.google.com/');
    expect(JSON.parse(window.localStorage.getItem(key))).toEqual(first);
    expect(getSignupAttribution()).toMatchObject({
      signup_channel: 'ai_referral',
      signup_utm_source: 'ChatGPT',
      signup_landing_page: '/blog/reading',
    });
    expect(JSON.stringify(first)).not.toContain('private');
    expect(JSON.stringify(first)).not.toContain('secret');
  });

  it('preserves a no-signal first visit instead of replacing it with a later ad', () => {
    land('/blog');
    land('/signup?utm_source=fb&utm_medium=paid&fbclid=click');
    expect(getSignupAttribution().signup_channel).toBe('direct');
  });

  it('replaces invalid, stale and internal-only legacy snapshots on the first paint', () => {
    for (const old of [
      '{broken',
      JSON.stringify({
        referrer: `${window.location.origin}/signup`,
        captured_at: new Date().toISOString(),
      }),
      JSON.stringify({ referrer: 'https://www.google.com/', captured_at: '2020-01-01' }),
    ]) {
      window.localStorage.setItem(key, old);
      land('/blog', 'https://claude.ai/');
      expect(getSignupAttribution().signup_channel).toBe('ai_referral');
    }
  });

  it('retains first-paint evidence in memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://perplexity.ai/',
    });
    captureSignupAttribution();
    expect(getSignupAttribution().signup_channel).toBe('ai_referral');
  });

  it('finishes a fresh OAuth profile once, including direct visits', () => {
    const first = land('/signup');
    const profile = { created_at: new Date().toISOString(), signup_channel: 'direct' };
    const context = getSignupAttribution();
    const patch = getMissingSignupProfileFields(profile, context, {
      capturedAt: first.captured_at,
    });
    expect(patch.signup_attribution_recorded_at).toBeTruthy();
    expect(
      getMissingSignupProfileFields({ ...profile, ...patch }, { signup_channel: 'paid_social' })
    ).toEqual({});
  });

  it('never fills legacy profiles or uses a touch after signup', () => {
    const now = Date.now();
    const ai = { signup_channel: 'ai_referral' };
    expect(
      getMissingSignupProfileFields({ created_at: new Date(now - 86400000).toISOString() }, ai, {
        now,
        capturedAt: new Date(now).toISOString(),
      })
    ).toEqual({});
    expect(
      getMissingSignupProfileFields({ created_at: new Date(now - 60000).toISOString() }, ai, {
        now,
        capturedAt: new Date(now).toISOString(),
      })
    ).toEqual({});
  });
});
