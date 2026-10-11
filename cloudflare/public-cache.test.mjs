import test from 'node:test';
import assert from 'node:assert/strict';
import { canReadPublicCache, canStorePublicResponse } from './public-cache.mjs';

test('shared cache bypasses credentials and non-GET methods', () => {
  const url = 'https://www.ieltsai.pro/blog';
  assert.equal(canReadPublicCache(new Request(url)), true);
  for (const headers of [{ authorization: 'Bearer fixture' }, { cookie: 'session=fixture' }]) {
    assert.equal(canReadPublicCache(new Request(url, { headers })), false);
  }
  for (const method of ['POST', 'HEAD', 'OPTIONS']) {
    assert.equal(canReadPublicCache(new Request(url, { method })), false);
  }
});

test('public caching never overrides private policy, cookies or unkeyed variants', () => {
  const response = (headers, status = 200) => new Response('fixture', { status, headers });
  assert.equal(canStorePublicResponse(response({ 'cache-control': 'public, s-maxage=300' })), true);
  for (const policy of ['', 'private, max-age=300', 'public, no-store', 'public, no-cache', 'public, private="authorization"']) {
    assert.equal(canStorePublicResponse(response({ 'cache-control': policy })), false, policy);
  }
  for (const headers of [{ 'set-cookie': 'session=fixture' }, { vary: 'Authorization' }, { vary: '*' }]) {
    assert.equal(canStorePublicResponse(response({ 'cache-control': 'public, max-age=300', ...headers })), false);
  }
  assert.equal(canStorePublicResponse(response({ 'cache-control': 'public' }, 500)), false);
});
