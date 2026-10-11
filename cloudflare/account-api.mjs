import { wrangler } from './wrangler-cli.mjs';

// Reuse Wrangler's existing credentials in memory. Never print/store the token.
let token;
export async function cloudflareApi(resource, method = 'GET', body) {
  if (!token) {
    token = process.env.CLOUDFLARE_API_TOKEN;
  }
  if (!token) {
    const result = wrangler(['auth','token','--json'], {encoding:'utf8'});
    if (result.status !== 0) throw Error('Wrangler authentication unavailable; credential output withheld');
    const auth = JSON.parse(result.stdout);
    if (!['oauth','api_token'].includes(auth.type) || !auth.token) throw Error('Unsupported Wrangler credential type');
    token = auth.token;
  }
  const response = await fetch('https://api.cloudflare.com/client/v4'+resource, {
    method, headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:body ? JSON.stringify(body) : undefined, signal:AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw Error(`Cloudflare ${method} ${resource} (${response.status}): ${data.errors?.map(e=>e.message).join('; ')}`);
  return data.result;
}
