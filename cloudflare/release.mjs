import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { cloudflareApi } from './account-api.mjs';
import { wrangler } from './wrangler-cli.mjs';

const directory = fileURLToPath(new URL('./', import.meta.url));
const name = 'ielts-ai-cloudflare';
const account = '8814fe480ca632794b5f4fa007b4b166';
const zone = 'a0f923f4119e50e011eadaba1fcf48d5';
const args = process.argv.slice(2);
const version = args.find(arg => arg.startsWith('--deploy='))?.slice(9);
if (!args.includes('--upload') && !version) throw Error('Use --upload, then --deploy=<version UUID> after reviewing the uploaded version');
if (version && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(version)) throw Error('Invalid version UUID');
const routes = await cloudflareApi(`/zones/${zone}/workers/routes`);
for (const pattern of ['ieltsai.pro/*', 'www.ieltsai.pro/*']) {
  if (!routes.some(route => route.pattern === pattern && route.script === name && route.request_limit_fail_open === true)) {
    throw Error(`Live route or quota fallback differs: ${pattern}. Review routing before release.`);
  }
}
const subdomain = await cloudflareApi(`/accounts/${account}/workers/scripts/${name}/subdomain`);
if (subdomain.enabled || subdomain.previews_enabled) throw Error('Production workers.dev or preview URLs are enabled; review before release');
const base = JSON.parse(readFileSync(new URL('./wrangler.jsonc', import.meta.url)));
const manifest = JSON.parse(readFileSync(new URL('./.generated/build-production.json', import.meta.url)));
if (manifest.profile !== 'production' || manifest.output !== 'cloudflare/dist-production') throw Error('Rebuild the production profile before release');
const bindings = dotenv.parse(readFileSync(new URL('./.dev.vars', import.meta.url)));
for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY']) if (!bindings[key]) throw Error(`Missing public runtime binding: ${key}`);
const config = {
  ...base, name, main: fileURLToPath(new URL('./worker.ts', import.meta.url)),
  workers_dev: false, preview_urls: false, keep_vars: true,
  assets: { ...base.assets, directory: fileURLToPath(new URL('./dist-production', import.meta.url)) },
  vars: { ...bindings, DEPLOYMENT_STAGE: 'production' },
  secrets: { required: ['META_CAPI_ACCESS_TOKEN'] },
};
// Versions operations leave live routes, fail-open flags and DNS unchanged.
delete config.routes;
const configPath = fileURLToPath(new URL('./.generated/release.json', import.meta.url));
writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
if (version) await cloudflareApi(`/accounts/${account}/workers/scripts/${name}/versions/${version}`);
const command = version
  ? ['versions', 'deploy', `${version}@100%`, '--yes']
  : ['versions', 'upload', '--keep-vars'];
const result = wrangler([...command, '--config', configPath, '--message', 'Cloudflare public-cache hardening and portable release tooling'], {
  cwd: directory, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
});
process.exitCode = result.status ?? 1;
