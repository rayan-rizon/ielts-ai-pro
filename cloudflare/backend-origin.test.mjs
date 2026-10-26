import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../supabase/functions/_shared/originValidation.ts';

test('production custom domains are allowed', () => {
  for (const origin of ['https://www.ieltsai.pro', 'https://ieltsai.pro']) {
    assert.equal(isAllowedOrigin(origin, false), true, origin);
  }
});
test('retired hosts, workers, suffix attacks and loopback are denied', () => {
  for (const origin of ['https://ielts-ai-pro-rayan-rizons-projects.vercel.app', 'https://other.rayan-rizon.workers.dev', 'https://ielts-ai-pro.rayan-rizon.workers.dev', 'https://ielts-ai-pro.evil.workers.dev', 'https://ielts-ai-pro.rayan-rizon.workers.dev.evil.example', 'http://ielts-ai-pro.rayan-rizon.workers.dev', 'http://localhost:5173', 'null', '']) {
    assert.equal(isAllowedOrigin(origin, false), false, origin);
  }
});
