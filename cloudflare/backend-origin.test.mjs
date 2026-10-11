import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../supabase/functions/_shared/originValidation.ts';

test('Cloudflare preview is allowed alongside existing production origins', () => {
  for (const origin of ['https://www.ieltsai.pro', 'https://ieltsai.pro', 'https://ielts-ai-cloudflare-staging.rayan-rizon.workers.dev', 'https://ielts-ai-cloudflare.rayan-rizon.workers.dev', 'https://ielts-ai-pro-rayan-rizons-projects.vercel.app']) {
    assert.equal(isAllowedOrigin(origin, false), true, origin);
  }
});
test('preview exception does not allow other workers, suffix attacks or loopback', () => {
  for (const origin of ['https://other.rayan-rizon.workers.dev', 'https://ielts-ai-cloudflare.evil.workers.dev', 'https://ielts-ai-cloudflare.rayan-rizon.workers.dev.evil.example', 'https://ielts-ai-cloudflare-staging.evil.workers.dev', 'https://ielts-ai-cloudflare-staging.rayan-rizon.workers.dev.evil.example', 'http://ielts-ai-cloudflare-staging.rayan-rizon.workers.dev', 'http://localhost:5173', 'null', '']) {
    assert.equal(isAllowedOrigin(origin, false), false, origin);
  }
});
