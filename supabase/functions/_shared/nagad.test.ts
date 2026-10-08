// deno test --allow-env --allow-net supabase/functions/_shared/nagad.test.ts
//
// The sandbox test runs only when NAGAD_* sandbox credentials are in the
// environment; it opens a real sandbox session (no money moves).
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  classifyNagadStatus,
  clientIpv4,
  completePayment,
  decryptSensitive,
  encryptSensitive,
  formatNagadAmount,
  initializePayment,
  isValidOrderId,
  loadNagadConfig,
  nagadDateTime,
  newOrderId,
  signSensitive,
  toPem,
  verifyGatewaySignature,
  verifyPayment,
  type NagadConfig,
} from './nagad.ts';

function keyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

// Our side and a fake gateway, each holding the other's public key.
const merchant = keyPair();
const gateway = keyPair();
const ours: NagadConfig = {
  baseUrl: 'https://nagad.invalid',
  merchantId: '000000000000001',
  merchantPrivateKey: merchant.privatePem,
  pgPublicKey: gateway.publicPem,
  apiVersion: 'v-0.2.0',
};
const theirs: NagadConfig = {
  ...ours,
  merchantPrivateKey: gateway.privatePem,
  pgPublicKey: merchant.publicPem,
};

Deno.test('toPem wraps a bare base64 key the way Nagad sends it', () => {
  const body = merchant.publicPem.replace(/-----[^-]+-----|\s/g, '');
  const pem = toPem(body, 'PUBLIC KEY');
  assert.match(pem, /^-----BEGIN PUBLIC KEY-----\n/);
  assert.ok(
    pem
      .split('\n')
      .slice(1, -1)
      .every((line) => line.length <= 64)
  );
  assert.doesNotThrow(() => crypto.createPublicKey(pem));
  assert.equal(toPem(merchant.publicPem, 'PUBLIC KEY'), merchant.publicPem.trim());
  assert.equal(
    toPem('-----BEGIN X-----\\nabc\\n-----END X-----', 'PUBLIC KEY'),
    '-----BEGIN X-----\nabc\n-----END X-----'
  );
});

Deno.test('dateTime is Bangladesh time', () => {
  assert.equal(nagadDateTime(new Date('2026-10-06T20:30:45Z')), '20261007023045');
});

Deno.test('order ids fit Nagad rules and do not repeat', () => {
  const ids = new Set(Array.from({ length: 500 }, () => newOrderId()));
  assert.equal(ids.size, 500);
  for (const id of ids) assert.ok(isValidOrderId(id), id);
  assert.equal(isValidOrderId('abc'), false);
  assert.equal(isValidOrderId('IAP-123456'), false);
  assert.equal(isValidOrderId('A'.repeat(21)), false);
});

Deno.test('amounts are sent with two decimals', () => {
  assert.equal(formatNagadAmount(699), '699.00');
  assert.equal(formatNagadAmount(1572.5), '1572.50');
  assert.equal(formatNagadAmount(10.005), '10.01');
});

Deno.test('statuses: only Success pays, unknown stays pending', () => {
  assert.equal(classifyNagadStatus('Success'), 'paid');
  for (const s of ['Cancelled', 'Aborted', 'Failed', 'Fraud', 'InvalidRequest', 'UnKnownFailed']) {
    assert.equal(classifyNagadStatus(s), 'failed', s);
  }
  for (const s of [
    'Ready',
    'OrderInitiated',
    'InProgress',
    'OtpSent',
    'PinGiven',
    'Something',
    null,
  ]) {
    assert.equal(classifyNagadStatus(s), 'pending', String(s));
  }
});

Deno.test('crypto round trip: gateway can read and verify what we send, and vice versa', () => {
  const data = { merchantId: ours.merchantId, orderId: 'IAP123456', challenge: 'AB' };
  const sealed = encryptSensitive(ours, data);
  const plain = decryptSensitive(theirs, sealed);
  assert.deepEqual(JSON.parse(plain), data);
  assert.ok(verifyGatewaySignature(theirs, plain, signSensitive(ours, data)));

  const reply = JSON.stringify({ paymentReferenceId: 'ref', challenge: 'CD' });
  const replySig = signSensitive(theirs, JSON.parse(reply));
  assert.ok(verifyGatewaySignature(ours, reply, replySig));
  assert.equal(verifyGatewaySignature(ours, reply.replace('ref', 'forged'), replySig), false);
  assert.equal(verifyGatewaySignature(ours, reply, 'not-a-signature'), false);
});

