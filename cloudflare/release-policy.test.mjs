import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReleaseTarget, uploadedVersion, PRODUCTION_WORKER, PRODUCTION_TAG } from './release-policy.mjs';

const scripts = [{ id: PRODUCTION_WORKER, tag: PRODUCTION_TAG, routes: ['ieltsai.pro/*', 'www.ieltsai.pro/*'].map(pattern => ({ pattern, script: PRODUCTION_WORKER, request_limit_fail_open: true })) }];
const subdomain = { enabled: false, previews_enabled: false };
const manifest = { profile: 'production', output: 'cloudflare/dist-production' };
test('release refuses route, identity, preview, profile and CI target drift', () => {
  validateReleaseTarget(scripts, subdomain, manifest, { WORKERS_CI_BRANCH: 'main' });
  assert.throws(() => validateReleaseTarget([{ ...scripts[0], routes: [] }], subdomain, manifest), /route/);
  assert.throws(() => validateReleaseTarget([{ ...scripts[0], tag: 'wrong' }], subdomain, manifest), /identity/);
  assert.throws(() => validateReleaseTarget(scripts, { enabled: true }, manifest), /preview/);
  assert.throws(() => validateReleaseTarget(scripts, subdomain, { ...manifest, profile: 'staging' }), /production/);
  assert.throws(() => validateReleaseTarget(scripts, subdomain, manifest, { WORKERS_CI_BRANCH: 'feature' }), /main/);
  assert.throws(() => validateReleaseTarget(scripts, subdomain, manifest, { WRANGLER_CI_MATCH_TAG: 'other' }), /another/);
});
test('promotion uses only the exact production upload from structured output', () => {
  const record = { type: 'version-upload', worker_name: PRODUCTION_WORKER, worker_tag: PRODUCTION_TAG, version_id: '992bab92-9e53-40d6-87ed-2bf7b64b119e' };
  assert.equal(uploadedVersion(JSON.stringify(record)), record.version_id);
  assert.throws(() => uploadedVersion(''), /verified/);
  assert.throws(() => uploadedVersion(JSON.stringify({ ...record, worker_name: 'staging' })), /verified/);
  assert.throws(() => uploadedVersion(JSON.stringify({ ...record, version_id: 'invalid' })), /verified/);
});
