import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { cloudflareApi } from './account-api.mjs';
import { wrangler } from './wrangler-cli.mjs';
import { validateReleaseTarget, uploadedVersion } from './release-policy.mjs';

const directory = fileURLToPath(new URL('./', import.meta.url));
const name = 'ielts-ai-pro';
const account = '8814fe480ca632794b5f4fa007b4b166';
const args = process.argv.slice(2);
const version = args.find(arg => arg.startsWith('--deploy='))?.slice(9);
const automatic = args.includes('--auto');
if (!args.includes('--upload') && !version && !automatic) throw Error('Use --upload, --deploy=<version UUID>, or --auto');
if (automatic && (version || args.includes('--upload'))) throw Error('--auto cannot be combined with manual version operations');
if (version && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(version)) throw Error('Invalid version UUID');
// Workers Builds tokens can inspect Worker domains without zone-edit permissions.
const scripts = await cloudflareApi(`/accounts/${account}/workers/scripts`);
const domains = await cloudflareApi(`/accounts/${account}/workers/domains`);
const subdomain = await cloudflareApi(`/accounts/${account}/workers/scripts/${name}/subdomain`);
const base = JSON.parse(readFileSync(new URL('./wrangler.jsonc', import.meta.url)));
const manifest = JSON.parse(readFileSync(new URL('./.generated/build-production.json', import.meta.url)));
validateReleaseTarget(scripts, subdomain, manifest, process.env, domains);
const bindings = dotenv.parse(readFileSync(new URL('./.dev.vars', import.meta.url)));
for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY']) if (!bindings[key]) throw Error(`Missing public runtime binding: ${key}`);
const config = {
  ...base, name, main: fileURLToPath(new URL('./worker.ts', import.meta.url)),
  workers_dev: false, preview_urls: false, keep_vars: true,
  assets: { ...base.assets, directory: fileURLToPath(new URL('./dist-production', import.meta.url)) },
  vars: { ...bindings, DEPLOYMENT_STAGE: 'production' },
  secrets: { required: ['META_CAPI_ACCESS_TOKEN'] },
};
// Versions operations leave custom domains and DNS unchanged.
delete config.routes;
const configPath = fileURLToPath(new URL('./.generated/release.json', import.meta.url));
writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
if (version) await cloudflareApi(`/accounts/${account}/workers/scripts/${name}/versions/${version}`);
const command = version
  ? ['versions', 'deploy', `${version}@100%`, '--yes']
  : ['versions', 'upload', '--keep-vars'];
if (automatic) writeFileSync(new URL('./.generated/production-upload.ndjson', import.meta.url), '', { mode: 0o600 });
const result = wrangler([...command, '--config', configPath, '--message', 'Cloudflare public-cache hardening and portable release tooling'], {
  cwd: directory, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false',
    ...(automatic ? { WRANGLER_OUTPUT_FILE_PATH: fileURLToPath(new URL('./.generated/production-upload.ndjson', import.meta.url)) } : {}),
  },
});
process.exitCode = result.status ?? 1;
if (automatic && process.exitCode === 0) {
  const uploaded = uploadedVersion(readFileSync(new URL('./.generated/production-upload.ndjson', import.meta.url), 'utf8'));
  await cloudflareApi(`/accounts/${account}/workers/scripts/${name}/versions/${uploaded}`);
  const promote = wrangler(['versions', 'deploy', `${uploaded}@100%`, '--yes', '--config', configPath], {
    cwd: directory, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  process.exitCode = promote.status ?? 1;
  if (process.exitCode === 0) {
    const deployed = await cloudflareApi(`/accounts/${account}/workers/scripts/${name}/deployments`);
    const active = deployed.deployments[0];
    if (active?.versions?.length !== 1 || active.versions[0].version_id !== uploaded || active.versions[0].percentage !== 100) {
      throw Error('Uploaded production version is not serving 100% traffic');
    }
    console.log(`Verified production deployment: ${uploaded}`);
  }
}
