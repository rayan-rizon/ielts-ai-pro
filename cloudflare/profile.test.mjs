import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_BUILD_SETTINGS, validateProductionSettings, isMeasuredRequest, selectProfile, buildOutput } from './profile.mjs';

test('public build settings never include server secrets', () => {
  assert.ok(PUBLIC_BUILD_SETTINGS.every(name => name.startsWith('VITE_')));
  assert.ok(!PUBLIC_BUILD_SETTINGS.some(name => /ACCESS_TOKEN|SERVICE_ROLE|API_SECRET/.test(name)));
});

test('production settings reject missing tracking and duplicate purchase reporting', () => {
  const env = Object.fromEntries(PUBLIC_BUILD_SETTINGS.map(name => [name, 'fixture']));
  env.VITE_GA4_SERVER_PURCHASE = 'true';
  env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_live_fixture';
  env.VITE_SENTRY_DSN = 'https://public-key@fixture.ingest.sentry.io/123';
  validateProductionSettings(env);
  assert.throws(() => validateProductionSettings({ ...env, VITE_POSTHOG_PROJECT_TOKEN: '' }), /POSTHOG/);
  assert.throws(() => validateProductionSettings({ ...env, VITE_GA4_SERVER_PURCHASE: 'false' }), /must be true/);
  assert.throws(() => validateProductionSettings({ ...env, VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_fixture' }), /live mode/);
  assert.throws(() => validateProductionSettings({ ...env, VITE_SENTRY_DSN: '[Sensitive]' }), /masked placeholder/);
});

test('only exact HTTPS production hosts can enable measurement and indexing', () => {
  for (const host of ['ieltsai.pro', 'www.ieltsai.pro']) {
    assert.equal(isMeasuredRequest(new URL(`https://${host}/`), 'production'), true);
    assert.equal(isMeasuredRequest(new URL(`https://${host}/`), 'staging'), false);
  }
  for (const url of ['https://ielts-ai-pro.rayan-rizon.workers.dev/', 'https://ieltsai.pro.evil.test/', 'http://ieltsai.pro/', 'https://ieltsai.pro:444/']) {
    assert.equal(isMeasuredRequest(new URL(url), 'production'), false);
  }
});

test('build outputs and unknown profiles cannot be confused', () => {
  assert.equal(selectProfile([]), 'production');
  assert.equal(buildOutput(selectProfile(['--profile=production'])), 'cloudflare/dist-production');
  assert.throws(() => selectProfile(['--profile=prod']), /Unknown/);
});
