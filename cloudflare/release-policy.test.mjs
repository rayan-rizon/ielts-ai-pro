import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReleaseTarget, uploadedVersion, PRODUCTION_WORKER, PRODUCTION_TAG } from './release-policy.mjs';

const scripts = [{ id: PRODUCTION_WORKER, tag: PRODUCTION_TAG }];
const domains = ['ieltsai.pro', 'www.ieltsai.pro'].map(hostname => ({ hostname, service: PRODUCTION_WORKER, zone_id: 'a0f923f4119e50e011eadaba1fcf48d5', enabled: true, previews_enabled: false }));
const subdomain = { enabled: false, previews_enabled: false };
const manifest = { profile: 'production', output: 'cloudflare/dist-production' };
test('release refuses custom-domain, identity, preview, profile and CI target drift', () => {
  validateReleaseTarget(scripts, subdomain, manifest, { WORKERS_CI_BRANCH: 'main' }, domains);
  assert.throws(() => validateReleaseTarget(scripts, subdomain, manifest, {}, []), /custom domain/);
  for (const change of [{ service: 'other' }, { enabled: false }, { previews_enabled: true }, { zone_id: 'other' }]) {
    assert.throws(() => validateReleaseTarget(scripts, subdomain, manifest, {}, [{ ...domains[0], ...change }, domains[1]]), /custom domain/);
  }
  assert.throws(() => validateReleaseTarget([{ ...scripts[0], tag: 'wrong' }], subdomain, manifest, {}, domains), /identity/);
  assert.throws(() => validateReleaseTarget(scripts, { enabled: true }, manifest, {}, domains), /preview/);
  assert.throws(() => validateReleaseTarget(scripts, subdomain, { ...manifest, profile: 'staging' }, {}, domains), /production/);
  assert.throws(() => validateReleaseTarget(scripts, subdomain, manifest, { WORKERS_CI_BRANCH: 'feature' }, domains), /main/);
  assert.throws(() => validateReleaseTarget(scripts, subdomain, manifest, { WRANGLER_CI_MATCH_TAG: 'other' }, domains), /another/);
});
test('promotion uses only the exact production upload from structured output', () => {
  const record = { type: 'version-upload', worker_name: PRODUCTION_WORKER, worker_tag: PRODUCTION_TAG, version_id: '992bab92-9e53-40d6-87ed-2bf7b64b119e' };
  assert.equal(uploadedVersion(JSON.stringify(record)), record.version_id);
  assert.throws(() => uploadedVersion(''), /verified/);
  assert.throws(() => uploadedVersion(JSON.stringify({ ...record, worker_name: 'staging' })), /verified/);
  assert.throws(() => uploadedVersion(JSON.stringify({ ...record, version_id: 'invalid' })), /verified/);
});