Deno.test('client IP: IPv4 from the proxy chain, otherwise a placeholder', () => {
  const req = (h: Record<string, string>) => new Request('https://x.invalid', { headers: h });
  assert.equal(clientIpv4(req({ 'x-forwarded-for': '103.1.2.3, 10.0.0.1' })), '103.1.2.3');
  assert.equal(clientIpv4(req({ 'x-forwarded-for': '2001:db8::1' })), '127.0.0.1');
  assert.equal(clientIpv4(null), '127.0.0.1');
});

Deno.test('config is null until every Nagad secret is set', () => {
  const env = (values: Record<string, string>) => ({ get: (name: string) => values[name] });
  assert.equal(loadNagadConfig(env({ NAGAD_BASE_URL: 'x' })), null);
  const config = loadNagadConfig(
    env({
      NAGAD_BASE_URL: 'http://sandbox.mynagad.com:30001/',
      NAGAD_MERCHANT_ID: ' 000000000000001 ',
      NAGAD_MERCHANT_PRIVATE_KEY: merchant.privatePem,
      NAGAD_PG_PUBLIC_KEY: gateway.publicPem,
    })
  );
  assert.equal(config?.baseUrl, 'http://sandbox.mynagad.com:30001');
  assert.equal(config?.merchantId, '000000000000001');
  assert.equal(config?.apiVersion, 'v-0.2.0');
});

Deno.test('initialize rejects a response not signed by the gateway', async () => {
  const originalFetch = globalThis.fetch;
  const impostor = keyPair();
  globalThis.fetch = (async () => {
    const plain = { paymentReferenceId: 'ref123', challenge: 'C0FFEE', acceptDateTime: '1' };
    return Response.json({
      sensitiveData: encryptSensitive(theirs, plain),
      signature: signSensitive({ ...theirs, merchantPrivateKey: impostor.privatePem }, plain),
    });
  }) as typeof fetch;
  try {
    await assert.rejects(
      initializePayment(ours, 'IAP123456', { ip: '127.0.0.1' }),
      /signature verification/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test('complete refuses a payment page outside mynagad.com', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    Response.json({ status: 'Success', callBackUrl: 'https://evil.example/pay' })) as typeof fetch;
  try {
    await assert.rejects(
      completePayment(ours, {
        paymentReferenceId: 'ref',
        orderId: 'IAP123456',
        amount: 10,
        challenge: 'C',
        callbackUrl: 'https://x.invalid/cb',
        ip: '127.0.0.1',
      }),
      /unexpected host/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test('Nagad error bodies surface their reason code', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    Response.json(
      { reason: '16_0006_058', message: 'Failed to verify signature' },
      { status: 422 }
    )) as typeof fetch;
  try {
    await assert.rejects(verifyPayment(ours, 'ref'), (error: any) => {
      assert.equal(error.reason, '16_0006_058');
      assert.equal(error.httpStatus, 422);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const sandbox = loadNagadConfig();
Deno.test({
  name: 'sandbox: initialize, complete and verify a real session',
  ignore: !sandbox || !sandbox.baseUrl.includes('sandbox'),
  async fn() {
    const config = sandbox!;
    const orderId = newOrderId();
    const session = await initializePayment(config, orderId, { ip: '127.0.0.1' });
    assert.ok(session.paymentReferenceId.length >= 10);
    const page = await completePayment(config, {
      paymentReferenceId: session.paymentReferenceId,
      orderId,
      amount: 10,
      challenge: session.challenge,
      callbackUrl: 'https://www.ieltsai.pro/nagad-test-callback',
      ip: '127.0.0.1',
    });
    assert.match(new URL(page).hostname, /mynagad\.com$/);
    const verified = await verifyPayment(config, session.paymentReferenceId);
    assert.equal(verified.orderId, orderId);
    assert.equal(verified.amount, 10);
    assert.equal(classifyNagadStatus(verified.status), 'pending');
  },
});
