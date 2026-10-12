/**
 * Nagad Online Payment Gateway client (API guide v3.3).
 *
 * Every request carries `sensitiveData` encrypted with Nagad's public key
 * (RSA, PKCS#1 v1.5) and a signature over the same plain JSON made with our
 * private key. Responses come back the other way round.
 *
 * Two things the PDF gets wrong, both confirmed against the sandbox:
 *   - signatures are SHA256withRSA, not SHA1withRSA (SHA-1 is rejected with
 *     16_0006_058 "Failed to verify signature");
 *   - dateTime must be Bangladesh time, or Nagad answers 16_0006_076.
 *
 * Nothing Nagad sends to the browser is trusted. The callback redirect is
 * unsigned query parameters, so a payment only counts once verifyPayment —
 * a server-to-server call — says Success for the amount we asked for.
 */

import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';

export interface NagadConfig {
  baseUrl: string;
  merchantId: string;
  merchantPrivateKey: string;
  pgPublicKey: string;
  apiVersion: string;
  /** Which Nagad this talks to. Sandbox payments never grant a plan. */
  environment: 'sandbox' | 'live';
}

export class NagadError extends Error {
  constructor(
    message: string,
    readonly reason: string | null = null,
    readonly httpStatus: number | null = null
  ) {
    super(message);
    this.name = 'NagadError';
  }
}

const REQUEST_TIMEOUT_MS = 15000;

/**
 * Keys arrive from Nagad as a bare base64 body. Secrets may hold either that
 * or a full PEM; both normalise to PEM for node:crypto.
 */
