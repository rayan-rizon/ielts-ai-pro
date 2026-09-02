import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';

import geoHandler from '../../../api/geo.js';
import capiHandler from '../../../api/meta-capi.js';

const makeRes = () => {
  const res = {
    statusCode: null,
    body: undefined,
    headers: {},
    ended: false,
  };
  res.setHeader = vi.fn((key, value) => {
    res.headers[key] = value;
  });
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload) => {
    res.body = payload;
    return res;
  });
  res.end = vi.fn(() => {
    res.ended = true;
    return res;
  });
  return res;
};

describe('GET /api/geo', () => {
  it('returns the country the edge already resolved, with no user input', async () => {
    const res = makeRes();
    await geoHandler({ method: 'GET', headers: { 'x-vercel-ip-country': 'bd' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ country: 'BD' });
  });

  it.each(['XX', 'T1', '', 'BANGLADESH', '1'])(
    'reports no country rather than writing the placeholder %s to a profile',
    async (header) => {
      const res = makeRes();
      await geoHandler({ method: 'GET', headers: { 'x-vercel-ip-country': header } }, res);

      expect(res.body).toEqual({ country: null });
    }
  );

  it('returns null when the header is absent, as it is in local development', async () => {
    const res = makeRes();
    await geoHandler({ method: 'GET', headers: {} }, res);

    expect(res.body).toEqual({ country: null });
  });

  it('is never cached, since the answer differs per visitor', async () => {
    const res = makeRes();
    await geoHandler({ method: 'GET', headers: { 'x-vercel-ip-country': 'KZ' } }, res);

    expect(res.headers['Cache-Control']).toBe('no-store, private');
  });
});

describe('POST /api/meta-capi host gate', () => {
  const emailHash = 'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514';
  const externalIdHash = 'c1f711dd5e8a5c7a03e39fe27f0ca20ec95125d6c4c2d514099213b30e62019d';
  const validEvent = {
    event_name: 'CompleteRegistration',
    event_id: 'evt_1',
  };

  beforeEach(() => {
    process.env.META_CAPI_ACCESS_TOKEN = 'test-token';
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('') }))
    );
  });

  afterEach(() => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    vi.unstubAllGlobals();
  });

  const post = (body, headers = {}) =>
    capiHandler(
      {
        method: 'POST',
        headers: { host: 'www.ieltsai.pro', origin: 'https://www.ieltsai.pro', ...headers },
        body,
      },
      makeRes()
    );

  it('forwards events from the production site', async () => {
    const res = await post({ ...validEvent, event_source_url: 'https://www.ieltsai.pro/signup' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(payload.data[0]).not.toHaveProperty('custom_data');
    expect(res.statusCode).toBe(202);
  });

  it('passes pre-hashed identity through without receiving raw identifiers', async () => {
    const res = await post({
      ...validEvent,
      event_source_url: 'https://www.ieltsai.pro/signup',
      user: { em: emailHash, external_id: externalIdHash },
    });

    const payload = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(payload.data[0].user_data).toEqual(
      expect.objectContaining({ em: [emailHash], external_id: [externalIdHash] })
    );
    expect(res.statusCode).toBe(202);
  });

  it.each([
    { email: 'learner@example.com' },
    { em: 'not-a-sha256-hash' },
    { external_id: 'raw-user-id' },
  ])('rejects raw or malformed identity values', async (user) => {
    const res = await post({
      ...validEvent,
      event_source_url: 'https://www.ieltsai.pro/signup',
      user,
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('rejects a caller-supplied URL from a different host', async () => {
    const res = await post({ ...validEvent, event_source_url: 'http://localhost:5173/signup' });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('rejects a caller-supplied preview URL', async () => {
    const res = await post({
      ...validEvent,
      event_source_url: 'https://ielts-ai-pro-git-branch.vercel.app/',
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('rejects a cross-origin request even when its body claims a production URL', async () => {
    const res = await post(
      { ...validEvent, event_source_url: 'https://www.ieltsai.pro/signup' },
      { origin: 'https://attacker.example' }
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('rejects requests without a browser origin', async () => {
    const res = await post(
      { ...validEvent, event_source_url: 'https://www.ieltsai.pro/signup' },
      { origin: undefined }
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('falls back to the request host when no source url is supplied', async () => {
    const res = await post(validEvent, { host: 'localhost:3000' });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(204);
  });
});

describe('POST /api/meta-capi Subscribe event', () => {
  // Subscribe is fired alongside Purchase for a new subscription — see
  // COMPANION_PIXEL_EVENT in src/lib/tracking.js. It needs the same value/
  // currency validation as Purchase, since it carries the same subscription
  // amount and is meaningless to Meta's ROAS calc without it.
  beforeEach(() => {
    process.env.META_CAPI_ACCESS_TOKEN = 'test-token';
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('') }))
    );
  });

  afterEach(() => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    vi.unstubAllGlobals();
  });

  const post = (body) =>
    capiHandler(
      {
        method: 'POST',
        headers: { host: 'www.ieltsai.pro', origin: 'https://www.ieltsai.pro' },
        body,
      },
      makeRes()
    );

  it('accepts and forwards Subscribe with a valid value and currency', async () => {
    const res = await post({
      event_name: 'Subscribe',
      event_id: 'cs_live_sub_1',
      value: 14.99,
      currency: 'USD',
      event_source_url: 'https://www.ieltsai.pro/subscription/success',
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(payload.data[0]).toEqual(
      expect.objectContaining({ event_name: 'Subscribe', event_id: 'cs_live_sub_1' })
    );
    expect(payload.data[0].custom_data).toEqual(
      expect.objectContaining({ value: 14.99, currency: 'USD' })
    );
    expect(res.statusCode).toBe(202);
  });

  it('rejects Subscribe with missing value/currency, same as Purchase', async () => {
    const res = await post({
      event_name: 'Subscribe',
      event_id: 'cs_live_sub_2',
      event_source_url: 'https://www.ieltsai.pro/subscription/success',
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});
