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
  const validEvent = {
    event_name: 'CompleteRegistration',
    event_id: 'evt_1',
    value: 1,
    currency: 'USD',
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
      { method: 'POST', headers: { host: 'www.ieltsai.pro', ...headers }, body },
      makeRes()
    );

  it('forwards events from the production site', async () => {
    const res = await post({ ...validEvent, event_source_url: 'https://www.ieltsai.pro/signup' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(202);
  });

  it('drops localhost events instead of writing them to the dataset', async () => {
    const res = await post({ ...validEvent, event_source_url: 'http://localhost:5173/signup' });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(204);
  });

  it('drops preview-deployment events', async () => {
    const res = await post({
      ...validEvent,
      event_source_url: 'https://ielts-ai-pro-git-branch.vercel.app/',
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(204);
  });

  it('falls back to the request host when no source url is supplied', async () => {
    const res = await post(validEvent, { host: 'localhost:3000' });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(204);
  });
});