export function toPem(key: string, kind: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  const trimmed = key.trim();
  if (trimmed.startsWith('-----BEGIN')) return trimmed.replace(/\\n/g, '\n');
  const body = trimmed.replace(/\s+/g, '');
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${kind}-----\n${lines.join('\n')}\n-----END ${kind}-----`;
}

/** Null when Nagad is not configured, so callers can say so instead of crashing. */
export function loadNagadConfig(env: { get(name: string): string | undefined } = Deno.env) {
  const baseUrl = env.get('NAGAD_BASE_URL')?.trim().replace(/\/$/, '');
  const merchantId = env.get('NAGAD_MERCHANT_ID')?.trim();
  const privateKey = env.get('NAGAD_MERCHANT_PRIVATE_KEY');
  const publicKey = env.get('NAGAD_PG_PUBLIC_KEY');
  if (!baseUrl || !merchantId || !privateKey || !publicKey) return null;
  return {
    baseUrl,
    merchantId,
    merchantPrivateKey: toPem(privateKey, 'PRIVATE KEY'),
    pgPublicKey: toPem(publicKey, 'PUBLIC KEY'),
    apiVersion: env.get('NAGAD_API_VERSION')?.trim() || 'v-0.2.0',
    environment: nagadEnvironment(baseUrl, env.get('NAGAD_ENVIRONMENT')),
  } satisfies NagadConfig;
}

/** NAGAD_ENVIRONMENT wins; otherwise a sandbox base URL means sandbox. */
export function nagadEnvironment(baseUrl: string, explicit?: string): 'sandbox' | 'live' {
  const value = explicit?.trim().toLowerCase();
  if (value === 'live' || value === 'sandbox') return value;
  return /sandbox/i.test(baseUrl) ? 'sandbox' : 'live';
}

/** yyyyMMddHHmmss in Asia/Dhaka (UTC+6, no daylight saving). */
export function nagadDateTime(date: Date = new Date()): string {
  return new Date(date.getTime() + 6 * 3600 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace(/[-T:]/g, '');
}

/** Nagad order ids are 5–20 alphanumerics and may not repeat within a day. */
export function newOrderId(now: number = Date.now()): string {
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `IAP${now.toString(36).toUpperCase()}${random}`.slice(0, 20);
}

export function isValidOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9]{5,20}$/.test(value);
}

/** Nagad takes amounts as strings with two decimals. */
export function formatNagadAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

export function encryptSensitive(config: NagadConfig, data: unknown): string {
  return crypto
    .publicEncrypt(
      { key: config.pgPublicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(JSON.stringify(data))
    )
    .toString('base64');
}

export function signSensitive(config: NagadConfig, data: unknown): string {
  return crypto
    .sign('sha256', Buffer.from(JSON.stringify(data)), config.merchantPrivateKey)
    .toString('base64');
}

export function decryptSensitive(config: NagadConfig, sensitiveData: string): string {
  return crypto
    .privateDecrypt(
      { key: config.merchantPrivateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(sensitiveData, 'base64')
    )
    .toString('utf8');
}

export function verifyGatewaySignature(
  config: NagadConfig,
  plain: string,
  signature: string
): boolean {
  try {
    return crypto.verify(
      'sha256',
      Buffer.from(plain),
      config.pgPublicKey,
      Buffer.from(signature, 'base64')
    );
  } catch {
    return false;
  }
}

/**
 * Nagad wants the payer's IPv4 in X-KM-IP-V4. Anything else (IPv6, missing)
 * falls back to a placeholder; Nagad accepts it and it only feeds their logs.
 */
export function clientIpv4(req: Request | null): string {
  const forwarded = req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const candidate = forwarded || req?.headers.get('x-real-ip')?.trim() || '';
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(candidate) ? candidate : '127.0.0.1';
}

function headers(config: NagadConfig, ip: string, clientType: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-KM-Api-Version': config.apiVersion,
    'X-KM-IP-V4': ip,
    'X-KM-Client-Type': clientType,
  };
}

async function callNagad(url: string, init: RequestInit): Promise<Record<string, any>> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    throw new NagadError(`Nagad unreachable: ${(error as Error).message}`);
  }
  let body: Record<string, any> = {};
  try {
    body = await response.json();
  } catch {
    throw new NagadError(`Nagad returned a non-JSON response`, null, response.status);
  }
  if (!response.ok || body.reason) {
    throw new NagadError(
      body.message || `Nagad request failed with ${response.status}`,
      body.reason || null,
      response.status
    );
  }
  return body;
}

export interface InitializeResult {
  paymentReferenceId: string;
  challenge: string;
}

/** Step 1: open a payment session for one order. */
export async function initializePayment(
  config: NagadConfig,
  orderId: string,
  options: { ip: string; clientType?: string; now?: Date }
): Promise<InitializeResult> {
  const dateTime = nagadDateTime(options.now);
  const sensitive = {
    merchantId: config.merchantId,
    datetime: dateTime,
    orderId,
    challenge: crypto.randomBytes(20).toString('hex').toUpperCase(),
  };
  const body = await callNagad(
    `${config.baseUrl}/api/dfs/check-out/initialize/${config.merchantId}/${orderId}`,
    {
      method: 'POST',
      headers: headers(config, options.ip, options.clientType || 'PC_WEB'),
      body: JSON.stringify({
        dateTime,
        sensitiveData: encryptSensitive(config, sensitive),
        signature: signSensitive(config, sensitive),
      }),
    }
  );

  if (typeof body.sensitiveData !== 'string' || typeof body.signature !== 'string') {
    throw new NagadError('Nagad initialize response is missing sensitiveData');
  }
  let plain: string;
  try {
    plain = decryptSensitive(config, body.sensitiveData);
  } catch {
    throw new NagadError('Could not decrypt the Nagad initialize response');
  }
  if (!verifyGatewaySignature(config, plain, body.signature)) {
    throw new NagadError('Nagad initialize response failed signature verification');
  }
  const data = JSON.parse(plain);
  // The guide calls this `random`; the gateway sends `challenge`.
  const challenge = data.challenge ?? data.random;
  if (!data.paymentReferenceId || !challenge) {
    throw new NagadError('Nagad initialize response is incomplete');
  }
  return { paymentReferenceId: String(data.paymentReferenceId), challenge: String(challenge) };
}

/** Step 2: attach the amount; returns the Nagad page to send the learner to. */
export async function completePayment(
  config: NagadConfig,
  params: {
    paymentReferenceId: string;
    orderId: string;
    amount: number;
    challenge: string;
    callbackUrl: string;
    ip: string;
    clientType?: string;
    additionalMerchantInfo?: Record<string, string>;
  }
): Promise<string> {
  const sensitive = {
    merchantId: config.merchantId,
    orderId: params.orderId,
    currencyCode: '050',
    amount: formatNagadAmount(params.amount),
    challenge: params.challenge,
  };
  const body = await callNagad(
    `${config.baseUrl}/api/dfs/check-out/complete/${encodeURIComponent(params.paymentReferenceId)}`,
    {
      method: 'POST',
      headers: headers(config, params.ip, params.clientType || 'PC_WEB'),
      body: JSON.stringify({
        sensitiveData: encryptSensitive(config, sensitive),
        signature: signSensitive(config, sensitive),
        merchantCallbackURL: params.callbackUrl,
        additionalMerchantInfo: params.additionalMerchantInfo || {},
      }),
    }
  );
  if (body.status !== 'Success' || typeof body.callBackUrl !== 'string') {
    throw new NagadError(`Nagad did not return a payment page (status ${body.status ?? 'none'})`);
  }
  let target: URL;
  try {
    target = new URL(body.callBackUrl);
  } catch {
    throw new NagadError('Nagad returned an invalid payment page URL');
  }
  if (target.protocol !== 'https:' || !/(^|\.)mynagad\.com$/.test(target.hostname)) {
    throw new NagadError(`Nagad payment page is on an unexpected host: ${target.hostname}`);
  }
  return target.toString();
}

export interface VerifiedPayment {
  merchantId: string | null;
  orderId: string | null;
  paymentRefId: string | null;
  amount: number | null;
  status: string;
  statusCode: string | null;
  issuerPaymentRefNo: string | null;
  clientMobileNo: string | null;
  issuerPaymentDateTime: string | null;
}

/** Step 3: the only source of truth for whether money moved. */
export async function verifyPayment(
  config: NagadConfig,
  paymentReferenceId: string,
  options: { ip?: string } = {}
): Promise<VerifiedPayment> {
  const body = await callNagad(
    `${config.baseUrl}/api/dfs/verify/payment/${encodeURIComponent(paymentReferenceId)}`,
    { method: 'GET', headers: headers(config, options.ip || '127.0.0.1', 'PC_WEB') }
  );
  const amount = Number(body.amount);
  const text = (value: unknown) => (value == null || value === '' ? null : String(value));
  return {
    merchantId: text(body.merchantId),
    orderId: text(body.orderId),
    paymentRefId: text(body.paymentRefId),
    amount: Number.isFinite(amount) ? amount : null,
    status: String(body.status || 'Unknown'),
    statusCode: text(body.statusCode),
    issuerPaymentRefNo: text(body.issuerPaymentRefNo),
    clientMobileNo: text(body.clientMobileNo),
    issuerPaymentDateTime: text(body.issuerPaymentDateTime),
  };
}

export type NagadOutcome = 'paid' | 'pending' | 'failed';

// Purchase statuses from guide §5.2.7. Unknown values stay pending: a status we
// do not recognise must never grant access, and must never be closed as failed
// while money may still be moving.
const FAILED_STATUSES = new Set([
  'cancelled',
  'partialcancelled',
  'invalidrequest',
  'fraud',
  'aborted',
  'unknownfailed',
  'failed',
]);

export function classifyNagadStatus(status: string | null | undefined): NagadOutcome {
  const key = String(status || '').toLowerCase();
  if (key === 'success') return 'paid';
  if (FAILED_STATUSES.has(key)) return 'failed';
  return 'pending';
}

// Success result codes: "00_000_00" in the guide, "000" from the gateway.
const SUCCESS_STATUS_CODE = /^[0_]+$/;

export function isSuccessStatusCode(code: string | null | undefined): boolean {
  return SUCCESS_STATUS_CODE.test(String(code || '').trim());
}

export type NagadMismatchCode =
  | 'merchant_mismatch'
  | 'reference_mismatch'
  | 'order_mismatch'
  | 'amount_mismatch'
  | 'status_code_mismatch';

export interface NagadMismatch {
  code: NagadMismatchCode;
  detail: string;
}

/**
 * Nagad's UAT rule: before telling a customer they paid, the verify response
 * must name our merchant, this payment reference and order, the exact amount,
 * a success status and a success status code. Any difference is a mismatch;
 * the order is held for review and the customer sees an error, never success.
 *
 * Non-success responses still have to be about this merchant and reference,
 * otherwise we would close an order on someone else's answer.
 */
export function verificationMismatch(
  config: Pick<NagadConfig, 'merchantId'>,
  order: { order_id: string; payment_ref_id: string | null; amount: number | string },
  verified: VerifiedPayment
): NagadMismatch | null {
  const success = classifyNagadStatus(verified.status) === 'paid';
  const differs = (got: string | null, want: string | null) =>
    success ? got !== want : got != null && got !== want;

  if (differs(verified.merchantId, config.merchantId)) {
    return { code: 'merchant_mismatch', detail: `merchant ${verified.merchantId ?? 'missing'}` };
  }
  if (differs(verified.paymentRefId, order.payment_ref_id)) {
    return { code: 'reference_mismatch', detail: 'payment reference differs from this order' };
  }
  if (differs(verified.orderId, order.order_id)) {
    return { code: 'order_mismatch', detail: `order ${verified.orderId ?? 'missing'}` };
  }
  if (!success) return null;

  const expected = Math.round(Number(order.amount) * 100);
  if (verified.amount == null || Math.round(verified.amount * 100) !== expected) {
    return {
      code: 'amount_mismatch',
      detail: `paid ${verified.amount ?? 'unknown'}, expected ${Number(order.amount)}`,
    };
  }
  if (!isSuccessStatusCode(verified.statusCode)) {
    return {
      code: 'status_code_mismatch',
      detail: `status Success with code ${verified.statusCode ?? 'missing'}`,
    };
  }
  return null;
}
