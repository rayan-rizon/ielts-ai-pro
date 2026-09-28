// Minimal Cloudflare R2 object access over the S3 API, signed with aws4fetch.
// aws4fetch is a few KB, unlike the AWS SDK, so it keeps Edge cold starts short
// on routes that sit in front of audio playback.

// @ts-ignore Deno resolves npm: specifiers at deploy time.
import { AwsClient } from 'npm:aws4fetch@1.0.20';

declare const Deno: any;

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

/** Null when any credential is missing, so callers can fall back instead of failing. */
export function readR2Config(): R2Config | null {
  const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || '';
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID') || '';
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY') || '';
  const bucket = Deno.env.get('R2_BUCKET_NAME') || 'ielts-ai-media';
  const publicUrl = (Deno.env.get('R2_PUBLIC_URL') || 'https://media.ieltsai.pro').replace(
    /\/+$/,
    ''
  );
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function encodeKey(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

export function createR2Objects(config: R2Config) {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
  const objectUrl = (key: string) =>
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encodeKey(key)}`;

  return {
    publicUrl: (key: string) => `${config.publicUrl}/${encodeKey(key)}`,

    /** True when the object exists. Throws on anything other than 200/404. */
    async exists(key: string, timeoutMs = 2500): Promise<boolean> {
      const response = await client.fetch(objectUrl(key), {
        method: 'HEAD',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status === 200) return true;
      if (response.status === 404) return false;
      throw new Error(`R2 HEAD returned ${response.status}`);
    },

    async put(
      key: string,
      body: Uint8Array,
      options: { contentType: string; cacheControl: string },
      timeoutMs = 10000
    ): Promise<void> {
      const response = await client.fetch(objectUrl(key), {
        method: 'PUT',
        body: body as BodyInit,
        headers: {
          'Content-Type': options.contentType,
          'Cache-Control': options.cacheControl,
          'Content-Length': String(body.byteLength),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`R2 PUT returned ${response.status} ${detail.slice(0, 200)}`);
      }
    },
  };
}
